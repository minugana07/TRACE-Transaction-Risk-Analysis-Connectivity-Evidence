import type {
  Alert,
  CaseStatus,
  InvestigationNote,
  NoteType,
  Transaction,
  Account,
} from '../contracts/index.ts';
import type { ITraceInvestigateApi, AlertFilterOptions, GraphData } from '../api/client.ts';

export interface InvestigationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  alerts: Alert[];
  selectedAlertId: string | null;
  selectedAlert: Alert | null;
  selectedAlertTransactions: Transaction[];
  selectedAlertAccounts: Account[];
  filters: AlertFilterOptions;
  // Graph state
  graphData: GraphData | null;
  graphStatus: 'idle' | 'loading' | 'success' | 'error';
  selectedGraphNode: Account | null;
  selectedGraphEdge: Transaction | null;
  isSequenceHighlighted: boolean;
  graphMinAmount: number;
  graphRiskOnly: boolean;
  // Map state
  mapMetric: 'COUNT' | 'RATE';
  selectedMapLocation?: { city: string; country: string; count: number; flaggedCount: number; rate: number };
}

export type StateListener = (state: InvestigationState) => void;

export class InvestigationStore {
  private api: ITraceInvestigateApi;
  private state: InvestigationState;
  private listeners: Set<StateListener> = new Set();

  constructor(api: ITraceInvestigateApi) {
    this.api = api;
    this.state = {
      status: 'idle',
      alerts: [],
      selectedAlertId: null,
      selectedAlert: null,
      selectedAlertTransactions: [],
      selectedAlertAccounts: [],
      filters: {
        search: '',
        priority: 'ALL',
        status: 'ALL',
        timeRange: 'all',
        sortBy: 'riskScore',
        sortDirection: 'desc',
      },
      graphData: null,
      graphStatus: 'idle',
      selectedGraphNode: null,
      selectedGraphEdge: null,
      isSequenceHighlighted: false,
      graphMinAmount: 0,
      graphRiskOnly: false,
      mapMetric: 'COUNT',
    };
  }

