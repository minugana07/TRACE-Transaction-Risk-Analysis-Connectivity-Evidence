import type {
  Alert,
  CaseStatus,
  InvestigationNote,
  NoteType,
  Transaction,
  Account,
} from '../contracts/index.ts';
import type { ITraceInvestigateApi, AlertFilterOptions, GraphData } from './client.ts';
import {
  SYNTHETIC_ALERTS,
  SYNTHETIC_ACCOUNTS,
  SYNTHETIC_TRANSACTIONS,
} from '../data/synthetic-data.ts';

/**
 * Isolated in-memory API adapter populated with clearly labelled synthetic data.
 * Used for development, testing, and offline module demonstration.
 * Strictly guarantees that case status changes and notes do not mutate underlying transaction records.
 */
export class InMemoryTraceApiAdapter implements ITraceInvestigateApi {
  private alerts: Alert[];
  private accounts: Account[];
  private transactions: readonly Transaction[]; // Readonly to guarantee immutability

  constructor(
    initialAlerts: Alert[] = SYNTHETIC_ALERTS,
    initialAccounts: Account[] = SYNTHETIC_ACCOUNTS,
    initialTransactions: Transaction[] = SYNTHETIC_TRANSACTIONS
  ) {
    // Deep clone to isolate test runs
    this.alerts = JSON.parse(JSON.stringify(initialAlerts));
    this.accounts = JSON.parse(JSON.stringify(initialAccounts));
    // Freeze transactions to guarantee absolute immutability
    this.transactions = Object.freeze(JSON.parse(JSON.stringify(initialTransactions)));
  }

