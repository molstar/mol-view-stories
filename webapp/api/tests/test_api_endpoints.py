"""Minimal API endpoint tests focusing on core functionality.

These tests use the Flask test client and mock auth/storage layers to keep
them fast, deterministic and CI-friendly (no external MinIO or OIDC calls).
"""

import base64
import io
import json
from unittest.mock import Mock, patch

import msgpack


def _b64_msgpack(obj):
    return base64.b64encode(msgpack.packb(obj)).decode("utf-8")


@patch("routes.session_routes.save_object")
@patch("routes.session_routes.create_metadata")
@patch("routes.session_routes.check_user_session_limit")
@patch("routes.session_routes.get_user_from_request")
def test_create_session_success(mock_auth, mock_limit, mock_md, mock_save, client):
    mock_auth.return_value = (
        {"sub": "user-123", "name": "T", "email": "e"},
        "user-123",
    )
    mock_limit.return_value = True
    mock_md.return_value = {
        "id": "sess-1",
        "type": "session",
        "creator": {"id": "user-123", "name": "T", "email": "e"},
        "title": "t",
        "description": "d",
        "tags": [],
        "version": "1.0",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }
    mock_save.return_value = mock_md.return_value

    # Use FormData format (new standard)
    test_data = msgpack.packb({"k": 1})
    form_data = {
        "title": "t",
        "description": "d",
        "tags": "[]",
        "filename": "x.mvstory",
        "file": (io.BytesIO(test_data), "x.mvstory"),
    }

    resp = client.post("/api/session", data=form_data)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["type"] == "session"
    assert body["creator"]["id"] == "user-123"


@patch("routes.session_routes.find_object_by_id")
@patch("routes.session_routes.get_user_from_request")
def test_get_session_authenticated_owner(mock_auth, mock_find, client):
    mock_auth.return_value = (
        {"sub": "user-123", "name": "T", "email": "e"},
        "user-123",
    )
    mock_find.return_value = {
        "id": "sess-1",
        "type": "session",
        "creator": {"id": "user-123"},
        "title": "t",
    }
    resp = client.get("/api/session/sess-1")
    assert resp.status_code == 200
    assert resp.get_json()["id"] == "sess-1"


def test_create_story_legacy_return_data_no_longer_supported(client):
    """Test that the ?return_data parameter with JSON is no longer supported"""
    payload = {
        "filename": "s.mvsj",
        "title": "t",
        "description": "d",
        "tags": ["a"],
        "data": {"data": {"x": 1}},
    }
    resp = client.post("/api/story?return_data=true", json=payload)
    assert resp.status_code == 400
    body = resp.get_json()
    assert "Legacy JSON format is no longer supported" in body["message"]


@patch("routes.story_routes.minio_client")
@patch("routes.story_routes.list_objects_by_type")
def test_get_story_data_mvsj(mock_list, mock_minio, client):
    # Story exists and belongs to user-123
    mock_list.return_value = [
        {"id": "story-1", "creator": {"id": "user-123"}, "filename": "s.mvsj"}
    ]

    # Mock MinIO get_object to return MVSJ JSON with a top-level "data" key
    mock_resp = Mock()
    mock_resp.read.return_value = b'{"data": {"hello": "world"}}'
    mock_minio.get_object.return_value = mock_resp

    resp = client.get("/api/story/story-1/data?format=mvsj")
    assert resp.status_code == 200
    assert resp.get_json() == {"hello": "world"}


@patch("routes.story_routes.save_story_with_session")
@patch("routes.story_routes.create_metadata")
@patch("routes.story_routes.check_user_story_limit")
@patch("routes.story_routes.get_user_from_request")
def test_create_story_formdata_mvsj_with_session(
    mock_auth, mock_limit, mock_md, mock_save, client
):
    """Test creating a story with FormData (.mvsj + session files) using new field structure"""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "T", "email": "e"},
        "user-123",
    )
    mock_limit.return_value = True
    mock_md.return_value = {
        "id": "story-1",
        "type": "story",
        "creator": {"id": "user-123", "name": "T", "email": "e"},
        "title": "MVSJ Story with Session",
        "description": "A JSON story with session data",
        "tags": [],
        "version": "1.0",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }
    mock_save.return_value = mock_md.return_value

    # Create test story data (.mvsj)
    story_data = {"scenes": [{"id": 1, "data": "test"}]}
    story_blob = io.BytesIO(json.dumps(story_data).encode("utf-8"))

    # Create test session data
    session_data = msgpack.packb({"version": 1, "story": {"scenes": []}})
    session_blob = io.BytesIO(session_data)

    form_data = {
        "title": "MVSJ Story with Session",
        "description": "A JSON story with session data",
        "tags": "[]",
        "mvsj": (story_blob, "story.mvsj"),
        "session": (session_blob, "session.mvstory"),
    }

    resp = client.post("/api/story", data=form_data)
    assert resp.status_code == 201

    body = resp.get_json()
    assert body["id"] == "story-1"
    assert body["title"] == "MVSJ Story with Session"
    assert "public_uri" in body


