import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store import store


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "TRACE" in data["service"]


def test_default_transactions_loaded(client):
    response = client.get("/api/transactions")
    assert response.status_code == 200
    txs = response.json()
    assert len(txs) >= 15
    # Verify required contract fields
    first_tx = txs[0]
    for key in ["id", "timestamp", "sender_id", "receiver_id", "amount", "currency", "channel", "status"]:
        assert key in first_tx


def test_detection_alerts_generated(client):
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0

    # Verify risk score contract (0-100 investigation priority)
    for alert in alerts:
        assert 0.0 <= alert["risk_score"] <= 100.0
        assert alert["priority"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert len(alert["evidence"]) > 0
        assert len(alert["limitations"]) > 0
        assert alert["case_id"].startswith("CASE-")


def test_shared_case_endpoint(client):
    alerts_res = client.get("/api/alerts")
    alerts = alerts_res.json()
    assert len(alerts) > 0
    target_case_id = alerts[0]["case_id"]

    case_res = client.get(f"/api/cases/{target_case_id}")
    assert case_res.status_code == 200
    case_data = case_res.json()
    assert case_data["case_id"] == target_case_id
    assert case_data["alert"]["case_id"] == target_case_id
    assert len(case_data["transactions"]) > 0


def test_investigation_note_and_status_persistence(client):
    alerts_res = client.get("/api/alerts")
    alerts = alerts_res.json()
    target_case_id = alerts[0]["case_id"]

    # 1. Add investigation note with status change
    note_payload = {
        "case_id": target_case_id,
        "author": "Analyst Alex Turner",
        "note": "Verified counterparty invoices out-of-band. Escalating to compliance.",
        "status_change": "ESCALATED",
    }
    note_res = client.post(f"/api/cases/{target_case_id}/notes", json=note_payload)
    assert note_res.status_code == 200
    created_note = note_res.json()
    assert created_note["note"] == note_payload["note"]
    assert created_note["status_change"] == "ESCALATED"

    # 2. Verify case status is updated
    case_res = client.get(f"/api/cases/{target_case_id}")
    assert case_res.status_code == 200
    updated_case = case_res.json()
    assert updated_case["alert"]["investigation_status"] == "ESCALATED"
    notes = updated_case["notes"]
    assert any(n["id"] == created_note["id"] for n in notes)


def test_trace_ai_explanation_investigate_mode(client):
    alerts_res = client.get("/api/alerts")
    alerts = alerts_res.json()
    target_case = alerts[0]

    explain_req = {
        "case_id": target_case["case_id"],
        "mode": "investigate",
        "user_prompt": "Explain the evidence chain and recommend next steps.",
    }
    res = client.post("/api/ai/explain", json=explain_req)
    assert res.status_code == 200
    explanation = res.json()

    assert explanation["case_id"] == target_case["case_id"]
    assert explanation["mode"] == "investigate"
    assert len(explanation["observations"]) > 0
    assert len(explanation["inferences"]) > 0
    assert len(explanation["limitations"]) > 0
    assert len(explanation["recommended_actions"]) > 0
    assert "disclaimer" in explanation


def test_trace_ai_explanation_protect_me_mode(client):
    alerts_res = client.get("/api/alerts")
    alerts = alerts_res.json()
    target_case = alerts[0]

    explain_req = {
        "case_id": target_case["case_id"],
        "mode": "protect_me",
    }
    res = client.post("/api/ai/explain", json=explain_req)
    assert res.status_code == 200
    explanation = res.json()

    assert explanation["case_id"] == target_case["case_id"]
    assert explanation["mode"] == "protect_me"
    # Protect Me explanations should be clear and reassuring
    assert "Security Notice" in explanation["headline"] or "Review activity" in explanation["headline"]
    assert len(explanation["recommended_actions"]) > 0


def test_csv_upload_parsing_and_detection(client):
    csv_sample = """id,timestamp,sender_id,receiver_id,amount,currency,channel,status,city,country,latitude,longitude
TX-TEST-1,2026-10-28T01:00:00Z,ACC-T1,ACC-T2,9500,USD,ONLINE,COMPLETED,Austin,USA,30.2672,-97.7431
TX-TEST-2,2026-10-28T02:00:00Z,ACC-T1,ACC-T3,9400,USD,ONLINE,COMPLETED,Austin,USA,30.2672,-97.7431
TX-TEST-3,2026-10-28T03:00:00Z,ACC-T1,ACC-T4,9300,USD,ONLINE,COMPLETED,Austin,USA,30.2672,-97.7431
"""
    files = {"file": ("test_upload.csv", io.BytesIO(csv_sample.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/upload", files=files)
    assert upload_res.status_code == 200
    result = upload_res.json()
    assert result["transaction_count"] == 3
    assert len(result["alerts"]) >= 1
    assert any("Structuring" in a["title"] for a in result["alerts"])
