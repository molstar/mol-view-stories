"""Pytest configuration and fixtures."""

import os
import tempfile
from unittest.mock import Mock, patch

import pytest

from app import app as flask_app


@pytest.fixture
def app():
    """Create and configure a test Flask application."""
    # Set test environment variables
    test_env = {
        "OIDC_USERINFO_URL": "http://test-oidc/userinfo",
        "BASE_URL": "http://test-base-url",
        "MAX_SESSIONS_PER_USER": "10",
        "MAX_STORIES_PER_USER": "10",
        "MAX_UPLOAD_SIZE_MB": "50",
        "MINIO_ENDPOINT": "test-minio:9000",
        "MINIO_ACCESS_KEY": "test-access-key",
        "MINIO_SECRET_KEY": "test-secret-key",
        "MINIO_BUCKET_NAME": "test-bucket",
    }

    with patch.dict(os.environ, test_env):
        # Create test app
        test_app = flask_app
        test_app.config["TESTING"] = True
        test_app.config["WTF_CSRF_ENABLED"] = False

        # Create a temporary database for testing
        db_fd, test_app.config["DATABASE"] = tempfile.mkstemp()

        with test_app.app_context():
            yield test_app

        os.close(db_fd)
        os.unlink(test_app.config["DATABASE"])


@pytest.fixture
def client(app):
    """Create a test client for the Flask application."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test runner for the Flask application."""
    return app.test_cli_runner()


@pytest.fixture
def mock_userinfo():
    """Mock user info response."""
    return {
        "sub": "test-user-123",
        "name": "Test User",
        "email": "test@example.com",
        "preferred_username": "testuser",
    }


@pytest.fixture
def mock_session_user():
    """Mock session user."""
    return {
        "sub": "test-user-123",
        "name": "Test User",
        "email": "test@example.com",
        "preferred_username": "testuser",
    }


@pytest.fixture
def auth_headers():
    """Authentication headers for API requests."""
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
def mock_minio():
    """Mock MinIO client."""
    mock_client = Mock()
    mock_client.bucket_exists.return_value = True
    mock_client.make_bucket.return_value = None
    mock_client.put_object.return_value = Mock()
    mock_client.get_object.return_value = Mock()
    mock_client.list_objects.return_value = []
    mock_client.remove_object.return_value = None

    with patch("storage.client.minio_client", mock_client):
        yield mock_client


@pytest.fixture
def sample_story_data():
    """Sample story data for testing."""
    return {
        "title": "Test Story",
        "description": "A test story description",
        "scenes": [
            {
                "title": "Scene 1",
                "description": "First scene",
                "data": {"camera": {"position": [0, 0, 10]}},
            }
        ],
        "metadata": {"version": "1.0", "created_at": "2024-01-01T00:00:00Z"},
    }


@pytest.fixture
def sample_session_data():
    """Sample session data for testing."""
    return {
        "title": "Test Session",
        "description": "A test session description",
        "state": {"camera": {"position": [0, 0, 10]}, "structures": []},
        "metadata": {"version": "1.0", "created_at": "2024-01-01T00:00:00Z"},
    }
