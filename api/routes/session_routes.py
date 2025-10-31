"""Session-related route handlers."""

import base64
import json
import logging
import traceback

import msgpack
from flask import Blueprint, current_app, jsonify, request
from pydantic import ValidationError
from werkzeug.datastructures import FileStorage

from auth import get_user_from_request
from error_handlers import APIError, error_handler
from schemas import SessionUpdate
from storage import (
    MINIO_BUCKET,
    check_user_session_limit,
    count_user_sessions,
    count_user_stories,
    create_metadata,
    delete_all_user_data,
    delete_session_by_id,
    find_object_by_id,
    list_objects_by_type,
    minio_client,
    save_object,
    update_session_by_id,
)
from utils import validate_payload_size

# update
logger = logging.getLogger(__name__)

# Create Blueprint
session_bp = Blueprint("sessions", __name__)


def _bytes_to_base64(obj):
    """Recursively convert bytes in obj to base64-encoded strings for JSON serialization."""
    if isinstance(obj, bytes):
        return base64.b64encode(obj).decode("utf-8")
    elif isinstance(obj, dict):
        return {k: _bytes_to_base64(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_bytes_to_base64(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(_bytes_to_base64(item) for item in obj)
    else:
        return obj


def _parse_form_fields(form_data):
    """Parse and validate basic form fields."""
    title = form_data.get("title", "").strip()
    description = form_data.get("description", "").strip()
    tags_str = form_data.get("tags", "[]")
    filename = form_data.get("filename", "").strip()

    # Parse tags as JSON array
    try:
        tags = json.loads(tags_str) if tags_str else []
        if not isinstance(tags, list):
            raise ValueError("Tags must be an array")
    except (json.JSONDecodeError, ValueError) as e:
        raise APIError(f"Invalid tags format: {str(e)}", status_code=400)

    return title, description, tags, filename


def _validate_required_fields(title, filename):
    """Validate required form fields."""
    if not title:
        raise APIError("Title is required", status_code=400)
    if not filename:
        raise APIError("Filename is required", status_code=400)
    if not filename.endswith(".mvstory"):
        raise APIError("Session files must have .mvstory extension", status_code=400)


def _extract_and_validate_file(files):
    """Extract and validate uploaded file."""
    if "file" not in files:
        raise APIError("File is required", status_code=400)

    file = files["file"]
    if not isinstance(file, FileStorage) or not file.filename:
        raise APIError("Invalid file upload", status_code=400)

    # Read file data
    try:
        file_data = file.read()
        if not file_data:
            raise APIError("File cannot be empty", status_code=400)
    except Exception as e:
        raise APIError(f"Error reading file: {str(e)}", status_code=400)

    # Validate file size
    max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 100)
    max_size_bytes = max_size_mb * 1024 * 1024
    if len(file_data) > max_size_bytes:
        size_mb = len(file_data) / (1024 * 1024)
        raise APIError(
            f"File too large: {size_mb:.1f}MB (max: {max_size_mb}MB)", status_code=413
        )

    # Validate file content (should be valid msgpack)
    try:
        from schemas import _decompress_msgpack_data, _validate_msgpack_format

        msgpack_data = _decompress_msgpack_data(file_data)
        _validate_msgpack_format(msgpack_data)
    except Exception as e:
        raise APIError(f"Invalid session file format: {str(e)}", status_code=400)

    return file_data


def _validate_session_formdata(form_data, files):
    """Validate FormData input for session creation/update."""
    title, description, tags, filename = _parse_form_fields(form_data)
    _validate_required_fields(title, filename)
    file_data = _extract_and_validate_file(files)

    return {
        "title": title,
        "description": description,
        "tags": tags,
        "filename": filename,
        "file_data": file_data,
    }


@session_bp.route("/api/session", methods=["POST"])
@validate_payload_size()
@error_handler
def create_session():
    """Create a new session. Only supports FormData format for new sessions."""
    content_type = request.content_type or ""

    # Check for FormData by content type OR by presence of form/files data
    is_formdata = content_type.startswith("multipart/form-data") or (
        request.form and "file" in request.files
    )

    if not is_formdata:
        raise APIError(
            "Session creation requires FormData with a file upload. "
            "Legacy JSON format is no longer supported for new sessions.",
            status_code=400,
        )

    return _create_session_formdata()


def _create_session_formdata():
    """Create a new session using FormData with file upload."""
    # Validate FormData input
    validated_data = _validate_session_formdata(request.form, request.files)

    # Get user info from request
    user_info, user_id = get_user_from_request()

    # Check user session limit before creating
    max_sessions = current_app.config.get("MAX_SESSIONS_PER_USER", 100)
    check_user_session_limit(user_id, max_sessions)

    # Create metadata for the session (automatically sets visibility to private)
    metadata = create_metadata(
        "session",
        user_info,
        validated_data["title"],
        validated_data["description"],
        validated_data["tags"],
    )

    # Prepare data for storage - use raw file data instead of base64
    storage_data = {
        "filename": validated_data["filename"],
        "title": validated_data["title"],
        "description": validated_data["description"],
        "tags": validated_data["tags"],
        "data": validated_data["file_data"],  # Raw binary data
    }

    # Save the session
    result = save_object("session", storage_data, metadata)
    return jsonify(result), 201


@session_bp.route("/api/session")
@error_handler
def list_sessions():
    """List all sessions for the authenticated user. Sessions are always private."""
    # Get user info from request (always required since sessions are private)
    user_info, user_id = get_user_from_request()

    # Get all sessions for this user (they're all private)
    sessions = list_objects_by_type("session", user_id=user_id)
    return jsonify(sessions), 200


def _handle_get_session(session_id):
    """Handle GET request for a specific session."""
    user_info, user_id = get_user_from_request()

    matching_session = find_object_by_id(session_id, "session")
    if not matching_session:
        raise APIError("Session not found", status_code=404)

    if matching_session.get("creator", {}).get("id") != user_id:
        raise APIError(
            "Access denied. Only the creator can view this session",
            status_code=403,
            details={"session_id": session_id},
        )

    return jsonify(matching_session), 200


def _handle_put_session(session_id):
    """Handle PUT request for updating a specific session."""
    user_info, user_id = get_user_from_request()

    # Add inline validation for PUT method since we can't use decorator here
    content_length = request.content_length
    if content_length is not None:
        max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 100)
        max_size_bytes = max_size_mb * 1024 * 1024
        if content_length > max_size_bytes:
            logger.warning(
                f"PUT session request payload too large: {content_length} bytes (max: {max_size_bytes} bytes)"
            )
            return (
                jsonify(
                    {
                        "error": True,
                        "message": "Request payload too large",
                        "status_code": 413,
                        "details": {
                            "type": "PayloadTooLarge",
                            "description": f"The request payload exceeds the maximum allowed size of {max_size_mb}MB",
                            "max_size_mb": max_size_mb,
                            "received_size_mb": round(
                                content_length / (1024 * 1024), 2
                            ),
                            "suggestion": "Please reduce the payload size and try again",
                        },
                    }
                ),
                413,
            )

    content_type = request.content_type or ""

    # Check for FormData by content type OR by presence of form/files data
    is_formdata = content_type.startswith("multipart/form-data") or (
        request.form and "file" in request.files
    )

    if is_formdata:
        # New FormData-based approach
        return _update_session_formdata(session_id, user_id)
    else:
        # Legacy JSON-based approach
        return _update_session_json(session_id, user_id)


def _update_session_json(session_id, user_id):
    """Update session using legacy JSON format with base64 data."""
    try:
        raw_data = request.get_json()
        if not raw_data:
            raise APIError("No data provided", status_code=400)
    except Exception:
        # If JSON parsing fails, this might be FormData that was incorrectly routed here
        if request.form:
            # Handle as FormData
            return _update_session_formdata(session_id, user_id)
        else:
            raise APIError(
                "Invalid request format: not JSON and not valid FormData",
                status_code=400,
            )

    # SECURITY: Validate input using Pydantic model with extra="forbid"
    try:
        validated_input = SessionUpdate(**raw_data)
    except ValidationError as e:
        raise APIError(
            "Invalid input data",
            status_code=400,
            details={"validation_errors": e.errors()},
        )

    # Update the session using the validated input
    logger.info(
        f"Update session request received for session_id: {session_id} by user: {user_id}"
    )
    logger.debug(f"Validated input fields: {validated_input.dict(exclude_none=True)}")

    # Perform the update with authorization check (this already checks ownership)
    updated_metadata = update_session_by_id(
        session_id, user_id, validated_input.dict(exclude_none=True)
    )

    logger.info(
        f"Update session completed for session_id: {session_id} by user: {user_id}"
    )
    return jsonify(updated_metadata), 200


def _update_session_formdata(session_id, user_id):
    """Update session using FormData with file upload."""
    # Validate FormData input - for updates, make file optional
    update_data = _validate_session_formdata_update(request.form, request.files)

    logger.info(
        f"Update session request received for session_id: {session_id} by user: {user_id}"
    )
    logger.debug(f"Update data fields: {list(update_data.keys())}")

    # Perform the update with authorization check (this already checks ownership)
    updated_metadata = update_session_by_id(session_id, user_id, update_data)

    logger.info(
        f"Update session completed for session_id: {session_id} by user: {user_id}"
    )
    return jsonify(updated_metadata), 200


def _parse_optional_form_fields(form_data):
    """Parse optional form fields for updates."""
    update_data = {}

    if "title" in form_data:
        title = form_data.get("title", "").strip()
        if title:
            update_data["title"] = title

    if "description" in form_data:
        description = form_data.get("description", "").strip()
        update_data["description"] = description  # Allow empty description

    if "tags" in form_data:
        tags_str = form_data.get("tags", "[]")
        try:
            tags = json.loads(tags_str) if tags_str else []
            if not isinstance(tags, list):
                raise ValueError("Tags must be an array")
            update_data["tags"] = tags
        except (json.JSONDecodeError, ValueError) as e:
            raise APIError(f"Invalid tags format: {str(e)}", status_code=400)

    return update_data


def _process_optional_file_update(files):
    """Process optional file upload for updates."""
    if "file" not in files:
        return None

    file = files["file"]
    if not isinstance(file, FileStorage) or not file.filename:
        return None

    try:
        file_data = file.read()
        if not file_data:  # Skip empty files
            return None

        # Validate file size
        max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 100)
        max_size_bytes = max_size_mb * 1024 * 1024
        if len(file_data) > max_size_bytes:
            size_mb = len(file_data) / (1024 * 1024)
            raise APIError(
                f"File too large: {size_mb:.1f}MB (max: {max_size_mb}MB)",
                status_code=413,
            )

        # Validate file content
        try:
            from schemas import _decompress_msgpack_data, _validate_msgpack_format

            msgpack_data = _decompress_msgpack_data(file_data)
            _validate_msgpack_format(msgpack_data)
            return file_data
        except Exception as e:
            raise APIError(f"Invalid session file format: {str(e)}", status_code=400)

    except Exception as e:
        raise APIError(f"Error reading file: {str(e)}", status_code=400)


