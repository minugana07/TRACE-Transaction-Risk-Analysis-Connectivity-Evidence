# CONTRIBUTING TO TRACE

Welcome to **TRACE** (**T**ransaction **R**isk **A**nalysis, **C**onnectivity & **E**vidence).

> [!IMPORTANT]
> The product name is strictly **TRACE**. Never use any legacy working names in code, UI, or documentation.

---

## 1. Quickstart & Run Instructions

### Prerequisites
- Node.js (v18+ or v24 LTS)
- Python (3.11+ / 3.14)
- Git

### Backend Setup & Execution
The backend uses Python FastAPI with SQLite for persistent investigation notes and statuses.

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Or run with the venv python directly:
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# 3. Run automated tests
.\venv\Scripts\python.exe -m pytest tests/ -v
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive OpenAPI documentation at: `http://localhost:8000/docs`

### Frontend Setup & Execution
The frontend is built with React 19, TypeScript, Vite, Tailwind CSS, and Leaflet.

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server with API proxy
npm run dev
```
Frontend will be available at: `http://localhost:5173` (with `/api` automatically proxied to `http://localhost:8000`).

---

## 2. Team Module Ownership & Responsibilities

| Role | Primary Ownership | Key Deliverables & Touchpoints |
|---|---|---|
| **Member 1 (Lead Engineer)** | Architecture, Integration, Shared Contracts, App Shell, TRACE AI, Demo | Application shell, common API routers, database layer, Gemini integration with fallback, shared state, E2E tests |
| **Member 2 (Detection Engine)** | Fraud Detection Logic & Rule Engine | Fraud detection algorithms (`backend/app/detection/`), rule definitions, velocity & structuring detectors, priority scoring |
| **Member 3 (Analyst Experience)** | Investigate Workbench & Graph Visualizations | Analyst triage table, Risk Ripple connectivity graph, Hotspot map, evidence timeline, case inspection |
| **Member 4 (Consumer Safety)** | Protect Me Consumer Experience | Consumer-friendly safety view, plain-language alerts, rapid self-service actions (Lock card, confirm transaction) |

---

## 3. Integration Rules & Standards

### Rule A: Strict Shared Data Contracts
All modules **must** conform to the shared schemas defined in:
- Python / Pydantic: [`backend/app/models/contracts.py`](backend/app/models/contracts.py)
- TypeScript: [`frontend/src/types/trace.ts`](frontend/src/types/trace.ts)

Any changes to schemas must be proposed to Member 1 before modifying dependent modules.

### Rule B: Risk Score Definition
- Risk scores (`0.0` to `100.0`) denote **Investigation Priority**, **NOT** calibrated statistical probabilities of fraud.
- High risk score indicates an urgent need for human triage due to complex indicators (e.g. structuring, rapid dispersion).

### Rule C: Shared Case Context
Both **Protect Me** and **Investigate** modes consume the same underlying detection results, transactions, and case identifiers (`case_id`). A case opened in Protect Me mode references the exact same transactions and evidence items visible in Investigate mode.

### Rule D: TRACE AI Grounding & Guardrails
- TRACE AI operates strictly on empirical transaction records, triggered rules, and evidence provided by the backend.
- TRACE AI must distinguish **observations** (facts) from **inferences** (hypotheses).
- TRACE AI must **never** declare someone guilty, fabricate transactions, or invent fake locations.
- When `GEMINI_API_KEY` is unavailable or API requests fail, the deterministic fallback engine must seamlessly supply structured, factual summaries.

### Rule E: Hotspot Map & Graph Realism
- The Hotspot Map must only render actual geographic coordinates present in the transaction dataset. Never invent coordinates.
- Risk Ripple network graphs must reflect actual sender-to-receiver edges from the transaction records.

---

## 4. Repository Structure

```
TRACE/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI route handlers
│   │   ├── ai/              # Gemini AI client & deterministic fallback
│   │   ├── database.py      # SQLite store for notes and case status
│   │   ├── detection/       # Modular detection engine (Member 2 hook)
│   │   ├── models/          # Shared Pydantic data contracts
│   │   └── main.py          # FastAPI application entrypoint
│   ├── data/                # Synthetic datasets for testing and demo
│   ├── tests/               # Backend unit and integration test suite
│   └── venv/                # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Shell, Protect Me, Investigate, Map)
│   │   ├── services/        # API client and backend connectors
│   │   ├── types/           # Shared TypeScript contracts
│   │   ├── App.tsx          # Main application shell with mode toggle
│   │   └── main.tsx         # React root
│   └── vite.config.ts       # Vite configuration with /api proxy
├── CONTRIBUTING.md          # Architecture and collaboration guide
└── README.md                # Project introduction and overview
```
