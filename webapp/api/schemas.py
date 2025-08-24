"""Schema definitions for metadata validation."""

import base64
import json
import os
import zlib
from typing import Any, Dict, List, Optional, Union

import msgpack
from pydantic import BaseModel, Field, validator

# Common creator schema used in both session and story metadata
creator_schema = {
    "type": "object",
    "required": ["id", "name", "email"],
    "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "email": {"type": "string", "format": "email"},
    },
    "additionalProperties": False,
}

# Base metadata schema shared between sessions and stories
base_metadata_schema = {
    "type": "object",
    "required": [
        "id",
        "type",
        "created_at",
        "updated_at",
        "creator",
        "title",
        "description",
        "tags",
        "version",
    ],
    "properties": {
        "id": {"type": "string", "format": "uuid"},
        "type": {"type": "string", "enum": ["session", "story"]},
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"},
        "creator": creator_schema,
        "title": {"type": "string"},
        "description": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "version": {"type": "string"},
    },
    "additionalProperties": False,
}

# Session-specific metadata schema
session_metadata_schema = {
    **base_metadata_schema,
    "properties": {
        **base_metadata_schema["properties"],
        "type": {"type": "string", "enum": ["session"]},
    },
}

# Story-specific metadata schema
story_metadata_schema = {
    **base_metadata_schema,
    "properties": {
        **base_metadata_schema["properties"],
        "type": {"type": "string", "enum": ["story"]},
    },
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def _validate_base64_size(data_str, data_type="data"):
    """Validate the size of base64-encoded data."""
    max_base64_size = get_max_base64_size()
    max_size_mb = get_max_upload_size_mb()
    if len(data_str) > max_base64_size:
        raise ValueError(
            f"{data_type} too large: {len(data_str)} characters "
            f"(max: {max_base64_size} characters for {max_size_mb}MB)"
        )


def _decode_and_validate_base64(data_str, data_type="data"):
    """Decode base64 string and validate the resulting binary size."""
    try:
        byte_data = base64.b64decode(data_str)
    except Exception as e:
        raise ValueError(f"Invalid base64 encoding: {str(e)}")

    max_binary_size = get_max_upload_size_bytes()
    if len(byte_data) > max_binary_size:
        raise ValueError(
            f"{data_type} too large: {len(byte_data)} bytes (max: {max_binary_size} bytes)"
        )

    return byte_data


def _decompress_msgpack_data(byte_data):
    """Try to decompress data, fallback to raw bytes if not compressed."""
    try:
        return zlib.decompress(byte_data)
    except zlib.error:
        # Not compressed, use raw bytes
        return byte_data


def _validate_msgpack_format(msgpack_data):
    """Validate that data is in valid msgpack format."""
    try:
        msgpack.unpackb(msgpack_data, raw=False)
    except Exception as e:
        raise ValueError(f"Invalid msgpack data: {str(e)}")


def _validate_legacy_mvsx_dict(data):
    """Validate legacy MVSX dictionary format."""
    import json

    json.dumps(data)  # Ensure it's JSON serializable
    return True


def _validate_mvsx_zip_content(zip_bytes):
    """Validate MVSX zip file content."""
    import io
    import zipfile

    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        # Check for index.mvsj or at least one file
        if "index.mvsj" not in zf.namelist() and len(zf.namelist()) == 0:
            raise ValueError("MVSX zip must contain at least index.mvsj or one file")


def get_max_upload_size_mb():
    """Get the maximum upload size in MB from environment variable."""
    return int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))


def get_max_upload_size_bytes():
    """Get the maximum upload size in bytes."""
    return get_max_upload_size_mb() * 1024 * 1024


def get_max_base64_size():
    """Get the maximum base64 string size (base64 is ~33% larger than binary)."""
    return get_max_upload_size_bytes() * 4 // 3


# ============================================================================
# PYDANTIC MODELS FOR STRICT INPUT VALIDATION
# ============================================================================


class Creator(BaseModel):
    """Creator information - matches frontend interface"""

    id: str
    name: str
    email: str

    class Config:
        extra = "forbid"  # Prevent arbitrary fields