@patch("routes.story_routes.save_story_with_session")
@patch("routes.story_routes.create_metadata")
@patch("routes.story_routes.check_user_story_limit")
@patch("routes.story_routes.get_user_from_request")
def test_create_story_formdata_mvsx_with_session(
    mock_auth, mock_limit, mock_md, mock_save, client
):
    """Test creating a story with FormData (.mvsx + session files) using new field structure"""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "T", "email": "e"},
        "user-123",
    )
    mock_limit.return_value = True
    mock_md.return_value = {
        "id": "story-2",
        "type": "story",
        "creator": {"id": "user-123", "name": "T", "email": "e"},
        "title": "MVSX Story with Session",
    }
    mock_save.return_value = mock_md.return_value

    # Create test binary data (.mvsx - simulated ZIP)
    binary_data = b"PK\x03\x04fake_zip_data"
    story_blob = io.BytesIO(binary_data)

    # Create test session data
    session_data = msgpack.packb({"version": 1, "story": {"scenes": []}})
    session_blob = io.BytesIO(session_data)

    form_data = {
        "title": "MVSX Story with Session",
        "description": "A binary story with session data",
        "tags": "[]",
        "mvsx": (story_blob, "story.mvsx"),
        "session": (session_blob, "session.mvstory"),
    }

    resp = client.post("/api/story", data=form_data)
    assert resp.status_code == 201

    body = resp.get_json()
    assert body["id"] == "story-2"
    assert "public_uri" in body


def test_create_story_json_no_longer_supported(client):
    """Test that legacy JSON story creation is no longer supported"""
    payload = {
        "filename": "legacy.mvsj",
        "title": "Legacy Story",
        "description": "Created with JSON API",
        "tags": [],
        "data": {"scenes": [{"id": 1}]},
    }

    resp = client.post("/api/story", json=payload)
    assert resp.status_code == 400
    body = resp.get_json()
    assert "Legacy JSON format is no longer supported" in body["message"]


def test_create_story_formdata_missing_story_file(client):
    """Test FormData creation fails when story file is missing (no mvsx or mvsj)"""
    form_data = {
        "title": "Incomplete Story",
        "description": "Missing story file",
        "tags": "[]",
        "session": (io.BytesIO(b"session_data"), "session.mvstory"),
    }

    resp = client.post("/api/story", data=form_data)
    assert resp.status_code == 400
    body = resp.get_json()
    assert "Story file is required" in body["message"]


def test_create_story_formdata_missing_session_file(client):
    """Test FormData creation fails when session file is missing"""
    story_blob = io.BytesIO(b'{"scenes": []}')
    form_data = {
        "title": "Incomplete Story",
        "description": "Missing session file",
        "tags": "[]",
        "mvsj": (story_blob, "story.mvsj"),
    }

    resp = client.post("/api/story", data=form_data)
    assert resp.status_code == 400
    body = resp.get_json()
    assert "Session file is required" in body["message"]


@patch("routes.story_routes._get_story_by_id")
def test_get_story_session_data_endpoint_exists(mock_get_story, client):
    """Test that the session data endpoint exists and returns 404 for missing data"""
    mock_get_story.return_value = {
        "id": "story-1",
        "creator": {"id": "user-123"},
        "title": "Test Story",
    }

    resp = client.get("/api/story/story-1/session-data")
    # Should return 404 since no session data exists (no mocking of MinIO)
    assert resp.status_code == 404
    body = resp.get_json()
    assert "not found" in body["message"].lower()


@patch("routes.session_routes.count_user_sessions")
@patch("routes.session_routes.count_user_stories")
@patch("routes.session_routes.get_user_from_request")
def test_get_user_quota(mock_auth, mock_count_stories, mock_count_sessions, client):
    mock_auth.return_value = (
        {"sub": "user-123", "name": "T", "email": "e"},
        "user-123",
    )
    mock_count_sessions.return_value = 2
    mock_count_stories.return_value = 3

    resp = client.get("/api/user/quota")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["sessions"]["current"] == 2
    assert data["stories"]["current"] == 3


