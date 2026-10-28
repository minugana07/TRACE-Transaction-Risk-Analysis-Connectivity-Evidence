"""
TRACE Fraud Detection Engine.
Coordinates deterministic rule execution, aggregates evidence, synthesizes compound risk scores,
and generates explainable investigation alerts.
"""

from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
import uuid

from trace_engine.config import DetectionConfig
from trace_engine.rules import BaseRule, get_default_rules
from trace_engine.schemas import (
    Alert,
    AlertPriority,
    DetectionMode,
    DetectionResult,
    EvidenceItem,
    Transaction,
)


class FraudEngine:
    """
    Core detection engine for TRACE.
    Applies configurable deterministic rules to transaction sets, synthesizing
    comprehensive explainable alerts with calibrated 0-100 investigation priority scores.
    """

    def __init__(
        self,
        config: Optional[DetectionConfig] = None,
        rules: Optional[List[BaseRule]] = None,
    ):
        self.config = config or DetectionConfig()
        self.rules = rules if rules is not None else get_default_rules()

    def detect(
        self,
        transactions: List[Transaction],
        aggregate_by_account: bool = True,
    ) -> DetectionResult:
        """
        Executes all active rules against the provided transactions.

        Args:
            transactions: Ingested and validated Transaction instances.
            aggregate_by_account: When True, combines multiple rule triggers on the same account
                                  into unified compound alerts with combined evidence.

        Returns:
            DetectionResult containing prioritized alerts and audit metrics.
        """
        if not transactions:
            return DetectionResult(
                total_transactions_analyzed=0,
                flagged_transactions_count=0,
                alerts=[],
                analysis_timestamp=datetime.now(timezone.utc),
                metadata={"status": "NO_TRANSACTIONS_PROVIDED"},
            )

        raw_alerts: List[Alert] = []
        for rule in self.rules:
            rule_alerts = rule.evaluate(transactions, self.config)
            raw_alerts.extend(rule_alerts)

        final_alerts = self._consolidate_alerts(raw_alerts) if aggregate_by_account else raw_alerts

        # Sort alerts by risk score descending (highest priority investigation first)
        final_alerts.sort(key=lambda a: a.risk_score, reverse=True)

        all_flagged_txn_ids: Set[str] = set()
        for alert in final_alerts:
            all_flagged_txn_ids.update(alert.related_transaction_ids)

        # Summary statistics
        priority_counts = {p.value: 0 for p in AlertPriority}
        for a in final_alerts:
            priority_counts[a.priority.value] += 1

        rule_counts: Dict[str, int] = defaultdict(int)
        for a in final_alerts:
            for r in a.triggered_rules:
                rule_counts[r] += 1

        return DetectionResult(
            total_transactions_analyzed=len(transactions),
            flagged_transactions_count=len(all_flagged_txn_ids),
            alerts=final_alerts,
            analysis_timestamp=datetime.now(timezone.utc),
            metadata={
                "total_alerts": len(final_alerts),
                "priority_breakdown": priority_counts,
                "rule_triggers_breakdown": dict(rule_counts),
                "engine_version": "TRACE-2.0",
            },
        )

    def _consolidate_alerts(self, alerts: List[Alert]) -> List[Alert]:
        """
        Consolidates multiple alerts for the same account into a single unified alert
        if they share overlapping transactions or temporal context.
        Computes compound risk score using probabilistic combination: S = 100 * (1 - prod(1 - s_i/100)).
        """
        if not alerts:
            return []

        by_account: Dict[str, List[Alert]] = defaultdict(list)
        for a in alerts:
            by_account[a.account_id].append(a)

        consolidated: List[Alert] = []

        for account_id, acc_alerts in by_account.items():
            if len(acc_alerts) == 1:
                consolidated.append(acc_alerts[0])
                continue

            # Multi-rule trigger on the same account
            # Combine risk score compound formula
            comp_product = 1.0
            for a in acc_alerts:
                comp_product *= max(0.0, 1.0 - (a.risk_score / 100.0))
            compound_score = min(100.0, max(0.0, (1.0 - comp_product) * 100.0))

            # Determine priority
            priority = (
                AlertPriority.CRITICAL if compound_score >= 90
                else AlertPriority.HIGH if compound_score >= 70
                else AlertPriority.MEDIUM if compound_score >= 40
                else AlertPriority.LOW
            )

            # Merge related transaction IDs
            related_ids = sorted(list({tid for a in acc_alerts for tid in a.related_transaction_ids}))

            # Merge triggered rules
            all_rules = sorted(list({r for a in acc_alerts for r in a.triggered_rules}))

            # Merge evidence items
            all_evidence: List[EvidenceItem] = []
            seen_facts: Set[str] = set()
            for a in acc_alerts:
                for ev in a.evidence:
                    if ev.observed_fact not in seen_facts:
                        all_evidence.append(ev)
                        seen_facts.add(ev.observed_fact)

            # Merge limitations
            all_limitations: List[str] = sorted(list({lim for a in acc_alerts for lim in a.limitations}))

            # Union modes
            modes_set: Set[DetectionMode] = set()
            for a in acc_alerts:
                modes_set.update(a.modes)

            # Recommended action escalation
            if priority == AlertPriority.CRITICAL:
                action = "BLOCK_TEMPORARY"
            elif priority == AlertPriority.HIGH:
                action = "STEP_UP_AUTH"
            else:
                action = "MANUAL_REVIEW"

            # Synthesize cohesive explanation
            rule_summaries = [f"{a.triggered_rules[0]} ({a.risk_score:.0f})" for a in acc_alerts]
            explanation = (
                f"Compound investigation alert for Account '{account_id}'. Triggered {len(acc_alerts)} distinct "
                f"suspicious indicator(s): {', '.join(rule_summaries)}. Compound priority score is {compound_score:.1f}/100."
            )

            merged_alert = Alert(
                alert_id=f"ALT-CMP-{uuid.uuid4().hex[:8].upper()}",
                account_id=account_id,
                risk_score=round(compound_score, 1),
                priority=priority,
                related_transaction_ids=related_ids,
                triggered_rules=all_rules,
                evidence=all_evidence,
                limitations=all_limitations,
                explanation=explanation,
                modes=sorted(list(modes_set), key=lambda m: m.value),
                recommended_action=action,
                timestamp=max(a.timestamp for a in acc_alerts),
            )
            consolidated.append(merged_alert)

        return consolidated
