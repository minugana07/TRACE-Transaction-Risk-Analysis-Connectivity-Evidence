import type {
  Alert,
  CaseStatus,
  NoteType,
  Transaction,
  Account,
} from '../contracts/index.ts';
import type { InvestigationStore, InvestigationState } from '../state/investigation-store.ts';
import { GeoAggregator } from './map/GeoAggregator.ts';
import { RiskRippleGraphModel } from './graph/RiskRippleGraph.ts';

/**
 * High-performance, framework-agnostic UI renderer for the TRACE Investigate experience.
 * Can be mounted into any HTML container element (React ref, Vue template, or vanilla DOM).
 */
export class InvestigateUiRenderer {
  private container: HTMLElement;
  private store: InvestigationStore;
  private activeTab: 'dashboard' | 'graph' | 'map' = 'dashboard';
  private unsubscribe?: () => void;

  constructor(container: HTMLElement, store: InvestigationStore) {
    this.container = container;
    this.store = store;
    this.init();
  }

  private init() {
    this.container.classList.add('trace-investigate-module');
    this.injectStyles();
    this.unsubscribe = this.store.subscribe((state) => this.render(state));
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    this.container.innerHTML = '';
  }

  private injectStyles() {
    if (document.getElementById('trace-investigate-styles')) return;
    const style = document.createElement('style');
    style.id = 'trace-investigate-styles';
    style.textContent = `
      .trace-investigate-module {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #f1f5f9;
        background-color: #0b0f19;
        min-height: 700px;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #1e293b;
      }
      .trace-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #0f172a;
        padding: 12px 20px;
        border-bottom: 1px solid #1e293b;
      }
      .trace-branding {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .trace-badge {
        background: #0284c7;
        color: #fff;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .trace-title {
        font-size: 16px;
        font-weight: 600;
        color: #f8fafc;
        margin: 0;
      }
      .trace-tabs {
        display: flex;
        gap: 8px;
      }
      .trace-tab-btn {
        background: #1e293b;
        color: #94a3b8;
        border: 1px solid #334155;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.15s;
      }
      .trace-tab-btn:hover {
        color: #f8fafc;
        background: #334155;
      }
      .trace-tab-btn.active {
        background: #0284c7;
        color: #fff;
        border-color: #38bdf8;
      }
      .trace-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      /* Dashboard layout */
      .trace-dashboard-layout {
        display: grid;
        grid-template-columns: 360px 1fr;
        width: 100%;
        height: 100%;
      }
      .trace-sidebar {
        background: #0d1322;
        border-right: 1px solid #1e293b;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .trace-filter-bar {
        padding: 12px;
        border-bottom: 1px solid #1e293b;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .trace-input, .trace-select {
        background: #1e293b;
        border: 1px solid #334155;
        color: #f8fafc;
        padding: 6px 10px;
        border-radius: 5px;
        font-size: 12px;
        outline: none;
      }
      .trace-input:focus, .trace-select:focus {
        border-color: #38bdf8;
      }
      .trace-filter-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .trace-alert-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .trace-alert-card {
        background: #131d31;
        border: 1px solid #1e293b;
        border-radius: 6px;
        padding: 10px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .trace-alert-card:hover {
        border-color: #38bdf8;
        background: #18243c;
      }
      .trace-alert-card.selected {
        border-color: #38bdf8;
        background: #1a2a47;
        box-shadow: 0 0 0 1px #38bdf8;
      }
      .trace-alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .trace-priority-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .trace-p-CRITICAL { background: #7f1d1d; color: #fecaca; }
      .trace-p-HIGH { background: #7c2d12; color: #ffedd5; }
      .trace-p-MEDIUM { background: #78350f; color: #fef3c7; }
      .trace-p-LOW { background: #14532d; color: #dcfce7; }
      .trace-risk-score {
        font-size: 11px;
        font-weight: 700;
        color: #38bdf8;
      }
      .trace-alert-title {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0 0 4px 0;
        line-height: 1.3;
      }
      .trace-alert-sub {
        font-size: 11px;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
      }
      /* Detail Panel */
      .trace-detail-panel {
        background: #0b0f19;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .trace-card-box {
        background: #111827;
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 16px;
      }
      .trace-box-title {
        font-size: 14px;
        font-weight: 600;
        color: #e2e8f0;
        margin: 0 0 12px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .trace-meta-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 12px;
      }
      .trace-meta-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .trace-meta-label {
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
      }
      .trace-meta-val {
        font-size: 13px;
        font-weight: 500;
        color: #f1f5f9;
      }
      /* Rule badge */
      .trace-rule-item {
        background: #1e293b;
        border-left: 3px solid #38bdf8;
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      .trace-rule-header {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        font-weight: 600;
      }
      .trace-rule-desc {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 4px;
      }
      /* Evidence */
      .trace-evidence-item {
        background: #131c2e;
        border: 1px solid #1e293b;
        padding: 10px 12px;
        border-radius: 5px;
        margin-bottom: 8px;
      }
      .trace-evidence-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 3px;
        background: #0369a1;
        color: #e0f2fe;
        margin-right: 8px;
      }
      .trace-evidence-text {
        font-size: 12px;
        color: #e2e8f0;
      }
      /* Notes */
      .trace-note-item {
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 8px;
        font-size: 12px;
      }
      .trace-note-ANALYST_INTERPRETATION {
        background: #1e1b4b;
        border-left: 3px solid #818cf8;
      }
      .trace-note-PROCEDURAL_UPDATE {
        background: #0f172a;
        border-left: 3px solid #64748b;
      }
      .trace-note-SUPERVISORY_REVIEW {
        background: #143528;
        border-left: 3px solid #34d399;
      }
      .trace-note-author {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
      }
      .trace-disclaimer {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.4;
      }
      /* Empty & Loading states */
      .trace-state-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #94a3b8;
        text-align: center;
        gap: 12px;
      }
      .trace-btn {
        background: #0284c7;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 500;
      }
      .trace-btn:hover { background: #0369a1; }
      .trace-btn-secondary {
        background: #1e293b;
        color: #cbd5e1;
        border: 1px solid #334155;
      }
      .trace-btn-secondary:hover { background: #334155; }
      /* Graph & Map Views */
      .trace-view-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
      }
      .trace-view-toolbar {
        background: #0f172a;
        padding: 10px 16px;
        border-bottom: 1px solid #1e293b;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .trace-view-body {
        flex: 1;
        display: flex;
        position: relative;
        overflow: hidden;
      }
      .trace-inspector {
        width: 320px;
        background: #0d1322;
        border-left: 1px solid #1e293b;
        padding: 16px;
        overflow-y: auto;
      }
      /* Interactive Graph Canvas / SVG representation */
      .trace-graph-canvas {
        flex: 1;
        background: #080c14;
        position: relative;
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
  }

  private render(state: InvestigationState) {
    this.container.innerHTML = `
      <header class="trace-header">
        <div class="trace-branding">
          <span class="trace-badge">TRACE</span>
          <h1 class="trace-title">Transaction Risk Analysis, Connectivity & Evidence</h1>
        </div>
        <div class="trace-tabs">
          <button class="trace-tab-btn ${this.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            Investigation Dashboard
          </button>
          <button class="trace-tab-btn ${this.activeTab === 'graph' ? 'active' : ''}" data-tab="graph">
            Risk Ripple Graph
          </button>
          <button class="trace-tab-btn ${this.activeTab === 'map' ? 'active' : ''}" data-tab="map">
            Hotspot Map
          </button>
        </div>
      </header>
      <main class="trace-content">
        ${this.renderActiveTab(state)}
      </main>
    `;

    this.bindEvents(state);
  }

  private renderActiveTab(state: InvestigationState): string {
    if (state.status === 'loading' && state.alerts.length === 0) {
      return `
        <div class="trace-state-box" style="width: 100%;">
          <div style="font-size: 24px;">⏳</div>
          <p>Loading TRACE investigation records...</p>
        </div>
      `;
    }

    if (state.status === 'error' && state.alerts.length === 0) {
      return `
        <div class="trace-state-box" style="width: 100%;">
          <div style="font-size: 24px; color: #ef4444;">⚠️</div>
          <p style="color: #ef4444;">Failed to load TRACE records: ${state.errorMessage || 'Unknown error'}</p>
          <button class="trace-btn" id="btn-retry-alerts">Retry Connection</button>
        </div>
      `;
    }

    switch (this.activeTab) {
      case 'dashboard':
        return this.renderDashboard(state);
      case 'graph':
        return this.renderGraphView(state);
      case 'map':
        return this.renderMapView(state);
      default:
        return '';
    }
  }

  private renderDashboard(state: InvestigationState): string {
    const alerts = state.alerts;
    const selectedAlert = state.selectedAlert;

    return `
      <div class="trace-dashboard-layout">
        <!-- Sidebar Queue -->
        <aside class="trace-sidebar">
          <div class="trace-filter-bar">
            <input type="text" class="trace-input" id="filter-search" placeholder="Search account, case, or rule..." value="${state.filters.search || ''}">
            <div class="trace-filter-row">
              <select class="trace-select" id="filter-priority">
                <option value="ALL" ${state.filters.priority === 'ALL' ? 'selected' : ''}>All Priorities</option>
                <option value="CRITICAL" ${state.filters.priority === 'CRITICAL' ? 'selected' : ''}>Critical</option>
                <option value="HIGH" ${state.filters.priority === 'HIGH' ? 'selected' : ''}>High</option>
                <option value="MEDIUM" ${state.filters.priority === 'MEDIUM' ? 'selected' : ''}>Medium</option>
                <option value="LOW" ${state.filters.priority === 'LOW' ? 'selected' : ''}>Low</option>
              </select>
              <select class="trace-select" id="filter-status">
                <option value="ALL" ${state.filters.status === 'ALL' ? 'selected' : ''}>All Statuses</option>
                <option value="NEW" ${state.filters.status === 'NEW' ? 'selected' : ''}>New</option>
                <option value="UNDER_REVIEW" ${state.filters.status === 'UNDER_REVIEW' ? 'selected' : ''}>Under Review</option>
                <option value="ESCALATED" ${state.filters.status === 'ESCALATED' ? 'selected' : ''}>Escalated</option>
                <option value="CLOSED_RESOLVED" ${state.filters.status === 'CLOSED_RESOLVED' ? 'selected' : ''}>Resolved</option>
                <option value="CLOSED_FALSE_POSITIVE" ${state.filters.status === 'CLOSED_FALSE_POSITIVE' ? 'selected' : ''}>False Positive</option>
              </select>
            </div>
            <div class="trace-filter-row">
              <select class="trace-select" id="filter-time">
                <option value="all" ${state.filters.timeRange === 'all' ? 'selected' : ''}>All Time</option>
                <option value="24h" ${state.filters.timeRange === '24h' ? 'selected' : ''}>Last 24 Hours</option>
                <option value="7d" ${state.filters.timeRange === '7d' ? 'selected' : ''}>Last 7 Days</option>
                <option value="30d" ${state.filters.timeRange === '30d' ? 'selected' : ''}>Last 30 Days</option>
              </select>
              <select class="trace-select" id="filter-sort">
                <option value="riskScore" ${state.filters.sortBy === 'riskScore' ? 'selected' : ''}>Sort: Risk Priority</option>
                <option value="createdAt" ${state.filters.sortBy === 'createdAt' ? 'selected' : ''}>Sort: Newest</option>
                <option value="priority" ${state.filters.sortBy === 'priority' ? 'selected' : ''}>Sort: Severity</option>
                <option value="status" ${state.filters.sortBy === 'status' ? 'selected' : ''}>Sort: Status</option>
              </select>
            </div>
          </div>
          <div class="trace-alert-list">
            ${
              alerts.length === 0
                ? `<div class="trace-state-box"><p>No alerts match current filter criteria.</p></div>`
                : alerts
                    .map(
                      (a) => `
                <div class="trace-alert-card ${a.alertId === state.selectedAlertId ? 'selected' : ''}" data-alert-id="${a.alertId}">
                  <div class="trace-alert-header">
                    <span class="trace-priority-badge trace-p-${a.priority}">${a.priority}</span>
                    <span class="trace-risk-score" title="Investigation priority score (0-100)">Risk Priority: ${a.riskScore}/100</span>
                  </div>
                  <h3 class="trace-alert-title">${a.title}</h3>
                  <div class="trace-alert-sub">
                    <span>${a.primaryAccountId}</span>
                    <span>${new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              `
                    )
                    .join('')
            }
          </div>
        </aside>

        <!-- Detail Panel -->
        <section class="trace-detail-panel">
          ${
            !selectedAlert
              ? `<div class="trace-state-box"><p>Select an alert from the queue to view evidence and case context.</p></div>`
              : this.renderAlertDetail(selectedAlert, state)
          }
        </section>
      </div>
    `;
  }

  private renderAlertDetail(alert: Alert, state: InvestigationState): string {
    const rules = alert.detectionResult.triggeredRules || [];
    const evidence = alert.evidence || [];
    const notes = alert.notes || [];

    return `
      <div class="trace-disclaimer">
        <strong>Investigative Ethics Notice:</strong> Risk scores and flagged patterns represent investigation priorities and hypotheses, not definitive legal proof of fraudulent conduct.
      </div>

      <!-- Overview Header Box -->
      <div class="trace-card-box">
        <div class="trace-box-title">
          <span>${alert.title}</span>
          <span class="trace-priority-badge trace-p-${alert.priority}">${alert.priority} PRIORITY</span>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; margin: 0 0 14px 0;">${alert.description}</p>
        
        <div class="trace-meta-grid">
          <div class="trace-meta-item">
            <span class="trace-meta-label">Case Identifier</span>
            <span class="trace-meta-val">${alert.caseId}</span>
          </div>
          <div class="trace-meta-item">
            <span class="trace-meta-label">Primary Account</span>
            <span class="trace-meta-val" style="color: #38bdf8;">${alert.primaryAccountId}</span>
          </div>
          <div class="trace-meta-item">
            <span class="trace-meta-label">Risk Priority Score</span>
            <span class="trace-meta-val" style="color: #f59e0b; font-weight: 700;">${alert.riskScore} / 100</span>
          </div>
          <div class="trace-meta-item">
            <span class="trace-meta-label">Investigation Status</span>
            <span class="trace-meta-val">${alert.status}</span>
          </div>
        </div>

        <!-- Case Status Controls -->
        <div style="display: flex; gap: 8px; align-items: center; border-top: 1px solid #1e293b; padding-top: 12px;">
          <span style="font-size: 12px; color: #94a3b8;">Transition Case Status:</span>
          <select class="trace-select" id="case-status-select" style="width: 200px;">
            <option value="NEW" ${alert.status === 'NEW' ? 'selected' : ''}>NEW</option>
            <option value="UNDER_REVIEW" ${alert.status === 'UNDER_REVIEW' ? 'selected' : ''}>UNDER_REVIEW</option>
            <option value="ESCALATED" ${alert.status === 'ESCALATED' ? 'selected' : ''}>ESCALATED</option>
            <option value="CLOSED_RESOLVED" ${alert.status === 'CLOSED_RESOLVED' ? 'selected' : ''}>CLOSED_RESOLVED</option>
            <option value="CLOSED_FALSE_POSITIVE" ${alert.status === 'CLOSED_FALSE_POSITIVE' ? 'selected' : ''}>CLOSED_FALSE_POSITIVE</option>
          </select>
          <button class="trace-btn" id="btn-update-status">Update Status</button>
        </div>
      </div>

      <!-- Triggered Rules (Member 2 Detection Results) -->
      <div class="trace-card-box">
        <div class="trace-box-title">
          <span>Detection Engine Findings (${alert.detectionResult.engineVersion})</span>
          <span style="font-size: 12px; color: #94a3b8;">${rules.length} Rule(s) Triggered</span>
        </div>
        ${
          rules.length === 0
            ? `<p style="font-size: 12px; color: #94a3b8;">No specific rule triggers recorded.</p>`
            : rules
                .map(
                  (r) => `
              <div class="trace-rule-item">
                <div class="trace-rule-header">
                  <span style="color: #f8fafc;">${r.ruleName} <span style="color: #64748b;">[${r.ruleId}]</span></span>
                  <span class="trace-priority-badge trace-p-${r.severity}">${r.severity}</span>
                </div>
                <div class="trace-rule-desc">${r.description}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Conditions: ${JSON.stringify(r.matchedConditions)}</div>
              </div>
            `
                )
                .join('')
        }
      </div>

      <!-- Supporting Evidence (Immutable Observed Facts) -->
      <div class="trace-card-box">
        <div class="trace-box-title">
          <span>Observed Supporting Evidence</span>
          <span style="font-size: 11px; color: #38bdf8;">Verified Objective Telemetry</span>
        </div>
        ${
          evidence.length === 0
            ? `<p style="font-size: 12px; color: #94a3b8;">No evidence items attached to this alert.</p>`
            : evidence
                .map(
                  (e) => `
              <div class="trace-evidence-item">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span class="trace-evidence-badge">${e.category}</span>
                  <span style="font-size: 11px; color: #64748b;">Source: ${e.source} | ${new Date(e.timestamp).toLocaleString()}</span>
                </div>
                <div class="trace-evidence-text">${e.observedFact}</div>
              </div>
            `
                )
                .join('')
        }
      </div>

      <!-- Related Transactions & Accounts -->
      <div class="trace-card-box">
        <div class="trace-box-title">
          <span>Related Entities (${state.selectedAlertTransactions.length} Transactions, ${state.selectedAlertAccounts.length} Accounts)</span>
          <button class="trace-btn trace-btn-secondary" id="btn-view-in-graph">Explore in Risk Ripple Graph &rarr;</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <h4 style="font-size: 12px; color: #94a3b8; margin: 0 0 6px 0;">Accounts</h4>
            ${state.selectedAlertAccounts
              .map(
                (acc) => `
              <div style="font-size: 12px; padding: 6px; background: #0d1322; border-radius: 4px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span><strong>${acc.holderName}</strong> (${acc.accountId})</span>
                <span style="color: ${acc.riskScore > 70 ? '#ef4444' : '#38bdf8'};">Risk: ${acc.riskScore}</span>
              </div>
            `
              )
              .join('')}
          </div>
          <div>
            <h4 style="font-size: 12px; color: #94a3b8; margin: 0 0 6px 0;">Transactions</h4>
            ${state.selectedAlertTransactions
              .map(
                (t) => `
              <div style="font-size: 12px; padding: 6px; background: #0d1322; border-radius: 4px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span>${t.transactionId}: ${t.sourceAccountId} &rarr; ${t.targetAccountId}</span>
                <strong>$${t.amount.toLocaleString()}</strong>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Investigation Notes & Case Journal -->
      <div class="trace-card-box">
        <div class="trace-box-title">
          <span>Investigation Journal</span>
          <span style="font-size: 11px; color: #94a3b8;">Distinguishing Observed Evidence from Analyst Interpretation</span>
        </div>
        
        <div style="margin-bottom: 12px;">
          ${
            notes.length === 0
              ? `<p style="font-size: 12px; color: #94a3b8;">No investigation notes recorded yet.</p>`
              : notes
                  .map(
                    (n) => `
                <div class="trace-note-item trace-note-${n.type}">
                  <div class="trace-note-author">
                    <span>${n.authorName} &bull; <strong style="text-transform: uppercase;">${n.type.replace('_', ' ')}</strong></span>
                    <span>${new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <div>${n.content}</div>
                </div>
              `
                  )
                  .join('')
          }
        </div>

        <!-- Add Note Box -->
        <div style="background: #0d1322; padding: 12px; border-radius: 6px; border: 1px solid #1e293b;">
          <h4 style="font-size: 12px; color: #e2e8f0; margin: 0 0 8px 0;">Add Case Note</h4>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <select class="trace-select" id="note-type-select" style="flex: 1;">
              <option value="ANALYST_INTERPRETATION">ANALYST_INTERPRETATION (Hypothesis / Assessment)</option>
              <option value="PROCEDURAL_UPDATE">PROCEDURAL_UPDATE (Administrative status / Actions)</option>
              <option value="SUPERVISORY_REVIEW">SUPERVISORY_REVIEW (Manager approval / Escalation)</option>
            </select>
          </div>
          <textarea class="trace-input" id="note-content-input" placeholder="Record investigation findings, hypotheses, or procedural steps..." style="width: 100%; height: 60px; box-sizing: border-box; resize: vertical; margin-bottom: 8px;"></textarea>
          <div style="display: flex; justify-content: flex-end;">
            <button class="trace-btn" id="btn-submit-note">Record Note</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderGraphView(state: InvestigationState): string {
    const graphData = state.graphData;
    const selectedNode = state.selectedGraphNode;
    const selectedEdge = state.selectedGraphEdge;

    // Filter elements
    const elements = graphData
      ? RiskRippleGraphModel.toCytoscapeElements(graphData, {
          minAmount: state.graphMinAmount,
          riskOnly: state.graphRiskOnly,
          highlightSequence: state.isSequenceHighlighted,
        })
      : [];

    const nodes = elements.filter((e) => e.group === 'nodes') as any[];
    const edges = elements.filter((e) => e.group === 'edges') as any[];

    return `
      <div class="trace-view-container">
        <div class="trace-view-toolbar">
          <div style="display: flex; gap: 12px; align-items: center;">
            <strong style="font-size: 13px; color: #38bdf8;">Risk Ripple Transaction Graph</strong>
            <label style="font-size: 12px; display: flex; align-items: center; gap: 6px; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="graph-filter-risk" ${state.graphRiskOnly ? 'checked' : ''}>
              Flagged Transfers Only
            </label>
            <label style="font-size: 12px; display: flex; align-items: center; gap: 6px; color: #cbd5e1;">
              Min Amount:
              <input type="number" class="trace-input" id="graph-filter-min-amt" value="${state.graphMinAmount}" style="width: 80px;" step="1000">
            </label>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="trace-btn ${state.isSequenceHighlighted ? 'trace-btn-active' : 'trace-btn-secondary'}" id="btn-toggle-sequence">
              ${state.isSequenceHighlighted ? '✓ Sequence Highlighted' : '⚡ Highlight Flow Sequence'}
            </button>
          </div>
        </div>

        <div style="background: #1e293b; padding: 6px 16px; font-size: 11px; color: #94a3b8; border-bottom: 1px solid #334155;">
          <strong>Investigative Notice:</strong> Nodes represent accounts; directed edges represent actual transfers. Connected accounts are investigative leads, not proof of wrongdoing. Relationships are never fabricated.
        </div>

        <div class="trace-view-body">
          <div class="trace-graph-canvas" id="cy-graph-container">
            ${
              !graphData || nodes.length === 0
                ? `<div class="trace-state-box"><p>No connectivity data loaded for current account.</p></div>`
                : this.renderSvgGraph(nodes, edges, state)
            }
          </div>

          <!-- Inspector Panel for Node / Edge details -->
          <aside class="trace-inspector">
            <h3 style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin: 0 0 12px 0;">Entity Inspector</h3>
            ${
              selectedNode
                ? this.renderNodeInspector(selectedNode)
                : selectedEdge
                ? this.renderEdgeInspector(selectedEdge)
                : `<div class="trace-state-box" style="padding: 30px 10px;"><p style="font-size: 12px;">Click any account node or transfer edge in the graph to inspect ledger details.</p></div>`
            }
          </aside>
        </div>
      </div>
    `;
  }

  private renderSvgGraph(nodes: any[], edges: any[], state: InvestigationState): string {
    // Layout nodes horizontally or in a ring
    const width = 640;
    const height = 400;
    const count = nodes.length;

    const positions = new Map<string, { x: number; y: number }>();
    nodes.forEach((n, idx) => {
      // Circle layout
      const angle = (idx / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
      const rx = 220;
      const ry = 140;
      const x = width / 2 + rx * Math.cos(angle);
      const y = height / 2 + ry * Math.sin(angle);
      positions.set(n.data.id, { x, y });
    });

    const isSeq = state.isSequenceHighlighted;

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
          <marker id="arrow-flagged" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
          </marker>
          <marker id="arrow-selected" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
        </defs>

        <!-- Directed Edges -->
        ${edges
          .map((e) => {
            const src = positions.get(e.data.source);
            const tgt = positions.get(e.data.target);
            if (!src || !tgt) return '';

            const isSelected = state.selectedGraphEdge?.transactionId === e.data.id;
            const isFlagged = e.data.isFlagged;
            const strokeColor = isSelected ? '#38bdf8' : isFlagged ? '#ef4444' : '#64748b';
            const marker = isSelected ? 'url(#arrow-selected)' : isFlagged ? 'url(#arrow-flagged)' : 'url(#arrow)';
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return `
              <g class="graph-edge-group" data-edge-id="${e.data.id}" style="cursor: pointer;">
                <line x1="${src.x}" y1="${src.y}" x2="${tgt.x}" y2="${tgt.y}" 
                      stroke="${strokeColor}" stroke-width="${isSelected ? 3.5 : isFlagged ? 2.5 : 1.5}" 
                      marker-end="${marker}"
                      stroke-dasharray="${isSeq ? '5,5' : 'none'}" />
                <rect x="${midX - 35}" y="${midY - 10}" width="70" height="20" rx="3" fill="#0f172a" stroke="${strokeColor}" stroke-width="0.5" />
                <text x="${midX}" y="${midY + 4}" fill="#cbd5e1" font-size="9" text-anchor="middle" font-family="sans-serif">
                  ${isSeq && e.data.sequenceIndex ? `#${e.data.sequenceIndex} ` : ''}$${Math.round(e.data.amount / 1000)}k
                </text>
              </g>
            `;
          })
          .join('')}

        <!-- Account Nodes -->
        ${nodes
          .map((n) => {
            const pos = positions.get(n.data.id);
            if (!pos) return '';

            const isSelected = state.selectedGraphNode?.accountId === n.data.id;
            const isFocus = n.data.isFocus;
            const isHighRisk = n.data.riskScore >= 75;
            const stroke = isSelected ? '#38bdf8' : isFocus ? '#0284c7' : isHighRisk ? '#ef4444' : '#475569';
            const fill = isFocus ? '#0f172a' : '#1e293b';

            return `
              <g class="graph-node-group" data-node-id="${n.data.id}" style="cursor: pointer;">
                <circle cx="${pos.x}" cy="${pos.y}" r="26" fill="${fill}" stroke="${stroke}" stroke-width="${isSelected || isFocus ? 3 : 2}" />
                <text x="${pos.x}" y="${pos.y - 4}" fill="#f8fafc" font-size="9" font-weight="600" text-anchor="middle" font-family="sans-serif">
                  ${n.data.id}
                </text>
                <text x="${pos.x}" y="${pos.y + 8}" fill="#94a3b8" font-size="8" text-anchor="middle" font-family="sans-serif">
                  Score: ${n.data.riskScore}
                </text>
                <text x="${pos.x}" y="${pos.y + 38}" fill="#cbd5e1" font-size="10" font-weight="500" text-anchor="middle" font-family="sans-serif">
                  ${n.data.holderName.length > 15 ? n.data.holderName.substring(0, 14) + '…' : n.data.holderName}
                </text>
              </g>
            `;
          })
          .join('')}
      </svg>
    `;
  }

  private renderNodeInspector(node: Account): string {
    const associatedAlert = this.store.findAssociatedAlert(node.accountId);

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="background: #111827; padding: 10px; border-radius: 6px; border: 1px solid #1e293b;">
          <span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Selected Account</span>
          <h4 style="font-size: 14px; color: #f8fafc; margin: 4px 0;">${node.holderName}</h4>
          <span style="font-size: 11px; color: #38bdf8;">${node.accountId} &bull; ${node.holderType}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
          <div><span style="color: #64748b;">Account Status:</span> <strong>${node.status}</strong></div>
          <div><span style="color: #64748b;">Risk Priority Score:</span> <strong style="color: ${node.riskScore > 70 ? '#ef4444' : '#f59e0b'};">${node.riskScore} / 100</strong></div>
          <div><span style="color: #64748b;">Current Balance:</span> <strong>$${node.balance.toLocaleString()} ${node.currency}</strong></div>
          <div><span style="color: #64748b;">Country Code:</span> <strong>${node.country}</strong></div>
          <div><span style="color: #64748b;">Created:</span> <strong>${new Date(node.createdAt).toLocaleDateString()}</strong></div>
        </div>

        ${
          associatedAlert
            ? `
          <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 6px; padding: 10px;">
            <div style="font-size: 11px; color: #a5b4fc; margin-bottom: 4px;">Associated Alert Detected</div>
            <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 8px;">${associatedAlert.title}</div>
            <button class="trace-btn" style="width: 100%;" id="btn-nav-to-alert" data-alert-id="${associatedAlert.alertId}">
              Open Associated Alert (${associatedAlert.alertId}) &rarr;
            </button>
          </div>
        `
            : `<div style="font-size: 11px; color: #64748b;">No direct alert associated with this account.</div>`
        }

        <button class="trace-btn trace-btn-secondary" id="btn-pivot-account" data-acc-id="${node.accountId}" style="width: 100%;">
          Pivot Graph to this Account
        </button>
      </div>
    `;
  }

  private renderEdgeInspector(edge: Transaction): string {
    const associatedAlert = this.store.findAssociatedAlert(edge.transactionId);

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="background: #111827; padding: 10px; border-radius: 6px; border: 1px solid #1e293b;">
          <span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Selected Transfer</span>
          <h4 style="font-size: 16px; color: #38bdf8; margin: 4px 0;">$${edge.amount.toLocaleString()} ${edge.currency}</h4>
          <span style="font-size: 11px; color: #94a3b8;">${edge.transactionId} &bull; Channel: ${edge.channel}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
          <div><span style="color: #64748b;">Source Account:</span> <strong>${edge.sourceAccountId}</strong></div>
          <div><span style="color: #64748b;">Target Account:</span> <strong>${edge.targetAccountId}</strong></div>
          <div><span style="color: #64748b;">Timestamp:</span> <strong>${new Date(edge.timestamp).toLocaleString()}</strong></div>
          <div><span style="color: #64748b;">Status:</span> <strong style="color: ${edge.status === 'FLAGGED' ? '#ef4444' : '#10b981'};">${edge.status}</strong></div>
          ${
            edge.riskIndicators && edge.riskIndicators.length > 0
              ? `<div><span style="color: #64748b;">Risk Indicators:</span><br>${edge.riskIndicators.map((i) => `<span class="trace-priority-badge trace-p-HIGH" style="margin-right: 4px;">${i}</span>`).join('')}</div>`
              : ''
          }
        </div>

        ${
          associatedAlert
            ? `
          <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 6px; padding: 10px;">
            <div style="font-size: 11px; color: #a5b4fc; margin-bottom: 4px;">Associated Alert Detected</div>
            <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 8px;">${associatedAlert.title}</div>
            <button class="trace-btn" style="width: 100%;" id="btn-nav-to-alert" data-alert-id="${associatedAlert.alertId}">
              Open Associated Alert (${associatedAlert.alertId}) &rarr;
            </button>
          </div>
        `
            : `<div style="font-size: 11px; color: #64748b;">No direct alert associated with this transfer.</div>`
        }
      </div>
    `;
  }

  private renderMapView(state: InvestigationState): string {
    const transactions = state.selectedAlertTransactions;
    const agg = GeoAggregator.aggregate(transactions);
    const metric = state.mapMetric;
    const metricExplanation = GeoAggregator.explainMetric(metric);

    return `
      <div class="trace-view-container">
        <div class="trace-view-toolbar">
          <div style="display: flex; gap: 12px; align-items: center;">
            <strong style="font-size: 13px; color: #38bdf8;">Geographic Hotspot Map</strong>
            <div style="display: flex; gap: 4px;">
              <button class="trace-btn ${metric === 'COUNT' ? 'trace-btn-active' : 'trace-btn-secondary'}" id="btn-metric-count">
                Volume Count
              </button>
              <button class="trace-btn ${metric === 'RATE' ? 'trace-btn-active' : 'trace-btn-secondary'}" id="btn-metric-rate">
                Flagging Rate (%)
              </button>
            </div>
          </div>
          ${
            agg.hasSyntheticDemoCoordinates
              ? `<span style="font-size: 11px; background: #78350f; color: #fef3c7; padding: 3px 8px; border-radius: 4px; font-weight: 600;">[SYNTHETIC DEMO DATA]</span>`
              : ''
          }
        </div>

        <!-- Metric Explanation Banner -->
        <div style="background: #131d31; border-bottom: 1px solid #1e293b; padding: 8px 16px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between;">
          <span><strong>Displayed Metric:</strong> ${metricExplanation.label} &mdash; ${metricExplanation.explanation}</span>
          <span>${agg.validTransactionCount} mapped, ${agg.unmappedTransactionCount} unmapped</span>
        </div>

        <div class="trace-view-body">
          ${
            agg.isEmpty
              ? `
            <div class="trace-state-box" style="flex: 1;">
              <div style="font-size: 32px;">🌐</div>
              <h3 style="color: #e2e8f0; margin: 0;">No Verified Geographic Telemetry</h3>
              <p style="max-width: 440px; line-height: 1.4; color: #64748b;">
                Transactions in this selection do not have verified physical coordinates. TRACE adheres strictly to ethical data guidelines and never fabricates or infers coordinates from phone numbers, BINs, or account identifiers.
              </p>
            </div>
          `
              : `
            <div style="flex: 1; padding: 20px; overflow-y: auto;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                ${agg.clusters
                  .map(
                    (c) => `
                  <div class="trace-card-box" style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <h4 style="font-size: 14px; color: #f8fafc; margin: 0;">${c.city}, ${c.country}</h4>
                        <span style="font-size: 11px; color: #64748b;">Coords: ${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)}</span>
                      </div>
                      ${
                        c.isSyntheticDemo
                          ? `<span style="font-size: 9px; background: #78350f; color: #fef3c7; padding: 2px 5px; border-radius: 3px;">DEMO</span>`
                          : ''
                      }
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 6px;">
                      <div style="flex: 1; background: #0d1322; padding: 8px; border-radius: 4px;">
                        <div style="font-size: 10px; color: #64748b;">VOLUME COUNT</div>
                        <div style="font-size: 16px; font-weight: 700; color: #f8fafc;">${c.totalCount} txns</div>
                        <div style="font-size: 10px; color: #94a3b8;">$${c.totalVolume.toLocaleString()}</div>
                      </div>
                      <div style="flex: 1; background: #0d1322; padding: 8px; border-radius: 4px;">
                        <div style="font-size: 10px; color: #64748b;">FLAGGING RATE</div>
                        <div style="font-size: 16px; font-weight: 700; color: ${c.flaggedRate > 0.5 ? '#ef4444' : '#10b981'};">
                          ${(c.flaggedRate * 100).toFixed(0)}%
                        </div>
                        <div style="font-size: 10px; color: #94a3b8;">${c.flaggedCount} of ${c.totalCount} flagged</div>
                      </div>
                    </div>

                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                      Sample Transfers: ${c.sampleTransactionIds.join(', ')}
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  private bindEvents(state: InvestigationState) {
    // Navigation Tabs
    this.container.querySelectorAll('.trace-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        if (tab) {
          this.activeTab = tab;
          this.render(this.store.getState());
        }
      });
    });

    // Alert Queue Item Click
    this.container.querySelectorAll('.trace-alert-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const alertId = (e.currentTarget as HTMLElement).getAttribute('data-alert-id');
        if (alertId) this.store.selectAlert(alertId);
      });
    });

    // Filters
    const searchInput = this.container.querySelector('#filter-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.store.loadAlerts({ search: (e.target as HTMLInputElement).value });
      });
    }

    const prioritySelect = this.container.querySelector('#filter-priority') as HTMLSelectElement;
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        this.store.loadAlerts({ priority: (e.target as HTMLSelectElement).value });
      });
    }

    const statusSelect = this.container.querySelector('#filter-status') as HTMLSelectElement;
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.store.loadAlerts({ status: (e.target as HTMLSelectElement).value });
      });
    }

    const timeSelect = this.container.querySelector('#filter-time') as HTMLSelectElement;
    if (timeSelect) {
      timeSelect.addEventListener('change', (e) => {
        this.store.loadAlerts({ timeRange: (e.target as HTMLSelectElement).value as any });
      });
    }

    const sortSelect = this.container.querySelector('#filter-sort') as HTMLSelectElement;
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.store.loadAlerts({ sortBy: (e.target as HTMLSelectElement).value as any });
      });
    }

    // Case Status Update
    const btnUpdateStatus = this.container.querySelector('#btn-update-status');
    if (btnUpdateStatus) {
      btnUpdateStatus.addEventListener('click', async () => {
        const select = this.container.querySelector('#case-status-select') as HTMLSelectElement;
        if (select) {
          await this.store.updateCaseStatus(select.value as CaseStatus);
        }
      });
    }

    // Add Note
    const btnSubmitNote = this.container.querySelector('#btn-submit-note');
    if (btnSubmitNote) {
      btnSubmitNote.addEventListener('click', async () => {
        const typeSelect = this.container.querySelector('#note-type-select') as HTMLSelectElement;
        const contentInput = this.container.querySelector('#note-content-input') as HTMLTextAreaElement;
        if (contentInput && contentInput.value.trim()) {
          await this.store.addNote({
            type: typeSelect.value as NoteType,
            content: contentInput.value.trim(),
            authorId: 'USR-ANALYST',
            authorName: 'Current Analyst',
          });
        }
      });
    }

    // View in Graph Shortcut
    const btnViewGraph = this.container.querySelector('#btn-view-in-graph');
    if (btnViewGraph) {
      btnViewGraph.addEventListener('click', () => {
        this.activeTab = 'graph';
        this.render(this.store.getState());
      });
    }

    // Graph interactions
    this.container.querySelectorAll('.graph-node-group').forEach((g) => {
      g.addEventListener('click', (e) => {
        const accId = (e.currentTarget as HTMLElement).getAttribute('data-node-id');
        if (accId) this.store.selectGraphNode(accId);
      });
    });

    this.container.querySelectorAll('.graph-edge-group').forEach((g) => {
      g.addEventListener('click', (e) => {
        const txnId = (e.currentTarget as HTMLElement).getAttribute('data-edge-id');
        if (txnId) this.store.selectGraphEdge(txnId);
      });
    });

    // Sequence Highlight
    const btnSeq = this.container.querySelector('#btn-toggle-sequence');
    if (btnSeq) {
      btnSeq.addEventListener('click', () => {
        this.store.setSequenceHighlighted(!state.isSequenceHighlighted);
      });
    }

    // Graph Filters
    const chkRisk = this.container.querySelector('#graph-filter-risk') as HTMLInputElement;
    const txtMinAmt = this.container.querySelector('#graph-filter-min-amt') as HTMLInputElement;
    if (chkRisk && txtMinAmt) {
      const updateGraphFilters = () => {
        this.store.setGraphFilters(Number(txtMinAmt.value) || 0, chkRisk.checked);
      };
      chkRisk.addEventListener('change', updateGraphFilters);
      txtMinAmt.addEventListener('input', updateGraphFilters);
    }

    // Map Metric Toggle
    const btnCount = this.container.querySelector('#btn-metric-count');
    const btnRate = this.container.querySelector('#btn-metric-rate');
    if (btnCount && btnRate) {
      btnCount.addEventListener('click', () => this.store.setMapMetric('COUNT'));
      btnRate.addEventListener('click', () => this.store.setMapMetric('RATE'));
    }

    // Navigate to Alert from inspector
    const btnNavAlert = this.container.querySelector('#btn-nav-to-alert');
    if (btnNavAlert) {
      btnNavAlert.addEventListener('click', (e) => {
        const alertId = (e.currentTarget as HTMLElement).getAttribute('data-alert-id');
        if (alertId) {
          this.activeTab = 'dashboard';
          this.store.selectAlert(alertId);
        }
      });
    }

    // Pivot graph
    const btnPivot = this.container.querySelector('#btn-pivot-account');
    if (btnPivot) {
      btnPivot.addEventListener('click', (e) => {
        const accId = (e.currentTarget as HTMLElement).getAttribute('data-acc-id');
        if (accId) this.store.loadGraphForAccount(accId);
      });
    }
  }
}
