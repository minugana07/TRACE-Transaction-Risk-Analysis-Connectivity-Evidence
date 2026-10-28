"""
TRACE Fraud Detection Engine & Data Processing Package.
"""

from trace_engine.config import (
    ConnectedChainsConfig,
    DetectionConfig,
    FrequencySpikeConfig,
    RapidVelocityConfig,
    RepeatedAmountsConfig,
    UnusualAmountConfig,
)
from trace_engine.engine import FraudEngine
from trace_engine.ingestion import ingest_transactions_csv
from trace_engine.integration import (
    detect_fraud,
    detection_router,
    filter_alerts_for_mode,
    ingest_and_detect,
    ingest_csv,
)
from trace_engine.rules import (
    BaseRule,
    ConnectedChainsRule,
    FrequencySpikeRule,
    RapidVelocityRule,
    RepeatedAmountsRule,
    UnusualAmountRule,
    get_default_rules,
)
from trace_engine.schemas import (
    Alert,
    AlertPriority,
    DetectionMode,
    DetectionResult,
    EvidenceItem,
    IngestionResult,
    RejectedRow,
    Transaction,
    TransactionStatus,
)

__all__ = [
    # Schemas
    "Transaction",
    "TransactionStatus",
    "Alert",
    "AlertPriority",
    "EvidenceItem",
    "DetectionMode",
    "DetectionResult",
    "IngestionResult",
    "RejectedRow",
    # Engine & Config
    "FraudEngine",
    "DetectionConfig",
    "UnusualAmountConfig",
    "RapidVelocityConfig",
    "RepeatedAmountsConfig",
    "FrequencySpikeConfig",
    "ConnectedChainsConfig",
    # Ingestion & Integration
    "ingest_transactions_csv",
    "ingest_csv",
    "detect_fraud",
    "ingest_and_detect",
    "filter_alerts_for_mode",
    "detection_router",
    # Rules
    "BaseRule",
    "UnusualAmountRule",
    "RapidVelocityRule",
    "RepeatedAmountsRule",
    "FrequencySpikeRule",
    "ConnectedChainsRule",
    "get_default_rules",
]