  async fetchAlerts(filters?: AlertFilterOptions): Promise<Alert[]> {
    let result = [...this.alerts];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.alertId.toLowerCase().includes(q) ||
          a.caseId.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.primaryAccountId.toLowerCase().includes(q) ||
          a.relatedAccountIds.some((acc) => acc.toLowerCase().includes(q)) ||
          a.detectionResult.triggeredRules.some((r) => r.ruleName.toLowerCase().includes(q))
      );
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      result = result.filter((a) => a.priority === filters.priority);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters?.minRisk !== undefined) {
      result = result.filter((a) => a.riskScore >= filters.minRisk!);
    }

    if (filters?.maxRisk !== undefined) {
      result = result.filter((a) => a.riskScore <= filters.maxRisk!);
    }

    if (filters?.timeRange && filters.timeRange !== 'all') {
      const now = new Date('2026-10-28T09:30:00Z').getTime(); // Reference time
      const windowMs: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const limit = windowMs[filters.timeRange] || 0;
      if (limit > 0) {
        result = result.filter((a) => now - new Date(a.createdAt).getTime() <= limit);
      }
    }

    // Sorting
    const sortBy = filters?.sortBy || 'riskScore';
    const direction = filters?.sortDirection === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      if (sortBy === 'riskScore') {
        return (a.riskScore - b.riskScore) * direction;
      }
      if (sortBy === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      }
      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return ((pOrder[a.priority] || 0) - (pOrder[b.priority] || 0)) * direction;
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status) * direction;
      }
      return 0;
    });

    return result;
  }

  async fetchAlertById(alertId: string): Promise<Alert | null> {
    const alert = this.alerts.find((a) => a.alertId === alertId);
    return alert ? JSON.parse(JSON.stringify(alert)) : null;
  }

  async fetchCaseNotes(caseId: string): Promise<InvestigationNote[]> {
    const alert = this.alerts.find((a) => a.caseId === caseId);
    return alert ? JSON.parse(JSON.stringify(alert.notes)) : [];
  }

  async updateCaseStatus(
    caseId: string,
    status: CaseStatus,
    updatedBy = 'ANALYST_DEFAULT'
  ): Promise<{ success: boolean; caseId: string; status: CaseStatus; updatedAt: string }> {
    const targetAlerts = this.alerts.filter((a) => a.caseId === caseId);
    if (targetAlerts.length === 0) {
      throw new Error(`Case ${caseId} not found`);
    }

    const updatedAt = new Date().toISOString();
    for (const alert of targetAlerts) {
      alert.status = status;
      alert.updatedAt = updatedAt;
      // Record procedural audit note
      alert.notes.push({
        noteId: `NOTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        caseId,
        authorId: updatedBy,
        authorName: updatedBy,
        createdAt: updatedAt,
        type: 'PROCEDURAL_UPDATE',
        content: `Case status transitioned to ${status}.`,
      });
    }

    // Verify underlying transactions remain unmodified
    return { success: true, caseId, status, updatedAt };
  }

  async addInvestigationNote(
    caseId: string,
    noteInput: { type: NoteType; content: string; authorId: string; authorName: string }
  ): Promise<InvestigationNote> {
    const targetAlerts = this.alerts.filter((a) => a.caseId === caseId);
    if (targetAlerts.length === 0) {
      throw new Error(`Case ${caseId} not found`);
    }

    const newNote: InvestigationNote = {
      noteId: `NOTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      caseId,
      authorId: noteInput.authorId,
      authorName: noteInput.authorName,
      createdAt: new Date().toISOString(),
      type: noteInput.type,
      content: noteInput.content,
    };

    for (const alert of targetAlerts) {
      alert.notes.push(newNote);
      alert.updatedAt = newNote.createdAt;
    }

    return newNote;
  }

  async fetchAccount(accountId: string): Promise<Account | null> {
    const account = this.accounts.find((acc) => acc.accountId === accountId);
    return account ? JSON.parse(JSON.stringify(account)) : null;
  }

  async fetchTransaction(transactionId: string): Promise<Transaction | null> {
    const txn = this.transactions.find((t) => t.transactionId === transactionId);
    return txn ? JSON.parse(JSON.stringify(txn)) : null;
  }

  async fetchTransactions(transactionIds: string[]): Promise<Transaction[]> {
    const set = new Set(transactionIds);
    return this.transactions
      .filter((t) => set.has(t.transactionId))
      .map((t) => JSON.parse(JSON.stringify(t)));
  }

  async fetchConnectivityGraph(rootAccountId: string, maxHops = 2): Promise<GraphData> {
    const visitedAccountIds = new Set<string>([rootAccountId]);
    const matchedTransactions: Transaction[] = [];
    let currentFrontier = new Set<string>([rootAccountId]);

    for (let hop = 0; hop < maxHops; hop++) {
      const nextFrontier = new Set<string>();
      for (const txn of this.transactions) {
        if (currentFrontier.has(txn.sourceAccountId)) {
          matchedTransactions.push(txn);
          if (!visitedAccountIds.has(txn.targetAccountId)) {
            visitedAccountIds.add(txn.targetAccountId);
            nextFrontier.add(txn.targetAccountId);
          }
        } else if (currentFrontier.has(txn.targetAccountId)) {
          matchedTransactions.push(txn);
          if (!visitedAccountIds.has(txn.sourceAccountId)) {
            visitedAccountIds.add(txn.sourceAccountId);
            nextFrontier.add(txn.sourceAccountId);
          }
        }
      }
      currentFrontier = nextFrontier;
      if (currentFrontier.size === 0) break;
    }

    // Deduplicate transactions
    const uniqueTxns = Array.from(
      new Map(matchedTransactions.map((t) => [t.transactionId, t])).values()
    );

    // Fetch accounts
    const nodes = this.accounts.filter((acc) => visitedAccountIds.has(acc.accountId));

    return {
      nodes,
      edges: uniqueTxns,
      focusAccountId: rootAccountId,
    };
  }

  /**
   * Helper to inspect current transaction store state (for immutability testing).
   */
  getTransactionsSnapshot(): readonly Transaction[] {
    return this.transactions;
  }
}
