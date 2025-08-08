"""Session-related route handlers."""

import base64
import logging
import traceback

import msgpack
from flask import Blueprint, current_app, jsonify, request
from pydantic import ValidationError

from auth import get_user_from_request
from error_handlers import APIError, error_handler
from schemas import SessionInput, SessionUpdate
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


@session_bp.route("/api/session", methods=["POST"])
@validate_payload_size()
@error_handler
def create_session():
    """Create a new session with strict field validation. Sessions are always private."""
    raw_data = request.get_json()
    if not raw_data:
        raise APIError("No data provided", status_code=400)

    # SECURITY: Validate input using Pydantic model with extra="forbid"
    try:
        validated_input = SessionInput(**raw_data)
    except ValidationError as e:
        raise APIError(
            "Invalid input data",
            status_code=400,
            details={"validation_errors": e.errors()},
        )

    # Get user info from request
    user_info, user_id = get_user_from_request()

    # Check user session limit before creating
    max_sessions = current_app.config.get("MAX_SESSIONS_PER_USER", 100)
    check_user_session_limit(user_id, max_sessions)

    # Create metadata for the session (automatically sets visibility to private)
    metadata = create_metadata(
        "session",
        user_info,
        validated_input.title,
        validated_input.description,
        validated_input.tags,
    )

    # Prepare data for storage - only validated fields
    storage_data = {
        "filename": validated_input.filename,
        "title": validated_input.title,
        "description": validated_input.description,
        "tags": validated_input.tags,
        "data": validated_input.data,
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


@session_bp.route("/api/session/<session_id>", methods=["GET", "PUT", "DELETE"])
@error_handler
def session_by_id(session_id):
    """Get, update, or delete a specific session by its ID. GET is public, PUT/DELETE require authentication and ownership."""

    if request.method == "GET":
        # GET: Find the session across all users (public read access)
        matching_session = find_object_by_id(session_id, "session")

        if not matching_session:
            raise APIError("Session not found", status_code=404)

        return jsonify(matching_session), 200

    elif request.method == "PUT":
        # PUT: Require authentication and ownership
        user_info, user_id = get_user_from_request()

        # Add inline validation for PUT method since we can't use decorator here
        content_length = request.content_length
        if content_length is not None:
            max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 50)
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

        raw_data = request.get_json()
        if not raw_data:
            raise APIError("No data provided", status_code=400)

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
        logger.debug(
            f"Validated input fields: {validated_input.dict(exclude_none=True)}"
        )

        # Perform the update with authorization check (this already checks ownership)
        updated_metadata = update_session_by_id(
            session_id, user_id, validated_input.dict(exclude_none=True)
        )

        logger.info(
            f"Update session completed for session_id: {session_id} by user: {user_id}"
        )
        return jsonify(updated_metadata), 200

    elif request.method == "DELETE":
        # DELETE: Require authentication and ownership
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


@session_bp.route("/api/session/<session_id>/data", methods=["GET"])
@error_handler
def get_session_data(session_id):
    """Get the raw data content of a specific session. Sessions are now publicly readable."""
    # Find the session across all users (public read access)
    matching_session = find_object_by_id(session_id, "session")

    if not matching_session:
        raise APIError("Session not found", status_code=404)

    # Get the data file from storage
    try:
        session_user_id = matching_session["creator"]["id"]
        object_path = f"{session_user_id}/sessions/{session_id}"
        data_path = f"{object_path}/data.mvstory"

        logger.info(f"Attempting to read session data from: {data_path}")
        response = minio_client.get_object(MINIO_BUCKET, data_path)
        file_data = msgpack.unpackb(response.read(), raw=False)
        response.close()

        # Return the data content, ensuring JSON serializability
        if "data" in file_data:
            safe_data = _bytes_to_base64(file_data["data"])
            return jsonify(safe_data), 200
        else:
            safe_data = _bytes_to_base64(file_data)
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