# =============================================================================
# NEW FORMDATA TESTS
# =============================================================================


@patch("routes.session_routes.save_object")
@patch("routes.session_routes.create_metadata")
@patch("routes.session_routes.check_user_session_limit")
@patch("routes.session_routes.get_user_from_request")
def test_create_session_formdata_success(
    mock_auth, mock_limit, mock_md, mock_save, client
):
    """Test creating a session using FormData with file upload."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )
    mock_limit.return_value = True
    mock_md.return_value = {
        "id": "sess-formdata-1",
        "type": "session",
        "creator": {"id": "user-123", "name": "Test User", "email": "test@example.com"},
        "title": "Test Session FormData",
        "description": "Testing FormData upload",
        "tags": [],
        "version": "1.0",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }
    mock_save.return_value = mock_md.return_value

    # Create test binary data (msgpack + deflate simulation)
    test_data = msgpack.packb({"version": 1, "story": {"scenes": []}})

    # Prepare FormData with file upload
    form_data = {
        "title": "Test Session FormData",
        "description": "Testing FormData upload",
        "tags": "[]",
        "filename": "Test Session FormData.mvstory",
        "file": (io.BytesIO(test_data), "session.mvstory"),
    }

    # Don't set content_type explicitly - let Flask test client handle it like a real browser
    resp = client.post("/api/session", data=form_data)
    assert resp.status_code == 201

    body = resp.get_json()
    assert body["type"] == "session"
    assert body["creator"]["id"] == "user-123"
    assert body["title"] == "Test Session FormData"

    # Verify save_object was called with binary data (not base64)
    mock_save.assert_called_once()
    args, kwargs = mock_save.call_args
    assert args[0] == "session"
    storage_data = args[1]
    assert isinstance(storage_data["data"], bytes)
    assert storage_data["data"] == test_data


@patch("routes.session_routes.get_user_from_request")
def test_create_session_json_no_longer_supported(mock_auth, client):
    """Test that JSON-based session creation is no longer supported."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )

    payload = {
        "filename": "legacy.mvstory",
        "title": "Legacy Session",
        "description": "Testing legacy JSON",
        "data": _b64_msgpack({"version": 1, "story": {"scenes": []}}),
        "tags": [],
    }

    resp = client.post("/api/session", json=payload)
    assert resp.status_code == 400

    body = resp.get_json()
    assert "Session creation requires FormData" in body["message"]
    assert "Legacy JSON format is no longer supported" in body["message"]


@patch("routes.session_routes.get_user_from_request")
def test_create_session_formdata_missing_file(mock_auth, client):
    """Test FormData request without file upload returns error."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )

    form_data = {
        "title": "Test Session",
        "description": "Missing file",
        "tags": "[]",
        "filename": "test.mvstory",
    }
    # No file parameter

    # Don't set content_type explicitly - let Flask test client handle it like a real browser
    resp = client.post("/api/session", data=form_data)
    assert resp.status_code == 400
    body = resp.get_json()
    assert "Session creation requires FormData with a file upload" in body["message"]


@patch("routes.session_routes.get_user_from_request")
def test_create_session_formdata_invalid_filename(mock_auth, client):
    """Test FormData request with invalid filename extension."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )

    test_data = msgpack.packb({"version": 1, "story": {"scenes": []}})

    form_data = {
        "title": "Test Session",
        "description": "Invalid filename",
        "tags": "[]",
        "filename": "test.txt",  # Wrong extension
        "file": (io.BytesIO(test_data), "session.mvstory"),
    }

    # Don't set content_type explicitly - let Flask test client handle it like a real browser
    resp = client.post("/api/session", data=form_data)
    assert resp.status_code == 400
    body = resp.get_json()
    assert ".mvstory extension" in body["message"]


