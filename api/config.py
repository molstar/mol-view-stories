"""Application configuration."""
import os
import logging
from flask_cors import CORS
from utils import SizeValidationMiddleware


def configure_cors(app):
    """Configure CORS for the Flask app."""
    CORS(app, resources={
        r"/api/story/*/data": {
            "origins": "*",  # Allow any origin for public story data
            "methods": ["GET", "OPTIONS"],
            "allow_headers": ["Content-Type", "Accept"],
            "expose_headers": ["Content-Type"]
        },
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://molstar.org",
                "https://stories.molstar.org",
                os.getenv(
                    'FRONTEND_URL',
                    'https://molstar.org/mol-view-stories/'
                )
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Authorization", 
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
            ],
            "expose_headers": ["Content-Type"],
            "supports_credentials": True,
            "max_age": 86400  # Cache preflight requests for 24 hours
        }
    })


def configure_app(app):
    """Configure the Flask app with all necessary settings."""
    # Basic Flask configuration
    app.secret_key = os.getenv('FLASK_SECRET_KEY', os.getenv('FLASK_SECRET_KEY'))
    
    # OIDC configuration
    app.config['OIDC_USERINFO_URL'] = os.getenv(
        'OIDC_USERINFO_URL', 
        'https://login.aai.lifescience-ri.eu/oidc/userinfo'
    )
    
    # Base URL for public URIs
    app.config['BASE_URL'] = os.getenv(
        'BASE_URL',
        'https://stories.molstar.org'
    )
    
    # User limits configuration
    # TODO: Change to 10 after testing
    app.config['MAX_SESSIONS_PER_USER'] = int(os.getenv('MAX_SESSIONS_PER_USER', '100'))
    app.config['MAX_STORIES_PER_USER'] = int(os.getenv('MAX_STORIES_PER_USER', '100'))
    
    # Upload size limit (configurable via environment variable)
    max_upload_size_mb = int(os.getenv('MAX_UPLOAD_SIZE_MB', '50'))
    max_size_bytes = max_upload_size_mb * 1024 * 1024
    app.config['MAX_CONTENT_LENGTH'] = max_size_bytes
    app.config['MAX_UPLOAD_SIZE_MB'] = max_upload_size_mb  # Store for use in decorators
    
    # Add WSGI middleware for request size validation
    # This provides early validation before Flask processes the request
    logger = logging.getLogger(__name__)
    logger.info(f"Adding size validation middleware with limit: {max_upload_size_mb}MB")
    app.wsgi_app = SizeValidationMiddleware(app.wsgi_app, max_size_bytes, logger)
    
    # Configure CORS
    configure_cors(app) 