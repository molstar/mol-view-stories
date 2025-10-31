"""Story-related route handlers."""

import io
import json
import logging
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request, send_file
from pydantic import ValidationError

from auth import get_user_from_request
from error_handlers import APIError, error_handler
from schemas import BaseItemUpdate, StoryInput
from storage import (
    MINIO_BUCKET,
    check_user_story_limit,
    create_metadata,
    delete_story_by_id,
    list_objects_by_type,
    minio_client,
    save_object,
    save_story_with_session,
    update_story_by_id,
)
from utils import validate_payload_size

logger = logging.getLogger(__name__)

# Create Blueprint
story_bp = Blueprint("stories", __name__)


def generate_public_uri(object_type, object_id):
    """Generate a public URI for an object."""
    base_url = current_app.config.get("BASE_URL", "https://stories.molstar.org").rstrip(
        "/"
    )
    return f"{base_url}/api/{object_type}/{object_id}"


def _get_story_by_id(story_id):
    """Find a story by ID and return it with public URI."""
    stories = list_objects_by_type("story")

    # Find the requested story
    for story_obj in stories:
        if story_obj.get("id") == story_id:
            story_obj["public_uri"] = generate_public_uri("story", story_id)
            return story_obj
    raise APIError("Story not found", status_code=404)


def _validate_payload_size_inline(max_size_mb):
    """Validate request payload size inline for conditional routes."""
    content_length = request.content_length
    if content_length is not None:
        max_size_bytes = max_size_mb * 1024 * 1024
        if content_length > max_size_bytes:
            logger.warning(
                f"PUT request payload too large: {content_length} bytes (max: {max_size_bytes} bytes)"
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
    return None


def _handle_story_update(story_id, user_id):
    """Handle story update logic."""
    max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 100)
    error_response = _validate_payload_size_inline(max_size_mb)
    if error_response:
        return error_response

    content_type = request.content_type or ""

    # Check if this is a FormData request (multipart/form-data or has files)
    is_formdata = (
        content_type.startswith("multipart/form-data")
        or bool(request.files)
        or bool(request.form)
    )

    if is_formdata:
        # New FormData format with session data
        logger.info(f"Detected FormData request with content-type: {content_type}")
        return _update_story_formdata(story_id, user_id)
    else:
        # Legacy JSON format (backward compatibility)
        logger.info(f"Detected JSON request with content-type: {content_type}")
        return _update_story_json(story_id, user_id)


def _update_story_json(story_id, user_id):
    """Handle story update using legacy JSON format."""
    raw_data = request.get_json()
    if not raw_data:
        raise APIError("No data provided", status_code=400)

    # SECURITY: Validate input using Pydantic model with extra="forbid"
    try:
        validated_input = BaseItemUpdate(**raw_data)
    except ValidationError as e:
        raise APIError(
            "Invalid input data",
            status_code=400,
            details={"validation_errors": e.errors()},
        )

    # Update the story using the validated input
    logger.info(
        f"Update story (JSON) request received for story_id: {story_id} by user: {user_id}"
    )
    logger.debug(f"Validated input fields: {validated_input.dict(exclude_none=True)}")

    # Perform the update with authorization check
    updated_metadata = update_story_by_id(
        story_id, user_id, validated_input.dict(exclude_none=True)
    )

    logger.info(
        f"Update story (JSON) completed for story_id: {story_id} by user: {user_id}"
    )
    return jsonify(updated_metadata), 200