def _validate_session_formdata_update(form_data, files):
    """Validate FormData input for session update (all fields optional)."""
    update_data = _parse_optional_form_fields(form_data)

    file_data = _process_optional_file_update(files)
    if file_data:
        update_data["data"] = file_data

    if not update_data:
        raise APIError("No valid update data provided", status_code=400)

    return update_data


def _handle_delete_session(session_id):
    """Handle DELETE request for a specific session."""
    user_info, user_id = get_user_from_request()

    logger.info(
        f"Delete session request received for session_id: {session_id} by user: {user_id}"
    )

    # Perform the deletion with authorization check (this already checks ownership)
    result = delete_session_by_id(session_id, user_id)

    logger.info(
        f"Delete session completed for session_id: {session_id} by user: {user_id}"
    )
    return jsonify(result), 200


@session_bp.route("/api/session/<session_id>", methods=["GET", "PUT", "DELETE"])
@error_handler
def session_by_id(session_id):
    """Get, update, or delete a specific session by its ID.

    GET, PUT, DELETE all require authentication and ownership.
    """

    if request.method == "GET":
        return _handle_get_session(session_id)
    elif request.method == "PUT":
        return _handle_put_session(session_id)
    elif request.method == "DELETE":
        return _handle_delete_session(session_id)


def _is_legacy_msgpack(data):
    """Check if data is legacy msgpack format without throwing exceptions."""
    try:
        parsed = msgpack.unpackb(data, raw=False)
        return isinstance(parsed, dict) and "data" in parsed
    except (msgpack.exceptions.ExtraData, ValueError, TypeError):
        return False


