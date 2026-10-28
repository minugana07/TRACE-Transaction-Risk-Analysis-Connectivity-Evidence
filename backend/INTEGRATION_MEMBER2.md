# TRACE Integration Guide: Member 1 & Member 2 Coordination

This document specifies the exact contract schemas, service interfaces, and integration points provided by **Member 2 (Fraud Detection Engine & Data Processing)** for **Member 1 (TRACE Core Application & Backend)**.

---

## 1. Principles of Integration

1. **Single Application Backend**: Member 2 does not spin up an independent HTTP server. All endpoints are packaged as a FastAPI `APIRouter` (`detection_router`) or direct Python functions that Member 1 can include into the shared TRACE FastAPI application.
2. **Branding Integrity**: The product name is strictly **TRACE**. The deprecated name "FraudLens" is never used.
3. **No Silent Drops**: Any row rejected during ingestion is returned with detailed diagnostics so Member 1's UI can present informative validation feedback to the user.
4. **Explainable Priority Scores**: Risk scores range strictly from 0 to 100 representing **investigation priority**, not calibrated statistical fraud probabilities. Evidence items explicitly separate observed facts from inferred risk.

---

## 2. Shared Data Models (`trace_engine/schemas.py`)

Member 1 can directly import these Pydantic v2 models:

```python
from trace_engine.schemas import (
    Transaction,
    TransactionStatus,
    Alert,
    AlertPriority,
    EvidenceItem,
    DetectionMode,
    DetectionResult,
    IngestionResult,
    RejectedRow,
)
```

### `Transaction`
Normalized transaction model used across TRACE:
```python
class Transaction(BaseModel):
    transaction_id: str          # Unique ID (e.g., "TXN_1001")
    sender_id: str               # Originating account ID (e.g., "ACC_001")
    recipient_id: str            # Beneficiary account ID (e.g., "ACC_002")
    amount: float                # Strictly positive float/decimal
    currency: str = "USD"        # ISO 4217 3-letter currency code (e.g., "USD", "EUR")
    timestamp: datetime          # Timezone-aware UTC timestamp
    status: TransactionStatus    # "COMPLETED", "PENDING", "FAILED", "CANCELLED"
    metadata: Dict[str, Any]     # Optional tags (e.g., {"channel": "mobile", "category": "retail"})
```

### `IngestionResult` & `RejectedRow`
Guarantees full auditability when uploading CSV transaction files:
```python
class RejectedRow(BaseModel):
    row_index: int               # 1-based index from CSV
    raw_data: Dict[str, Any]     # Original row key-values
    error_type: str              # Category (e.g. "INVALID_AMOUNT", "DUPLICATE_TRANSACTION_ID")
    error_details: str           # User-facing explanation of failure

class IngestionResult(BaseModel):
    total_rows_read: int
    valid_count: int
    rejected_count: int
    duplicate_count: int
    transactions: List[Transaction]
    rejected_rows: List[RejectedRow]
```

### `Alert` & `EvidenceItem`
Explainable detection output:
```python
class EvidenceItem(BaseModel):
    rule_id: str                 # Identifier of triggered rule
    rule_name: str               # Human-readable title
    observed_fact: str           # Objective, verifiable observation (e.g. "Sent 4 transfers of $9,500 in 3 hours")
    inferred_risk: str           # Risk hypothesis (e.g. "Matches structuring/smurfing pattern below $10,000 threshold")
    metrics: Dict[str, Any]      # Exact mathematical metrics (e.g. {"multiplier": 12.5, "z_score": 4.1})

class Alert(BaseModel):
    alert_id: str                # Unique alert ID (e.g. "ALT-VEL-9A3F10")
    account_id: str              # Account under investigation
    risk_score: float            # 0.0 - 100.0 investigation priority
    priority: AlertPriority      # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    related_transaction_ids: List[str]
    triggered_rules: List[str]
    evidence: List[EvidenceItem]
    limitations: List[str]       # Gaps in data (e.g. "Limited account history (1 prior transaction)")
    explanation: str             # Synthesized narrative summary
    modes: List[DetectionMode]   # ["PROTECT_ME", "INVESTIGATE"] or ["INVESTIGATE"]
    recommended_action: str      # "BLOCK_TEMPORARY", "STEP_UP_AUTH", "MANUAL_REVIEW", "MONITOR"
    timestamp: datetime
```

---

## 3. Integration Options for Member 1

### Option A: Direct Python Service Functions (Recommended for Internal Workflows)

```python
from trace_engine import (
    ingest_csv,
    detect_fraud,
    ingest_and_detect,
    DetectionMode,
    DetectionConfig,
)

# 1. Ingest CSV file or buffer
ingestion_result = ingest_csv("path/to/transactions.csv")
if ingestion_result.rejected_rows:
    print(f"Warning: {len(ingestion_result.rejected_rows)} rows were rejected.")

# 2. Run detection on validated transactions
detection_result = detect_fraud(ingestion_result.transactions)

# 3. Filter for 'Protect Me' (real-time prevention) view
protect_alerts = [a for a in detection_result.alerts if DetectionMode.PROTECT_ME in a.modes]

# 4. Filter for 'Investigate' (forensic intelligence) view
investigate_alerts = [a for a in detection_result.alerts if DetectionMode.INVESTIGATE in a.modes]
```

### Option B: FastAPI Router Mount (Recommended for Web API)

In Member 1's main FastAPI application file:

```python
from fastapi import FastAPI
from trace_engine import detection_router

app = FastAPI(title="TRACE")

# Mount detection endpoints
app.include_router(detection_router)
```

#### Available Endpoints:

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/trace/detection/detect` | Accepts `List[Transaction]` (JSON) and optional `mode` query param. Returns `DetectionResult`. |
| `POST` | `/trace/detection/ingest-csv` | Accepts multipart CSV upload. Returns `IngestionResult` with validated transactions and rejected row audits. |
| `POST` | `/trace/detection/analyze-csv` | Ingests CSV and returns both `ingestion` and `detection` results in a single call. |
| `GET` | `/trace/detection/rules` | Returns all registered rules, descriptions, and default engine configuration. |

---

## 4. Protect Me vs Investigate Modes

TRACE supports two operational modes:

1. **Protect Me Mode**:
   - Focuses on real-time intervention and immediate account defense.
   - Highlights high-urgency alerts (`CRITICAL` and `HIGH` priority) such as account takeover velocity bursts and drastic outlier fund drains.
   - Recommends direct interventions: `BLOCK_TEMPORARY` or `STEP_UP_AUTH`.

2. **Investigate Mode**:
   - Designed for AML analysts, forensic investigators, and compliance officers.
   - Displays all flagged behaviors, including multi-account pass-through layering (`ORIGIN` $\rightarrow$ `INTERMEDIARY` $\rightarrow$ `DESTINATION`), fan-out dispersion, structuring near regulatory limits, and exploratory behavioral shifts.
   - Provides full evidence metrics and notes data limitations.

---

## 5. Schema Alignment & Change Coordination

- If Member 1's published contracts differ in minor field names, Member 2's `trace_engine/ingestion.py` column resolver can adapt aliases without breaking changes.
- To request new rules or threshold tunings, adjust `DetectionConfig` or add a new `BaseRule` subclass to `trace_engine/rules/`.
