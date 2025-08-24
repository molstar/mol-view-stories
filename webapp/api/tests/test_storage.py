"""Minimal storage tests for client, utils, metadata, and quota paths."""

from unittest.mock import patch

import pytest

from error_handlers import APIError


def test_minio_configuration_reload(monkeypatch):
    monkeypatch.setenv("MINIO_ENDPOINT", "http://minio:9000")
    monkeypatch.setenv("MINIO_ACCESS_KEY", "a")
    monkeypatch.setenv("MINIO_SECRET_KEY", "b")
    monkeypatch.setenv("MINIO_BUCKET", "root")
    import importlib

    from storage import client

    importlib.reload(client)
    assert client.MINIO_ENDPOINT == "http://minio:9000"
    assert client.MINIO_BUCKET == "root"


def test_handle_minio_error_wraps_s3_error():
    from minio.error import S3Error

    from storage.client import handle_minio_error

    @handle_minio_error("op")
    def fn():
        raise S3Error(
            code="x",
            message="y",
            resource="r",
            request_id="i",
            host_id="h",
            response=None,
        )

    with pytest.raises(APIError) as e:
        fn()
    assert "Storage operation failed: op" in str(e.value.message)


def test_storage_utils_paths():
    from storage.utils import get_content_type, get_data_file_extension, get_object_path

    metadata = {"id": "id", "creator": {"id": "u"}}
    assert get_object_path(metadata, "session") == "u/sessions/id"
    assert get_data_file_extension("session") == ".mvstory"
    assert get_content_type("story") == "application/json"


def test_metadata_validation_and_filename():
    from storage.metadata import (
        create_metadata,
        validate_data_filename,
        validate_metadata,
    )

    user = {"sub": "u", "name": "n", "email": "e"}
    md = create_metadata("session", user)
    assert md["creator"]["id"] == "u"
    assert validate_metadata(md, "session") is True
    assert validate_data_filename("x.mvstory", "session") is True
    with pytest.raises(APIError):
        validate_data_filename("x.txt", "session")


@patch("storage.objects.list_objects_by_type")
def test_quota_counts(mock_list):
    mock_list.return_value = [{"id": "1"}, {"id": "2"}]

    from storage.quota import count_user_sessions

    assert count_user_sessions("u") == 2
