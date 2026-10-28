"""
Rule: CONNECTED_CHAINS_AND_FAN_OUT
Detects multi-recipient fan-out dispersal and connected pass-through transfer sequences (layering).
Provides relational graph evidence linking senders, intermediaries, and ultimate beneficiaries.
"""

from collections import defaultdict
from datetime import timedelta
from typing import Dict, List, Set, Tuple
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


class ConnectedChainsRule(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="RULE_CONNECTED_CHAINS",
            rule_name="Connected Transfer Chains & Fan-Out",
            description="Detects rapid fund dispersal to multiple recipients (fan-out) and pass-through layering sequences across intermediary accounts.",
        )

    def evaluate(
        self,
        transactions: List[Transaction],
        config: DetectionConfig,
    ) -> List[Alert]:
        cfg = config.connected_chains
        if not cfg.enabled or not transactions:
            return []

        alerts: List[Alert] = []
        fan_out_delta = timedelta(hours=cfg.fan_out_window_hours)
        chain_delta = timedelta(hours=cfg.chain_window_hours)

        # 1. FAN-OUT PATTERN DETECTION
        # Single sender distributing to multiple unique recipients in short window
        sender_txns: Dict[str, List[Transaction]] = defaultdict(list)
        for t in sorted(transactions, key=lambda x: x.timestamp):
            sender_txns[t.sender_id].append(t)

        for sender_id, tx_list in sender_txns.items():
            for i, tx in enumerate(tx_list):
                window_txns = [tx]
                recipients = {tx.recipient_id}

                for other in tx_list[i + 1:]:
                    if (other.timestamp - tx.timestamp) > fan_out_delta:
                        break
                    window_txns.append(other)
                    recipients.add(other.recipient_id)

                if len(recipients) >= cfg.fan_out_recipients_threshold:
                    total_amt = sum(t.amount for t in window_txns)
                    span_mins = max(1.0, (window_txns[-1].timestamp - window_txns[0].timestamp).total_seconds() / 60.0)

                    score = min(
                        100.0,
                        cfg.base_severity_score + (len(recipients) - cfg.fan_out_recipients_threshold) * 5.0 + 15.0
                    )
                    priority = (
                        AlertPriority.CRITICAL if score >= 90
                        else AlertPriority.HIGH if score >= 70
                        else AlertPriority.MEDIUM
                    )

                    observed_fact = (
                        f"Account '{sender_id}' distributed funds to {len(recipients)} distinct recipients "
                        f"across {len(window_txns)} transactions totaling {window_txns[0].currency} {total_amt:,.2f} "
                        f"within {span_mins:.1f} minutes."
                    )
                    inferred_risk = (
                        "Rapid 1-to-many dispersion (fan-out). Common in fraud rings where a master account dispatches "
                        "illicit proceeds to an array of money mules or decentralized accounts to evade transaction thresholds."
                    )
                    limitations = [
                        "Legitimate corporate disbursements such as vendor payouts or payroll may exhibit fan-out characteristics."
                    ]

                    alert_id = f"ALT-FAN-{uuid.uuid4().hex[:8].upper()}"
                    alerts.append(
                        Alert(
                            alert_id=alert_id,
                            account_id=sender_id,
                            risk_score=round(score, 1),
                            priority=priority,
                            related_transaction_ids=[t.transaction_id for t in window_txns],
                            triggered_rules=[f"{self.rule_id}_FAN_OUT"],
                            evidence=[
                                EvidenceItem(
                                    rule_id=f"{self.rule_id}_FAN_OUT",
                                    rule_name="Rapid Fan-Out Dispersal",
                                    observed_fact=observed_fact,
                                    inferred_risk=inferred_risk,
                                    metrics={
                                        "recipient_count": len(recipients),
                                        "transfer_count": len(window_txns),
                                        "total_amount": round(total_amt, 2),
                                        "time_span_minutes": round(span_mins, 2),
                                        "recipients": sorted(list(recipients)),
                                    },
                                )
                            ],
                            limitations=limitations,
                            explanation=(
                                f"Account '{sender_id}' disbursed funds to {len(recipients)} distinct recipients within "
                                f"{span_mins:.1f} minutes, exhibiting fan-out behavior."
                            ),
                            modes=[DetectionMode.PROTECT_ME, DetectionMode.INVESTIGATE],
                            recommended_action="MANUAL_REVIEW",
                            timestamp=window_txns[-1].timestamp,
                        )
                    )
                    break  # Alert once per sender to avoid duplicate cluster spam

        # 2. PASS-THROUGH / LAYERING CHAIN DETECTION (A -> B -> C)
        # Find intermediate accounts B that receive from A and forward >= 75% to C within chain_window_hours
        inbound_by_account: Dict[str, List[Transaction]] = defaultdict(list)
        outbound_by_account: Dict[str, List[Transaction]] = defaultdict(list)

        for t in sorted(transactions, key=lambda x: x.timestamp):
            inbound_by_account[t.recipient_id].append(t)
            outbound_by_account[t.sender_id].append(t)

        # Check candidate intermediate nodes B
        candidate_intermediaries = set(inbound_by_account.keys()) & set(outbound_by_account.keys())

        for b_acc in candidate_intermediaries:
            inbounds = inbound_by_account[b_acc]
            outbounds = outbound_by_account[b_acc]

            for in_tx in inbounds:
                for out_tx in outbounds:
                    # Outbound must happen after or at same time as inbound, within window
                    if out_tx.timestamp < in_tx.timestamp:
                        continue
                    delay = (out_tx.timestamp - in_tx.timestamp)
                    if delay > chain_delta:
                        continue

                    # Cannot be circular self-transfer back to origin A
                    if out_tx.recipient_id == in_tx.sender_id:
                        continue

                    pass_through_ratio = (out_tx.amount / in_tx.amount) if in_tx.amount > 0 else 0.0

                    if pass_through_ratio >= cfg.chain_pass_through_ratio and pass_through_ratio <= 1.25:
                        delay_mins = delay.total_seconds() / 60.0
                        score = min(100.0, cfg.base_severity_score + 25.0 + (10.0 if delay_mins < 30.0 else 0.0))
                        priority = AlertPriority.CRITICAL if score >= 90 else AlertPriority.HIGH

                        observed_fact = (
                            f"Pass-through chain detected: Account '{b_acc}' received {in_tx.currency} {in_tx.amount:,.2f} "
                            f"from '{in_tx.sender_id}' (tx: {in_tx.transaction_id}) and forwarded "
                            f"{out_tx.currency} {out_tx.amount:,.2f} ({pass_through_ratio * 100:.1f}%) to "
                            f"'{out_tx.recipient_id}' (tx: {out_tx.transaction_id}) {delay_mins:.1f} minutes later."
                        )
                        inferred_risk = (
                            f"Layering / money mule transit pattern. Account '{b_acc}' acts as a pass-through intermediary "
                            f"with minimal retention, obscuring the paper trail between originator '{in_tx.sender_id}' "
                            f"and destination '{out_tx.recipient_id}'."
                        )
                        limitations = [
                            "Escrow services, automated clearing houses, or exchange wallets naturally exhibit pass-through velocity."
                        ]

                        alert_id = f"ALT-CHN-{uuid.uuid4().hex[:8].upper()}"
                        alerts.append(
                            Alert(
                                alert_id=alert_id,
                                account_id=b_acc,
                                risk_score=round(score, 1),
                                priority=priority,
                                related_transaction_ids=[in_tx.transaction_id, out_tx.transaction_id],
                                triggered_rules=[f"{self.rule_id}_PASS_THROUGH"],
                                evidence=[
                                    EvidenceItem(
                                        rule_id=f"{self.rule_id}_PASS_THROUGH",
                                        rule_name="Pass-Through Chain (Layering)",
                                        observed_fact=observed_fact,
                                        inferred_risk=inferred_risk,
                                        metrics={
                                            "originator": in_tx.sender_id,
                                            "intermediary": b_acc,
                                            "beneficiary": out_tx.recipient_id,
                                            "inbound_amount": in_tx.amount,
                                            "outbound_amount": out_tx.amount,
                                            "pass_through_ratio": round(pass_through_ratio, 3),
                                            "delay_minutes": round(delay_mins, 1),
                                        },
                                    )
                                ],
                                limitations=limitations,
                                explanation=(
                                    f"Account '{b_acc}' forwarded {pass_through_ratio * 100:.1f}% of received funds from "
                                    f"'{in_tx.sender_id}' to '{out_tx.recipient_id}' within {delay_mins:.1f} minutes."
                                ),
                                modes=[DetectionMode.INVESTIGATE],
                                recommended_action="BLOCK_TEMPORARY" if score >= 85 else "MANUAL_REVIEW",
                                timestamp=out_tx.timestamp,
                            )
                        )

        return alerts
