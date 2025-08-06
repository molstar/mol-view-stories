import uuid
from datetime import datetime
from jsonschema import validate, ValidationError
from schemas import (
    session_metadata_schema,
    story_metadata_schema,
    validate_file_extension,
    get_allowed_extensions
)
from error_handlers import APIError


def create_metadata(object_type, user_info, title="", description="", tags=None):
    """Create metadata for a new object.
    
    Args:
        object_type: 'session' (always private) or 'story' (always public)
        user_info: User information from authentication
        title: Optional title
        description: Optional description
        tags: Optional list of tags
    """
    if tags is None:
        tags = []
    
    now = datetime.utcnow().isoformat()
    metadata = {
        "id": str(uuid.uuid4())[:8],
        "type": object_type,
        "created_at": now,
        "updated_at": now,
        "creator": {
            "id": user_info.get("sub", ""),
            "name": user_info.get("name", ""),
            "email": user_info.get("email", "")
        },
        "title": title,
        "description": description,
        "tags": tags,
        "version": "1.0"
    }

    try:
        schema = session_metadata_schema if object_type == "session" else story_metadata_schema
        validate(instance=metadata, schema=schema)
        return metadata
    except ValidationError as e:
        raise APIError(
            "Invalid metadata format",
            status_code=400,
            details={'validation_error': str(e)}
        )


def validate_metadata(metadata, object_type):
    """Validate metadata against the appropriate schema."""
    try:
        schema = session_metadata_schema if object_type == "session" else story_metadata_schema
        validate(instance=metadata, schema=schema)
        return True
    except ValidationError as e:
        raise APIError(
            "Invalid metadata format",
            status_code=400,
            details={'validation_error': str(e)}
        )


def validate_data_filename(filename, data_type):
    """Validate file extension for the given data type."""
    if not validate_file_extension(filename, data_type):
        allowed_ext = get_allowed_extensions(data_type)
        raise APIError(
            f"Invalid file extension for {data_type}: {filename}",
            status_code=400,
            details={
                'allowed_extensions': allowed_ext,
                'provided_filename': filename
            }
        )
    return True


def update_metadata_timestamp(metadata):
    """Update the updated_at timestamp of metadata."""
    metadata = metadata.copy()
    metadata['updated_at'] = datetime.utcnow().isoformat()
    return metadata 