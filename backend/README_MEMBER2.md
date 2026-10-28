# TRACE Fraud Detection Engine & Data Processing (Member 2)

TRACE (**Transaction Risk Analysis, Connectivity & Evidence**) is a fraud detection and forensic intelligence platform.
This package contains the **Fraud Detection Engine** and **Data Processing Pipeline**, responsible for transaction ingestion, data normalization, deterministic rule evaluation, explainable evidence generation, and prioritized fraud alerting.

---

## 🌟 Key Capabilities

1. **Transaction Ingestion & Validation** (`trace_engine/ingestion.py`):
   - Fast CSV parsing with Pandas & Pydantic v2.
   - Robust column resolution supporting common header aliases (`from_account`, `txn_amount`, `datetime`, etc.).
   - Type conversions, currency normalization (ISO 4217), and UTC timestamp standardization.
   - **No Silent Discarding**: Every malformed or invalid row is recorded in `rejected_rows` with original row number, raw payload, and specific error diagnostic.
   - **Intelligent Deduplication**: Rejects accidental double-submissions with identical transaction IDs (`DUPLICATE_TRANSACTION_ID`), while preserving legitimate recurring transfers of equal amounts with distinct IDs.

2. **Explainable Detection Engine** (`trace_engine/engine.py` & `trace_engine/rules/`):
   - **Unusual Amount Relative to History**: Statistical baseline (mean, median, standard deviation, z-score) with explicit limitation reporting for accounts with sparse history.
   - **Rapid Velocity Bursts**: Detects rapid successive transfers within configurable sliding windows (e.g. $\ge 3$ transfers in 15 mins).
   - **Repeated Amounts (Structuring / Smurfing)**: Identifies near-identical amounts split within a window, including transactions near regulatory reporting thresholds (\$8,000–\$9,999.99).
   - **Sudden Frequency Surges**: Compares short-term transaction cadence to long-term baseline rates, including dormant account reactivation detection.
   - **Connected Chains & Fan-Out**: Graph-aware pattern detection including 1-to-many fan-out dispersion and multi-hop pass-through layering sequences (A $\rightarrow$ B $\rightarrow$ C).

3. **Evidence-Based Alert Generation**:
   - Scores investigation priority from **0 to 100** (not a raw fraud probability).
   - Distinct separation between **Observed Facts** (verifiable data points) and **Inferred Risk** (analytical reasoning).
   - Transparent missing-data limitations (e.g., limited baseline, missing device metadata).
   - Priority banding: `LOW` (0–39), `MEDIUM` (40–69), `HIGH` (70–89), `CRITICAL` (90–100).
   - Dual-view routing: `PROTECT_ME` (immediate blocking/intervention) and `INVESTIGATE` (forensic deep dive).

4. **Integration with Member 1's Backend**:
   - Zero competing server: Exports direct Python functions AND a drop-in FastAPI router (`detection_router`).
   - Member 1 can simply mount `app.include_router(detection_router)` in their FastAPI application.

---

## 📁 Repository Layout

```
/Users/sarayum/.gemini/antigravity/scratch/trace/
├── trace_engine/
│   ├── __init__.py               # Top-level API exports
│   ├── schemas.py                # Pydantic v2 models (Transaction, Alert, IngestionResult, etc.)
│   ├── config.py                 # Configurable detection thresholds and rule toggles
│   ├── ingestion.py              # CSV parsing, column aliasing, validation, duplicate auditing
│   ├── rules/
│   │   ├── __init__.py           # Rule registry
│   │   ├── base.py               # Abstract BaseRule interface
│   │   ├── unusual_amount.py     # Outliers relative to account history
│   │   ├── rapid_velocity.py     # Burst transfers in short sliding window
│   │   ├── repeated_amounts.py   # Structuring / smurfing detection
│   │   ├── frequency_spike.py    # Cadence surges and dormant reactivation
│   │   └── connected_chains.py   # Multi-recipient fan-out & pass-through layering
│   ├── engine.py                 # Core FraudEngine & compound alert aggregation
│   └── integration.py            # High-level Python service functions & FastAPI APIRouter
├── data/
│   ├── sample_valid.csv          # Realistic clean baseline transactions
│   ├── sample_suspicious.csv     # Scenarios: outlier, velocity burst, structuring, fan-out, chain
│   ├── sample_malformed.csv      # Audit test dataset with corrupt/invalid/duplicate rows
│   └── generate_sample_data.py   # Reproducible synthetic data generator
├── tests/
│   ├── __init__.py
│   ├── test_ingestion.py         # CSV parsing, duplicate handling, schema validation tests
│   ├── test_rules.py             # Unit tests for each deterministic rule & edge cases
│   ├── test_engine.py            # End-to-end tests, priority score boundaries, consolidation
│   └── test_integration.py       # FastAPI router tests and high-level service function tests
├── README.md                     # This documentation
└── INTEGRATION.md                # Integration contract guide for Member 1
```

---

## 🚀 Quickstart & Usage

### 1. Ingest CSV & Detect Fraud in Python

```python
from trace_engine import ingest_and_detect, DetectionMode

# Ingest and detect in a single call
ingestion_res, detection_res = ingest_and_detect(
    "data/sample_suspicious.csv",
    mode=DetectionMode.PROTECT_ME  # or DetectionMode.INVESTIGATE
)

print(f"Total parsed: {ingestion_res.total_rows_read}")
print(f"Valid transactions: {ingestion_res.valid_count}")
print(f"Rejected rows: {ingestion_res.rejected_count}")
print(f"Total alerts: {len(detection_res.alerts)}")

for alert in detection_res.alerts:
    print(f"\n[ALERT] {alert.alert_id} | Priority: {alert.priority.value} | Score: {alert.risk_score}")
    print(f"Account: {alert.account_id}")
    print(f"Explanation: {alert.explanation}")
    for ev in alert.evidence:
        print(f"  - FACT: {ev.observed_fact}")
        print(f"  - RISK: {ev.inferred_risk}")
    if alert.limitations:
        print(f"  - LIMITATIONS: {', '.join(alert.limitations)}")
```

### 2. Plug into Member 1's FastAPI Backend

```python
from fastapi import FastAPI
from trace_engine import detection_router

app = FastAPI(title="TRACE Backend")

# Mount detection endpoints seamlessly
app.include_router(detection_router)

# Available endpoints:
# POST /trace/detection/detect
# POST /trace/detection/ingest-csv
# POST /trace/detection/analyze-csv
# GET  /trace/detection/rules
```

---

## 🧪 Running Automated Tests

Run the complete test suite using pytest:

```bash
cd /Users/sarayum/.gemini/antigravity/scratch/trace
python3 -m pytest -v
```

All 24 automated unit and integration tests will execute:
- CSV ingestion, column alias mapping, and error reporting.
- Duplicate detection vs legitimate recurring transfers.
- Individual rule accuracy (outliers, velocity, structuring, frequency, chains).
- 0–100 score bounds and priority band assignments.
- FastAPI endpoint request/response contracts.
