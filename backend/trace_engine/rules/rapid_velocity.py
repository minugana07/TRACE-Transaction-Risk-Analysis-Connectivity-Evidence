"""
Rule: RAPID_SUCCESSIVE_TRANSFERS
Detects rapid successive outbound transfers within a defined time window (velocity burst).
Provides objective timing evidence and separates observations from inferred fraud risk.
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


class RapidVelocityRule(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="RULE_RAPID_VELOCITY",
            rule_name="Rapid Successive Transfers",
            description="Identifies accounts initiating multiple outbound transfers in rapid succession within a short time window.",
        )

    def evaluate(
        self,
        transactions: List[Transaction],
        config: DetectionConfig,
    ) -> List[Alert]:
        cfg = config.rapid_velocity
        if not cfg.enabled or not transactions:
            return []

        alerts: List[Alert] = []
        window_delta = timedelta(minutes=cfg.window_minutes)

        # Group by sender and sort by timestamp
        sender_txns: Dict[str, List[Transaction]] = defaultdict(list)
        for t in sorted(transactions, key=lambda x: x.timestamp):
            sender_txns[t.sender_id].append(t)

        for sender_id, tx_list in sender_txns.items():
            if len(tx_list) < cfg.min_transfers:
                continue

            # Sliding window over transactions
            i = 0
            n = len(tx_list)
            already_alerted_txn_ids: Set[str] = set()

            while i < n:
                cluster = [tx_list[i]]
                j = i + 1
                while j < n and (tx_list[j].timestamp - tx_list[i].timestamp) <= window_delta:
                    cluster.append(tx_list[j])
                    j += 1

                if len(cluster) >= cfg.min_transfers:
                    cluster_ids = {t.transaction_id for t in cluster}
                    # Check if this cluster is largely redundant with an already alerted group
                    if not cluster_ids.issubset(already_alerted_txn_ids):
                        total_amount = sum(t.amount for t in cluster)
                        distinct_recipients = len({t.recipient_id for t in cluster})
                        time_span_seconds = max(1.0, (cluster[-1].timestamp - cluster[0].timestamp).total_seconds())
                        time_span_mins = time_span_seconds / 60.0

                        # Calculate severity score
                        score = cfg.base_severity_score
                        # Extra transactions in burst
                        score += min(25.0, (len(cluster) - cfg.min_transfers) * 8.0)
                        # High cumulative value
                        if total_amount >= cfg.cumulative_amount_threshold:
                            score += min(20.0, (total_amount / cfg.cumulative_amount_threshold) * 5.0)
                        # Multi-recipient dispersion
                        if distinct_recipients > 1:
                            score += min(15.0, distinct_recipients * 4.0)

                        score = min(100.0, score)
                        priority = (
                            AlertPriority.CRITICAL if score >= 90
                            else AlertPriority.HIGH if score >= 70
                            else AlertPriority.MEDIUM if score >= 40
                            else AlertPriority.LOW
                        )

                        observed_fact = (
                            f"Account '{sender_id}' executed {len(cluster)} outbound transfers totaling "
                            f"{cluster[0].currency} {total_amount:,.2f} within {time_span_mins:.1f} minutes "
                            f"(window threshold: {cfg.min_transfers} transfers in {cfg.window_minutes} mins) "
                            f"to {distinct_recipients} distinct recipient(s)."
                        )
                        inferred_risk = (
                            "Unusual burst velocity. Rapid successive transfers often reflect automated exfiltration "
                            "scripts, account takeover drains, or deliberate attempts to empty balances before detection."
                        )

                        limitations: List[str] = []
                        has_metadata = any(bool(t.metadata) for t in cluster)
                        if not has_metadata:
                            limitations.append(
                                "Device ID, IP geolocation, and session telemetry were not supplied in transaction feed; "
                                "velocity is evaluated purely on transfer execution timestamps."
                            )

                        alert_id = f"ALT-VEL-{uuid.uuid4().hex[:8].upper()}"
                        alerts.append(
                            Alert(
                                alert_id=alert_id,
                                account_id=sender_id,
                                risk_score=round(score, 1),
                                priority=priority,
                                related_transaction_ids=[t.transaction_id for t in cluster],
                                triggered_rules=[self.rule_id],
                                evidence=[
                                    EvidenceItem(
                                        rule_id=self.rule_id,
                                        rule_name=self.rule_name,
                                        observed_fact=observed_fact,
                                        inferred_risk=inferred_risk,
                                        metrics={
                                            "transfer_count": len(cluster),
                                            "total_amount": round(total_amount, 2),
                                            "time_span_minutes": round(time_span_mins, 2),
                                            "distinct_recipients_count": distinct_recipients,
                                            "currency": cluster[0].currency,
                                        },
                                    )
                                ],
                                limitations=limitations,
                                explanation=(
                                    f"Account '{sender_id}' initiated {len(cluster)} transfers in {time_span_mins:.1f} minutes, "
                                    f"exceeding velocity limits."
                                ),
                                modes=[DetectionMode.PROTECT_ME, DetectionMode.INVESTIGATE],
                                recommended_action="BLOCK_TEMPORARY" if score >= 85 else "MANUAL_REVIEW",
                                timestamp=cluster[-1].timestamp,
                            )
                        )

                        already_alerted_txn_ids.update(cluster_ids)
                        # Advance i past this cluster
                        i = j - 1
                i += 1

        return alerts
