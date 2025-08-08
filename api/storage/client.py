import logging
import os
import traceback
import warnings
from urllib.parse import urlparse

import urllib3
from minio import Minio
from minio.error import S3Error

from error_handlers import APIError

# Suppress only the single InsecureRequestWarning
warnings.filterwarnings("ignore", category=urllib3.exceptions.InsecureRequestWarning)

# Set up logging
logger = logging.getLogger(__name__)

# MinIO Configuration
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_BUCKET = os.getenv(
    "MINIO_BUCKET", "root"
)  # Use environment variable with fallback
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
MINIO_SECURE = os.getenv("MINIO_SECURE", "true").lower() == "true"

# Check if MinIO is configured
MINIO_ENABLED = bool(MINIO_ENDPOINT and MINIO_ACCESS_KEY and MINIO_SECRET_KEY)

if not MINIO_ENABLED:
    logger.warning("MinIO not configured - storage functionality will be disabled")
    logger.warning(
        "Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY to enable storage"
    )
    minio_client = None
else:
    # Validate required environment variables
    if not MINIO_ENDPOINT:
        raise ValueError("MINIO_ENDPOINT environment variable is required")
    if not MINIO_ACCESS_KEY:
        raise ValueError("MINIO_ACCESS_KEY environment variable is required")
    if not MINIO_SECRET_KEY:
        raise ValueError("MINIO_SECRET_KEY environment variable is required")

# Initialize MinIO client only if enabled
if MINIO_ENABLED:
    # Parse the endpoint to get just the host
    parsed_url = urlparse(MINIO_ENDPOINT)
    MINIO_HOST = parsed_url.netloc if parsed_url.netloc else parsed_url.path

    # Log configuration for debugging
    logger.info("MinIO Configuration:")
    logger.info(f"  Environment: {ENVIRONMENT}")
    logger.info(f"  Endpoint: {MINIO_ENDPOINT}")
    logger.info(f"  Host: {MINIO_HOST}")
    logger.info(f"  Bucket: {MINIO_BUCKET}")

    # Initialize MinIO client
    # Allow opting out of TLS for local development via MINIO_SECURE=false
    minio_client = Minio(
        MINIO_HOST,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE,
        cert_check=False,  # Skip certificate verification for self-signed certs
    )
else:
    MINIO_HOST = None
    minio_client = None


def handle_minio_error(operation):
    """Decorator to handle MinIO client errors."""

    def decorator(f):
        def wrapper(*args, **kwargs):
            if not MINIO_ENABLED:
                raise APIError(
                    f"Storage operation failed: {operation}",
                    status_code=503,
                    details={"error": "MinIO storage is not configured"},
                )
            try:
                return f(*args, **kwargs)
            except S3Error as e:
                error_msg = f"MinIO error during {operation}: {str(e)}"
                logger.error(error_msg)
                logger.error(f"Stack trace: {traceback.format_exc()}")
                raise APIError(
                    f"Storage operation failed: {operation}",
                    status_code=500,
                    details={"error": str(e)},
                )
            except Exception as e:
                error_msg = f"Unexpected error during {operation}: {str(e)}"
                logger.error(error_msg)
                logger.error(f"Stack trace: {traceback.format_exc()}")
                raise APIError(
                    f"Storage operation failed: {operation}",
                    status_code=500,
                    details={"error": str(e)},
                )

        return wrapper

    return decorator


def ensure_bucket_exists():
    """Ensure the MinIO bucket exists."""
    if not MINIO_ENABLED:
        logger.warning("MinIO not enabled, skipping bucket creation")
        return
    try:
        if not minio_client.bucket_exists(MINIO_BUCKET):
            logger.info(f"Bucket {MINIO_BUCKET} does not exist, creating it")
            minio_client.make_bucket(MINIO_BUCKET)
            logger.info(f"Created bucket: {MINIO_BUCKET}")
    except Exception as e:
        logger.error(f"Error ensuring bucket exists: {str(e)}")
        raise


@handle_minio_error("list_objects")
def list_minio_objects(prefix=""):
    """List objects in the MinIO bucket with optional prefix."""
    objects = []
    try:
        # Ensure the bucket exists
        ensure_bucket_exists()

        logger.info(
            f"Listing objects in bucket '{MINIO_BUCKET}' with prefix '{prefix}'"
        )

        # Use recursive=True to get all objects, not just top-level
        for obj in minio_client.list_objects(
            MINIO_BUCKET, prefix=prefix, recursive=True
        ):
            # Handle potentially missing or None values
            last_modified = obj.last_modified.isoformat() if obj.last_modified else None
            etag = obj.etag if hasattr(obj, "etag") else None
            size = obj.size if hasattr(obj, "size") else 0

            # Only add actual files, not directory markers
            if not obj.object_name.endswith("/"):
                objects.append(
                    {
                        "key": obj.object_name,
                        "size": size,
                        "last_modified": last_modified,
                        "etag": etag,
                    }
                )

                logger.debug(f"Found object: {obj.object_name} (size: {size})")
    except Exception as e:
        logger.error(f"Error listing objects: {e}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise

    logger.info(
        f"Listed {len(objects)} objects with prefix '{prefix}' in bucket '{MINIO_BUCKET}'"
    )
    return objects


@handle_minio_error("list_buckets")
def list_minio_buckets():
    """List all buckets in MinIO."""
    buckets = [bucket.name for bucket in minio_client.list_buckets()]
    logger.info(f"Found buckets: {buckets}")
    return buckets