def _update_story_formdata(story_id, user_id):
    """Handle story update using FormData format with session data."""
    logger.info(
        f"Update story (FormData) request received for story_id: {story_id} by user: {user_id}"
    )

    # Validate FormData input
    validated_data = _validate_story_formdata(request.form, request.files)

    # Get the existing story metadata to preserve creator info
    existing_story = _get_story_by_id(story_id)

    # Verify ownership
    if existing_story["creator"]["id"] != user_id:
        raise APIError(
            "Unauthorized: You can only update your own stories", status_code=403
        )

    metadata = {
        "id": story_id,
        "type": "story",
        "title": validated_data["title"],
        "description": validated_data["description"],
        "tags": validated_data["tags"],
        "creator": existing_story["creator"],  # Preserve original creator
        "created_at": existing_story["created_at"],  # Preserve creation time
        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),  # Set current time for update
        "version": "1.0",  # Match the version format from create_metadata (1.0 not 1.0.0)
    }

    # Prepare data for storage - story data (same format as creation)
    storage_data = {
        "filename": validated_data["story_filename"],
        "title": validated_data["title"],
        "description": validated_data["description"],
        "tags": validated_data["tags"],
        "data": validated_data["story_data"],
    }

    # Update story with session data using the new format
    from storage import save_story_with_session

    updated_metadata = save_story_with_session(
        "story", storage_data, validated_data["session_data"], metadata
    )

    logger.info(
        f"Update story (FormData) completed for story_id: {story_id} by user: {user_id}"
    )
    return jsonify(updated_metadata), 200


def _handle_story_delete(story_id, user_id):
    """Handle story deletion logic."""
    logger.info(
        f"Delete story request received for story_id: {story_id} by user: {user_id}"
    )

    # Perform the deletion with authorization check
    result = delete_story_by_id(story_id, user_id)

    logger.info(f"Delete story completed for story_id: {story_id} by user: {user_id}")
    return jsonify(result), 200


def _validate_story_formdata(form_data, files):
    """Validate FormData input for story creation.

    Expected fields:
    - 'mvsx' OR 'mvsj': Story content file
    - 'session': Session state file (.mvstory)
    - Metadata: title, description, tags
    """
    # Parse and validate basic form fields
    title, description, parsed_tags = _parse_story_metadata(form_data)

    # Validate and process story file
    story_filename, processed_story_data = _validate_and_process_story_file(
        files, title
    )

    # Validate and process session file
    session_data = _validate_and_process_session_file(files, title)

    return {
        "title": title,
        "description": description,
        "tags": parsed_tags,
        "story_filename": story_filename,
        "story_data": processed_story_data,
        "session_data": session_data,
    }


def _parse_story_metadata(form_data):
    """Parse and validate story metadata from form data."""
    title = form_data.get("title", "").strip()
    description = form_data.get("description", "").strip()
    tags = form_data.get("tags", "")

    # Validate required fields
    if not title:
        raise APIError("Title is required", status_code=400)

    # Parse tags if provided
    parsed_tags = []
    if tags:
        try:
            parsed_tags = json.loads(tags) if isinstance(tags, str) else tags
        except (json.JSONDecodeError, TypeError):
            raise APIError("Invalid tags format. Expected JSON array.", status_code=400)

    return title, description, parsed_tags


