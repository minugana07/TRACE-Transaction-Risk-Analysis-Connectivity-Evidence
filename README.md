# TRACE: Transaction Risk Analysis, Connectivity & Evidence

> **TRACE** is an end-to-end, evidence-grounded fraud detection and digital safety platform unifying deep forensic investigation for fraud analysts with accessible self-defense tools for consumers.

---

## Architecture Overview

```
                                      ┌─────────────────────────────────────────────────────────┐
                                      │                     TRACE Platform                      │
                                      └────────────────────────────┬────────────────────────────┘
                                                                   │
                                  ┌────────────────────────────────┴────────────────────────────────┐
                                  ▼                                                                 ▼
               ┌──────────────────────────────────────┐                         ┌──────────────────────────────────────┐
               │         Investigate Mode             │                         │          Protect Me Mode             │
               │        (Fraud Analysts)              │                         │       (Everyday Consumers)           │
               ├──────────────────────────────────────┤                         ├──────────────────────────────────────┤
               │ • Alert Queue & Triage Table         │                         │ • Consumer Security Portal           │
               │ • Risk Ripple Network Graph          │                         │ • CallShield Phone Lookup            │
               │ • Hotspot Geographic Clustering      │                         │ • ScamShield Interactive Defense     │
               │ • Evidence Timeline & Notes Audit    │                         │ • Safety Loop Evidence Matcher       │
               │ • TRACE AI Intelligence Brief        │                         │ • Accessible TTS & High-Contrast     │
               └──────────────────┬───────────────────┘                         └──────────────────┬───────────────────┘
                                  │                                                                │
                                  └────────────────────────────────┬───────────────────────────────┘
                                                                   ▼
                                  ┌─────────────────────────────────────────────────────────────────┐
                                  │               Unified FastAPI Backend & Shared SQLite           │
                                  │   Shared Contracts: Transaction, Alert, Evidence, Case Notes    │
                                  └────────────────────────────────┬────────────────────────────────┘
                                                                   │
                                       ┌───────────────────────────┴───────────────────────────┐
                                       ▼                                                       ▼
                    ┌─────────────────────────────────────┐               ┌─────────────────────────────────────┐
                    │     Member 2 Detection Engine       │               │       TRACE AI Gemini Explainer     │
                    │ • Velocity Surges                   │               │ • Observations vs Inferences        │
                    │ • Structuring / Smurfing            │               │ • Objective Evidence Grounding      │
                    │ • Frequency Spikes                  │               │ • Missing Info & Limitations        │
                    │ • Rapid Fan-Out & Pass-Through      │               │ • Deterministic Fallback Mode       │
                    └─────────────────────────────────────┘               └─────────────────────────────────────┘
```

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Lucide Icons
- **Backend:** Python 3.11+ / 3.14, FastAPI, Pydantic v2, Uvicorn, Pandas, NumPy
- **Persistence:** SQLite for case statuses, notes, and audit trails
- **AI Engine:** Google Gemini API with deterministic factual fallback
- **Testing:** Pytest (Backend, 34 tests) & Node.js Native Test Runner (Investigate, 22 tests)

---

## Team Modules & Ownership

| Member | Focus | Key Deliverables |
|---|---|---|
| **Member 1** | Architecture & Lead Integration | Shared data contracts, FastAPI backend routers, application shell, TRACE AI integration with deterministic fallback, end-to-end integration |
| **Member 2** | Fraud Detection Logic | `FraudEngine` rule algorithms, velocity surges, structuring detection, transaction ingestion pipeline, priority score calculation |
| **Member 3** | Investigate Experience | Deep-dive workbench, `RiskRippleGraphModel` directed transaction graph, `GeoAggregator` geographic cluster map, case immutability store |
| **Member 4** | Protect Me Experience | `ProtectMeContainer`, CallShield caller verification, ScamShield interactive evasion roleplay, Safety Loop evidence matcher, Accessibility toolbar |

---

## Quickstart & Local Setup

### 1. Prerequisites
- **Node.js:** v18+ (tested on v24 LTS)
- **Python:** v3.11+ (tested on Python 3.14)
- **Git**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```
- API root: `http://localhost:8000`
- Interactive OpenAPI documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Web Application: `http://localhost:5173` (requests to `/api` are automatically proxied to `http://localhost:8000`)

---

## Environment Variables & AI Configuration

The application is fully functional **with or without** an external AI API key.

| Variable | Description | Default / Fallback |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for dynamic AI explanations | If missing or invalid, TRACE automatically engages the **TRACE Deterministic Grounded Engine** to provide evidence-grounded observations and limitations without errors. |

To use Google Gemini:
```powershell
# Windows PowerShell
$env:GEMINI_API_KEY = "your-api-key-here"

# Linux / macOS
export GEMINI_API_KEY="your-api-key-here"
```

> [!NOTE]
> All secrets and API keys are strictly kept out of frontend bundles and Git commits.

---

## Verification & Automated Test Suites

### Backend Test Suite (34/34 Passing)
```bash
cd backend
python -m pytest tests/ -v
```
Verifies:
- Health check and synthetic transaction loading
- Detection engine rule triggers (velocity, structuring, spikes, pass-through)
- Shared case endpoints and SQLite persistence
- TRACE AI explanation generation (both Investigate and Protect Me modes)
- CSV upload, parsing, and column alias mapping
- Member 3 and Member 4 API compatibility bridges

### Investigate Module Test Suite (22/22 Passing)
```bash
node --test --experimental-strip-types frontend/src/modules/investigate/tests/run-all-tests.ts
```
Verifies:
- Alert queue triage and sorting
- Risk Ripple directed graph generation and cycle detection
- Geographic hotspot aggregation and empty location handling
- Case status transitions and transaction immutability guarantees
- Edge-case and malformed data handling

### Frontend Production Build
```bash
cd frontend
npm run build
```
Verifies TypeScript compilation and bundle generation (`dist/index.html`).

---

## Key Principles & Guardrails

1. **Risk Scores Represent Investigation Priority:** Scores (`0` to `100`) reflect triage urgency, **not** calibrated legal probabilities of fraud.
2. **Shared Case Context:** A case opened in Protect Me mode references the exact same transactions, evidence, and SQLite notes as in Investigate mode.
3. **Evidence Grounding:** TRACE AI strictly separates observations (facts) from inferences (hypotheses) and explicitly states dataset limitations.
4. **Zero Fabrication:** The hotspot map never invents locations; the connectivity graph never invents accounts or transactions.
5. **Guidance and Demo Actions:** Consumer protective actions (e.g. "Lock Account") are clearly presented with transparent feedback explaining simulated and production behaviors.
