"""Error handling utilities for the API."""

import logging
from functools import wraps

from flask import jsonify
from werkzeug.exceptions import RequestEntityTooLarge

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base exception for API errors."""

    def __init__(self, message, status_code=400, details=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.details = details or {}


def handle_api_error(error):
    """Convert APIError to JSON response."""
    response = {
        "error": True,
        "message": error.message,
        "status_code": error.status_code,
    }
    if error.details:
        response["details"] = error.details

    return jsonify(response), error.status_code


def error_handler(f):
    """Decorator to handle errors in API endpoints."""

    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except APIError as e:
            logger.error(f"API Error: {e.message}", extra={"details": e.details})
            return handle_api_error(e)
        except RequestEntityTooLarge as e:
            logger.warning(f"File size limit exceeded: {str(e)}")
            return (
                jsonify(
                    {
                        "error": True,
                        "message": "File size too large",
                        "status_code": 413,
                        "details": {
                            "type": "RequestEntityTooLarge",
                            "description": "The uploaded file exceeds the maximum allowed size of 50MB",
                            "max_size_mb": 50,
                            "suggestion": "Please reduce the file size and try again",
                        },
                    }
                ),
                413,
            )
        except Exception as e:
            logger.exception("Unexpected error occurred")
            return (
                jsonify(
                    {
                        "error": True,
                        "message": "An unexpected error occurred",
                        "status_code": 500,
                        "details": {"type": type(e).__name__, "description": str(e)},
                    }
                ),
                500,
            )

    return decorated
