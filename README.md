# TRACE: Transaction Risk Analysis, Connectivity & Evidence

**TRACE** is a next-generation fraud detection, case investigation, and digital safety platform designed to bridge the gap between financial fraud analysts and protected consumers.

---

## Key Capabilities

### 🛡️ Protect Me (Consumer Safety Mode)
- **Reassuring, Plain-Language Safety Portal**: Explains flagged transactions in non-jargony, clear terms without causing undue alarm.
- **Self-Service Verification**: Allows consumers to quickly confirm legitimate transactions ("Yes, I authorized this"), immediately freeze compromised accounts ("No! Freeze My Account"), or request an expedited callback.
- **Empirical Location Awareness**: Maps real transaction locations so users can immediately spot unfamiliar cities or overseas attempts.

### 🔍 Investigate (Fraud Analyst Workbench)
- **Investigation Priority Queue**: Triage cases ranked by empirical risk score (indicating investigation priority, NOT calibrated probabilities of fraud).
- **Risk Ripple Connectivity Graph**: Visualizes multi-hop fund flows, pass-through mule intermediaries, and downstream dispersal hubs using actual transaction edges.
- **Hotspot Map (Leaflet)**: Plots verified transaction coordinates with interactive inspector popups. Strictly uses dataset coordinates — never invents or synthesizes fake locations.
- **TRACE AI Intelligence Brief**: Evidence-grounded analysis powered by Google Gemini (with deterministic safety fallback). Strictly separates factual observations from analytical inferences, documents data limitations, and recommends cautious next steps.
- **Persistent Investigation Notes**: SQLite-backed audit trails and status management (`NEW`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED_BENIGN`, `RESOLVED_FRAUD`, `CLOSED`).

### 🔄 Shared Context & Single Source of Truth
Both **Protect Me** and **Investigate** modes consume the same underlying detection results, transactions, and case identifiers (`case_id`). A case opened in Protect Me mode references the exact same transactions and evidence items visible in Investigate mode.

---

## Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Lucide Icons.
- **Backend**: Python, FastAPI, SQLite, Pydantic v2.
- **AI Integration**: Google Gemini API via backend only (`google-genai` SDK) with deterministic fallback.
- **Detection Engine**: Modular rule engine (`backend/app/detection/`) with plug points for Member 2's custom rules and models.

---

## Quickstart

### 1. Run the Backend
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 2. Run the Frontend
```powershell
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

### 3. Run Automated Tests
```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests/ -v
```

---

## Module Ownership & Team Integration

See [CONTRIBUTING.md](CONTRIBUTING.md) for full module boundaries, shared data contracts (`backend/app/models/contracts.py` & `frontend/src/types/trace.ts`), and team integration rules.
