import base64
import io
import json
import logging
import os
import traceback

import msgpack

from error_handlers import APIError
from storage.client import (
    MINIO_BUCKET,
    ensure_bucket_exists,
    handle_minio_error,
    list_minio_objects,
    minio_client,
)
from storage.metadata import (
    update_metadata_timestamp,
    validate_data_filename,
    validate_metadata,
)
from storage.utils import (
    extract_unique_object_directories,
    extract_user_ids_from_objects,
    get_content_type,
    get_data_file_extension,
    get_object_path,
    get_plural_type,
)

logger = logging.getLogger(__name__)


@handle_minio_error("save_object")
def save_object(data_type, data, metadata):
    """Save an object (session or story) to MinIO storage."""
    _validate_save_inputs(data_type, data, metadata)

    object_path = get_object_path(metadata, data_type)

    try:
        logger.info(f"Starting save_object operation for {data_type}")
        logger.info(f"Object path: {object_path}")

        ensure_bucket_exists()
        _save_metadata(object_path, metadata)
        _save_data(object_path, data, data_type)

        return metadata
    except Exception as e:
        logger.error(f"Error in save_object: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise


def _validate_save_inputs(data_type, data, metadata):
    """Validate inputs for save_object."""
    if data_type not in ["session", "story"]:
        raise APIError(
            f"Invalid data type: {data_type}. Must be 'session' or 'story'",
            status_code=400,
        )

    data_filename = data.get("filename")
    if not data_filename:
        raise APIError(f"Filename is required for {data_type}", status_code=400)

    logger.info(f"Saving {data_type} with filename: {data_filename}")

    validate_data_filename(data_filename, data_type)
    validate_metadata(metadata, data_type)


def _save_metadata(object_path, metadata):
    """Save metadata to MinIO."""
    metadata_key = f"{object_path}/metadata.json"
    metadata_bytes = json.dumps(metadata, indent=2).encode("utf-8")

    with io.BytesIO(metadata_bytes) as metadata_stream:
        logger.info(f"Saving metadata to {metadata_key}")
        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=metadata_key,
            data=metadata_stream,
            length=len(metadata_bytes),
            content_type="application/json",
        )
        logger.info("Successfully saved metadata")


def _save_data(object_path, data, data_type):
    """Save data to MinIO."""
    filename = data.get("filename")
    extension = get_data_file_extension(data_type, filename)
    data_key = f"{object_path}/data{extension}"
    content_type = get_content_type(data_type)

    if data_type == "story":
        # For .mvsx, store only the base64 string as the file content
        if filename and filename.endswith(".mvsx"):
            story_data = data.get("data", "")
            if isinstance(story_data, str):
                # Decode base64 to binary before saving
                data_bytes = base64.b64decode(story_data)
            elif isinstance(story_data, dict):
                logger.warning(
                    f"MVSX story_data is a dict, not a string. Keys: {list(story_data.keys())}"
                )
                for k, v in story_data.items():
                    logger.warning(f"Key: {k}, type: {type(v)}")
                if "title" in story_data:
                    logger.error(
                        "MVSX story_data contains a 'title' field! This is likely a frontend or API payload bug."
                    )
                data_bytes = json.dumps(story_data).encode("utf-8")
            else:
                logger.error(
                    f"MVSX story_data is not a string or dict. Type: {type(story_data)}"
                )
                data_bytes = b""
            # No longer save as raw base64 string, always decode to binary
        else:
            # For .mvsj and other story types, keep existing behavior
            story_data = data.get("data", {})
            logger.info(f"Saving .mvsj story: type(data)={type(story_data)}")
            data_bytes = json.dumps(story_data, indent=2).encode("utf-8")
    else:
        data_bytes = msgpack.packb(data, use_bin_type=True)

    with io.BytesIO(data_bytes) as data_stream:
        logger.info(f"Saving data to {data_key}")
        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=data_key,
            data=data_stream,
            length=len(data_bytes),
            content_type=content_type,
        )
        logger.info("Successfully saved data")


@handle_minio_error("list_objects")
def list_objects_by_type(data_type, user_id=None):
    """List objects of a specific type with optional user filtering."""
    path_type = get_plural_type(data_type)

    if user_id:
        return _list_objects_for_user(data_type, path_type, user_id)
    else:
        return _list_objects_for_all_users(data_type, path_type)


