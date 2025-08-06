# Storage module - unified interface for object storage operations
# This module provides the same API as the original storage.py file

# Import client configuration and basic operations
from storage.client import (
    minio_client,
    MINIO_ENDPOINT,
    MINIO_BUCKET,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_HOST,
    handle_minio_error,
    ensure_bucket_exists,
    list_minio_objects,
    list_minio_buckets
)

# Import metadata operations
from storage.metadata import (
    create_metadata,
    validate_metadata,
    validate_data_filename,
    update_metadata_timestamp
)

# Import utility functions
from storage.utils import (
    get_object_path,
    get_data_file_extension,
    get_content_type,
    extract_unique_object_directories,
    extract_user_ids_from_objects
)

# Import quota management
from storage.quota import (
    count_user_sessions,
    count_user_stories,
    check_user_session_limit,
    check_user_story_limit
)

# Import object CRUD operations
from storage.objects import (
    save_object,
    list_objects_by_type,
    delete_all_user_data,
    delete_session_by_id,
    delete_story_by_id,
    update_session_by_id,
    update_story_by_id,
    find_object_by_id
)

# Export all functions to maintain the same API as the original storage.py
__all__ = [
    # Client and configuration
    'minio_client',
    'MINIO_ENDPOINT',
    'MINIO_BUCKET',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY', 
    'MINIO_HOST',
    'handle_minio_error',
    'ensure_bucket_exists',
    'list_minio_objects',
    'list_minio_buckets',
    
    # Metadata operations
    'create_metadata',
    'validate_metadata',
    'validate_data_filename',
    'update_metadata_timestamp',
    
    # Utility functions
    'get_object_path',
    'get_data_file_extension',
    'get_content_type',
    'extract_unique_object_directories',
    'extract_user_ids_from_objects',
    
    # Quota management
    'count_user_sessions',
    'count_user_stories',
    'check_user_session_limit',
    'check_user_story_limit',
    
    # Object CRUD operations
    'save_object',
    'list_objects_by_type',
    'delete_all_user_data',
    'delete_session_by_id',
    'delete_story_by_id',
    'update_session_by_id',
    'update_story_by_id',
] 