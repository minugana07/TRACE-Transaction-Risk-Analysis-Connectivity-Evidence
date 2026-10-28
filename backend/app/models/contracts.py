from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChannelType(str, Enum):
    WIRE = "WIRE"
    ONLINE = "ONLINE"
    MOBILE = "MOBILE"
    ATM = "ATM"
    CRYPTO_RAMP = "CRYPTO_RAMP"
    POS = "POS"
    ACH = "ACH"


class TransactionStatus(str, Enum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    FLAGGED = "FLAGGED"


class RiskTier(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InvestigationStatus(str, Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    ESCALATED = "ESCALATED"
    RESOLVED_BENIGN = "RESOLVED_BENIGN"
    RESOLVED_FRAUD = "RESOLVED_FRAUD"
    CLOSED = "CLOSED"


class GeographicData(BaseModel):
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ip_address: Optional[str] = None
    device_id: Optional[str] = None


class Transaction(BaseModel):
    id: str = Field(..., description="Unique transaction identifier, e.g. TX-1001")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    sender_id: str = Field(..., description="Sender account or entity identifier")
    receiver_id: str = Field(..., description="Receiver account or entity identifier")
    amount: float = Field(..., ge=0, description="Transaction amount")
    currency: str = Field("USD", description="ISO 4217 currency code")
    channel: str = Field(ChannelType.ONLINE.value, description="Payment channel or rail")
    status: str = Field(TransactionStatus.COMPLETED.value, description="Transaction status")
    geographic_data: Optional[GeographicData] = Field(None, description="Optional geo coordinates and device metadata")
    description: Optional[str] = Field(None, description="Transaction reference or memo")
    risk_score: Optional[float] = Field(None, ge=0, le=100, description="Optional transaction-level risk score (0-100)")


class Account(BaseModel):
    id: str = Field(..., description="Unique account identifier, e.g. ACC-101")
    account_number: str = Field(..., description="Masked or full account number")
    holder_name: str = Field(..., description="Account holder legal or business name")
    risk_tier: str = Field(RiskTier.LOW.value, description="Current account risk tier")
    account_type: str = Field("INDIVIDUAL", description="INDIVIDUAL, BUSINESS, MERCHANT, or MULE_SUSPECT")
    created_at: str = Field(..., description="ISO 8601 UTC creation date")


class EvidenceItem(BaseModel):
    id: str = Field(..., description="Unique evidence identifier, e.g. EVD-01")
    type: str = Field(..., description="Evidence category, e.g. VELOCITY_SURGE, GEO_VELOCITY, RAPID_DISPERSAL")
    description: str = Field(..., description="Objective, fact-grounded observation of transaction behavior")
    severity: str = Field(RiskTier.MEDIUM.value, description="Evidence severity: LOW, MEDIUM, HIGH, CRITICAL")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters and thresholds observed")


class Alert(BaseModel):
    id: str = Field(..., description="Unique alert identifier, e.g. ALT-2026-001")
    case_id: str = Field(..., description="Shared case identifier, e.g. CASE-2026-001")
    customer_id: str = Field(..., description="Account or customer primarily affected / subject")
    title: str = Field(..., description="Alert headline summary")
    summary: str = Field(..., description="Detailed analytical summary")
    risk_score: float = Field(
        ...,
        ge=0,
        le=100,
        description="Investigation priority score (0-100). NOT calibrated probability of fraud."
    )
    priority: str = Field(RiskTier.MEDIUM.value, description="Investigation priority: LOW, MEDIUM, HIGH, CRITICAL")
    related_transaction_ids: List[str] = Field(default_factory=list, description="IDs of transactions tied to this case")
    triggered_rules: List[str] = Field(default_factory=list, description="Identifiers or names of triggered detection rules")
    evidence: List[EvidenceItem] = Field(default_factory=list, description="Concrete evidence items backing this alert")
    limitations: List[str] = Field(
        default_factory=list,
        description="Explicit limitations and potential benign explanations (e.g. payroll, high net worth transfer)"
    )
    investigation_status: str = Field(
        InvestigationStatus.NEW.value,
        description="Investigation status: NEW, IN_PROGRESS, ESCALATED, RESOLVED_BENIGN, RESOLVED_FRAUD, CLOSED"
    )
    created_at: str = Field(..., description="ISO 8601 UTC timestamp")
    updated_at: str = Field(..., description="ISO 8601 UTC timestamp")


class DetectionResult(BaseModel):
    summary: str = Field(..., description="Detection execution overview")
    alerts: List[Alert] = Field(default_factory=list, description="Alerts produced by the detection engine")
    transaction_count: int = Field(..., description="Total transactions evaluated")
    flagged_count: int = Field(..., description="Number of flagged transactions")
    execution_time_ms: float = Field(..., description="Engine run duration in milliseconds")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Auxiliary run stats and rule counts")


class InvestigationNote(BaseModel):
    id: str = Field(..., description="Unique note identifier, e.g. NOTE-001")
    case_id: str = Field(..., description="Case identifier")
    alert_id: Optional[str] = Field(None, description="Optional specific alert identifier")
    author: str = Field(..., description="Author of the note, e.g. Analyst or Consumer")
    note: str = Field(..., description="Investigation findings, hypotheses, or consumer clarification")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    status_change: Optional[str] = Field(None, description="Optional status change associated with this note")


class InvestigationNoteCreate(BaseModel):
    case_id: str
    alert_id: Optional[str] = None
    author: str = "Lead Analyst"
    note: str
    status_change: Optional[str] = None


class CaseStatusUpdate(BaseModel):
    case_id: str
    status: str
    author: str = "Lead Analyst"
    reason: Optional[str] = None


class AIExplanationRequest(BaseModel):
    case_id: str
    alert_id: Optional[str] = None
    mode: str = Field("investigate", description="'investigate' for fraud analysts, 'protect_me' for consumers")
    user_prompt: Optional[str] = None


class AIExplanationResponse(BaseModel):
    case_id: str
    mode: str
    headline: str
    observations: List[str] = Field(
        default_factory=list,
        description="Strictly observed empirical transaction facts"
    )
    inferences: List[str] = Field(
        default_factory=list,
        description="Analytical inferences and hypotheses clearly distinguished from facts"
    )
    evidence_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    limitations: List[str] = Field(
        default_factory=list,
        description="Missing data, ambiguity, or alternative benign explanations"
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Prudent, non-accusatory next steps"
    )
    engine_used: str = Field("TRACE Gemini AI", description="AI model or deterministic fallback identifier")
    disclaimer: str = Field(
        "TRACE AI provides evidence summarization and decision-support. It does not declare guilt or replace human judgment.",
        description="Compliance and safety disclaimer"
    )
