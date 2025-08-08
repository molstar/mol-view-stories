"""Main Flask application - refactored with modular structure."""

import logging

from flask import Flask, current_app, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge

# Configuration
from config import configure_app
from routes.admin_routes import admin_bp

# Route blueprints
from routes.session_routes import session_bp
from routes.story_routes import story_bp

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configure the app (CORS, secrets, etc.)
configure_app(app)

# Register blueprints
app.register_blueprint(session_bp)
app.register_blueprint(story_bp)
app.register_blueprint(admin_bp)


# Global error handler for file size limits
@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    """Handle file size limit exceeded errors globally."""
    logger.warning(f"File size limit exceeded: {str(e)}")
    max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 50)
    return (
        jsonify(
            {
                "error": True,
                "message": "File size too large",
                "status_code": 413,
                "details": {
                    "type": "RequestEntityTooLarge",
                    "description": f"The uploaded file exceeds the maximum allowed size of {max_size_mb}MB",
                    "max_size_mb": max_size_mb,
                    "suggestion": "Please reduce the file size and try again",
                },
            }
        ),
        413,
    )


# Add a before_request hook for additional size validation
@app.before_request
def validate_request_size():
    """Additional request size validation before processing."""
    # Skip validation for certain endpoints
    if request.endpoint in ["health_check", "static"]:
        return

    # Only validate POST/PUT requests
    if request.method not in ["POST", "PUT"]:
        return

    max_size_mb = current_app.config.get("MAX_UPLOAD_SIZE_MB", 50)
    max_size_bytes = max_size_mb * 1024 * 1024

    # Check Content-Length header
    content_length = request.content_length
    if content_length and content_length > max_size_bytes:
        logger.warning(
            f"Before-request validation: payload too large {content_length} bytes"
        )
        return (
            jsonify(
                {
                    "error": True,
                    "message": "Request payload too large",
                    "status_code": 413,
                    "details": {
                        "type": "PayloadTooLarge",
                        "description": f"Request exceeds maximum size of {max_size_mb}MB",
                        "max_size_mb": max_size_mb,
                        "received_size_mb": round(content_length / (1024 * 1024), 2),
                    },
                }
            ),
            413,
        )


@app.route("/ready")
def health_check():
    """Health check endpoint for Kubernetes readiness probe."""
    return jsonify({"status": "healthy", "message": "Service is ready"}), 200


if __name__ == "__main__":
    # Development server - only used when running directly with python
    app.run(host="0.0.0.0", port=5000, debug=False)