@patch("routes.session_routes.update_session_by_id")
@patch("routes.session_routes.get_user_from_request")
def test_update_session_formdata_success(mock_auth, mock_update, client):
    """Test updating a session using FormData with file upload."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )
    mock_update.return_value = {
        "id": "sess-1",
        "type": "session",
        "creator": {"id": "user-123"},
        "title": "Updated Session",
        "description": "Updated via FormData",
        "updated_at": "2024-01-01T01:00:00Z",
    }

    test_data = msgpack.packb({"version": 1, "story": {"scenes": [{"id": 1}]}})

    form_data = {
        "title": "Updated Session",
        "description": "Updated via FormData",
        "tags": '["updated"]',
        "file": (io.BytesIO(test_data), "session.mvstory"),
    }

    # Don't set content_type explicitly - let Flask test client handle it like a real browser
    resp = client.put("/api/session/sess-1", data=form_data)
    assert resp.status_code == 200

    body = resp.get_json()
    assert body["title"] == "Updated Session"

    # Verify update_session_by_id was called with binary data
    mock_update.assert_called_once()
    args, kwargs = mock_update.call_args
    assert args[0] == "sess-1"  # session_id
    assert args[1] == "user-123"  # user_id
    update_data = args[2]
    assert isinstance(update_data["data"], bytes)
    assert update_data["title"] == "Updated Session"


@patch("routes.session_routes.minio_client")
@patch("routes.session_routes.find_object_by_id")
@patch("routes.session_routes.get_user_from_request")
def test_get_session_data_new_format(mock_auth, mock_find, mock_minio, client):
    """Test loading session data saved in new FormData format (raw binary)."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )
    mock_find.return_value = {
        "id": "sess-1",
        "creator": {"id": "user-123"},
        "title": "Test Session",
    }

    # Mock deflated binary data (like what FormData actually saves - msgpack + deflate)
    import zlib

    test_session_data = msgpack.packb({"version": 1, "story": {"scenes": []}})
    deflated_data = zlib.compress(
        test_session_data, level=3
    )  # This will cause ExtraData when trying to unpack as msgpack

    mock_response = Mock()
    mock_response.read.return_value = deflated_data
    mock_minio.get_object.return_value = mock_response

    resp = client.get("/api/session/sess-1/data")
    assert resp.status_code == 200

    # Should return base64-encoded version of the raw binary (deflated data)
    expected_base64 = base64.b64encode(deflated_data).decode("utf-8")
    assert resp.get_json() == expected_base64


@patch("routes.session_routes.minio_client")
@patch("routes.session_routes.find_object_by_id")
@patch("routes.session_routes.get_user_from_request")
def test_get_session_data_legacy_format(mock_auth, mock_find, mock_minio, client):
    """Test loading session data saved in legacy format (msgpack wrapper)."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )
    mock_find.return_value = {
        "id": "sess-1",
        "creator": {"id": "user-123"},
        "title": "Test Session",
    }

    # Mock legacy format data (msgpack wrapper with metadata)
    test_session_data = msgpack.packb({"version": 1, "story": {"scenes": []}})
    legacy_wrapper = {
        "title": "Test Session",
        "description": "Test",
        "tags": [],
        "data": test_session_data,
    }
    legacy_binary = msgpack.packb(legacy_wrapper)

    mock_response = Mock()
    mock_response.read.return_value = legacy_binary
    mock_minio.get_object.return_value = mock_response

    resp = client.get("/api/session/sess-1/data")
    assert resp.status_code == 200

    # Should return base64-encoded version of the inner data
    expected_base64 = base64.b64encode(test_session_data).decode("utf-8")
    assert resp.get_json() == expected_base64


@patch("routes.session_routes.update_session_by_id")
@patch("routes.session_routes.get_user_from_request")
def test_update_session_formdata_partial_update(mock_auth, mock_update, client):
    """Test updating a session with FormData but no file (partial update)."""
    mock_auth.return_value = (
        {"sub": "user-123", "name": "Test User", "email": "test@example.com"},
        "user-123",
    )
    mock_update.return_value = {
        "id": "sess-1",
        "type": "session",
        "creator": {"id": "user-123"},
        "title": "Updated Title Only",
        "updated_at": "2024-01-01T01:00:00Z",
    }

    form_data = {
        "title": "Updated Title Only",
        "description": "No file upload, just metadata",
    }
    # No files parameter

    # Don't set content_type explicitly - let Flask test client handle it like a real browser
    resp = client.put("/api/session/sess-1", data=form_data)
    assert resp.status_code == 200

    body = resp.get_json()
    assert body["title"] == "Updated Title Only"

    # Verify update_session_by_id was called without data field
    mock_update.assert_called_once()
    args, kwargs = mock_update.call_args
    update_data = args[2]
    assert "data" not in update_data  # No file upload means no data update
    assert update_data["title"] == "Updated Title Only"