class BaseItemInput(BaseModel):
    """Base input validation model - matches frontend BaseItem interface

    This enforces the supported fields and prevents users from storing
    arbitrary data by doing direct API calls.
    """

    # Required fields for input
    filename: str = Field(..., description="Original filename with extension")
    title: str = Field(default="", description="Human-readable title")
    description: str = Field(default="", description="Detailed description")
    tags: List[str] = Field(default_factory=list, description="List of tags")

    # Optional data payload (the actual session/story content)
    data: Union[Dict[str, Any], str] = Field(
        default=None, description="The actual content data"
    )

    # Server-generated fields should NOT be accepted from input
    # These will be generated by the backend: id, type, created_at, updated_at, creator, version

    class Config:
        extra = "forbid"  # CRITICAL: Prevents arbitrary fields from being stored

    @validator("filename")
    def filename_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Filename cannot be empty")
        return v.strip()

    @validator("title")
    def title_must_be_reasonable_length(cls, v):
        if len(v) > 200:
            raise ValueError("Title must be 200 characters or less")
        return v

    @validator("description")
    def description_must_be_reasonable_length(cls, v):
        if len(v) > 2000:
            raise ValueError("Description must be 2000 characters or less")
        return v

    @validator("tags")
    def validate_tags(cls, v):
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        for tag in v:
            if not isinstance(tag, str):
                raise ValueError("All tags must be strings")
            if len(tag) > 50:
                raise ValueError("Each tag must be 50 characters or less")
        return v


class SessionInput(BaseItemInput):
    """Input validation for session creation/update"""

    # Override data field to only accept base64-encoded compressed msgpack
    data: str = Field(
        ...,
        description="Session data as base64-encoded string containing msgpack data (optionally deflate-compressed)",
    )

    @validator("filename")
    def validate_session_extension(cls, v):
        if not v.endswith(".mvstory"):
            raise ValueError("Session files must have .mvstory extension")
        return v

    @validator("data")
    def validate_session_data_content(cls, v, values):
        """Validate and decode base64-encoded msgpack session data."""
        if not isinstance(v, str):
            raise ValueError("Session data must be a base64-encoded string")

        if not v.strip():
            raise ValueError("Session data cannot be empty")

        # Validate size and decode
        _validate_base64_size(v, "Session data")
        byte_data = _decode_and_validate_base64(v, "Session data")

        # Decompress and validate msgpack format
        msgpack_data = _decompress_msgpack_data(byte_data)
        _validate_msgpack_format(msgpack_data)

        # Return original base64 string (validation only)
        return v

    class Config:
        extra = "forbid"


class StoryInput(BaseItemInput):
    """Input validation for story creation/update"""

    @validator("filename")
    def validate_story_extension(cls, v):
        if not (v.endswith(".mvsj") or v.endswith(".mvsx")):
            raise ValueError("Story files must have .mvsj or .mvsx extension")
        return v

    @validator("data")
    def validate_story_data_content(cls, v, values):
        """Validate story data content based on file extension."""
        filename = values.get("filename", "")

        # Check data size before processing
        if isinstance(v, dict):
            # For JSON data, check serialized size
            try:
                json_str = json.dumps(v)
                max_json_size = get_max_upload_size_bytes()
                if len(json_str) > max_json_size:
                    raise ValueError(
                        f"Story data too large: {len(json_str)} bytes (max: {max_json_size} bytes)"
                    )
            except Exception as e:
                if "too large" in str(e):
                    raise e
                # If JSON serialization fails for other reasons, continue with validation
                pass
        elif isinstance(v, str):
            # For base64-encoded data (like in MVSX files)
            max_base64_size = get_max_base64_size()
            max_size_mb = get_max_upload_size_mb()
            if len(v) > max_base64_size:
                raise ValueError(
                    f"Story data too large: {len(v)} characters (max: {max_base64_size} characters for {max_size_mb}MB)"
                )

        if filename.endswith(".mvsj"):
            validate_json_content(v)
        elif filename.endswith(".mvsx"):
            validate_mvsx_content(v)

        return v

    class Config:
        extra = "forbid"


