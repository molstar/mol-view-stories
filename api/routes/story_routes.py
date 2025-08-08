"""Story-related route handlers."""

import io
import json
import logging

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
    update_story_by_id,
)
from utils import validate_payload_size

logger = logging.getLogger(__name__)

# Create Blueprint
story_bp = Blueprint("stories", __name__)


def generate_public_uri(object_type, object_id):
    """Generate a public URI for an object."""
    import os

    base_url = os.getenv("BASE_URL", "https://stories.molstar.org").rstrip("/")
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
    max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 50)
    error_response = _validate_payload_size_inline(max_size_mb)
    if error_response:
        return error_response

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
        f"Update story request received for story_id: {story_id} by user: {user_id}"
    )
    logger.debug(f"Validated input fields: {validated_input.dict(exclude_none=True)}")

    # Perform the update with authorization check
    updated_metadata = update_story_by_id(
        story_id, user_id, validated_input.dict(exclude_none=True)
    )

    logger.info(f"Update story completed for story_id: {story_id} by user: {user_id}")
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
    """Create a new story with strict field validation. Stories are always public."""
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
    result = save_object("story", storage_data, metadata)

    # Check if user wants the full data object instead of just metadata
    return_data = request.args.get("return_data", "").lower() == "true"

    if return_data:
        # Return the full story data object (like a .mvsj file)
        return jsonify(storage_data), 201
    else:
        # Return metadata only (default behavior)
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
