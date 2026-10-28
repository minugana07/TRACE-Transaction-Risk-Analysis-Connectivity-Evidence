import math
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.database import get_case_status
from app.models.contracts import (
    Alert,
    DetectionResult,
    EvidenceItem,
    GeographicData,
    InvestigationStatus,
    RiskTier,
    Transaction,
)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def parse_iso(ts_str: str) -> datetime:
    """Parse ISO 8601 string to aware datetime."""
    clean = ts_str.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(clean)
    except Exception:
        return datetime.now(timezone.utc)


class DetectionEngine:
    """
    TRACE Modular Fraud Detection Engine.
    
    Architectural boundary owned by Member 2 (Detection Engineer).
    Member 1 provides this robust base runner and baseline rule definitions.
    Member 2 can plug in specialized statistical or machine learning rules.
    """

    def __init__(self):
        self.rules_registry = [
            self._rule_structuring_smurfing,
            self._rule_geo_velocity,
            self._rule_rapid_mule_dispersal,
            self._rule_high_velocity_burst,
            self._rule_high_risk_channel_anomaly,
            self._rule_member2_fraud_engine,
        ]

    def register_rule(self, rule_fn):
        """Allows Member 2 to plug in additional custom detection rules dynamically."""
        self.rules_registry.append(rule_fn)

    def run(self, transactions: List[Transaction]) -> DetectionResult:
        """
        Executes all active rules against the supplied transaction set.
        Returns a unified DetectionResult adhering to shared data contracts.
        """
        start_time = time.time()
        alerts_map: Dict[str, Alert] = {}
        flagged_tx_ids = set()

        # Sort transactions chronologically
        sorted_txs = sorted(transactions, key=lambda tx: parse_iso(tx.timestamp))

        # Evaluate all registered rules
        for rule in self.rules_registry:
            rule_alerts = rule(sorted_txs)
            for alert in rule_alerts:
                # Merge or record alert by case_id
                if alert.case_id in alerts_map:
                    existing = alerts_map[alert.case_id]
                    # Merge related transactions
                    combined_txs = list(
                        set(existing.related_transaction_ids + alert.related_transaction_ids)
                    )
                    combined_rules = list(
                        set(existing.triggered_rules + alert.triggered_rules)
                    )
                    combined_evidence = existing.evidence + alert.evidence
                    combined_limitations = list(
                        set(existing.limitations + alert.limitations)
                    )
                    # Higher investigation priority score takes precedence
                    max_score = max(existing.risk_score, alert.risk_score)
                    
                    priority = (
                        RiskTier.CRITICAL.value if max_score >= 85
                        else RiskTier.HIGH.value if max_score >= 70
                        else RiskTier.MEDIUM.value if max_score >= 40
                        else RiskTier.LOW.value
                    )

                    existing.related_transaction_ids = combined_txs
                    existing.triggered_rules = combined_rules
                    existing.evidence = combined_evidence
                    existing.limitations = combined_limitations
                    existing.risk_score = max_score
                    existing.priority = priority
                else:
                    alerts_map[alert.case_id] = alert

                for tx_id in alert.related_transaction_ids:
                    flagged_tx_ids.add(tx_id)

        # Sync persisted investigation statuses from SQLite if exists
        final_alerts = []
        for alert in alerts_map.values():
            persisted_status = get_case_status(alert.case_id)
            if persisted_status:
                alert.investigation_status = persisted_status
            final_alerts.append(alert)

        # Sort alerts by risk score (investigation priority) descending
        final_alerts.sort(key=lambda a: a.risk_score, reverse=True)

        elapsed_ms = (time.time() - start_time) * 1000.0

        return DetectionResult(
            summary=(
                f"Detection completed across {len(transactions)} transactions. "
                f"Identified {len(final_alerts)} high-priority investigation cases with "
                f"{len(flagged_tx_ids)} flagged transactions."
            ),
            alerts=final_alerts,
            transaction_count=len(transactions),
            flagged_count=len(flagged_tx_ids),
            execution_time_ms=round(elapsed_ms, 2),
            metadata={
                "rules_evaluated": len(self.rules_registry),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "engine_version": "TRACE-DETECTION-v2.0-INTEGRATED",
            },
        )

    # -------------------------------------------------------------
    # MEMBER 2 ENGINE INTEGRATION ADAPTER
    # -------------------------------------------------------------

    def _rule_member2_fraud_engine(self, txs: List[Transaction]) -> List[Alert]:
        """
        Invokes Member 2's FraudEngine directly over transactions, converting
        Member 2's Alert models into unified TRACE shared Alert contracts.
        """
        try:
            from trace_engine import detect_fraud
            from trace_engine.schemas import Transaction as TETxn, TransactionStatus as TETxnStatus

            te_txs = []
            for t in txs:
                ts = parse_iso(t.timestamp)
                status_enum = TETxnStatus.COMPLETED
                st_upper = (t.status or "COMPLETED").upper()
                if st_upper == "PENDING":
                    status_enum = TETxnStatus.PENDING
                elif st_upper == "FAILED":
                    status_enum = TETxnStatus.FAILED
                elif st_upper == "CANCELLED":
                    status_enum = TETxnStatus.CANCELLED

                te_txs.append(
                    TETxn(
                        transaction_id=t.id,
                        sender_id=t.sender_id,
                        recipient_id=t.receiver_id,
                        amount=t.amount,
                        currency=t.currency or "USD",
                        timestamp=ts,
                        status=status_enum,
                        metadata={"channel": t.channel},
                    )
                )

            te_result = detect_fraud(te_txs)
            converted_alerts = []
            now_str = datetime.now(timezone.utc).isoformat()

            for te_alert in te_result.alerts:
                ev_items = []
                for ev in te_alert.evidence:
                    ev_items.append(
                        EvidenceItem(
                            id=f"EVD-M2-{ev.rule_id}-{te_alert.account_id}",
                            type=ev.rule_name.upper().replace(" ", "_"),
                            description=f"{ev.observed_fact}. Hypothesized Risk: {ev.inferred_risk}",
                            severity=te_alert.priority.value,
                            timestamp=now_str,
                            details=ev.metrics,
                        )
                    )

                converted_alerts.append(
                    Alert(
                        id=f"ALT-M2-{te_alert.alert_id}",
                        case_id=f"CASE-M2-{te_alert.account_id}",
                        customer_id=te_alert.account_id,
                        title=f"{te_alert.explanation[:70]}",
                        summary=te_alert.explanation,
                        risk_score=te_alert.risk_score,
                        priority=te_alert.priority.value,
                        related_transaction_ids=te_alert.related_transaction_ids,
                        triggered_rules=te_alert.triggered_rules,
                        evidence=ev_items,
                        limitations=te_alert.limitations,
                        investigation_status=InvestigationStatus.NEW.value,
                        created_at=now_str,
                        updated_at=now_str,
                    )
                )

            return converted_alerts
        except Exception:
            return []

    # -------------------------------------------------------------
    # BASELINE RULE IMPLEMENTATIONS
    # -------------------------------------------------------------

    def _rule_structuring_smurfing(self, txs: List[Transaction]) -> List[Alert]:
        alerts = []
        by_sender: Dict[str, List[Transaction]] = {}
        for tx in txs:
            by_sender.setdefault(tx.sender_id, []).append(tx)

        for sender_id, sender_txs in by_sender.items():
            near_threshold_txs = [
                tx for tx in sender_txs if 8000.0 <= tx.amount < 10000.0
            ]
            if len(near_threshold_txs) >= 3:
                total_val = sum(tx.amount for tx in near_threshold_txs)
                tx_ids = [tx.id for tx in near_threshold_txs]
                now_str = datetime.now(timezone.utc).isoformat()
                case_id = f"CASE-STRUC-{sender_id}"

                evidence = EvidenceItem(
                    id=f"EVD-STRUC-{sender_id}",
                    type="STRUCTURING_SMURFING",
                    description=(
                        f"Account {sender_id} executed {len(near_threshold_txs)} transactions "
                        f"totaling ${total_val:,.2f}, each narrowly under the $10,000 reporting threshold."
                    ),
                    severity=RiskTier.HIGH.value,
                    timestamp=near_threshold_txs[-1].timestamp,
                    details={
                        "transaction_count": len(near_threshold_txs),
                        "total_amount": total_val,
                        "amounts": [tx.amount for tx in near_threshold_txs],
                    },
                )

                alerts.append(
                    Alert(
                        id=f"ALT-STRUC-{sender_id}",
                        case_id=case_id,
                        customer_id=sender_id,
                        title=f"Suspected Structuring / Smurfing Pattern ({sender_id})",
                        summary=(
                            f"Multiple high-value transfers under $10,000 threshold initiated in short succession. "
                            f"Combined value: ${total_val:,.2f} across {len(near_threshold_txs)} transfers."
                        ),
                        risk_score=88.0,
                        priority=RiskTier.CRITICAL.value,
                        related_transaction_ids=tx_ids,
                        triggered_rules=["R101_STRUCTURING_SUB_THRESHOLD"],
                        evidence=[evidence],
                        limitations=[
                            "Legitimate series of contractor invoices not ruled out without invoice review.",
                            "Account may have received structured cash deposits prior to wire.",
                        ],
                        investigation_status=InvestigationStatus.NEW.value,
                        created_at=now_str,
                        updated_at=now_str,
                    )
                )

        return alerts

    def _rule_geo_velocity(self, txs: List[Transaction]) -> List[Alert]:
        alerts = []
        by_sender: Dict[str, List[Transaction]] = {}
        for tx in txs:
            if (
                tx.geographic_data
                and tx.geographic_data.latitude is not None
                and tx.geographic_data.longitude is not None
            ):
                by_sender.setdefault(tx.sender_id, []).append(tx)

        for sender_id, geo_txs in by_sender.items():
            if len(geo_txs) < 2:
                continue

            for i in range(len(geo_txs) - 1):
                tx1 = geo_txs[i]
                tx2 = geo_txs[i + 1]

                t1 = parse_iso(tx1.timestamp)
                t2 = parse_iso(tx2.timestamp)
                delta_hours = max((t2 - t1).total_seconds() / 3600.0, 0.001)

                g1 = tx1.geographic_data
                g2 = tx2.geographic_data
                dist_km = haversine_km(g1.latitude, g1.longitude, g2.latitude, g2.longitude)

                speed_kmh = dist_km / delta_hours

                if dist_km > 300.0 and speed_kmh > 800.0:
                    now_str = datetime.now(timezone.utc).isoformat()
                    case_id = f"CASE-GEO-{sender_id}"
                    loc1 = f"{g1.city or 'Lat/Lon ' + str(g1.latitude)}"
                    loc2 = f"{g2.city or 'Lat/Lon ' + str(g2.latitude)}"

                    evidence = EvidenceItem(
                        id=f"EVD-GEO-{tx1.id}-{tx2.id}",
                        type="GEO_VELOCITY",
                        description=(
                            f"Successive transactions from {loc1} and {loc2} separated by {dist_km:,.1f} km "
                            f"in {delta_hours:.2f} hours (calculated speed: {speed_kmh:,.0f} km/h), exceeding physical transit limits."
                        ),
                        severity=RiskTier.CRITICAL.value,
                        timestamp=tx2.timestamp,
                        details={
                            "distance_km": round(dist_km, 1),
                            "time_interval_hours": round(delta_hours, 2),
                            "calculated_speed_kmh": round(speed_kmh, 1),
                            "loc1": loc1,
                            "loc2": loc2,
                        },
                    )

                    alerts.append(
                        Alert(
                            id=f"ALT-GEO-{sender_id}",
                            case_id=case_id,
                            customer_id=sender_id,
                            title=f"Impossible Travel / Geographic Velocity Anomaly ({sender_id})",
                            summary=(
                                f"Transaction activity detected across widely distant coordinates ({loc1} to {loc2}) "
                                f"within {delta_hours:.1f} hours, strongly indicating credential compromise or remote session sharing."
                            ),
                            risk_score=94.0,
                            priority=RiskTier.CRITICAL.value,
                            related_transaction_ids=[tx1.id, tx2.id],
                            triggered_rules=["R202_IMPOSSIBLE_TRAVEL_SPEED"],
                            evidence=[evidence],
                            limitations=[
                                "VPN, corporate proxy, or satellite IP routing may misreport geolocation.",
                                "Authorized cardholder family member or secondary cardholder might be traveling legitimately.",
                            ],
                            investigation_status=InvestigationStatus.NEW.value,
                            created_at=now_str,
                            updated_at=now_str,
                        )
                    )
                    break

        return alerts

    def _rule_rapid_mule_dispersal(self, txs: List[Transaction]) -> List[Alert]:
        alerts = []
        accounts = set([tx.sender_id for tx in txs] + [tx.receiver_id for tx in txs])

        for acc in accounts:
            inbound = [tx for tx in txs if tx.receiver_id == acc]
            outbound = [tx for tx in txs if tx.sender_id == acc]

            if not inbound or not outbound:
                continue

            for in_tx in inbound:
                t_in = parse_iso(in_tx.timestamp)
                quick_out = [
                    out_tx for out_tx in outbound
                    if 0 <= (parse_iso(out_tx.timestamp) - t_in).total_seconds() <= 21600
                ]

                if len(quick_out) >= 2:
                    out_sum = sum(o.amount for o in quick_out)
                    distinct_receivers = set(o.receiver_id for o in quick_out)
                    if out_sum >= 0.75 * in_tx.amount and len(distinct_receivers) >= 2:
                        now_str = datetime.now(timezone.utc).isoformat()
                        case_id = f"CASE-MULE-{acc}"
                        rel_ids = [in_tx.id] + [o.id for o in quick_out]

                        evidence = EvidenceItem(
                            id=f"EVD-MULE-{acc}",
                            type="RAPID_DISPERSAL",
                            description=(
                                f"Account {acc} received ${in_tx.amount:,.2f} from {in_tx.sender_id} "
                                f"and rapidly dispersed ${out_sum:,.2f} ({(out_sum/in_tx.amount)*100:.1f}%) "
                                f"to {len(distinct_receivers)} downstream accounts within 6 hours."
                            ),
                            severity=RiskTier.CRITICAL.value,
                            timestamp=quick_out[-1].timestamp,
                            details={
                                "inbound_amount": in_tx.amount,
                                "dispersed_amount": out_sum,
                                "downstream_accounts": list(distinct_receivers),
                            },
                        )

                        alerts.append(
                            Alert(
                                id=f"ALT-MULE-{acc}",
                                case_id=case_id,
                                customer_id=acc,
                                title=f"Mule Account Suspected - Rapid Dispersal ({acc})",
                                summary=(
                                    f"Classic money mule pass-through behavior. Immediate outbound layering "
                                    f"of funds after inbound receipt."
                                ),
                                risk_score=91.0,
                                priority=RiskTier.CRITICAL.value,
                                related_transaction_ids=rel_ids,
                                triggered_rules=["R305_RAPID_PASS_THROUGH_MULE"],
                                evidence=[evidence],
                                limitations=[
                                    "Escrow, payroll distribution, or real estate closing accounts exhibit similar dispersal patterns legitimately.",
                                    "Customer may be an unwitting victim of an employment or romance scam.",
                                ],
                                investigation_status=InvestigationStatus.NEW.value,
                                created_at=now_str,
                                updated_at=now_str,
                            )
                        )
                        break

        return alerts

    def _rule_high_velocity_burst(self, txs: List[Transaction]) -> List[Alert]:
        alerts = []
        by_sender: Dict[str, List[Transaction]] = {}
        for tx in txs:
            by_sender.setdefault(tx.sender_id, []).append(tx)

        for sender_id, s_txs in by_sender.items():
            if len(s_txs) < 4:
                continue

            for i in range(len(s_txs) - 3):
                window = s_txs[i:i+4]
                t_first = parse_iso(window[0].timestamp)
                t_last = parse_iso(window[-1].timestamp)
                diff_minutes = (t_last - t_first).total_seconds() / 60.0

                if diff_minutes <= 15.0:
                    tot_amt = sum(w.amount for w in window)
                    now_str = datetime.now(timezone.utc).isoformat()
                    case_id = f"CASE-VELOCITY-{sender_id}"
                    
                    evidence = EvidenceItem(
                        id=f"EVD-VEL-{sender_id}",
                        type="VELOCITY_SURGE",
                        description=(
                            f"Account {sender_id} initiated 4 successive payments totaling ${tot_amt:,.2f} "
                            f"in {diff_minutes:.1f} minutes, indicating automated scripting or bot activity."
                        ),
                        severity=RiskTier.HIGH.value,
                        timestamp=window[-1].timestamp,
                        details={
                            "count": len(window),
                            "window_minutes": round(diff_minutes, 1),
                            "total_amount": tot_amt,
                        },
                    )

                    alerts.append(
                        Alert(
                            id=f"ALT-VEL-{sender_id}",
                            case_id=case_id,
                            customer_id=sender_id,
                            title=f"High Velocity Burst Anomaly ({sender_id})",
                            summary=(
                                f"Unusual burst of 4 outbound payments in under 15 minutes. "
                                f"Total burst volume: ${tot_amt:,.2f}."
                            ),
                            risk_score=78.0,
                            priority=RiskTier.HIGH.value,
                            related_transaction_ids=[w.id for w in window],
                            triggered_rules=["R401_VELOCITY_BURST_ANOMALY"],
                            evidence=[evidence],
                            limitations=[
                                "Batch supplier payment by small business operator.",
                                "E-commerce checkout retry after initial payment gateway glitch.",
                            ],
                            investigation_status=InvestigationStatus.NEW.value,
                            created_at=now_str,
                            updated_at=now_str,
                        )
                    )
                    break

        return alerts

    def _rule_high_risk_channel_anomaly(self, txs: List[Transaction]) -> List[Alert]:
        alerts = []
        for tx in txs:
            if tx.channel in ["CRYPTO_RAMP", "WIRE"] and tx.amount >= 15000.0:
                now_str = datetime.now(timezone.utc).isoformat()
                case_id = f"CASE-CHANNEL-{tx.id}"

                evidence = EvidenceItem(
                    id=f"EVD-CHAN-{tx.id}",
                    type="HIGH_RISK_CHANNEL",
                    description=(
                        f"High-value {tx.channel} transaction of ${tx.amount:,.2f} sent to {tx.receiver_id}. "
                        f"Irreversible settlement rail combined with high amount."
                    ),
                    severity=RiskTier.HIGH.value,
                    timestamp=tx.timestamp,
                    details={
                        "channel": tx.channel,
                        "amount": tx.amount,
                        "receiver": tx.receiver_id,
                    },
                )

                alerts.append(
                    Alert(
                        id=f"ALT-CHAN-{tx.id}",
                        case_id=case_id,
                        customer_id=tx.sender_id,
                        title=f"Large High-Risk Channel Outflow ({tx.channel})",
                        summary=(
                            f"${tx.amount:,.2f} transferred via irreversible {tx.channel} rail to {tx.receiver_id}."
                        ),
                        risk_score=74.0,
                        priority=RiskTier.HIGH.value,
                        related_transaction_ids=[tx.id],
                        triggered_rules=["R503_HIGH_VALUE_CRYPTO_WIRE_OUTFLOW"],
                        evidence=[evidence],
                        limitations=[
                            "Authorized crypto investment or high-value purchase.",
                            "Commercial property deposit or verified wealth transfer.",
                        ],
                        investigation_status=InvestigationStatus.NEW.value,
                        created_at=now_str,
                        updated_at=now_str,
                    )
                )

        return alerts


# Singleton default engine instance
default_detection_engine = DetectionEngine()
