"""Minimal config tests covering defaults and content length computation."""

import os
from unittest.mock import patch

from flask import Flask

from config import configure_app


@patch.dict(os.environ, {"MAX_UPLOAD_SIZE_MB": "25"})
def test_configure_app_sets_max_content_length():
    app = Flask("test_configure_app_sets_max_content_length")
    configure_app(app)
    assert app.config["MAX_UPLOAD_SIZE_MB"] == 25
    assert app.config["MAX_CONTENT_LENGTH"] == 25 * 1024 * 1024


@patch.dict(os.environ, {}, clear=True)
def test_configure_app_uses_defaults():
    app = Flask("test_configure_app_uses_defaults")
    configure_app(app)
    assert (
        app.config["OIDC_USERINFO_URL"]
        == "https://login.aai.lifescience-ri.eu/oidc/userinfo"
    )
    assert app.config["BASE_URL"] == "https://stories.molstar.org"
