import type {
  Alert,
  CaseStatus,
  InvestigationNote,
  NoteType,
  Transaction,
  Account,
} from '../contracts/index.ts';

export interface AlertFilterOptions {
  search?: string;
  priority?: string;
  status?: string;
  minRisk?: number;
  maxRisk?: number;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  sortBy?: 'riskScore' | 'priority' | 'createdAt' | 'status';
  sortDirection?: 'asc' | 'desc';
}

export interface GraphData {
  nodes: Account[];
  edges: Transaction[];
  focusAccountId?: string;
}

export interface ITraceInvestigateApi {
  fetchAlerts(filters?: AlertFilterOptions): Promise<Alert[]>;
  fetchAlertById(alertId: string): Promise<Alert | null>;
  fetchCaseNotes(caseId: string): Promise<InvestigationNote[]>;
  updateCaseStatus(caseId: string, status: CaseStatus, updatedBy?: string): Promise<{ success: boolean; caseId: string; status: CaseStatus; updatedAt: string }>;
  addInvestigationNote(caseId: string, note: { type: NoteType; content: string; authorId: string; authorName: string }): Promise<InvestigationNote>;
  fetchAccount(accountId: string): Promise<Account | null>;
  fetchTransaction(transactionId: string): Promise<Transaction | null>;
  fetchTransactions(transactionIds: string[]): Promise<Transaction[]>;
  fetchConnectivityGraph(rootAccountId: string, maxHops?: number): Promise<GraphData>;
}

/**
 * Live HTTP client connecting to Member 1's backend API.
 */
export class HttpTraceInvestigateClient implements ITraceInvestigateApi {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchAlerts(filters?: AlertFilterOptions): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.minRisk !== undefined) params.set('minRisk', String(filters.minRisk));
    if (filters?.maxRisk !== undefined) params.set('maxRisk', String(filters.maxRisk));
    if (filters?.timeRange) params.set('timeRange', filters.timeRange);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortDirection) params.set('sortDirection', filters.sortDirection);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/alerts${query}`);
    if (!res.ok) throw new Error(`TRACE API Error: Failed to fetch alerts (${res.status} ${res.statusText})`);
    return res.json();
  }

  async fetchAlertById(alertId: string): Promise<Alert | null> {
    const res = await fetch(`${this.baseUrl}/alerts/${encodeURIComponent(alertId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`TRACE API Error: Failed to fetch alert ${alertId} (${res.status})`);
    return res.json();
  }

  async fetchCaseNotes(caseId: string): Promise<InvestigationNote[]> {
    const res = await fetch(`${this.baseUrl}/cases/${encodeURIComponent(caseId)}/notes`);
    if (!res.ok) throw new Error(`TRACE API Error: Failed to fetch notes for case ${caseId} (${res.status})`);
    return res.json();
  }

  async updateCaseStatus(caseId: string, status: CaseStatus, updatedBy = 'ANALYST_DEFAULT'): Promise<{ success: boolean; caseId: string; status: CaseStatus; updatedAt: string }> {
    const res = await fetch(`${this.baseUrl}/cases/${encodeURIComponent(caseId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updatedBy }),
    });
    if (!res.ok) throw new Error(`TRACE API Error: Failed to update case status (${res.status})`);
    return res.json();
  }

  async addInvestigationNote(caseId: string, note: { type: NoteType; content: string; authorId: string; authorName: string }): Promise<InvestigationNote> {
    const res = await fetch(`${this.baseUrl}/cases/${encodeURIComponent(caseId)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!res.ok) throw new Error(`TRACE API Error: Failed to record investigation note (${res.status})`);
    return res.json();
  }

  async fetchAccount(accountId: string): Promise<Account | null> {
    const res = await fetch(`${this.baseUrl}/accounts/${encodeURIComponent(accountId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`TRACE API Error: Failed to fetch account ${accountId} (${res.status})`);
    return res.json();
  }

  async fetchTransaction(transactionId: string): Promise<Transaction | null> {
    const res = await fetch(`${this.baseUrl}/transactions/${encodeURIComponent(transactionId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`TRACE API Error: Failed to fetch transaction ${transactionId} (${res.status})`);
    return res.json();
  }

  async fetchTransactions(transactionIds: string[]): Promise<Transaction[]> {
    if (transactionIds.length === 0) return [];
    const params = new URLSearchParams({ ids: transactionIds.join(',') });
    const res = await fetch(`${this.baseUrl}/transactions?${params.toString()}`);
    if (!res.ok) throw new Error(`TRACE API Error: Failed to fetch transactions (${res.status})`);
    return res.json();
  }

  async fetchConnectivityGraph(rootAccountId: string, maxHops = 2): Promise<GraphData> {
    const res = await fetch(`${this.baseUrl}/graph/connectivity/${encodeURIComponent(rootAccountId)}?hops=${maxHops}`);
    if (!res.ok) throw new Error(`TRACE API Error: Failed to fetch connectivity graph (${res.status})`);
    return res.json();
  }
}