def _list_objects_for_user(data_type, path_type, user_id):
    """List objects for a specific user."""
    prefix = f"{user_id}/{path_type}/"

    logger.info(f"Listing objects for user {user_id} with prefix: {prefix}")

    objects = list_minio_objects(prefix)
    if objects is None:
        logger.info(f"No objects found for prefix: {prefix}")
        return []

    return _process_objects_for_user(objects, data_type, user_id)


def _list_objects_for_all_users(data_type, path_type):
    """List objects across all users."""
    logger.info(f"Listing all {data_type} objects across all users")

    all_objects = list_minio_objects("")
    if all_objects is None:
        return []

    user_ids = extract_user_ids_from_objects(all_objects, path_type)
    logger.info(f"Found {len(user_ids)} users to scan for {data_type} objects")

    result = []
    for uid in user_ids:
        user_prefix = f"{uid}/{path_type}/"

        user_objects = list_minio_objects(user_prefix)
        if user_objects:
            user_result = _process_objects_for_user(user_objects, data_type, uid)
            result.extend(user_result)

    logger.info(f"Found {len(result)} {data_type} objects")
    return result


def _process_objects_for_user(objects, data_type, user_id):
    """Process objects for a specific user and return metadata list."""
    result = []
    path_type = get_plural_type(data_type)

    logger.debug(f"Processing {len(objects)} objects for user {user_id}")

    object_dirs = extract_unique_object_directories(objects, path_type)
    logger.debug(
        f"Found {len(object_dirs)} potential {data_type} directories for user {user_id}"
    )

    for dir_path in object_dirs:
        metadata = _load_metadata_from_directory(dir_path, data_type)
        if metadata:
            result.append(metadata)

    return result


def _load_metadata_from_directory(dir_path, data_type):
    """Load and validate metadata from a directory."""
    metadata_path = f"{dir_path}metadata.json"
    try:
        logger.debug(f"Looking for metadata at: {metadata_path}")
        response = minio_client.get_object(MINIO_BUCKET, metadata_path)
        data = response.read()
        metadata = json.loads(data.decode("utf-8"))

        # Validate that this is the correct type of object
        actual_type = metadata.get("type")
        if actual_type == data_type:
            logger.debug(f"Successfully added metadata for: {metadata_path}")
            return metadata
        else:
            logger.warning(
                f"Skipping {metadata_path}: wrong type (expected {data_type}, got {actual_type})"
            )

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in metadata file {metadata_path}: {e}")
    except Exception as e:
        logger.error(f"Error reading metadata for {metadata_path}: {e}")
    finally:
        if "response" in locals():
            response.close()

    return None


@handle_minio_error("delete_all_user_data")
def delete_all_user_data(user_id):
    """Delete all sessions and stories for a specific user."""
    if not user_id:
        raise APIError("User ID is required for deletion", status_code=400)

    logger.info(f"Starting deletion of all data for user: {user_id}")

    user_prefix = f"{user_id}/"
    user_objects = list_minio_objects(user_prefix)

    if not user_objects:
        logger.info(f"No objects found for user {user_id}")
        return _create_deletion_summary(user_id, 0, 0, 0, "No data found for user")

    logger.info(f"Found {len(user_objects)} objects to delete for user {user_id}")

    deleted_objects = _delete_objects(user_objects)
    sessions_deleted, stories_deleted = _count_deleted_objects(deleted_objects)

    logger.info(
        f"Successfully deleted all data for user {user_id}: "
        f"{sessions_deleted} sessions, {stories_deleted} stories, "
        f"{len(deleted_objects)} total files"
    )

    return _create_deletion_summary(
        user_id,
        sessions_deleted,
        stories_deleted,
        len(deleted_objects),
        f"Successfully deleted all data for user {user_id}",
    )


def _delete_objects(objects):
    """Delete a list of objects and return successfully deleted objects."""
    deleted_objects = []

    for obj in objects:
        try:
            object_key = obj["key"]
            logger.debug(f"Deleting object: {object_key}")

            minio_client.remove_object(MINIO_BUCKET, object_key)
            deleted_objects.append(object_key)

        except Exception as e:
            logger.error(f"Failed to delete object {obj['key']}: {str(e)}")
            continue

    return deleted_objects


def _count_deleted_objects(deleted_objects):
    """Count sessions and stories from deleted object paths."""
    sessions_deleted = 0
    stories_deleted = 0

    for obj_key in deleted_objects:
        if "/sessions/" in obj_key:
            sessions_deleted += 1
        elif "/stories/" in obj_key:
            stories_deleted += 1

    # Since each session/story has 2 files (metadata.json and data.*),
    # divide by 2 to get actual object count
    return sessions_deleted // 2, stories_deleted // 2


