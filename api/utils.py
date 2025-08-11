"""Utility functions and decorators."""

import logging
from functools import wraps

from flask import current_app, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge

logger = logging.getLogger(__name__)


def validate_payload_size(max_size_mb=None):
    """
    Decorator to validate request payload size early to prevent OOM issues.

    This checks the Content-Length header before processing the request,
    which is much more efficient than letting Flask load the entire payload
    into memory before rejecting it.

    Args:
        max_size_mb: Maximum size in MB. If None, uses app config value.
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get max size from app config if not specified
            if max_size_mb is None:
                max_size_mb_config = current_app.config.get("MAX_UPLOAD_SIZE_MB", 50)
            else:
                max_size_mb_config = max_size_mb

            max_size_bytes = max_size_mb_config * 1024 * 1024

            # Check Content-Length header if present
            content_length = request.content_length
            if content_length is not None:
                if content_length > max_size_bytes:
                    logger.warning(
                        f"Request payload too large: {content_length} bytes (max: {max_size_bytes} bytes)"
                    )
                    return (
                        jsonify(
                            {
                                "error": True,
                                "message": "Request payload too large",
                                "status_code": 413,
                                "details": {
                                    "type": "PayloadTooLarge",
                                    "description": (
                                        f"The request payload exceeds the maximum "
                                        f"allowed size of {max_size_mb_config}MB"
                                    ),
                                    "max_size_mb": max_size_mb_config,
                                    "received_size_mb": round(
                                        content_length / (1024 * 1024), 2
                                    ),
                                    "suggestion": "Please reduce the payload size and try again",
                                },
                            }
                        ),
                        413,
                    )
            else:
                # CRITICAL FIX: Reject requests without Content-Length header
                # This prevents chunked transfer encoding from bypassing limits
                logger.warning(
                    "Request missing Content-Length header - rejecting to prevent bypass"
                )
                return (
                    jsonify(
                        {
                            "error": True,
                            "message": "Content-Length header required",
                            "status_code": 400,
                            "details": {
                                "type": "MissingContentLength",
                                "description": (
                                    f"Content-Length header is required for uploads. "
                                    f"Maximum allowed size: {max_size_mb_config}MB"
                                ),
                                "max_size_mb": max_size_mb_config,
                                "suggestion": "Ensure your client sends Content-Length header",
                            },
                        }
                    ),
                    400,
                )

            return f(*args, **kwargs)

        return decorated_function

    return decorator


class SizeLimitedStream:
    """Stream wrapper that enforces size limits during reading."""

    def __init__(self, stream, max_size, logger=None):
        self.stream = stream
        self.max_size = max_size
        self.bytes_read = 0
        self.logger = logger or logging.getLogger(__name__)

    def read(self, size=-1):
        if size == -1:
            # Read all remaining bytes, but enforce limit
            size = self.max_size - self.bytes_read + 1

        data = self.stream.read(size)
        self.bytes_read += len(data)

        if self.bytes_read > self.max_size:
            self.logger.warning(
                f"Stream size limit exceeded: {self.bytes_read} bytes (max: {self.max_size} bytes)"
            )
            raise RequestEntityTooLarge(
                f"Request entity too large: {self.bytes_read} bytes (max: {self.max_size} bytes)"
            )

        return data

    def readline(self, size=-1):
        line = self.stream.readline(size)
        self.bytes_read += len(line)

        if self.bytes_read > self.max_size:
            self.logger.warning(
                f"Stream size limit exceeded during readline: {self.bytes_read} bytes"
            )
            raise RequestEntityTooLarge(
                f"Request entity too large: {self.bytes_read} bytes (max: {self.max_size} bytes)"
            )

        return line

    def readlines(self, hint=-1):
        lines = self.stream.readlines(hint)
        total_size = sum(len(line) for line in lines)
        self.bytes_read += total_size

        if self.bytes_read > self.max_size:
            self.logger.warning(
                f"Stream size limit exceeded during readlines: {self.bytes_read} bytes"
            )
            raise RequestEntityTooLarge(
                f"Request entity too large: {self.bytes_read} bytes (max: {self.max_size} bytes)"
            )

        return lines

    def __getattr__(self, name):
        # Delegate other attributes to the wrapped stream
        return getattr(self.stream, name)


class SizeValidationMiddleware:
    """WSGI middleware that enforces request size limits at the WSGI level."""

    def __init__(self, app, max_size_bytes, logger=None):
        self.app = app
        self.max_size_bytes = max_size_bytes
        self.logger = logger or logging.getLogger(__name__)

    def __call__(self, environ, start_response):
        # Check Content-Length if present
        content_length = environ.get("CONTENT_LENGTH")
        if content_length:
            try:
                content_length = int(content_length)
                if content_length > self.max_size_bytes:
                    self.logger.warning(
                        f"WSGI middleware rejected large request: {content_length} bytes"
                    )
                    # Return 413 response
                    response = self._create_error_response(content_length)
                    start_response(
                        "413 Payload Too Large",
                        [
                            ("Content-Type", "application/json"),
                            ("Content-Length", str(len(response))),
                        ],
                    )
                    return [response]
            except ValueError:
                pass  # Invalid Content-Length, let downstream handle it

        # Wrap the input stream to enforce size limits during reading
        if "wsgi.input" in environ:
            environ["wsgi.input"] = SizeLimitedStream(
                environ["wsgi.input"], self.max_size_bytes, self.logger
            )

        return self.app(environ, start_response)

    def _create_error_response(self, received_size=None):
        """Create a JSON error response for oversized requests."""
        max_size_mb = self.max_size_bytes / (1024 * 1024)
        response_data = {
            "error": True,
            "message": "Request payload too large",
            "status_code": 413,
            "details": {
                "type": "PayloadTooLarge",
                "description": f"The request payload exceeds the maximum allowed size of {max_size_mb:.0f}MB",
                "max_size_mb": max_size_mb,
                "suggestion": "Please reduce the payload size and try again",
            },
        }

        if received_size:
            response_data["details"]["received_size_mb"] = round(
                received_size / (1024 * 1024), 2
            )

        import json

        return json.dumps(response_data).encode("utf-8")
