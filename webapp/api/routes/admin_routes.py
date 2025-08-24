"""Administrative and utility route handlers."""

import logging

from flask import Blueprint, jsonify, request

from auth import make_userinfo_request
from error_handlers import APIError, error_handler

logger = logging.getLogger(__name__)

# Create Blueprint
admin_bp = Blueprint("admin", __name__)


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