def _create_deletion_summary(
    user_id, sessions_deleted, stories_deleted, total_objects_deleted, message
):
    """Create a deletion summary dictionary."""
    return {
        "user_id": user_id,
        "sessions_deleted": sessions_deleted,
        "stories_deleted": stories_deleted,
        "total_objects_deleted": total_objects_deleted,
        "message": message,
    }


def find_object_by_id(object_id, data_type):
    """Find an object by ID across all users and visibilities."""
    all_objects = list_objects_by_type(data_type)

    for obj in all_objects:
        if obj.get("id") == object_id:
            return obj

    return None


def _find_object_by_id(object_id, data_type):
    """Deprecated: Use find_object_by_id instead."""
    return find_object_by_id(object_id, data_type)


def _check_object_ownership(obj, requesting_user_id, object_id, object_type):
    """Check if the requesting user owns the object."""
    creator_id = obj.get("creator", {}).get("id")
    if creator_id != requesting_user_id:
        raise APIError(
            f"Access denied. Only the creator can modify this {object_type}",
            status_code=403,
            details={
                f"{object_type}_id": object_id,
                "creator_id": creator_id,
                "requesting_user_id": requesting_user_id,
            },
        )


@handle_minio_error("delete_session_by_id")
def delete_session_by_id(session_id, requesting_user_id):
    """Delete a specific session by ID, with authorization check."""
    return _delete_object_by_id(session_id, requesting_user_id, "session")


@handle_minio_error("delete_story_by_id")
def delete_story_by_id(story_id, requesting_user_id):
    """Delete a specific story by ID, with authorization check."""
    return _delete_object_by_id(story_id, requesting_user_id, "story")


def _delete_object_by_id(object_id, requesting_user_id, object_type):
    """Delete a specific object by ID, with authorization check."""
    if not object_id:
        raise APIError(
            f"{object_type.title()} ID is required for deletion", status_code=400
        )

    if not requesting_user_id:
        raise APIError("User authentication required", status_code=401)

    logger.info(
        f"Delete {object_type} {object_id} requested by user: {requesting_user_id}"
    )

    matching_object = _find_object_by_id(object_id, object_type)
    if not matching_object:
        raise APIError(f"{object_type.title()} not found", status_code=404)

    _check_object_ownership(matching_object, requesting_user_id, object_id, object_type)

    deleted_files = _delete_object_files(matching_object, object_id, object_type)

    logger.info(
        f"Successfully deleted {object_type} {object_id} for user {requesting_user_id}"
    )

    return {
        f"{object_type}_id": object_id,
        "user_id": requesting_user_id,
        "message": f"Successfully deleted {object_type} {object_id}",
        "deleted_files": deleted_files,
    }


def _delete_object_files(obj, object_id, object_type):
    """Delete the actual files for an object."""
    creator_id = obj.get("creator", {}).get("id")
    path_type = get_plural_type(object_type)
    object_path = f"{creator_id}/{path_type}/{object_id}"

    # Delete metadata.json
    metadata_key = f"{object_path}/metadata.json"
    logger.debug(f"Deleting metadata: {metadata_key}")
    minio_client.remove_object(MINIO_BUCKET, metadata_key)

    deleted_files = [metadata_key]

    if object_type == "session":
        # Delete data.mvstory
        data_key = f"{object_path}/data.mvstory"
        logger.debug(f"Deleting data: {data_key}")
        minio_client.remove_object(MINIO_BUCKET, data_key)
        deleted_files.append(data_key)
    else:
        # For stories, find and delete the data file (could be .mvsj or .mvsx)
        data_files = _find_story_data_files(object_path)
        for data_file in data_files:
            logger.debug(f"Deleting data file: {data_file}")
            minio_client.remove_object(MINIO_BUCKET, data_file)
            deleted_files.append(data_file)

    return deleted_files


def _find_story_data_files(object_path):
    """Find data files for a story object."""
    data_files = []
    try:
        object_prefix = f"{object_path}/"
        objects = list_minio_objects(object_prefix)
        metadata_key = f"{object_path}/metadata.json"

        for obj in objects:
            if obj["key"] != metadata_key and obj["key"].startswith(object_prefix):
                data_files.append(obj["key"])
    except Exception as e:
        logger.warning(f"Could not list objects to find data file: {e}")

    if not data_files:
        logger.warning(f"No data files found for story at {object_path}")

    return data_files