  getState(): InvestigationState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private update(patch: Partial<InvestigationState>) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  async loadAlerts(customFilters?: AlertFilterOptions): Promise<void> {
    const filters = { ...this.state.filters, ...customFilters };
    this.update({ status: 'loading', errorMessage: undefined, filters });

    try {
      const alerts = await this.api.fetchAlerts(filters);
      let selectedAlert = this.state.selectedAlert;
      let selectedId = this.state.selectedAlertId;

      // Retain or select top priority alert if none selected
      if (!selectedId && alerts.length > 0) {
        selectedId = alerts[0].alertId;
        selectedAlert = alerts[0];
      } else if (selectedId) {
        selectedAlert = alerts.find((a) => a.alertId === selectedId) || alerts[0] || null;
        selectedId = selectedAlert ? selectedAlert.alertId : null;
      }

      this.update({
        status: 'success',
        alerts,
        selectedAlertId: selectedId,
        selectedAlert,
      });

      if (selectedAlert) {
        await this.loadAlertEntities(selectedAlert);
        await this.loadGraphForAccount(selectedAlert.primaryAccountId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.update({ status: 'error', errorMessage: msg });
    }
  }

  async selectAlert(alertId: string): Promise<void> {
    const alert = this.state.alerts.find((a) => a.alertId === alertId);
    if (!alert) return;

    this.update({
      selectedAlertId: alertId,
      selectedAlert: alert,
      selectedGraphNode: null,
      selectedGraphEdge: null,
    });

    await this.loadAlertEntities(alert);
    await this.loadGraphForAccount(alert.primaryAccountId);
  }

  private async loadAlertEntities(alert: Alert): Promise<void> {
    try {
      const [txns, primaryAcc, ...relatedAccs] = await Promise.all([
        this.api.fetchTransactions(alert.transactionIds),
        this.api.fetchAccount(alert.primaryAccountId),
        ...alert.relatedAccountIds.map((id) => this.api.fetchAccount(id)),
      ]);

      const allAccounts = [primaryAcc, ...relatedAccs].filter((a): a is Account => a !== null);
      this.update({
        selectedAlertTransactions: txns,
        selectedAlertAccounts: allAccounts,
      });
    } catch (err: unknown) {
      console.error('TRACE Investigate: Failed loading related entities', err);
    }
  }

  async loadGraphForAccount(accountId: string): Promise<void> {
    this.update({ graphStatus: 'loading', selectedGraphNode: null, selectedGraphEdge: null });
    try {
      const graphData = await this.api.fetchConnectivityGraph(accountId, 2);
      const rootNode = graphData.nodes.find((n) => n.accountId === accountId) || null;
      this.update({
        graphData,
        graphStatus: 'success',
        selectedGraphNode: rootNode,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.update({ graphStatus: 'error', errorMessage: msg });
    }
  }

  selectGraphNode(accountId: string | null): void {
    if (!accountId) {
      this.update({ selectedGraphNode: null });
      return;
    }
    const node = this.state.graphData?.nodes.find((n) => n.accountId === accountId) || null;
    this.update({ selectedGraphNode: node, selectedGraphEdge: null });
  }

  selectGraphEdge(transactionId: string | null): void {
    if (!transactionId) {
      this.update({ selectedGraphEdge: null });
      return;
    }
    const edge = this.state.graphData?.edges.find((t) => t.transactionId === transactionId) || null;
    this.update({ selectedGraphEdge: edge, selectedGraphNode: null });
  }

  setSequenceHighlighted(highlighted: boolean): void {
    this.update({ isSequenceHighlighted: highlighted });
  }

  setGraphFilters(minAmount: number, riskOnly: boolean): void {
    this.update({ graphMinAmount: minAmount, graphRiskOnly: riskOnly });
  }

  setMapMetric(metric: 'COUNT' | 'RATE'): void {
    this.update({ mapMetric: metric });
  }

  setSelectedMapLocation(loc?: { city: string; country: string; count: number; flaggedCount: number; rate: number }): void {
    this.update({ selectedMapLocation: loc });
  }

  async updateCaseStatus(newStatus: CaseStatus, author = 'ANALYST_01'): Promise<void> {
    const alert = this.state.selectedAlert;
    if (!alert) throw new Error('No active case selected');

    await this.api.updateCaseStatus(alert.caseId, newStatus, author);

    // Refresh active alert and queue
    alert.status = newStatus;
    alert.updatedAt = new Date().toISOString();
    const notes = await this.api.fetchCaseNotes(alert.caseId);
    alert.notes = notes;

    const updatedAlerts = this.state.alerts.map((a) => (a.caseId === alert.caseId ? { ...alert } : a));

    this.update({
      selectedAlert: { ...alert },
      alerts: updatedAlerts,
    });
  }

  async addNote(noteInput: { type: NoteType; content: string; authorId: string; authorName: string }): Promise<void> {
    const alert = this.state.selectedAlert;
    if (!alert) throw new Error('No active case selected');

    await this.api.addInvestigationNote(alert.caseId, noteInput);
    const updatedNotes = await this.api.fetchCaseNotes(alert.caseId);
    alert.notes = updatedNotes;
    alert.updatedAt = new Date().toISOString();

    const updatedAlerts = this.state.alerts.map((a) => (a.caseId === alert.caseId ? { ...alert } : a));

    this.update({
      selectedAlert: { ...alert },
      alerts: updatedAlerts,
    });
  }

  /**
   * Cross-navigation: find if an account or transaction belongs to an existing alert in TRACE.
   */
  findAssociatedAlert(entityId: string): Alert | undefined {
    return this.state.alerts.find(
      (a) =>
        a.primaryAccountId === entityId ||
        a.relatedAccountIds.includes(entityId) ||
        a.transactionIds.includes(entityId)
    );
  }
}
