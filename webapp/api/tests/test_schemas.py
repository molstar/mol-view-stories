"""Minimal schema tests that exercise core validation paths."""

import base64

import msgpack
import pytest
from pydantic import ValidationError

from schemas import BaseItemUpdate, SessionInput, StoryInput


def _base64_msgpack(obj):
    return base64.b64encode(msgpack.packb(obj)).decode("utf-8")


def test_session_input_valid_minimal():
    session = SessionInput(
        filename="a.mvstory",
        title="t",
        description="d",
        data=_base64_msgpack({"k": 1}),
    )
    assert session.filename.endswith(".mvstory")


def test_session_input_missing_required_field():
    with pytest.raises(ValidationError):
        SessionInput(title="t", description="d", data=_base64_msgpack({}))


def test_story_input_valid_minimal():
    story = StoryInput(filename="s.mvsj", data={"scenes": []})
    assert story.filename.endswith(".mvsj")


def test_base_item_update_partial():
    upd = BaseItemUpdate(description="x")
    assert upd.description == "x"
