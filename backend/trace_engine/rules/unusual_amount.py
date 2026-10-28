"""
Rule: UNUSUAL_AMOUNT_RELATIVE_TO_HISTORY
Detects transfers unusually large relative to available sender account history.
Provides transparent statistical evidence and explicitly notes missing-data limitations.
"""

import math
import statistics
import uuid
from collections import defaultdict
from typing import Dict, List
from trace_engine.config import DetectionConfig
from trace_engine.rules.base import BaseRule
from trace_engine.schemas import (
    Alert,
    AlertPriority,
    DetectionMode,
    EvidenceItem,
    Transaction,
)


class UnusualAmountRule(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="RULE_UNUSUAL_AMOUNT",
            rule_name="Unusual Transfer Amount Relative to History",
            description="Identifies transfers that deviate significantly from an account's historical spending profile.",
        )

    def evaluate(
        self,
        transactions: List[Transaction],
        config: DetectionConfig,
    ) -> List[Alert]:
        cfg = config.unusual_amount
        if not cfg.enabled or not transactions:
            return []

        alerts: List[Alert] = []

        # Group and sort transactions by sender chronologically
        sender_txns: Dict[str, List[Transaction]] = defaultdict(list)
        for t in sorted(transactions, key=lambda x: x.timestamp):
            sender_txns[t.sender_id].append(t)

        for sender_id, tx_list in sender_txns.items():
            prior_amounts: List[float] = []

            for txn in tx_list:
                amount = txn.amount

                # Evaluate against prior transactions
                has_enough_history = len(prior_amounts) >= cfg.min_history_count

                if not has_enough_history:
                    # Account has limited history
                    # We only flag extreme amounts (> $10k) with an explicit limitation warning
                    if amount >= max(cfg.min_amount_to_flag * 10, 10000.0):
                        alert_id = f"ALT-AMT-LIM-{uuid.uuid4().hex[:8].upper()}"
                        observed_fact = (
                            f"Account '{sender_id}' initiated transfer {txn.transaction_id} of "
                            f"{txn.currency} {amount:,.2f} with only {len(prior_amounts)} prior recorded outbound transfer(s)."
                        )
                        inferred_risk = (
                            "Large capital transfer on an account with sparse historical baseline. "
                            "Unestablished account profiles present elevated risk of first-party fraud or rapid cash-out."
                        )
                        limitations = [
                            f"Account has limited transaction history ({len(prior_amounts)} prior records; "
                            f"minimum {cfg.min_history_count} required for statistical variance models). "
                            "Normal spending baseline cannot be reliably established."
                        ]

                        score = 45.0
                        alerts.append(
                            Alert(
                                alert_id=alert_id,
                                account_id=sender_id,
                                risk_score=score,
                                priority=AlertPriority.MEDIUM,
                                related_transaction_ids=[txn.transaction_id],
                                triggered_rules=[self.rule_id],
                                evidence=[
                                    EvidenceItem(
                                        rule_id=self.rule_id,
                                        rule_name=self.rule_name,
                                        observed_fact=observed_fact,
                                        inferred_risk=inferred_risk,
                                        metrics={
                                            "amount": amount,
                                            "prior_transaction_count": len(prior_amounts),
                                            "currency": txn.currency,
                                        },
                                    )
                                ],
                                limitations=limitations,
                                explanation=(
                                    f"Transfer {txn.transaction_id} of {txn.currency} {amount:,.2f} was flagged due to "
                                    f"high absolute value with sparse prior account history."
                                ),
                                modes=[DetectionMode.INVESTIGATE],
                                recommended_action="STEP_UP_AUTH",
                                timestamp=txn.timestamp,
                            )
                        )
                else:
                    # We have sufficient history to establish statistical baselines
                    median_val = statistics.median(prior_amounts)
                    mean_val = statistics.mean(prior_amounts)
                    std_val = statistics.stdev(prior_amounts) if len(prior_amounts) > 1 else 0.0

                    multiplier = (amount / median_val) if median_val > 0 else 1.0
                    z_score = ((amount - mean_val) / std_val) if std_val > 0 else 0.0

                    is_multiplier_spike = multiplier >= cfg.multiplier_threshold and amount >= cfg.min_amount_to_flag
                    is_zscore_spike = z_score >= cfg.z_score_threshold and amount >= cfg.min_amount_to_flag

                    if is_multiplier_spike or is_zscore_spike:
                        # Calculate priority score based on severity of deviation
                        # Base severity plus bonus for extreme multiples
                        score = min(
                            100.0,
                            cfg.base_severity_score + min(40.0, (multiplier - cfg.multiplier_threshold) * 5.0) + (10.0 if z_score > 4.0 else 0.0)
                        )
                        priority = (
                            AlertPriority.CRITICAL if score >= 90
                            else AlertPriority.HIGH if score >= 70
                            else AlertPriority.MEDIUM
                        )

                        observed_fact = (
                            f"Account '{sender_id}' initiated transfer {txn.transaction_id} for "
                            f"{txn.currency} {amount:,.2f}. Prior median transfer amount is "
                            f"{txn.currency} {median_val:,.2f} (a {multiplier:.1f}x deviation) and "
                            f"mean is {txn.currency} {mean_val:,.2f} with z-score {z_score:.2f} "
                            f"across {len(prior_amounts)} historical transactions."
                        )
                        inferred_risk = (
                            "Sudden disproportionate outbound capital transfer sharply deviating from the established "
                            "account baseline. Often indicative of unauthorized account takeover (ATO) or rushed liquidation."
                        )
                        limitations = []
                        if len(prior_amounts) < 10:
                            limitations.append(
                                f"Historical baseline calculated from a modest sample size ({len(prior_amounts)} transactions)."
                            )

                        alert_id = f"ALT-AMT-{uuid.uuid4().hex[:8].upper()}"
                        alerts.append(
                            Alert(
                                alert_id=alert_id,
                                account_id=sender_id,
                                risk_score=round(score, 1),
                                priority=priority,
                                related_transaction_ids=[txn.transaction_id],
                                triggered_rules=[self.rule_id],
                                evidence=[
                                    EvidenceItem(
                                        rule_id=self.rule_id,
                                        rule_name=self.rule_name,
                                        observed_fact=observed_fact,
                                        inferred_risk=inferred_risk,
                                        metrics={
                                            "amount": amount,
                                            "median_historical_amount": median_val,
                                            "mean_historical_amount": mean_val,
                                            "std_deviation": std_val,
                                            "multiplier": round(multiplier, 2),
                                            "z_score": round(z_score, 2),
                                            "prior_count": len(prior_amounts),
                                        },
                                    )
                                ],
                                limitations=limitations,
                                explanation=(
                                    f"Outbound transfer {txn.transaction_id} of {txn.currency} {amount:,.2f} is {multiplier:.1f}x "
                                    f"the sender's median historical transfer ({txn.currency} {median_val:,.2f}), triggering an alert."
                                ),
                                modes=[DetectionMode.PROTECT_ME, DetectionMode.INVESTIGATE],
                                recommended_action="BLOCK_TEMPORARY" if priority == AlertPriority.CRITICAL else "STEP_UP_AUTH",
                                timestamp=txn.timestamp,
                            )
                        )

                # Record amount into history for subsequent transactions
                prior_amounts.append(amount)

        return alerts
