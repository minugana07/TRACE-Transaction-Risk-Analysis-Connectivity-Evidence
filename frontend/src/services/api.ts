import type {
  AIExplanationRequest,
  AIExplanationResponse,
  Alert,
  CaseStatusUpdate,
  DetectionResult,
  InvestigationNote,
  InvestigationNoteCreate,
  Transaction,
} from '../types/trace';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchTransactions(accountId?: string, channel?: string): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (accountId) params.append('account_id', accountId);
  if (channel) params.append('channel', channel);
  const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchAlerts(customerId?: string, priority?: string, status?: string): Promise<Alert[]> {
  const params = new URLSearchParams();
  if (customerId) params.append('customer_id', customerId);
  if (priority) params.append('priority', priority);
  if (status) params.append('status', status);
  const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export interface CaseDetailResponse {
  case_id: string;
  alert: Alert;
  transactions: Transaction[];
  notes: InvestigationNote[];
  history: Array<{ action: string; details: string; author: string; timestamp: string }>;
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDetailResponse> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}`);
  return res.json();
}

export async function addCaseNote(caseId: string, note: InvestigationNoteCreate): Promise<InvestigationNote> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error('Failed to add investigation note');
  return res.json();
}

export async function updateCaseStatus(caseId: string, update: CaseStatusUpdate): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error('Failed to update case status');
  return res.json();
}

export async function requestAIExplanation(payload: AIExplanationRequest): Promise<AIExplanationResponse> {
  const res = await fetch(`${API_BASE}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate TRACE AI explanation');
  return res.json();
}

export async function uploadDataset(file: File): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload dataset');
  }
  return res.json();
}

export async function triggerDetectionRun(): Promise<DetectionResult> {
  const res = await fetch(`${API_BASE}/detection/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to execute detection run');
  return res.json();
}
