import os


def get_plural_type(data_type):
    """Convert data type to proper plural form."""
    if data_type == "story":
        return "stories"
    elif data_type == "session":
        return "sessions"
    else:
        # Fallback for any other types
        return data_type + "s"


def get_object_path(metadata, data_type):
    """Generate the S3 object path based on metadata.

    Structure:
    root/
        {user_id}/
            {type}s/
                {object_id}/
                    - metadata.json
                    - data.{ext}
    """
    user_id = metadata["creator"]["id"]
    object_id = metadata["id"]

    # Convert type to plural (story -> stories, session -> sessions)
    path_type = get_plural_type(data_type)

    # Simplified user-centric structure without visibility
    return f"{user_id}/{path_type}/{object_id}"


def get_data_file_extension(data_type, filename=None):
    """Get the appropriate file extension for data files."""
    if data_type == "story":
        # For stories: use the original extension from the filename
        if filename:
            _, ext = os.path.splitext(filename)
            return ext if ext in [".mvsj", ".mvsx"] else ".mvsj"
        return ".mvsj"
    else:
        # For sessions: use msgpack format
        return ".mvstory"


def get_content_type(data_type):
    """Get the appropriate content type for data files."""
    if data_type == "story":
        return "application/json"
    else:
        return "application/msgpack"


def extract_unique_object_directories(objects, path_type):
    """Extract unique object directories from a list of objects."""
    object_dirs = set()
    for obj in objects:
        # Split the path and get the directory containing the object
        parts = obj["key"].rstrip("/").split("/")
        # New structure: {user_id}/{type}s/{object_id}/...
        if len(parts) >= 3:  # user_id/types/object_id/...
            object_dir = "/".join(parts[:3]) + "/"
            object_dirs.add(object_dir)
    return object_dirs


def extract_user_ids_from_objects(objects, path_type):
    """Extract unique user IDs from object paths."""
    user_ids = set()
    for obj in objects:
        parts = obj["key"].split("/")
        if len(parts) >= 2 and parts[1] == path_type:  # {user_id}/{type}s/...
            user_ids.add(parts[0])
    return user_ids


def is_object_public(object_id, object_type):
    """Check if an object (session or story) is public by its type.

    Args:
        object_id: The ID of the object to check
        object_type: The type of object ('session' or 'story')

    Returns:
        tuple: (is_public: bool, object_data: dict or None)
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        # Sessions are always private, stories are always public
        if object_type == "session":
            return False, None
        elif object_type == "story":
            # Import here to avoid circular imports since we're in the storage module
            from .objects import list_objects_by_type

            # Get all story objects (they're all public now)
            public_objects = list_objects_by_type(object_type)

            # Find the object with matching ID
            for obj in public_objects:
                if obj.get("id") == object_id:
                    logger.debug(f"Found public {object_type}: {object_id}")
                    return True, obj

            return False, None
        else:
            logger.error(f"Unknown object type: {object_type}")
            return False, None
    except Exception as e:
        logger.error(f"Error checking if {object_type} {object_id} is public: {str(e)}")
        return False, None