class BaseItemUpdate(BaseModel):
    """Model for updating existing items - all fields optional except those that shouldn't change"""

    title: Optional[str] = Field(None, description="Human-readable title")
    description: Optional[str] = Field(None, description="Detailed description")
    tags: Optional[List[str]] = Field(None, description="List of tags")
    data: Optional[Dict[str, Any]] = Field(None, description="The actual content data")

    # Fields that cannot be updated: id, type, filename, created_at, creator, version

    class Config:
        extra = "forbid"  # CRITICAL: Prevents arbitrary fields

    @validator("title")
    def title_length_check(cls, v):
        if v is not None and len(v) > 200:
            raise ValueError("Title must be 200 characters or less")
        return v

    @validator("description")
    def description_length_check(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError("Description must be 2000 characters or less")
        return v

    @validator("tags")
    def validate_tags_update(cls, v):
        if v is not None:
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
            for tag in v:
                if not isinstance(tag, str):
                    raise ValueError("All tags must be strings")
                if len(tag) > 50:
                    raise ValueError("Each tag must be 50 characters or less")
        return v

    @validator("data")
    def validate_data_size(cls, v):
        """Validate data size for updates."""
        if v is None:
            return v

        # Check data size before processing
        if isinstance(v, dict):
            # For JSON data, check serialized size
            try:
                json_str = json.dumps(v)
                max_json_size = get_max_upload_size_bytes()
                if len(json_str) > max_json_size:
                    raise ValueError(
                        f"Data too large: {len(json_str)} bytes (max: {max_json_size} bytes)"
                    )
            except Exception as e:
                if "too large" in str(e):
                    raise e
                # If JSON serialization fails for other reasons, continue
                pass
        elif isinstance(v, str):
            # For base64-encoded data
            max_base64_size = get_max_base64_size()
            max_size_mb = get_max_upload_size_mb()
            if len(v) > max_base64_size:
                raise ValueError(
                    f"Data too large: {len(v)} characters (max: {max_base64_size} characters for {max_size_mb}MB)"
                )

        return v


class SessionUpdate(BaseItemUpdate):
    """Model for updating session items with msgpack data support"""

    # Override data field to only accept base64-encoded compressed msgpack
    data: Optional[str] = Field(
        None,
        description="Session data as base64-encoded string containing msgpack data (optionally deflate-compressed)",
    )

    @validator("data")
    def validate_session_data_content(cls, v, values):
        """Validate and decode base64-encoded msgpack session data for updates."""
        if v is None:
            return v

        if not isinstance(v, str):
            raise ValueError("Session data must be a base64-encoded string")

        if not v.strip():
            raise ValueError("Session data cannot be empty")

        # Validate size and decode
        _validate_base64_size(v, "Session data")
        byte_data = _decode_and_validate_base64(v, "Session data")

        # Decompress and validate msgpack format
        msgpack_data = _decompress_msgpack_data(byte_data)
        _validate_msgpack_format(msgpack_data)

        # Return original base64 string (validation only)
        return v

    class Config:
        extra = "forbid"


# ============================================================================
# CONTENT VALIDATION FUNCTIONS
# ============================================================================


def validate_msgpack_content(data):
    """Validate that data can be serialized as msgpack (for sessions)."""
    try:
        # Try to serialize the data as msgpack
        msgpack.packb(data, use_bin_type=True)
        return True
    except Exception as e:
        raise ValueError(f"Data cannot be serialized as msgpack: {str(e)}")


def validate_json_content(data):
    """Validate that data is valid JSON (for .mvsj files)."""
    try:
        # Try to serialize the data as JSON
        json.dumps(data)
        return True
    except Exception as e:
        raise ValueError(f"Data is not valid JSON: {str(e)}")


def validate_mvsx_content(data):
    """Validate that data represents a valid zip file with index.mvsj (for .mvsx files)."""
    try:
        # Accept legacy dict (for backward compatibility)
        if isinstance(data, dict):
            return _validate_legacy_mvsx_dict(data)

        # Accept base64-encoded string (new, binary zip)
        if isinstance(data, str):
            if not data.strip():
                raise ValueError("MVSX data string cannot be empty")

            zip_bytes = _decode_and_validate_base64(data, "MVSX data")
            _validate_mvsx_zip_content(zip_bytes)
            return True

        raise ValueError(
            "MVSX data must be a dictionary (legacy) or a base64-encoded string (zip)"
        )
    except Exception as e:
        raise ValueError(f"Data is not valid MVSX format: {str(e)}")


# ============================================================================
# ORIGINAL VALIDATION FUNCTIONS (kept for backward compatibility)
# ============================================================================

# File format configurations
FILE_FORMATS = {
    "session": ".mvstory",
    "story": [".mvsj", ".mvsx"],  # List of allowed extensions for stories
}


def get_allowed_extensions(object_type):
    """Get allowed file extensions for a given object type."""
    extensions = FILE_FORMATS.get(object_type, [])
    if isinstance(extensions, str):
        return [extensions]
    return extensions


def validate_file_extension(filename, object_type):
    """Validate that a filename has the correct extension for its object type."""
    allowed_extensions = get_allowed_extensions(object_type)
    for ext in allowed_extensions:
        if filename.endswith(ext):
            return True
    return False
