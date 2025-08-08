"""Administrative and utility route handlers."""

import logging

from flask import Blueprint, jsonify, request, session

from auth import make_userinfo_request
from error_handlers import APIError, error_handler
from storage import MINIO_BUCKET, list_minio_buckets, list_minio_objects

logger = logging.getLogger(__name__)

# Create Blueprint
admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/")
@error_handler
def index():
    """Home page showing login status."""
    user = session.get("user")
    if user:
        return f"Hello, {user['name']} ({user['email']})"
    return "You are not logged in."


@admin_bp.route("/api/userinfo")
@error_handler
def userinfo():
    """Get user information from OIDC token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise APIError("Authorization header required", status_code=401)

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise APIError("Invalid token format", status_code=401)

    token = parts[1]
    userinfo = make_userinfo_request(token)
    return jsonify(userinfo), 200


@admin_bp.route("/verify")
@error_handler
def verify():
    """Endpoint to verify user's token and return user information."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise APIError("Authorization header required", status_code=401)

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise APIError("Invalid token format", status_code=401)

    token = parts[1]
    userinfo = make_userinfo_request(token)
    logger.info(f'Token verified for user: {userinfo.get("name")}')
    return jsonify({"authenticated": True, "user": userinfo}), 200


@admin_bp.route("/api/s3/buckets")
@error_handler
def list_buckets():
    """Endpoint to list all MinIO buckets."""
    buckets = list_minio_buckets()
    return jsonify({"buckets": buckets}), 200


@admin_bp.route("/api/s3/list")
@error_handler
def list_bucket_contents():
    """Endpoint to list MinIO bucket contents."""
    # First, list available buckets
    buckets = list_minio_buckets()
    if buckets:
        logger.info(f"Available buckets: {buckets}")

    prefix = request.args.get("prefix", "")

    if not MINIO_BUCKET:
        raise APIError("MinIO bucket not configured", status_code=500)

    objects = list_minio_objects(prefix)
    return jsonify({"bucket": MINIO_BUCKET, "prefix": prefix, "objects": objects}), 200
