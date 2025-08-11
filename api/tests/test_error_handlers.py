"""Minimal critical tests for error handling utilities."""

from werkzeug.exceptions import RequestEntityTooLarge

from error_handlers import APIError, error_handler, handle_api_error


def test_handle_api_error_basic(app):
    with app.app_context():
        error = APIError("Test error", status_code=418)
        response, status = handle_api_error(error)
        assert status == 418
        assert response.get_json()["message"] == "Test error"


def test_error_handler_converts_exceptions(app):
    with app.app_context():

        @error_handler
        def will_raise():
            raise APIError("boom", status_code=403)

        resp, status = will_raise()
        assert status == 403
        assert resp.get_json()["error"] is True


def test_error_handler_request_entity_too_large(app):
    with app.app_context():

        @error_handler
        def will_raise_too_large():
            raise RequestEntityTooLarge("too large")

        resp, status = will_raise_too_large()
        assert status == 413
        data = resp.get_json()
        assert data["message"] == "File size too large"
