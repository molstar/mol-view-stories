"""Minimal API endpoint tests focusing on core functionality.

These tests use the Flask test client and mock auth/storage layers to keep
them fast, deterministic and CI-friendly (no external MinIO or OIDC calls).
"""

import base64
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

    payload = {
        "filename": "x.mvstory",
        "title": "t",
        "description": "d",
        "data": _b64_msgpack({"k": 1}),
        "tags": [],
    }

    resp = client.post("/api/session", json=payload)
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


@patch("routes.story_routes.save_object")
@patch("routes.story_routes.create_metadata")
@patch("routes.story_routes.check_user_story_limit")
@patch("routes.story_routes.get_user_from_request")
def test_create_story_return_data(mock_auth, mock_limit, mock_md, mock_save, client):
    mock_auth.return_value = (
        {"sub": "user-123", "name": "T", "email": "e"},
        "user-123",
    )
    mock_limit.return_value = True
    mock_md.return_value = {
        "id": "story-1",
        "type": "story",
        "creator": {"id": "user-123", "name": "T", "email": "e"},
        "title": "t",
    }
    mock_save.return_value = mock_md.return_value

    payload = {
        "filename": "s.mvsj",
        "title": "t",
        "description": "d",
        "tags": ["a"],
        "data": {"data": {"x": 1}},
    }
    resp = client.post("/api/story?return_data=true", json=payload)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["filename"] == "s.mvsj"
    assert body["data"] == {"data": {"x": 1}}


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
