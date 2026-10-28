"""
Unit tests for TRACE Deterministic Detection Rules.
Tests individual rules against isolated synthetic transaction patterns and edge cases.
"""

from datetime import datetime, timedelta, timezone
import pytest

from trace_engine.config import DetectionConfig
from trace_engine.rules import (
    ConnectedChainsRule,
    FrequencySpikeRule,
    RapidVelocityRule,
    RepeatedAmountsRule,
    UnusualAmountRule,
)
from trace_engine.schemas import AlertPriority, DetectionMode, Transaction


@pytest.fixture
def base_time():
    return datetime(2026, 10, 25, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def config():
    return DetectionConfig()


def test_unusual_amount_rule_normal(base_time, config):
    """Transactions with consistent normal amounts should not trigger alert."""
    rule = UnusualAmountRule()
    txns = [
        Transaction(
            transaction_id=f"T{i}",
            sender_id="ACC_NORMAL",
            recipient_id="RECIP_01",
            amount=100.0 + (i * 5),
            currency="USD",
            timestamp=base_time + timedelta(days=i),
        )
        for i in range(5)
    ]
    alerts = rule.evaluate(txns, config)
    assert len(alerts) == 0


def test_unusual_amount_rule_spike(base_time, config):
    """Spike (> 3.5x median) after baseline triggers explainable alert."""
    rule = UnusualAmountRule()
    txns = [
        Transaction(
            transaction_id=f"T{i}",
            sender_id="ACC_SPIKE",
            recipient_id="RECIP_01",
            amount=100.0,
            currency="USD",
            timestamp=base_time + timedelta(days=i),
        )
        for i in range(4)
    ]
    # Add outlier transaction: $1,500 (15x baseline)
    txns.append(
        Transaction(
            transaction_id="T_OUTLIER",
            sender_id="ACC_SPIKE",
            recipient_id="RECIP_EXT",
            amount=1500.0,
            currency="USD",
            timestamp=base_time + timedelta(days=5),
        )
    )

    alerts = rule.evaluate(txns, config)
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert.account_id == "ACC_SPIKE"
    assert alert.related_transaction_ids == ["T_OUTLIER"]
    assert alert.risk_score >= 70.0
    assert len(alert.evidence) == 1

    ev = alert.evidence[0]
    assert "15.0x deviation" in ev.observed_fact or "15x" in ev.observed_fact
    assert "Sudden disproportionate outbound capital transfer" in ev.inferred_risk
    assert ev.metrics["multiplier"] == 15.0


def test_unusual_amount_rule_limited_history(base_time, config):
    """High value transfer with sparse history notes missing-data limitation."""
    rule = UnusualAmountRule()
    txns = [
        Transaction(
            transaction_id="T_LIM_1",
            sender_id="ACC_NEWBIE",
            recipient_id="RECIP_01",
            amount=15000.0,
            currency="USD",
            timestamp=base_time,
        )
    ]
    alerts = rule.evaluate(txns, config)
    assert len(alerts) == 1
    alert = alerts[0]
    assert len(alert.limitations) > 0
    assert "limited transaction history" in alert.limitations[0]


def test_rapid_velocity_rule(base_time, config):
    """Multiple outbound transfers in short window triggers velocity alert."""
    rule = RapidVelocityRule()
    # 4 transfers in 6 minutes
    txns = [
        Transaction(
            transaction_id=f"T_VEL_{i}",
            sender_id="ACC_FAST",
            recipient_id=f"RECIP_{i}",
            amount=500.0,
            currency="USD",
            timestamp=base_time + timedelta(minutes=i * 2),
        )
        for i in range(4)
    ]

    alerts = rule.evaluate(txns, config)
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert.account_id == "ACC_FAST"
    assert len(alert.related_transaction_ids) == 4
    assert alert.risk_score >= 60.0
    assert "velocity limits" in alert.explanation


def test_repeated_amounts_structuring(base_time, config):
    """Repeated transfers near regulatory limit ($9,500) trigger structuring rule."""
    rule = RepeatedAmountsRule()
    txns = [
        Transaction(
            transaction_id=f"T_STR_{i}",
            sender_id="ACC_STRUCT",
            recipient_id=f"MULE_{i}",
            amount=amt,
            currency="USD",
            timestamp=base_time + timedelta(hours=i * 2),
        )
        for i, amt in enumerate([9500.0, 9480.0, 9520.0])
    ]

    alerts = rule.evaluate(txns, config)
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert.account_id == "ACC_STRUCT"
    assert len(alert.related_transaction_ids) == 3
    ev = alert.evidence[0]
    assert ev.metrics["near_reporting_threshold"] is True
    assert "structuring (smurfing)" in ev.inferred_risk


def test_frequency_spike_rule(base_time, config):
    """Sudden surge in transaction rate triggers frequency alert."""
    rule = FrequencySpikeRule()
    # 2 baseline transactions over 20 days
    txns = [
        Transaction(
            transaction_id="T_OLD_1",
            sender_id="ACC_SURGE",
            recipient_id="RECIP_01",
            amount=20.0,
            currency="USD",
            timestamp=base_time - timedelta(days=20),
        ),
        Transaction(
            transaction_id="T_OLD_2",
            sender_id="ACC_SURGE",
            recipient_id="RECIP_01",
            amount=25.0,
            currency="USD",
            timestamp=base_time - timedelta(days=10),
        ),
    ]
    # Then sudden burst of 5 transactions in 30 minutes
    burst_time = base_time
    for i in range(5):
        txns.append(
            Transaction(
                transaction_id=f"T_BURST_{i}",
                sender_id="ACC_SURGE",
                recipient_id=f"RECIP_{i}",
                amount=50.0,
                currency="USD",
                timestamp=burst_time + timedelta(minutes=i * 6),
            )
        )

    alerts = rule.evaluate(txns, config)
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert.account_id == "ACC_SURGE"
    assert "surge in transaction frequency" in alert.explanation


def test_connected_chains_fan_out(base_time, config):
    """Fan-out to 4+ unique recipients in 1 hour triggers fan-out alert."""
    rule = ConnectedChainsRule()
    txns = [
        Transaction(
            transaction_id=f"T_FAN_{i}",
            sender_id="ACC_DISTRIBUTOR",
            recipient_id=f"MULE_ACC_{i}",
            amount=300.0,
            currency="USD",
            timestamp=base_time + timedelta(minutes=i * 10),
        )
        for i in range(5)
    ]

    alerts = rule.evaluate(txns, config)
    assert len(alerts) >= 1
    fan_out_alerts = [a for a in alerts if "FAN_OUT" in a.triggered_rules[0]]
    assert len(fan_out_alerts) == 1
    assert fan_out_alerts[0].account_id == "ACC_DISTRIBUTOR"
    assert "fan-out" in fan_out_alerts[0].explanation


def test_connected_chains_pass_through(base_time, config):
    """Pass-through layering sequence (A -> B -> C within 20 mins) triggers chain alert."""
    rule = ConnectedChainsRule()
    txns = [
        # Origin A sends $5,000 to Intermediary B
        Transaction(
            transaction_id="T_CHAIN_IN",
            sender_id="ORIGIN_ACC",
            recipient_id="INTERMEDIARY_MULE",
            amount=5000.0,
            currency="USD",
            timestamp=base_time,
        ),
        # Intermediary B sends $4,800 (96%) to Destination C 25 minutes later
        Transaction(
            transaction_id="T_CHAIN_OUT",
            sender_id="INTERMEDIARY_MULE",
            recipient_id="DESTINATION_OFFSHORE",
            amount=4800.0,
            currency="USD",
            timestamp=base_time + timedelta(minutes=25),
        ),
    ]

    alerts = rule.evaluate(txns, config)
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert.account_id == "INTERMEDIARY_MULE"
    assert set(alert.related_transaction_ids) == {"T_CHAIN_IN", "T_CHAIN_OUT"}
    assert "Pass-Through" in alert.evidence[0].rule_name
    assert alert.evidence[0].metrics["pass_through_ratio"] == 0.96
