"""
Smoke tests for the foundation-only backend. There's no scoring/diagnosis
logic here yet — that all lives in the frontend today (see
ARCHITECTURE.md's "Planned data flow" section for the documented future
move) — so these tests verify what actually exists: the health check, the
subjects catalog, 404 handling for an unknown subject, and that CORS is
actually configured for the frontend's origin rather than just assumed.
"""

from fastapi.testclient import TestClient

from app.main import app
from app.core.config import get_settings

client = TestClient(app)


def test_health_check_reports_ok():
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == get_settings().app_name


def test_list_subjects_includes_python():
    response = client.get("/api/v1/subjects")

    assert response.status_code == 200
    subjects = response.json()
    assert any(s["id"] == "python" for s in subjects)


def test_get_known_subject_returns_full_concept_list():
    response = client.get("/api/v1/subjects/python")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "python"
    assert len(body["concepts"]) == 9  # the 9 Python concepts documented in ARCHITECTURE.md


def test_get_unknown_subject_returns_404_not_a_stack_trace():
    response = client.get("/api/v1/subjects/does-not-exist")

    assert response.status_code == 404
    # A real client should get a clean JSON error, never an HTML debug page.
    body = response.json()
    assert "detail" in body


def test_cors_allows_the_configured_frontend_origin():
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rejects_an_unlisted_origin():
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://evil.example.com"},
    )

    assert response.headers.get("access-control-allow-origin") is None
