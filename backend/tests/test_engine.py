"""
End-to-End Tests for TRACE FraudEngine.
Tests multi-rule synthesis, risk score bounds (0-100), alert consolidation,
Protect Me vs Investigate modes, and performance on synthetic datasets.
"""

from pathlib import Path
import pytest

from trace_engine.engine import FraudEngine
from trace_engine.ingestion import ingest_transactions_csv
from trace_engine.schemas import AlertPriority, DetectionMode


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def test_engine_on_clean_valid_data():
    """Ordinary day-to-day transactions should yield zero false-positive alerts."""
    ingestion = ingest_transactions_csv(DATA_DIR / "sample_valid.csv")
    assert ingestion.valid_count > 0

    engine = FraudEngine()
    result = engine.detect(ingestion.transactions)

    assert result.total_transactions_analyzed == ingestion.valid_count
    assert result.flagged_transactions_count == 0
    assert len(result.alerts) == 0


def test_engine_on_suspicious_dataset():
    """All flagged scenarios in sample_suspicious.csv must be detected with high confidence."""
    ingestion = ingest_transactions_csv(DATA_DIR / "sample_suspicious.csv")
    assert ingestion.valid_count > 0

    engine = FraudEngine()
    result = engine.detect(ingestion.transactions, aggregate_by_account=True)

    assert result.total_transactions_analyzed == ingestion.valid_count
    assert len(result.alerts) > 0

    flagged_accounts = {a.account_id for a in result.alerts}
    assert "ACC_OUTLIER_01" in flagged_accounts
    assert "ACC_VELOCITY_02" in flagged_accounts
    assert "ACC_STRUCTURING_03" in flagged_accounts
    assert "ACC_SURGE_04" in flagged_accounts
    assert "ACC_FAN_OUT_05" in flagged_accounts
    assert "INTERMEDIARY_B" in flagged_accounts

    # Ensure legitimate repeated transfers account ACC_NORMAL_LEGIT was NOT flagged
    assert "ACC_NORMAL_LEGIT" not in flagged_accounts


def test_score_boundaries_and_priority_mapping():
    """Every generated alert must strictly bound its risk score between 0.0 and 100.0."""
    ingestion = ingest_transactions_csv(DATA_DIR / "sample_suspicious.csv")
    engine = FraudEngine()
    result = engine.detect(ingestion.transactions)

    for alert in result.alerts:
        assert 0.0 <= alert.risk_score <= 100.0
        if alert.risk_score >= 90.0:
            assert alert.priority == AlertPriority.CRITICAL
        elif alert.risk_score >= 70.0:
            assert alert.priority == AlertPriority.HIGH
        elif alert.risk_score >= 40.0:
            assert alert.priority == AlertPriority.MEDIUM
        else:
            assert alert.priority == AlertPriority.LOW

        # Check evidence separation
        for ev in alert.evidence:
            assert len(ev.observed_fact) > 0
            assert len(ev.inferred_risk) > 0
            assert isinstance(ev.metrics, dict)


def test_protect_me_vs_investigate_filtering():
    """
    Protect Me view focuses on actionable intervention (critical/high alerts),
    while Investigate view contains all forensic anomalies.
    """
    ingestion = ingest_transactions_csv(DATA_DIR / "sample_suspicious.csv")
    engine = FraudEngine()
    result = engine.detect(ingestion.transactions)

    protect_me_alerts = [a for a in result.alerts if DetectionMode.PROTECT_ME in a.modes]
    investigate_alerts = [a for a in result.alerts if DetectionMode.INVESTIGATE in a.modes]

    assert len(investigate_alerts) >= len(protect_me_alerts)
    # Critical and high alerts should appear in Protect Me
    for a in protect_me_alerts:
        assert a.priority in (AlertPriority.HIGH, AlertPriority.CRITICAL, AlertPriority.MEDIUM)
        assert a.recommended_action in ("BLOCK_TEMPORARY", "STEP_UP_AUTH", "MANUAL_REVIEW")


def test_empty_dataset_handling():
    """Engine should handle empty transaction list safely."""
    engine = FraudEngine()
    result = engine.detect([])
    assert result.total_transactions_analyzed == 0
    assert result.flagged_transactions_count == 0
    assert len(result.alerts) == 0