@handle_minio_error("update_session_by_id")
def update_session_by_id(session_id, requesting_user_id, update_data):
    """Update a specific session by ID, with authorization check."""
    return _update_object_by_id(session_id, requesting_user_id, update_data, "session")


@handle_minio_error("update_story_by_id")
def update_story_by_id(story_id, requesting_user_id, update_data):
    """Update a specific story by ID, with authorization check."""
    return _update_object_by_id(story_id, requesting_user_id, update_data, "story")


def _update_object_by_id(object_id, requesting_user_id, update_data, object_type):
    """Update a specific object by ID, with authorization check."""
    if not object_id:
        raise APIError(
            f"{object_type.title()} ID is required for update", status_code=400
        )

    if not requesting_user_id:
        raise APIError("User authentication required", status_code=401)

    logger.info(
        f"Update {object_type} {object_id} requested by user: {requesting_user_id}"
    )

    matching_object = _find_object_by_id(object_id, object_type)
    if not matching_object:
        raise APIError(f"{object_type.title()} not found", status_code=404)

    _check_object_ownership(matching_object, requesting_user_id, object_id, object_type)

    updated_metadata = _update_object_metadata(
        matching_object, update_data, object_type
    )
    _save_updated_metadata(updated_metadata, object_id, object_type)

    if "data" in update_data and update_data["data"] is not None:
        _save_updated_data(updated_metadata, update_data, object_id, object_type)

    logger.info(
        f"Successfully updated {object_type} {object_id} for user {requesting_user_id}"
    )
    return updated_metadata


def _update_object_metadata(original_metadata, update_data, object_type):
    """Update metadata with new values."""
    updated_metadata = update_metadata_timestamp(original_metadata)

    # Update only the provided fields (no visibility field since sessions are always private, stories always public)
    for field in ["title", "description", "tags"]:
        if field in update_data and update_data[field] is not None:
            updated_metadata[field] = update_data[field]

    validate_metadata(updated_metadata, object_type)
    return updated_metadata


def _save_updated_metadata(metadata, object_id, object_type):
    """Save updated metadata to storage."""
    creator_id = metadata.get("creator", {}).get("id")
    path_type = get_plural_type(object_type)
    object_path = f"{creator_id}/{path_type}/{object_id}"

    _save_metadata(object_path, metadata)
    logger.debug(f"Updated metadata for {object_type} {object_id}")


def _save_updated_data(metadata, update_data, object_id, object_type):
    """Save updated data to storage."""
    creator_id = metadata.get("creator", {}).get("id")
    path_type = get_plural_type(object_type)
    object_path = f"{creator_id}/{path_type}/{object_id}"

    if object_type == "session":
        _save_updated_session_data(object_path, metadata, update_data, object_id)
    else:
        _save_updated_story_data(object_path, metadata, update_data, object_id)

    logger.debug(f"Updated data for {object_type} {object_id}")


def _save_updated_session_data(object_path, metadata, update_data, session_id):
    """Save updated session data."""
    data_key = f"{object_path}/data.mvstory"

    storage_data = {
        "filename": f"{session_id}.mvstory",
        "title": metadata["title"],
        "description": metadata["description"],
        "tags": metadata["tags"],
        "data": update_data["data"],
    }

    data_bytes = msgpack.packb(storage_data, use_bin_type=True)

    with io.BytesIO(data_bytes) as data_stream:
        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=data_key,
            data=data_stream,
            length=len(data_bytes),
            content_type="application/msgpack",
        )


def _save_updated_story_data(object_path, metadata, update_data, story_id):
    """Save updated story data."""
    # Find the existing data file to determine extension
    object_prefix = f"{object_path}/"
    objects = list_minio_objects(object_prefix)

    data_file_extension = ".mvsj"  # Default
    for obj in objects:
        if not obj["key"].endswith("metadata.json") and obj["key"].startswith(
            object_prefix
        ):
            _, ext = os.path.splitext(obj["key"])
            if ext in [".mvsj", ".mvsx"]:
                data_file_extension = ext
                break

    data_key = f"{object_path}/data{data_file_extension}"

    # Save only the actual story data, not the metadata wrapper
    story_data = update_data["data"]
    data_bytes = json.dumps(story_data, indent=2).encode("utf-8")

    with io.BytesIO(data_bytes) as data_stream:
        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=data_key,
            data=data_stream,
            length=len(data_bytes),
            content_type="application/json",
        )
