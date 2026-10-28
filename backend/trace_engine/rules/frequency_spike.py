"""
Rule: SUDDEN_FREQUENCY_SPIKE
Detects sudden, dramatic changes in transaction frequency compared to historical account cadence.
Includes detection of dormant account reactivation spikes.
"""

from collections import defaultdict
from datetime import timedelta
from typing import Dict, List, Set
import uuid

from trace_engine.config import DetectionConfig
from trace_engine.rules.base import BaseRule
from trace_engine.schemas import (
    Alert,
    AlertPriority,
    DetectionMode,
    EvidenceItem,
    Transaction,
)


class FrequencySpikeRule(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="RULE_FREQUENCY_SPIKE",
            rule_name="Sudden Transaction Frequency Surge",
            description="Identifies abrupt surges in transaction cadence compared to an account's historical frequency profile.",
        )

    def evaluate(
        self,
        transactions: List[Transaction],
        config: DetectionConfig,
    ) -> List[Alert]:
        cfg = config.frequency_spike
        if not cfg.enabled or not transactions:
            return []

        alerts: List[Alert] = []
        short_window_delta = timedelta(hours=cfg.short_window_hours)

        # Group by sender
        sender_txns: Dict[str, List[Transaction]] = defaultdict(list)
        for t in sorted(transactions, key=lambda x: x.timestamp):
            sender_txns[t.sender_id].append(t)

        for sender_id, tx_list in sender_txns.items():
            # Need sufficient transactions to evaluate frequency change
            if len(tx_list) < cfg.min_short_window_transfers:
                continue

            first_time = tx_list[0].timestamp
            last_time = tx_list[-1].timestamp
            total_span_hours = max(1.0, (last_time - first_time).total_seconds() / 3600.0)

            # Historical baseline rate across the full recorded timeline
            baseline_rate = len(tx_list) / total_span_hours

            alerted_txn_ids: Set[str] = set()

            # Inspect sliding short windows
            for i, tx in enumerate(tx_list):
                if tx.transaction_id in alerted_txn_ids:
                    continue

                window_txns = [tx]
                for other in tx_list[i + 1:]:
                    if (other.timestamp - tx.timestamp) > short_window_delta:
                        break
                    window_txns.append(other)

                if len(window_txns) >= cfg.min_short_window_transfers:
                    short_span_hours = max(
                        0.1, (window_txns[-1].timestamp - window_txns[0].timestamp).total_seconds() / 3600.0
                    )
                    short_rate = len(window_txns) / short_span_hours

                    ratio = (short_rate / baseline_rate) if baseline_rate > 0 else 1.0

                    # Check for dormancy reactivation (gap of > 7 days prior to this window)
                    is_dormant_reactivation = False
                    if i > 0:
                        prev_tx = tx_list[i - 1]
                        gap_days = (tx.timestamp - prev_tx.timestamp).total_seconds() / 86400.0
                        if gap_days >= 7.0:
                            is_dormant_reactivation = True

                    if ratio >= cfg.frequency_ratio_threshold or (is_dormant_reactivation and len(window_txns) >= cfg.min_short_window_transfers):
                        window_ids = {t.transaction_id for t in window_txns}
                        if not window_ids.issubset(alerted_txn_ids):
                            score = cfg.base_severity_score + min(30.0, (ratio - cfg.frequency_ratio_threshold) * 5.0)
                            if is_dormant_reactivation:
                                score += 20.0
                            score = min(100.0, score)

                            priority = (
                                AlertPriority.CRITICAL if score >= 90
                                else AlertPriority.HIGH if score >= 70
                                else AlertPriority.MEDIUM if score >= 40
                                else AlertPriority.LOW
                            )

                            total_amount = sum(t.amount for t in window_txns)
                            observed_fact = (
                                f"Account '{sender_id}' executed {len(window_txns)} transactions totaling "
                                f"{window_txns[0].currency} {total_amount:,.2f} at a rate of {short_rate:.2f} tx/hr "
                                f"within {short_span_hours:.1f} hours. Historical average cadence is {baseline_rate:.2f} tx/hr "
                                f"({ratio:.1f}x frequency surge)."
                            )
                            if is_dormant_reactivation:
                                observed_fact += " Account had been inactive for over 7 days prior to this burst."

                            inferred_risk = (
                                "Abrupt surge in transfer cadence significantly outpacing normal user activity. "
                                "Frequent indicator of automated script execution following credential theft, session hijacking, "
                                "or rapid laundering through compromised credentials."
                            )

                            limitations = [
                                "E-commerce seasonal promotions, end-of-month commercial settlements, or batch payroll "
                                "may cause benign cadence spikes."
                            ]

                            alert_id = f"ALT-FRQ-{uuid.uuid4().hex[:8].upper()}"
                            alerts.append(
                                Alert(
                                    alert_id=alert_id,
                                    account_id=sender_id,
                                    risk_score=round(score, 1),
                                    priority=priority,
                                    related_transaction_ids=sorted(list(window_ids)),
                                    triggered_rules=[self.rule_id],
                                    evidence=[
                                        EvidenceItem(
                                            rule_id=self.rule_id,
                                            rule_name=self.rule_name,
                                            observed_fact=observed_fact,
                                            inferred_risk=inferred_risk,
                                            metrics={
                                                "burst_count": len(window_txns),
                                                "burst_rate_per_hour": round(short_rate, 2),
                                                "baseline_rate_per_hour": round(baseline_rate, 2),
                                                "ratio": round(ratio, 2),
                                                "dormant_reactivation": is_dormant_reactivation,
                                                "total_burst_amount": round(total_amount, 2),
                                            },
                                        )
                                    ],
                                    limitations=limitations,
                                    explanation=(
                                        f"Account '{sender_id}' exhibited a {ratio:.1f}x surge in transaction frequency, "
                                        f"initiating {len(window_txns)} transfers within {short_span_hours:.1f} hours."
                                    ),
                                    modes=[DetectionMode.PROTECT_ME, DetectionMode.INVESTIGATE],
                                    recommended_action="STEP_UP_AUTH" if score < 70 else "MANUAL_REVIEW",
                                    timestamp=window_txns[-1].timestamp,
                                )
                            )

                            alerted_txn_ids.update(window_ids)

        return alerts
