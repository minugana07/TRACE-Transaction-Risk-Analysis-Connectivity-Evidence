# TRACE Shared Domain Contracts | Member 1 & Member 2 Integration

This document defines the exact shared TypeScript models and endpoints agreed upon across TRACE team members.

---

## Shared Models (`src/contracts/`)

### 1. Alert Contract (`alert.ts`)
```typescript
export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'ESCALATED'
  | 'CLOSED_FALSE_POSITIVE'
  | 'CLOSED_RESOLVED';

export interface Alert {
  alertId: string;
  caseId: string;
  title: string;
  description: string;
  priority: AlertPriority;
  riskScore: number; // 0-100 investigation priority score
  status: CaseStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  assignedTo?: string;
  primaryAccountId: string;
  relatedAccountIds: string[];
  transactionIds: string[];
  detectionResult: DetectionResult;
  evidence: EvidenceItem[];
  notes: InvestigationNote[];
}
```

### 2. Detection Result Contract (`detection.ts` - Member 2)
```typescript
export type RuleSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TriggeredRule {
  ruleId: string;
  ruleName: string;
  severity: RuleSeverity;
  category: 'STRUCTURING' | 'RAPID_MOVEMENT' | 'GEO_ANOMALY' | 'HIGH_VELOCITY' | 'UNUSUAL_VOLUME' | string;
  description: string;
  matchedConditions: Record<string, unknown>;
}

export interface DetectionResult {
  resultId: string;
  engineVersion: string;
  timestamp: string;
  overallRiskScore: number;
  triggeredRules: TriggeredRule[];
  anomalyFeatures?: Record<string, number>;
}
```

### 3. Evidence Item Contract (`evidence.ts` - Member 1 & 3)
```typescript
export type EvidenceCategory =
  | 'OBSERVED_TRANSACTION'
  | 'VELOCITY_METRIC'
  | 'GRAPH_CONNECTIVITY'
  | 'GEOGRAPHIC_DISPERSION'
  | 'SYSTEM_FLAG';

export interface EvidenceItem {
  evidenceId: string;
  category: EvidenceCategory;
  observedFact: string; // Objective factual observation
  dataPoints: Record<string, unknown>;
  source: string; // e.g. "CORE_LEDGER", "DEVICE_TELEMETRY"
  timestamp: string;
}
```

### 4. Investigation Note Contract (`investigation-note.ts` - Member 1)
```typescript
export type NoteType =
  | 'ANALYST_INTERPRETATION'
  | 'PROCEDURAL_UPDATE'
  | 'SUPERVISORY_REVIEW';

export interface InvestigationNote {
  noteId: string;
  caseId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  type: NoteType;
  content: string;
}
```

### 5. Transaction Contract (`transaction.ts` - Member 3)
```typescript
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FLAGGED' | 'REJECTED';
export type TransactionChannel = 'WIRE' | 'ACH' | 'SWIFT' | 'INTERNAL' | 'P2P';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  ipAddress?: string;
  isSyntheticDemo?: boolean; // Clearly marked if synthetic
}

export interface Transaction {
  transactionId: string;
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: TransactionStatus;
  channel: TransactionChannel;
  location?: GeoLocation;
  riskIndicators?: string[];
}
```

---

## Backend API Endpoints (Member 1 Specification)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/alerts` | Filtered and sorted alert queue |
| `GET` | `/api/alerts/:alertId` | Complete alert record with evidence & notes |
| `GET` | `/api/cases/:caseId/notes` | Case investigation notes |
| `PATCH` | `/api/cases/:caseId/status` | Update case status (body: `{ status, updatedBy }`) |
| `POST` | `/api/cases/:caseId/notes` | Add investigation note (body: `{ type, content, authorId, authorName }`) |
| `GET` | `/api/accounts/:accountId` | Account details & current balance |
| `GET` | `/api/transactions?ids=...` | Batch transaction retrieval |
| `GET` | `/api/graph/connectivity/:accountId` | 1-2 hop transaction graph (nodes: `Account[]`, edges: `Transaction[]`) |
