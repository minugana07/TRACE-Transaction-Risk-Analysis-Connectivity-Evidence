"""
TRACE Integration Module.
Provides high-level Python detection service interfaces and a plug-and-play FastAPI router
for Member 1's backend application.
"""

import io
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from trace_engine.config import DetectionConfig
from trace_engine.engine import FraudEngine
from trace_engine.ingestion import ingest_transactions_csv
from trace_engine.schemas import (
    Alert,
    DetectionMode,
    DetectionResult,
    IngestionResult,
    Transaction,
)

# ---------------------------------------------------------------------------
# High-Level Python Service Functions
# ---------------------------------------------------------------------------

def detect_fraud(
    transactions: List[Transaction],
    config: Optional[DetectionConfig] = None,
    aggregate_by_account: bool = True,
) -> DetectionResult:
    """
    Standard entry-point function for fraud detection in TRACE.

    Args:
        transactions: List of validated Transaction models.
        config: Optional DetectionConfig overrides.
        aggregate_by_account: Whether to merge multi-rule triggers on the same account.

    Returns:
        DetectionResult containing prioritized alerts and audit stats.
    """
    engine = FraudEngine(config=config)
    return engine.detect(transactions, aggregate_by_account=aggregate_by_account)


def ingest_csv(
    source: Union[str, Path, io.TextIOBase, io.BytesIO, bytes],
) -> IngestionResult:
    """
    Standard entry-point function for CSV ingestion in TRACE.
    Validates rows, reports rejected lines, and deduplicates without losing legitimate transfers.
    """
    return ingest_transactions_csv(source)


def ingest_and_detect(
    source: Union[str, Path, io.TextIOBase, io.BytesIO, bytes],
    config: Optional[DetectionConfig] = None,
    mode: Optional[DetectionMode] = None,
) -> Tuple[IngestionResult, DetectionResult]:
    """
    Convenience pipeline: Parses CSV, validates transactions, runs detection,
    and optionally filters alerts by mode (Protect Me vs Investigate).

    Returns:
        Tuple of (IngestionResult, DetectionResult).
    """
    ingestion = ingest_csv(source)
    detection = detect_fraud(ingestion.transactions, config=config)

    if mode is not None:
        detection.alerts = [a for a in detection.alerts if mode in a.modes]
        detection.flagged_transactions_count = len({
            tid for a in detection.alerts for tid in a.related_transaction_ids
        })

    return ingestion, detection


def filter_alerts_for_mode(alerts: List[Alert], mode: DetectionMode) -> List[Alert]:
    """
    Filters alerts by user view mode:
    - PROTECT_ME: Immediate end-user / frontline blocking & warnings.
    - INVESTIGATE: Comprehensive forensic and network connectivity deep-dive.
    """
    return [a for a in alerts if mode in a.modes]


# ---------------------------------------------------------------------------
# Plug-and-Play FastAPI APIRouter for Member 1
# ---------------------------------------------------------------------------

detection_router = APIRouter(prefix="/trace/detection", tags=["TRACE Detection Engine"])


@detection_router.post("/detect", response_model=DetectionResult)
def api_detect_transactions(
    transactions: List[Transaction],
    mode: Optional[DetectionMode] = Query(None, description="Filter alerts by view mode (PROTECT_ME or INVESTIGATE)"),
) -> DetectionResult:
    """
    Analyzes a batch of normalized transactions and returns prioritized fraud alerts.
    """
    result = detect_fraud(transactions)
    if mode is not None:
        result.alerts = filter_alerts_for_mode(result.alerts, mode)
        result.flagged_transactions_count = len({
            tid for a in result.alerts for tid in a.related_transaction_ids
        })
    return result


@detection_router.post("/ingest-csv", response_model=IngestionResult)
async def api_ingest_csv(
    file: UploadFile = File(..., description="CSV file of transactions"),
) -> IngestionResult:
    """
    Validates and normalizes an uploaded CSV file of transactions.
    Provides clear error breakdowns for any rejected rows.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    return ingest_csv(content)


@detection_router.post("/analyze-csv")
async def api_analyze_csv(
    file: UploadFile = File(..., description="CSV file of transactions"),
    mode: Optional[DetectionMode] = Query(None, description="Optional view mode filter"),
) -> Dict[str, Any]:
    """
    End-to-end endpoint: Ingests CSV and executes fraud detection in one call.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    ingestion, detection = ingest_and_detect(content, mode=mode)
    return {
        "ingestion": ingestion.model_dump(),
        "detection": detection.model_dump(),
    }


@detection_router.get("/rules")
def api_list_rules() -> Dict[str, Any]:
    """
    Returns registered detection rules and active engine configuration.
    """
    engine = FraudEngine()
    return {
        "engine_version": "TRACE-2.0",
        "rules": [
            {
                "rule_id": r.rule_id,
                "rule_name": r.rule_name,
                "description": r.description,
            }
            for r in engine.rules
        ],
        "default_config": engine.config.model_dump(),
    }