def _is_old_msgpack(data):
    """Check if data is old msgpack format (parseable but no wrapper)."""
    try:
        parsed = msgpack.unpackb(data, raw=False)
        return not (isinstance(parsed, dict) and "data" in parsed)
    except (msgpack.exceptions.ExtraData, ValueError, TypeError):
        return False


def _convert_session_data_to_base64(raw_bytes):
    """Convert session data to base64 based on format detection."""
    if _is_legacy_msgpack(raw_bytes):
        # Legacy format: msgpack wrapper with metadata
        file_data = msgpack.unpackb(raw_bytes, raw=False)
        safe_data = _bytes_to_base64(file_data["data"])
        logger.info("Loaded session data in legacy format (msgpack wrapper)")
    elif _is_old_msgpack(raw_bytes):
        # Old format: raw msgpack without wrapper
        file_data = msgpack.unpackb(raw_bytes, raw=False)
        safe_data = _bytes_to_base64(file_data)
        logger.info("Loaded session data in old format (raw msgpack)")
    else:
        # New format: raw binary data (deflated msgpack) - PRIMARY CASE
        safe_data = _bytes_to_base64(raw_bytes)
        logger.info("Loaded session data in new format (raw binary)")

    return safe_data


def _check_session_access(session_id, user_id):
    """Check if user has access to the session."""
    matching_session = find_object_by_id(session_id, "session")
    if not matching_session:
        raise APIError("Session not found", status_code=404)

    if matching_session.get("creator", {}).get("id") != user_id:
        raise APIError(
            "Access denied. Only the creator can view this session data",
            status_code=403,
            details={"session_id": session_id},
        )

    return matching_session


