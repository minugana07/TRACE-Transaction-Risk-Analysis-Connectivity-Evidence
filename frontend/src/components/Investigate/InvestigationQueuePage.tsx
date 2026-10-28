import React, { useState, useMemo } from 'react';
import type { Alert, Transaction } from '../../types/trace';
import {
  Briefcase,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Share2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';

interface InvestigationQueuePageProps {
  alerts: Alert[];
  transactions: Transaction[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onNavigateToWorkbench: (caseId: string) => void;
  onNavigateToRiskRipple: (caseId: string) => void;
  onNavigateToAIChat: (caseId: string) => void;
  onStatusChanged: (caseId: string, newStatus: string) => void;
}

export const InvestigationQueuePage: React.FC<InvestigationQueuePageProps> = ({
  alerts,
  transactions,
  activeCaseId,
  onSelectCase,
  onNavigateToWorkbench,
  onNavigateToRiskRipple,
  onNavigateToAIChat,
  onStatusChanged,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<Alert | null>(
    alerts.find((a) => a.case_id === activeCaseId) || alerts[0] || null
  );

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.pattern_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.evidence_summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === 'ALL' || alert.priority.toUpperCase() === priorityFilter.toUpperCase();

      const matchesStatus =
        statusFilter === 'ALL' ||
        (alert.investigation_status || 'NEW').toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [alerts, searchQuery, priorityFilter, statusFilter]);

  // Statistics
  const totalCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.priority === 'CRITICAL').length;
  const inProgressCount = alerts.filter((a) => a.investigation_status === 'IN_PROGRESS').length;
  const escalatedCount = alerts.filter((a) => a.investigation_status === 'ESCALATED').length;
  const resolvedCount = alerts.filter(
    (a) => a.investigation_status === 'RESOLVED_BENIGN' || a.investigation_status === 'CLOSED'
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25324A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40">
              <Briefcase className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                Investigation Queue & Case Triage
              </h1>
              <p className="text-xs text-[#94A3B8]">
                Central triage registry for flagged syndicates, mule rings, and behavioral anomalies
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#94A3B8] px-3 py-1.5 rounded-xl bg-[#111A2E] border border-[#25324A]">
            QUEUE SIZE: <b className="text-[#F8FAFC]">{filteredAlerts.length}</b> / {totalCount}
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg">
          <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Critical Alerts</div>
          <div className="text-2xl font-black text-[#F43F5E] mt-1">{criticalCount}</div>
          <div className="text-[10px] text-[#94A3B8] mt-1">Requires immediate freeze</div>
        </div>
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg">
          <div className="text-[10px] font-mono text-[#94A3B8] uppercase">In Progress</div>
          <div className="text-2xl font-black text-[#60A5FA] mt-1">{inProgressCount}</div>
          <div className="text-[10px] text-[#94A3B8] mt-1">Assigned to analysts</div>
        </div>
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg">
          <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Escalated to SAR</div>
          <div className="text-2xl font-black text-[#7C3AED] mt-1">{escalatedCount}</div>
          <div className="text-[10px] text-[#94A3B8] mt-1">Regulatory filing queue</div>
        </div>
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg">
          <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Resolved / Closed</div>
          <div className="text-2xl font-black text-[#10B981] mt-1">{resolvedCount}</div>
          <div className="text-[10px] text-[#94A3B8] mt-1">Audited benign or closed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Case ID, Customer, Typology or Evidence keywords..."
            className="w-full pl-10 pr-4 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-[#080D1B] border border-[#25324A] rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-[#94A3B8] text-[10px] uppercase font-mono">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111A2E]">All Severities</option>
              <option value="CRITICAL" className="bg-[#111A2E]">Critical</option>
              <option value="HIGH" className="bg-[#111A2E]">High</option>
              <option value="MEDIUM" className="bg-[#111A2E]">Medium</option>
              <option value="LOW" className="bg-[#111A2E]">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#080D1B] border border-[#25324A] rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-[#94A3B8] text-[10px] uppercase font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111A2E]">All Statuses</option>
              <option value="NEW" className="bg-[#111A2E]">New</option>
              <option value="IN_PROGRESS" className="bg-[#111A2E]">In Progress</option>
              <option value="ESCALATED" className="bg-[#111A2E]">Escalated</option>
              <option value="RESOLVED_BENIGN" className="bg-[#111A2E]">Resolved Benign</option>
              <option value="CLOSED" className="bg-[#111A2E]">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue Table & Selected Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts Table (2 cols) */}
        <div className="lg:col-span-2 bg-[#111A2E] border border-[#25324A] rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#25324A] flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              Active Triage Docket
            </h2>
            <span className="text-[11px] font-mono text-[#94A3B8]">
              Showing {filteredAlerts.length} cases
            </span>
          </div>

          <div className="overflow-x-auto divide-y divide-[#25324A]/60 flex-1 max-h-[580px] overflow-y-auto">
            {filteredAlerts.length === 0 ? (
              <div className="p-12 text-center text-[#94A3B8] text-xs space-y-2">
                <ShieldCheck className="w-8 h-8 text-[#10B981] mx-auto opacity-70" />
                <p>No cases match current filter criteria.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = selectedCaseDetail?.case_id === alert.case_id;
                const isCritical = alert.priority === 'CRITICAL';
                const status = alert.investigation_status || 'NEW';

                return (
                  <div
                    key={alert.case_id}
                    onClick={() => {
                      setSelectedCaseDetail(alert);
                      onSelectCase(alert.case_id);
                    }}
                    className={`p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#16223B] border-l-4 border-l-[#2563EB]'
                        : 'hover:bg-[#152037] border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-[#F8FAFC]">
                          {alert.case_id}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                              : 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40'
                          }`}
                        >
                          {alert.priority}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#080D1B] text-[#94A3B8] border border-[#25324A]">
                          SCORE: <b className={isCritical ? 'text-[#F43F5E]' : 'text-[#60A5FA]'}>{alert.risk_score}</b>
                        </span>
                      </div>

                      <div className="text-xs text-[#F8FAFC] font-semibold truncate">
                        {alert.pattern_type} &bull; <span className="text-[#94A3B8] font-normal">{alert.customer_id}</span>
                      </div>

                      <p className="text-[11px] text-[#94A3B8] line-clamp-1">
                        {alert.evidence_summary}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                          status === 'ESCALATED'
                            ? 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40'
                            : status === 'RESOLVED_BENIGN'
                            ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                            : status === 'IN_PROGRESS'
                            ? 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40'
                            : 'bg-[#111A2E] text-[#94A3B8] border border-[#25324A]'
                        }`}
                      >
                        {status}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToWorkbench(alert.case_id);
                        }}
                        className="text-[11px] text-[#60A5FA] hover:text-white flex items-center gap-1 font-semibold"
                      >
                        <span>Open Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Case Quick Inspector (1 col) */}
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-5 flex flex-col justify-between">
          {selectedCaseDetail ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#25324A] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] animate-pulse" />
                    <span className="font-mono text-sm font-black text-[#F8FAFC]">
                      {selectedCaseDetail.case_id}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080D1B] text-[#94A3B8] border border-[#25324A]">
                    {selectedCaseDetail.investigation_status || 'NEW'}
                  </span>
                </div>

                {/* Typology and Target */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#94A3B8]">Typology Pattern</div>
                  <div className="text-sm font-bold text-[#F8FAFC]">{selectedCaseDetail.pattern_type}</div>
                  <div className="text-xs text-[#94A3B8] font-mono">Entity Account: {selectedCaseDetail.customer_id}</div>
                </div>

                {/* Risk Gauge */}
                <div className="bg-[#080D1B] border border-[#25324A] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#94A3B8]">Calculated Risk Index:</span>
                    <span className="text-[#F43F5E] font-black text-sm">{selectedCaseDetail.risk_score} / 100</span>
                  </div>
                  <div className="w-full bg-[#111A2E] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        selectedCaseDetail.risk_score >= 80
                          ? 'bg-[#F43F5E]'
                          : selectedCaseDetail.risk_score >= 50
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#10B981]'
                      }`}
                      style={{ width: `${selectedCaseDetail.risk_score}%` }}
                    />
                  </div>
                </div>

                {/* Evidence Summary */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-[#94A3B8]">Evidence Synthesis</div>
                  <div className="bg-[#080D1B] border border-[#25324A] rounded-xl p-3 text-xs text-[#F8FAFC]/90 leading-relaxed font-mono">
                    {selectedCaseDetail.evidence_summary}
                  </div>
                </div>

                {/* Quick Status Setter */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-[#94A3B8]">Update Status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['IN_PROGRESS', 'ESCALATED', 'RESOLVED_BENIGN', 'CLOSED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => onStatusChanged(selectedCaseDetail.case_id, st)}
                        className={`text-[10px] font-mono font-bold py-1.5 px-2 rounded-lg border transition ${
                          selectedCaseDetail.investigation_status === st
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-[#080D1B] text-[#94A3B8] border-[#25324A] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-[#25324A]">
                <button
                  onClick={() => onNavigateToWorkbench(selectedCaseDetail.case_id)}
                  className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/25 transition"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Full Analyst Workbench</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onNavigateToRiskRipple(selectedCaseDetail.case_id)}
                    className="py-2 bg-[#111A2E] hover:bg-[#16223B] border border-[#7C3AED]/40 text-[#A78BFA] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Risk Ripple</span>
                  </button>
                  <button
                    onClick={() => onNavigateToAIChat(selectedCaseDetail.case_id)}
                    className="py-2 bg-[#111A2E] hover:bg-[#16223B] border border-[#2563EB]/40 text-[#60A5FA] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Ask TRACE AI</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[#94A3B8] text-xs">
              Select a case from the triage queue to inspect full telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
