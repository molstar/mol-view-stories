"""Minimal sanity checks and import tests."""


def test_import_core_modules():
    from app import app  # noqa: F401
    from config import configure_app, configure_cors  # noqa: F401
    from error_handlers import APIError, error_handler, handle_api_error  # noqa: F401
    from utils import (  # noqa: F401
        SizeLimitedStream,
        SizeValidationMiddleware,
        validate_payload_size,
    )

    assert True
