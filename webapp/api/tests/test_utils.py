"""Minimal utils tests to cover payload decorator, stream wrapper, and middleware."""

import io

import pytest
from werkzeug.exceptions import RequestEntityTooLarge

from utils import SizeLimitedStream, SizeValidationMiddleware, validate_payload_size


def test_validate_payload_size_no_content_length(app):
    with app.test_request_context("/"):

        @validate_payload_size()
        def view():
            return {"ok": True}

        resp, status = view()
        assert status == 400
        assert resp.get_json()["message"].startswith("Content-Length header required")


def test_size_limited_stream_exceeds_limit():
    data = b"x" * 20
    stream = io.BytesIO(data)
    limited = SizeLimitedStream(stream, max_size=10)
    with pytest.raises(RequestEntityTooLarge):
        limited.read()


def test_size_validation_middleware_rejects_large_request():
    def dummy_app(environ, start_response):
        start_response("200 OK", [("Content-Type", "text/plain")])
        return [b"OK"]

    middleware = SizeValidationMiddleware(dummy_app, max_size_bytes=1024)
    large_size = 2048
    environ = {
        "CONTENT_LENGTH": str(large_size),
        "wsgi.input": io.BytesIO(b"x" * large_size),
    }

    status_holder = {}

    def start_response(status, headers):
        status_holder["status"] = status

    result = list(middleware(environ, start_response))
    assert status_holder["status"].startswith("413")
    assert isinstance(result, list) and result
