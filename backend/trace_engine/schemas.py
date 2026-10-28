"""
TRACE Shared Contract Schemas.
Pydantic v2 data models for transactions, ingestion results, alerts, evidence, and detection results.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class TransactionStatus(str, Enum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class AlertPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DetectionMode(str, Enum):
    PROTECT_ME = "PROTECT_ME"
    INVESTIGATE = "INVESTIGATE"


class Transaction(BaseModel):
    """
    Standard normalized Transaction model for TRACE.
    Represents an ingested, validated transaction record.
    """
    model_config = ConfigDict(extra="ignore")

    transaction_id: str = Field(..., description="Unique transaction identifier")
    sender_id: str = Field(..., description="Account or entity identifier sending funds")
    recipient_id: str = Field(..., description="Account or entity identifier receiving funds")
    amount: float = Field(..., gt=0, description="Transaction amount (strictly positive)")
    currency: str = Field("USD", min_length=3, max_length=3, description="ISO-4217 3-letter currency code")
    timestamp: datetime = Field(..., description="UTC or timezone-aware transaction execution timestamp")
    status: TransactionStatus = Field(default=TransactionStatus.COMPLETED, description="Execution status")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Optional metadata (e.g. channel, notes)")

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        v = v.strip().upper()
        if len(v) != 3 or not v.isalpha():
            raise ValueError(f"Invalid currency code: {v}. Must be a 3-letter alphabetic code.")
        return v

    @field_validator("transaction_id", "sender_id", "recipient_id")
    @classmethod
    def validate_identifiers(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Identifier cannot be empty or whitespace only.")
        return v


class RejectedRow(BaseModel):
    """
    Detailed audit log for any rejected row during CSV ingestion.
    Guarantees no silent discard of data.
    """
    row_index: int = Field(..., description="Line or index number from original source file")
    raw_data: Dict[str, Any] = Field(..., description="Raw row values as parsed")
    error_type: str = Field(..., description="Category of validation failure")
    error_details: str = Field(..., description="Actionable explanation of why row was rejected")


class IngestionResult(BaseModel):
    """
    Result returned by transaction ingestion pipeline.
    """
    total_rows_read: int = Field(0, description="Total records parsed from source")
    valid_count: int = Field(0, description="Count of successfully validated transactions")
    rejected_count: int = Field(0, description="Count of invalid/rejected rows")
    duplicate_count: int = Field(0, description="Count of duplicate transaction IDs detected")
    transactions: List[Transaction] = Field(default_factory=list, description="Validated Transaction objects")
    rejected_rows: List[RejectedRow] = Field(default_factory=list, description="Detailed records of rejected rows")


class EvidenceItem(BaseModel):
    """
    Atomic supporting evidence item for an alert.
    Strictly separates observed facts from inferred risk.
    """
    rule_id: str = Field(..., description="Identifier of the rule generating this evidence")
    rule_name: str = Field(..., description="Human-readable rule name")
    observed_fact: str = Field(..., description="Factual, verifiable metrics observed in the data")
    inferred_risk: str = Field(..., description="Reasoning of why this factual pattern is suspicious")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Raw mathematical/quantitative metrics")


class Alert(BaseModel):
    """
    Explainable Alert contract for TRACE.
    Represents prioritized investigation recommendations.
    """
    alert_id: str = Field(..., description="Unique alert identifier")
    account_id: str = Field(..., description="Primary account or entity of interest")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Investigation priority score (0-100, not fraud probability)")
    priority: AlertPriority = Field(..., description="Priority classification: LOW, MEDIUM, HIGH, CRITICAL")
    related_transaction_ids: List[str] = Field(default_factory=list, description="Associated transaction IDs")
    triggered_rules: List[str] = Field(default_factory=list, description="Keys of triggered detection rules")
    evidence: List[EvidenceItem] = Field(default_factory=list, description="Itemized supporting evidence")
    limitations: List[str] = Field(default_factory=list, description="Missing data limitations or baseline gaps")
    explanation: str = Field(..., description="Comprehensive synthesis explaining why alert was generated")
    modes: List[DetectionMode] = Field(
        default_factory=lambda: [DetectionMode.PROTECT_ME, DetectionMode.INVESTIGATE],
        description="Target user views (Protect Me real-time vs Investigate forensic)"
    )
    recommended_action: str = Field(
        default="MANUAL_REVIEW",
        description="Recommended action: e.g. BLOCK_TEMPORARY, STEP_UP_AUTH, MANUAL_REVIEW, MONITOR"
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Alert creation timestamp")


class DetectionResult(BaseModel):
    """
    Overall result of detection engine analysis over a batch or stream of transactions.
    """
    total_transactions_analyzed: int = Field(0, description="Total valid transactions inspected")
    flagged_transactions_count: int = Field(0, description="Count of distinct transactions tied to alerts")
    alerts: List[Alert] = Field(default_factory=list, description="Generated prioritized alerts")
    analysis_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of analysis")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Runtime execution metadata")
