"""Authentication and authorization utilities."""

import logging
import os
from functools import wraps

import requests
from flask import request, session

from error_handlers import APIError

logger = logging.getLogger(__name__)


def session_required(f):
    """Decorator to ensure the request has a valid session."""

    @wraps(f)
    def decorated(*args, **kwargs):
        user = session.get("user")
        if not user:
            logger.warning("No valid session found.")
            raise APIError("Authentication required!", status_code=401)

        return f(current_user=user, *args, **kwargs)

    return decorated


def make_userinfo_request(token):
    """Make a request to the OIDC /userinfo endpoint to validate the token."""
    userinfo_endpoint = os.getenv(
        "OIDC_USERINFO_URL", "https://login.aai.lifescience-ri.eu/oidc/userinfo"
    )
    headers = {"Authorization": f"Bearer {token}"}

    try:
        with requests.Session() as session:
            response = session.get(userinfo_endpoint, headers=headers, timeout=5)
        response.raise_for_status()
        userinfo = response.json()
        logger.info(f'Userinfo request successful: {userinfo.get("name")}')
        return userinfo
    except requests.exceptions.RequestException as e:
        logger.error(f"Error during userinfo request: {e}")
        raise APIError(
            "Failed to validate token", status_code=401, details={"error": str(e)}
        )


def get_user_from_request():
    """Extract and validate user info from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise APIError("Authorization required", status_code=401)

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise APIError("Invalid token format", status_code=401)

    token = parts[1]
    user_info = make_userinfo_request(token)
    return user_info, user_info.get("sub")