def _validate_and_process_story_file(files, title):
    """Validate and process story file (mvsx or mvsj)."""
    # Check for story file - either 'mvsx' or 'mvsj'
    story_file = None
    story_type = None
    story_filename = None

    if "mvsx" in files:
        story_file = files["mvsx"]
        story_type = "mvsx"
        story_filename = story_file.filename or f"{title}.mvsx"
    elif "mvsj" in files:
        story_file = files["mvsj"]
        story_type = "mvsj"
        story_filename = story_file.filename or f"{title}.mvsj"
    else:
        raise APIError(
            "Story file is required. Provide either 'mvsx' or 'mvsj' field.",
            status_code=400,
        )

    if not story_file or not story_file.filename:
        raise APIError(f"Story {story_type} file must have a filename", status_code=400)

    # Read and process story data
    story_data = story_file.read()
    if not story_data:
        raise APIError(f"Story {story_type} file cannot be empty", status_code=400)

    if story_type == "mvsx":
        # For .mvsx files, keep as binary
        processed_story_data = story_data
    else:  # mvsj
        # For .mvsj files, parse as JSON
        try:
            processed_story_data = json.loads(story_data.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise APIError("Invalid .mvsj file format", status_code=400)

    return story_filename, processed_story_data


def _validate_and_process_session_file(files, title):
    """Validate and process session file."""
    if "session" not in files:
        raise APIError(
            "Session file is required. Provide 'session' field.", status_code=400
        )

    session_file = files["session"]
    if not session_file.filename:
        session_file.filename = f"{title}.mvstory"
    elif not session_file.filename.endswith(".mvstory"):
        raise APIError("Session file must have .mvstory extension", status_code=400)

    session_data = session_file.read()
    if not session_data:
        raise APIError("Session file cannot be empty", status_code=400)

    return session_data


def _get_story_data_extensions(requested_format):
    """Get list of extensions to try based on requested format."""
    if requested_format in ["mvsj", "mvsx"]:
        return [f".{requested_format}"]
    else:
        return [".mvsj", ".mvsx"]


def _serve_mvsx_file(file_bytes, matching_story, story_id):
    """Serve MVSX file as binary ZIP."""
    filename = matching_story.get("filename", f"story_{story_id}.mvsx")
    return send_file(
        io.BytesIO(file_bytes),
        mimetype="application/zip",
        as_attachment=True,
        download_name=filename,
    )


def _serve_mvsj_file(file_bytes):
    """Serve MVSJ file as JSON."""
    file_data = json.loads(file_bytes.decode("utf-8"))
    if isinstance(file_data, dict) and "data" in file_data:
        return jsonify(file_data["data"]), 200
    elif isinstance(file_data, (dict, list)):
        return jsonify(file_data), 200
    else:
        return file_data, 200


def _try_read_story_file(object_path, ext, matching_story, story_id):
    """Try to read a story file with given extension."""
    data_path = f"{object_path}/data{ext}"
    logger.info(f"Attempting to read story data from: {data_path}")

    response = minio_client.get_object(MINIO_BUCKET, data_path)
    file_bytes = response.read()
    response.close()

    if ext == ".mvsx":
        return _serve_mvsx_file(file_bytes, matching_story, story_id)
    else:
        return _serve_mvsj_file(file_bytes)


@story_bp.route("/api/story", methods=["POST"])
@validate_payload_size()
@error_handler
def create_story():
    """Create a new story with strict field validation. Stories are always public.

    Requires FormData with the following structure:
    - 'mvsx' OR 'mvsj': Story content file
    - 'session': Session state file (.mvstory)
    - Metadata fields: title, description, tags
    """
    content_type = request.content_type or ""

    # Only accept FormData format
    if not content_type.startswith("multipart/form-data"):
        raise APIError(
            "Story creation requires FormData format. "
            "Legacy JSON format is no longer supported.",
            status_code=400,
        )

    return _create_story_formdata()


def _create_story_formdata():
    """Create a new story using FormData with story + session files."""
    # Validate FormData input
    validated_data = _validate_story_formdata(request.form, request.files)

    # Get user info from request
    user_info, user_id = get_user_from_request()

    # Check user story limit before creating
    max_stories = current_app.config.get("MAX_STORIES_PER_USER", 100)
    check_user_story_limit(user_id, max_stories)

    # Create metadata for the story (automatically sets visibility to public)
    metadata = create_metadata(
        "story",
        user_info,
        validated_data["title"],
        validated_data["description"],
        validated_data["tags"],
    )

    # Prepare data for storage - story data
    storage_data = {
        "filename": validated_data["story_filename"],
        "title": validated_data["title"],
        "description": validated_data["description"],
        "tags": validated_data["tags"],
        "data": validated_data["story_data"],
    }

    # Save the story with session
    result = save_story_with_session(
        "story", storage_data, validated_data["session_data"], metadata
    )

    # Add public URI since all stories are public
    result["public_uri"] = generate_public_uri("story", metadata["id"])
    return jsonify(result), 201


@story_bp.route("/api/story/mvsj", methods=["POST"])
@validate_payload_size()
@error_handler
def create_story_mvsj():
    """Create a new story and return it in .mvsj format directly."""
    raw_data = request.get_json()
    if not raw_data:
        raise APIError("No data provided", status_code=400)

    # SECURITY: Validate input using Pydantic model with extra="forbid"
    try:
        validated_input = StoryInput(**raw_data)
    except ValidationError as e:
        raise APIError(
            "Invalid input data",
            status_code=400,
            details={"validation_errors": e.errors()},
        )

    # Get user info from request
    user_info, user_id = get_user_from_request()

    # Check user story limit before creating
    max_stories = current_app.config.get("MAX_STORIES_PER_USER", 100)
    check_user_story_limit(user_id, max_stories)

    # Create metadata for the story (automatically sets visibility to public)
    metadata = create_metadata(
        "story",
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

    # Save the story
    save_object("story", storage_data, metadata)

    # Return the full story data object (like a .mvsj file)
    return jsonify(storage_data), 201


@story_bp.route("/api/story/debug/format", methods=["POST"])
@validate_payload_size()
@error_handler
def debug_story_format():
    """Debug endpoint to test story data format being saved."""
    raw_data = request.get_json()
    if not raw_data:
        raise APIError("No data provided", status_code=400)

    # SECURITY: Validate input using Pydantic model with extra="forbid"
    try:
        validated_input = StoryInput(**raw_data)
    except ValidationError as e:
        raise APIError(
            "Invalid input data",
            status_code=400,
            details={"validation_errors": e.errors()},
        )

    # Get user info from request
    user_info, user_id = get_user_from_request()

    # Create metadata for the story
    metadata = create_metadata(
        "story",
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

    # Show what would be saved
    from storage.utils import get_object_path

    object_path = get_object_path(metadata, "story")

    # Extract just the story data (what should be saved to .mvsj file)
    story_data = storage_data.get("data", {})

    return (
        jsonify(
            {
                "message": "Debug info - story not actually saved",
                "story_id": metadata["id"],
                "object_path": object_path,
                "full_storage_data": storage_data,
                "story_data_only": story_data,
                "what_gets_saved_to_mvsj": story_data,
            }
        ),
        200,
    )


@story_bp.route("/api/story")
@error_handler
def list_stories():
    """List all stories, or only the current user's stories if authenticated."""
    auth_header = request.headers.get("Authorization")
    user_id = None
    if auth_header:
        try:
            from auth import get_user_from_request

            user_info, user_id = get_user_from_request()
        except Exception:
            # If token is invalid, return 401
            raise APIError("Invalid or expired token", status_code=401)

    # If user_id is present, filter by user; else, return all stories
    if user_id:
        stories = list_objects_by_type("story", user_id=user_id)
    else:
        stories = list_objects_by_type("story")

    # Add public URIs to all stories
    for story in stories:
        if "id" in story:
            story["public_uri"] = generate_public_uri("story", story["id"])

    return jsonify(stories), 200


@story_bp.route("/api/story/<story_id>", methods=["GET", "PUT", "DELETE"])
@error_handler
def story_by_id(story_id):
    """Get, update, or delete a specific story by its ID. Stories are always public."""

    if request.method == "GET":
        # GET: Stories are always public, no authentication required
        matching_story = _get_story_by_id(story_id)
        return jsonify(matching_story), 200

    else:
        # For PUT and DELETE operations, require authentication to verify ownership
        user_info, user_id = get_user_from_request()

        if request.method == "PUT":
            return _handle_story_update(story_id, user_id)
        elif request.method == "DELETE":
            return _handle_story_delete(story_id, user_id)


@story_bp.route("/api/story/<story_id>/data", methods=["GET"])
@error_handler
def get_story_data(story_id):
    """Get the raw data content of a specific story. Stories are always public.

    Supports optional format parameter:
    - ?format=mvsj (force .mvsj format)
    - ?format=mvsx (force .mvsx format)
    - No format parameter (tries both .mvsj and .mvsx)
    """
    # Find the story (no authentication needed since stories are public)
    matching_story = _get_story_by_id(story_id)

    # Get the data file from storage
    try:
        story_user_id = matching_story["creator"]["id"]
        from storage.utils import get_plural_type

        path_type = get_plural_type("story")
        object_path = f"{story_user_id}/{path_type}/{story_id}"

        # Check if a specific format is requested
        requested_format = request.args.get("format", "").lower()
        extensions_to_try = _get_story_data_extensions(requested_format)

        for ext in extensions_to_try:
            try:
                return _try_read_story_file(object_path, ext, matching_story, story_id)
            except Exception as e:
                logger.debug(f"Failed to read {ext} file: {str(e)}")
                continue

        # Handle no files found
        if requested_format:
            logger.error(
                f"No valid story data found for story: {story_id} with format: {requested_format}"
            )
            raise APIError(
                f"Story data not found in {requested_format} format", status_code=404
            )
        else:
            logger.error(f"No valid story data found for story: {story_id}")
            raise APIError("Story data not found", status_code=404)
    except Exception as e:
        logger.error(f"Error reading story data: {str(e)}")
        raise APIError("Story data not found", status_code=404)


@story_bp.route("/api/story/<story_id>/session-data", methods=["GET"])
@error_handler
def get_story_session_data(story_id):
    """Get the session data for a story. Stories are always public."""
    # Find the story (no authentication needed since stories are public)
    matching_story = _get_story_by_id(story_id)

    try:
        story_user_id = matching_story["creator"]["id"]
        from storage import MINIO_BUCKET, minio_client
        from storage.utils import get_plural_type

        path_type = get_plural_type("story")
        object_path = f"{story_user_id}/{path_type}/{story_id}"
        session_path = f"{object_path}/session.mvstory"

        # Check if session data exists
        try:
            response = minio_client.get_object(MINIO_BUCKET, session_path)
            session_bytes = response.read()
            response.close()

            # Return raw binary data with appropriate content type
            return send_file(
                io.BytesIO(session_bytes),
                mimetype="application/x-deflate",
                as_attachment=True,
                download_name=f"{matching_story.get('title', story_id)}.mvstory",
            )

        except Exception as e:
            logger.debug(f"Session data not found for story {story_id}: {str(e)}")
            raise APIError("Session data not available for this story", status_code=404)

    except Exception as e:
        logger.error(f"Error reading story session data: {str(e)}")
        raise APIError("Story session data not found", status_code=404)


@story_bp.route("/api/story/<story_id>/format", methods=["GET"])
@error_handler
def get_story_format(story_id):
    """Return the format (mvsj or mvsx) of the story's data file based on S3 extension."""
    # Find the story (no authentication needed since stories are public)
    stories = list_objects_by_type("story")
    matching_story = None
    for story_obj in stories:
        if story_obj.get("id") == story_id:
            matching_story = story_obj
            break
    if not matching_story:
        raise APIError("Story not found", status_code=404)
    try:
        story_user_id = matching_story["creator"]["id"]
        from storage import MINIO_BUCKET, minio_client
        from storage.utils import get_plural_type

        path_type = get_plural_type("story")
        object_path = f"{story_user_id}/{path_type}/{story_id}"
        # Try both extensions
        for ext in [".mvsj", ".mvsx"]:
            data_path = f"{object_path}/data{ext}"
            try:
                minio_client.stat_object(MINIO_BUCKET, data_path)
                return jsonify({"format": ext[1:]})  # Remove dot
            except Exception:
                continue
        raise APIError("Story data file not found", status_code=404)
    except Exception as e:
        raise APIError(
            "Error determining story format", status_code=500, details={"error": str(e)}
        )
