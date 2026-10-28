"""
Integration Tests for TRACE Integration Service and FastAPI Router.
Verifies service functions, FastAPI endpoints, query parameters, and serialization.
"""

from pathlib import Path
import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from trace_engine.integration import (
    detect_fraud,
    detection_router,
    ingest_and_detect,
    ingest_csv,
)
from trace_engine.schemas import DetectionMode


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@pytest.fixture
def api_client():
    app = FastAPI(title="TRACE Test App")
    app.include_router(detection_router)
    return TestClient(app)


def test_service_ingest_and_detect():
    """Verify combined high-level ingest_and_detect service function."""
    csv_file = DATA_DIR / "sample_suspicious.csv"
    ingestion, detection = ingest_and_detect(csv_file)

    assert ingestion.valid_count > 0
    assert detection.total_transactions_analyzed == ingestion.valid_count
    assert len(detection.alerts) > 0


def test_service_mode_filtering():
    """Verify mode filtering in ingest_and_detect."""
    csv_file = DATA_DIR / "sample_suspicious.csv"
    _, protect_detection = ingest_and_detect(csv_file, mode=DetectionMode.PROTECT_ME)

    for alert in protect_detection.alerts:
        assert DetectionMode.PROTECT_ME in alert.modes


def test_api_list_rules(api_client):
    """Verify GET /trace/detection/rules endpoint."""
    response = api_client.get("/trace/detection/rules")
    assert response.status_code == 200
    data = response.json()
    assert data["engine_version"] == "TRACE-2.0"
    assert len(data["rules"]) == 5
    rule_ids = [r["rule_id"] for r in data["rules"]]
    assert "RULE_UNUSUAL_AMOUNT" in rule_ids
    assert "RULE_RAPID_VELOCITY" in rule_ids
    assert "default_config" in data


def test_api_detect_transactions(api_client):
    """Verify POST /trace/detection/detect endpoint with raw JSON transactions."""
    payload = [
        {
            "transaction_id": "T1",
            "sender_id": "ACC_SPAM",
            "recipient_id": "RECIP_1",
            "amount": 500.0,
            "currency": "USD",
            "timestamp": "2026-10-25T10:00:00Z",
            "status": "COMPLETED",
        },
        {
            "transaction_id": "T2",
            "sender_id": "ACC_SPAM",
            "recipient_id": "RECIP_2",
            "amount": 500.0,
            "currency": "USD",
            "timestamp": "2026-10-25T10:02:00Z",
            "status": "COMPLETED",
        },
        {
            "transaction_id": "T3",
            "sender_id": "ACC_SPAM",
            "recipient_id": "RECIP_3",
            "amount": 500.0,
            "currency": "USD",
            "timestamp": "2026-10-25T10:04:00Z",
            "status": "COMPLETED",
        },
    ]

    response = api_client.post("/trace/detection/detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_transactions_analyzed"] == 3
    assert len(data["alerts"]) >= 1
    assert data["alerts"][0]["account_id"] == "ACC_SPAM"


def test_api_analyze_csv_upload(api_client):
    """Verify POST /trace/detection/analyze-csv with file upload."""
    csv_file = DATA_DIR / "sample_suspicious.csv"
    with open(csv_file, "rb") as f:
        response = api_client.post(
            "/trace/detection/analyze-csv",
            files={"file": ("sample_suspicious.csv", f, "text/csv")},
        )

    assert response.status_code == 200
    data = response.json()
    assert "ingestion" in data
    assert "detection" in data
    assert data["ingestion"]["valid_count"] > 0
    assert len(data["detection"]["alerts"]) > 0
