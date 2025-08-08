"""Minimal critical tests for the main Flask application."""

from typing import List


def test_health_check(client):
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.is_json
    assert response.get_json()["status"] == "healthy"


def test_blueprints_registered(app):
    blueprint_names: List[str] = [bp.name for bp in app.blueprints.values()]
    assert "sessions" in blueprint_names
    assert "stories" in blueprint_names
    assert "admin" in blueprint_names
