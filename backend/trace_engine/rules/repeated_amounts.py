"""
Rule: REPEATED_SIMILAR_AMOUNTS
Detects repeated transfers of identical or very similar amounts (structuring / smurfing).
Separates objective clustering facts from inferred anti-money laundering risk.
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


class RepeatedAmountsRule(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="RULE_REPEATED_AMOUNTS",
            rule_name="Repeated Similar Amounts (Structuring)",
            description="Detects multiple transfers of identical or near-identical amounts within a sliding window, indicating potential structuring or smurfing.",
        )

    def evaluate(
        self,
        transactions: List[Transaction],
        config: DetectionConfig,
    ) -> List[Alert]:
        cfg = config.repeated_amounts
        if not cfg.enabled or not transactions:
            return []

        alerts: List[Alert] = []
        window_delta = timedelta(hours=cfg.window_hours)

        # Group by sender
        sender_txns: Dict[str, List[Transaction]] = defaultdict(list)
        for t in sorted(transactions, key=lambda x: x.timestamp):
            sender_txns[t.sender_id].append(t)

        for sender_id, tx_list in sender_txns.items():
            if len(tx_list) < cfg.min_occurrences:
                continue

            alerted_txn_ids: Set[str] = set()

            for i, anchor_tx in enumerate(tx_list):
                if anchor_tx.transaction_id in alerted_txn_ids:
                    continue

                anchor_amount = anchor_tx.amount
                lower_bound = anchor_amount * (1.0 - cfg.tolerance_ratio)
                upper_bound = anchor_amount * (1.0 + cfg.tolerance_ratio)

                # Find all transactions within window from anchor that match amount range
                matching_cluster = [anchor_tx]
                for other_tx in tx_list[i + 1:]:
                    if (other_tx.timestamp - anchor_tx.timestamp) > window_delta:
                        break
                    if lower_bound <= other_tx.amount <= upper_bound:
                        matching_cluster.append(other_tx)

                if len(matching_cluster) >= cfg.min_occurrences:
                    cluster_ids = {t.transaction_id for t in matching_cluster}
                    if not cluster_ids.issubset(alerted_txn_ids):
                        total_amount = sum(t.amount for t in matching_cluster)
                        avg_amount = total_amount / len(matching_cluster)
                        span_hours = max(
                            0.1,
                            (matching_cluster[-1].timestamp - matching_cluster[0].timestamp).total_seconds() / 3600.0,
                        )

                        # Check for regulatory structuring proximity ($8k - $10k)
                        is_near_threshold = any(
                            cfg.structuring_range_min <= t.amount <= cfg.structuring_range_max
                            for t in matching_cluster
                        )

                        score = cfg.base_severity_score
                        # Extra repetitions
                        score += min(20.0, (len(matching_cluster) - cfg.min_occurrences) * 7.0)
                        # Regulatory structuring penalty
                        if is_near_threshold:
                            score += 25.0
                        # Recipient variety
                        unique_recipients = len({t.recipient_id for t in matching_cluster})
                        if unique_recipients > 1:
                            score += 10.0

                        score = min(100.0, score)
                        priority = (
                            AlertPriority.CRITICAL if score >= 90
                            else AlertPriority.HIGH if score >= 70
                            else AlertPriority.MEDIUM if score >= 40
                            else AlertPriority.LOW
                        )

                        observed_fact = (
                            f"Account '{sender_id}' executed {len(matching_cluster)} transfers of similar amounts "
                            f"(mean: {matching_cluster[0].currency} {avg_amount:,.2f}, tolerance: +/-{cfg.tolerance_ratio * 100:.0f}%) "
                            f"totaling {matching_cluster[0].currency} {total_amount:,.2f} within {span_hours:.1f} hours "
                            f"to {unique_recipients} distinct recipient(s)."
                        )
                        inferred_risk = (
                            "Repeated similar amount transfers. In banking compliance, clustering transfers just below "
                            "regulatory thresholds or splitting large sums into smaller equal increments is a hallmark of "
                            "structuring (smurfing) to evade automated currency transaction reporting."
                        )
                        limitations = [
                            "Legitimate recurring batch disbursements (e.g. standardized vendor retainers or payroll) "
                            "cannot be distinguished without business category and invoice remittance records."
                        ]

                        alert_id = f"ALT-STR-{uuid.uuid4().hex[:8].upper()}"
                        alerts.append(
                            Alert(
                                alert_id=alert_id,
                                account_id=sender_id,
                                risk_score=round(score, 1),
                                priority=priority,
                                related_transaction_ids=sorted(list(cluster_ids)),
                                triggered_rules=[self.rule_id],
                                evidence=[
                                    EvidenceItem(
                                        rule_id=self.rule_id,
                                        rule_name=self.rule_name,
                                        observed_fact=observed_fact,
                                        inferred_risk=inferred_risk,
                                        metrics={
                                            "occurrences_count": len(matching_cluster),
                                            "average_amount": round(avg_amount, 2),
                                            "total_amount": round(total_amount, 2),
                                            "time_span_hours": round(span_hours, 2),
                                            "unique_recipients": unique_recipients,
                                            "near_reporting_threshold": is_near_threshold,
                                        },
                                    )
                                ],
                                limitations=limitations,
                                explanation=(
                                    f"Detected {len(matching_cluster)} transfers of ~{matching_cluster[0].currency} {avg_amount:,.2f} "
                                    f"within {span_hours:.1f} hours, indicating potential structuring activity."
                                ),
                                modes=[DetectionMode.INVESTIGATE],
                                recommended_action="MANUAL_REVIEW",
                                timestamp=matching_cluster[-1].timestamp,
                            )
                        )

                        alerted_txn_ids.update(cluster_ids)

        return alerts