@session_bp.route("/api/session/<session_id>/data", methods=["GET"])
@error_handler
def get_session_data(session_id):
    """Get the raw data content of a specific session. Requires authentication and ownership."""
    user_info, user_id = get_user_from_request()
    matching_session = _check_session_access(session_id, user_id)

    try:
        session_user_id = matching_session["creator"]["id"]
        object_path = f"{session_user_id}/sessions/{session_id}"
        data_path = f"{object_path}/data.mvstory"

        logger.info(f"Attempting to read session data from: {data_path}")
        response = minio_client.get_object(MINIO_BUCKET, data_path)
        raw_bytes = response.read()
        response.close()

        safe_data = _convert_session_data_to_base64(raw_bytes)
        return jsonify(safe_data), 200

    except Exception as e:
        logger.error(f"Error reading session data: {str(e)}")
        raise APIError("Session data not found", status_code=404)


@session_bp.route("/api/user/delete-all", methods=["DELETE"])
@error_handler
def delete_all_user_data_endpoint():
    """Delete all sessions and stories for the authenticated user.

    This is a destructive operation that will permanently remove:
    - All sessions created by the user (always private)
    - All stories created by the user (always public)

    Returns:
        200: Success with deletion summary
        401: Authentication required
        500: Server error during deletion
    """
    # Get user info from request for authentication
    user_info, user_id = get_user_from_request()

    logger.info(
        f"Delete all data request from user: {user_id} ({user_info.get('name', 'Unknown')})"
    )

    # Perform the deletion
    result = delete_all_user_data(user_id)

    logger.info(f"Delete all data completed for user {user_id}: {result}")

    return jsonify(result), 200


@session_bp.route("/api/user/quota", methods=["GET"])
@error_handler
def get_user_quota():
    """Get quota information for the authenticated user.

    Returns current usage, limits, remaining quota, and usage percentages
    for both sessions and stories.

    Returns:
        200: Quota information with current usage and limits
        401: Authentication required
        500: Server error
    """
    # Get user info from request for authentication
    user_info, user_id = get_user_from_request()

    logger.info(
        f"Quota request from user: {user_id} ({user_info.get('name', 'Unknown')})"
    )

    try:
        # Get current counts
        current_sessions = count_user_sessions(user_id)
        current_stories = count_user_stories(user_id)

        # Get limits from config
        max_sessions = current_app.config.get("MAX_SESSIONS_PER_USER", 100)
        max_stories = current_app.config.get("MAX_STORIES_PER_USER", 100)

        # Calculate remaining quota
        remaining_sessions = max(0, max_sessions - current_sessions)
        remaining_stories = max(0, max_stories - current_stories)

        # Calculate usage percentages
        session_usage_percent = (
            round((current_sessions / max_sessions) * 100, 1) if max_sessions > 0 else 0
        )
        story_usage_percent = (
            round((current_stories / max_stories) * 100, 1) if max_stories > 0 else 0
        )

        # Check if user is at or near limits
        session_limit_reached = current_sessions >= max_sessions
        story_limit_reached = current_stories >= max_stories
        session_near_limit = current_sessions >= (max_sessions * 0.9)  # 90% threshold
        story_near_limit = current_stories >= (max_stories * 0.9)  # 90% threshold

        quota_info = {
            "user_id": user_id,
            "user_name": user_info.get("name", ""),
            "sessions": {
                "current": current_sessions,
                "limit": max_sessions,
                "remaining": remaining_sessions,
                "usage_percent": session_usage_percent,
                "limit_reached": session_limit_reached,
                "near_limit": session_near_limit,
            },
            "stories": {
                "current": current_stories,
                "limit": max_stories,
                "remaining": remaining_stories,
                "usage_percent": story_usage_percent,
                "limit_reached": story_limit_reached,
                "near_limit": story_near_limit,
            },
            "overall": {
                "total_objects": current_sessions + current_stories,
                "total_limit": max_sessions + max_stories,
                "any_limit_reached": session_limit_reached or story_limit_reached,
                "any_near_limit": session_near_limit or story_near_limit,
            },
        }

        logger.info(
            f"Quota info for user {user_id}: {current_sessions}/{max_sessions} sessions, "
            f"{current_stories}/{max_stories} stories"
        )

        return jsonify(quota_info), 200

    except Exception as e:
        error_msg = f"Failed to get quota information for user {user_id}: {str(e)}"
        logger.error(error_msg)
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise APIError(
            "Failed to retrieve quota information",
            status_code=500,
            details={"error": str(e), "user_id": user_id},
        )
