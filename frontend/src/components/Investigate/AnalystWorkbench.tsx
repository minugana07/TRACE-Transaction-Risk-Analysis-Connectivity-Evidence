import React, { useState } from 'react';
import type { Alert, Transaction, InvestigationNote } from '../../types/trace';
import { TraceAIPanel } from '../Common/TraceAIPanel';
import { HotspotMap } from '../Common/HotspotMap';
import { RiskRippleGraph } from './RiskRippleGraph';
import { CaseNotesPanel } from './CaseNotesPanel';
import { RuleBreakdownModal } from '../Common/RuleBreakdownModal';
import { VerificationModal } from '../Common/VerificationModal';
import {
  ShieldAlert,
  Search,
  Sparkles,
  Share2,
  MapPin,
  ListOrdered,
  FileText,
  DollarSign,
  Activity,
  Layers,
  Lock,
  CheckCircle,
  KeyRound,
  CheckCircle2,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface AnalystWorkbenchProps {
  alerts: Alert[];
  transactions: Transaction[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  caseTransactions: Transaction[];
  caseNotes: InvestigationNote[];
  onNoteAdded: (note: InvestigationNote) => void;
  onStatusChanged: (newStatus: string) => void;
}

export const AnalystWorkbench: React.FC<AnalystWorkbenchProps> = ({
  alerts,
  transactions,
  activeCaseId,
  onSelectCase,
  caseTransactions,
  caseNotes,
  onNoteAdded,
  onStatusChanged,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ai' | 'graph' | 'map' | 'txs' | 'notes'>('ai');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (priorityFilter !== 'ALL' && alert.priority.toUpperCase() !== priorityFilter.toUpperCase()) {
      return false;
    }
    if (statusFilter !== 'ALL' && alert.investigation_status.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        alert.case_id.toLowerCase().includes(term) ||
        alert.customer_id.toLowerCase().includes(term) ||
        alert.title.toLowerCase().includes(term) ||
        alert.triggered_rules.some((r) => r.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const activeAlert = alerts.find((a) => a.case_id === activeCaseId) || alerts[0];
  const criticalCount = alerts.filter((a) => a.priority === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.priority === 'HIGH').length;

  // Pipeline step calculation
  const pipelineSteps = ['OPEN / NEW', 'IN REVIEW', 'ESCALATED', 'RESOLVED'];
  let currentStepIdx = 0;
  if (activeAlert) {
    const st = activeAlert.investigation_status.toUpperCase();
    if (st === 'IN_PROGRESS' || st === 'IN_REVIEW') currentStepIdx = 1;
    else if (st === 'ESCALATED') currentStepIdx = 2;
    else if (st.includes('RESOLVED') || st === 'CLOSED') currentStepIdx = 3;
    else currentStepIdx = 0;
  }

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleEscalateTier2 = () => {
    if (!activeAlert) return;
    onStatusChanged('ESCALATED');
    onNoteAdded({
      id: `note-${Date.now()}`,
      case_id: activeAlert.case_id,
      author: 'Lead FinCrime Analyst',
      content: 'Case escalated to Senior Financial Crime Tier-2 SAR Investigation team.',
      timestamp: new Date().toISOString(),
      tags: ['ESCALATION', 'TIER_2'],
    });
    triggerFeedback('Case escalated to FinCrime Tier-2 management with audit log recorded.');
  };

  const handleFreezeAccount = () => {
    if (!activeAlert) return;
    onNoteAdded({
      id: `note-${Date.now()}`,
      case_id: activeAlert.case_id,
      author: 'Risk Operations',
      content: `Protective account freeze initiated for suspect counterparty ${activeAlert.customer_id} pending SAR disclosure.`,
      timestamp: new Date().toISOString(),
      tags: ['ACCOUNT_FREEZE', 'PROTECTIVE_HOLD'],
    });
    triggerFeedback(`Protective account freeze applied for entity ${activeAlert.customer_id}.`);
  };

  const handleMarkFalsePositive = () => {
    if (!activeAlert) return;
    onStatusChanged('RESOLVED_BENIGN');
    onNoteAdded({
      id: `note-${Date.now()}`,
      case_id: activeAlert.case_id,
      author: 'Lead FinCrime Analyst',
      content: 'Investigation concluded. Verified legitimate user pattern; marked as benign false positive.',
      timestamp: new Date().toISOString(),
      tags: ['RESOLVED', 'FALSE_POSITIVE'],
    });
    triggerFeedback('Case marked as false positive and resolved benign.');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top 4 KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-xl">
          <div className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wider font-mono">
            Evaluated Ledger Records
          </div>
          <div className="text-2xl font-black font-mono text-[#F8FAFC] mt-1 tabular-nums">
            {transactions.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#2563EB] mt-0.5 font-mono">100% Ingested Rails</div>
        </div>

        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-xl">
          <div className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wider font-mono">
            Active Priority Cases
          </div>
          <div className="text-2xl font-black font-mono text-[#60A5FA] mt-1 tabular-nums">
            {alerts.length}
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-0.5">
            <span className="text-[#F43F5E] font-bold">{criticalCount} Critical</span> &bull;{' '}
            <span className="text-[#F59E0B] font-bold">{highCount} High</span>
          </div>
        </div>

        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-xl">
          <div className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wider font-mono">
            Flagged Transactions
          </div>
          <div className="text-2xl font-black font-mono text-[#F59E0B] mt-1 tabular-nums">
            {Array.from(new Set(alerts.flatMap((a) => a.related_transaction_ids))).length}
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-0.5">Linked to audit evidence</div>
        </div>

        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-xl">
          <div className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wider font-mono">
            Max Risk Priority Score
          </div>
          <div className="text-2xl font-black font-mono text-[#F43F5E] mt-1 tabular-nums">
            {alerts.length > 0 ? Math.max(...alerts.map((a) => a.risk_score)).toFixed(0) : 0}
            <span className="text-xs text-[#94A3B8] font-normal">/100</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-0.5 font-mono">Urgency score (not probability)</div>
        </div>
      </div>


      {/* Main Two-Column Layout (4 cols Queue + 8 cols Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Triage Queue (4 cols) */}
        <div className="lg:col-span-4 bg-[#0C182B] border border-[#1E314B] rounded-lg p-4 shadow space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E314B]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#06B6D4]" />
              <h2 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                Investigation Queue
              </h2>
            </div>
            <span className="text-xs bg-[#08101E] text-[#06B6D4] font-mono px-2 py-0.5 rounded border border-[#1E314B]">
              {filteredAlerts.length} Cases
            </span>
          </div>

          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search case, entity, or rule..."
                className="w-full bg-[#08101E] border border-[#1E314B] rounded pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#06B6D4]"
              />
            </div>

            <div className="flex gap-2 text-xs">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-1/2 bg-[#08101E] border border-[#1E314B] rounded px-2 py-1 text-[#94A3B8] text-[11px] focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-1/2 bg-[#08101E] border border-[#1E314B] rounded px-2 py-1 text-[#94A3B8] text-[11px] focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED_BENIGN">Resolved Benign</option>
                <option value="RESOLVED_FRAUD">Resolved Fraud</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Alert Cards List */}
          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-10 text-[#94A3B8] text-xs">
                No alerts matching current filters.
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = activeAlert && activeAlert.case_id === alert.case_id;

                let badgeColor = 'bg-[#080D1B] text-[#94A3B8] border border-[#25324A]';
                if (alert.priority === 'CRITICAL') {
                  badgeColor = 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40';
                } else if (alert.priority === 'HIGH') {
                  badgeColor = 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40';
                } else if (alert.priority === 'MEDIUM') {
                  badgeColor = 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40';
                }

                return (
                  <div
                    key={alert.case_id}
                    onClick={() => onSelectCase(alert.case_id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#16233B] border-[#2563EB] shadow-lg shadow-[#2563EB]/15 ring-1 ring-[#2563EB]/50'
                        : 'bg-[#111A2E] border-[#25324A] hover:border-[#2563EB]/50 hover:bg-[#16233B]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#60A5FA]">{alert.case_id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${badgeColor}`}>
                        Score {alert.risk_score.toFixed(0)}/100
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-[#F8FAFC] line-clamp-1">{alert.title}</h4>

                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-2">
                      <span className="font-mono text-[#F8FAFC]">Subject: {alert.customer_id}</span>
                      <span className="text-[10px] bg-[#080D1B] px-1.5 py-0.5 rounded text-[#60A5FA] font-mono border border-[#25324A]">
                        {alert.investigation_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mt-1.5 pt-1.5 border-t border-[#25324A]/70 font-mono">
                      <span>{alert.related_transaction_ids.length} linked txs</span>
                      <span>{alert.evidence.length} evidence items</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Case Inspector (8 cols) */}
        {activeAlert ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Action Feedback Toast */}
            {actionFeedback && (
              <div className="p-3.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{actionFeedback}</span>
              </div>
            )}

            {/* Case Header Banner */}
            <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#25324A]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 px-2 py-0.5 rounded font-bold">
                      {activeAlert.case_id}
                    </span>
                    <span className="text-xs font-mono text-[#94A3B8]">
                      Entity Subject: <b className="text-[#F8FAFC]">{activeAlert.customer_id}</b>
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-[#F8FAFC] mt-1">{activeAlert.title}</h1>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold font-mono">
                      Investigation Priority
                    </div>
                    <div className="text-xl font-black font-mono text-[#F43F5E] tabular-nums">
                      {activeAlert.risk_score.toFixed(0)}
                      <span className="text-xs text-[#94A3B8] font-normal">/100</span>
                    </div>
                  </div>

                  <select
                    value={activeAlert.investigation_status}
                    onChange={(e) => onStatusChanged(e.target.value)}
                    className="bg-[#080D1B] border border-[#25324A] text-xs text-[#F8FAFC] rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="NEW">Status: NEW</option>
                    <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                    <option value="ESCALATED">Status: ESCALATED</option>
                    <option value="RESOLVED_BENIGN">Status: RESOLVED BENIGN</option>
                    <option value="RESOLVED_FRAUD">Status: RESOLVED FRAUD</option>
                    <option value="CLOSED">Status: CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Sub-summary */}
              <p className="text-xs text-[#94A3B8] leading-relaxed">{activeAlert.summary}</p>

              {/* Visual Status Progression Pipeline Bar */}
              <div className="p-4 rounded-xl bg-[#080D1B] border border-[#25324A] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] pb-1 border-b border-[#25324A]/60">
                  <span className="uppercase tracking-wider font-semibold">Case Lifecycle Progression</span>
                  <span className="text-[#60A5FA]">Active Stage: {pipelineSteps[currentStepIdx]}</span>
                </div>
                <div className="flex items-center justify-between relative pt-2">
                  {pipelineSteps.map((st, i) => {
                    const isCompleted = i < currentStepIdx;
                    const isCurrent = i === currentStepIdx;
                    return (
                      <div key={st} className="flex-1 flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                            isCurrent
                              ? 'bg-[#2563EB] text-white ring-4 ring-[#2563EB]/25 shadow-lg shadow-[#2563EB]/40'
                              : isCompleted
                              ? 'bg-[#10B981] text-white shadow-sm shadow-[#10B981]'
                              : 'bg-[#111A2E] text-[#94A3B8] border border-[#25324A]'
                          }`}
                        >
                          {isCompleted ? '✓' : i + 1}
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold mt-1.5 text-center ${
                            isCurrent
                              ? 'text-[#60A5FA]'
                              : isCompleted
                              ? 'text-[#10B981]'
                              : 'text-[#94A3B8]/60'
                          }`}
                        >
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operational Action Workflow Bar */}
              <div className="p-3.5 rounded-xl bg-[#080D1B] border border-[#25324A] flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                  Operational Rapid Actions
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleEscalateTier2}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#F59E0B] border border-[#F59E0B]/40 transition flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Escalate to Tier-2 SAR</span>
                  </button>

                  <button
                    onClick={handleFreezeAccount}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F43F5E]/15 hover:bg-[#F43F5E]/25 text-[#F43F5E] border border-[#F43F5E]/40 transition flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze Counterparty</span>
                  </button>

                  <button
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#A78BFA] border border-[#7C3AED]/40 transition flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Request OTP Challenge</span>
                  </button>

                  <button
                    onClick={handleMarkFalsePositive}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark False Positive</span>
                  </button>
                </div>
              </div>

              {/* Triggered Rules & Explainable Rationale Pill Section */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#25324A]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-[#94A3B8] mr-1">Triggered Rules:</span>
                  {activeAlert.triggered_rules.map((rule, idx) => (
                    <span
                      key={idx}
                      onClick={() => setIsRuleModalOpen(true)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30 cursor-pointer hover:bg-[#F43F5E]/25 transition"
                    >
                      {rule}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setIsRuleModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#2563EB]/20 hover:bg-[#2563EB]/30 text-[#60A5FA] border border-[#2563EB]/40 transition flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Audit Signal Breakdown</span>
                </button>
              </div>

              {/* Inspector Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#25324A]">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide transition ${
                    activeTab === 'ai'
                      ? 'bg-[#2563EB] text-white font-bold shadow-lg shadow-[#2563EB]/25'
                      : 'bg-[#080D1B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#25324A]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> TRACE AI Brief
                </button>

                <button
                  onClick={() => setActiveTab('graph')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide transition ${
                    activeTab === 'graph'
                      ? 'bg-[#2563EB] text-white font-bold shadow-lg shadow-[#2563EB]/25'
                      : 'bg-[#080D1B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#25324A]'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" /> Risk Ripple Graph
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide transition ${
                    activeTab === 'map'
                      ? 'bg-[#2563EB] text-white font-bold shadow-lg shadow-[#2563EB]/25'
                      : 'bg-[#080D1B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#25324A]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> Hotspot Map
                </button>

                <button
                  onClick={() => setActiveTab('txs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide transition ${
                    activeTab === 'txs'
                      ? 'bg-[#2563EB] text-white font-bold shadow-lg shadow-[#2563EB]/25'
                      : 'bg-[#080D1B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#25324A]'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" /> Transactions ({caseTransactions.length})
                </button>

                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide transition ${
                    activeTab === 'notes'
                      ? 'bg-[#2563EB] text-white font-bold shadow-lg shadow-[#2563EB]/25'
                      : 'bg-[#080D1B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#25324A]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Case Notes ({caseNotes.length})
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            {activeTab === 'ai' && (
              <TraceAIPanel caseId={activeAlert.case_id} mode="investigate" />
            )}

            {activeTab === 'graph' && (
              <RiskRippleGraph
                transactions={caseTransactions}
                customerSubjectId={activeAlert.customer_id}
              />
            )}

            {activeTab === 'map' && (
              <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-sm font-semibold text-[#F8FAFC]">
                      Verified Case Geolocation Hotspots
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#94A3B8] font-mono">
                    Strict empirical coordinates from transaction payload
                  </span>
                </div>
                <HotspotMap transactions={caseTransactions} height="400px" />
              </div>
            )}

            {activeTab === 'txs' && (
              <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-sm font-semibold text-[#F8FAFC]">
                      Associated Transaction Audit Records
                    </h3>
                  </div>
                  <span className="text-xs text-[#94A3B8] font-mono">
                    Total Volume: ₹
                    {caseTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#25324A] text-[#94A3B8] uppercase tracking-wider text-[10px] bg-[#080D1B] font-mono">
                        <th className="py-2.5 px-3">Tx ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Sender &rarr; Receiver</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#25324A]/60 font-mono">
                      {caseTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#16233B] text-[#F8FAFC]">
                          <td className="py-2.5 px-3 font-bold text-[#60A5FA]">{tx.id}</td>
                          <td className="py-2.5 px-3 text-[#94A3B8] text-[11px]">
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[#60A5FA]">{tx.sender_id}</span>
                            <span className="text-[#94A3B8] mx-1.5">&rarr;</span>
                            <span className="text-[#A78BFA]">{tx.receiver_id}</span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#F8FAFC]">
                            ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-[#080D1B] border border-[#25324A] text-[10px] text-[#94A3B8]">
                              {tx.channel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#94A3B8] text-[11px]">
                            {tx.geographic_data?.city || tx.geographic_data?.country || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <CaseNotesPanel
                caseId={activeAlert.case_id}
                notes={caseNotes}
                currentStatus={activeAlert.investigation_status}
                onNoteAdded={onNoteAdded}
                onStatusChanged={onStatusChanged}
              />
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 bg-[#111A2E] border border-[#25324A] rounded-2xl p-12 text-center text-[#94A3B8]">
            Select a case from the queue to start investigating.
          </div>
        )}
      </div>

      {/* Rule Breakdown Explainer Modal */}
      <RuleBreakdownModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        transaction={caseTransactions[0] || null}
        alert={activeAlert}
        onOpenVerification={() => {
          setIsRuleModalOpen(false);
          setIsVerifyModalOpen(true);
        }}
      />

      {/* Step-Up Challenge Verification Modal */}
      <VerificationModal
        isOpen={isVerifyModalOpen}
        transaction={caseTransactions[0] || null}
        onClose={() => setIsVerifyModalOpen(false)}
        onVerified={() => {
          onStatusChanged('RESOLVED_BENIGN');
          triggerFeedback('Step-up authentication confirmed. Case resolved as verified user.');
        }}
      />
    </div>
  );
};
