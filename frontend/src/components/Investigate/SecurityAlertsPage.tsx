import React, { useState, useMemo } from 'react';
import type { Alert } from '../../types/trace';
import { RuleBreakdownModal } from '../Common/RuleBreakdownModal';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Share2,
  Sparkles,
  ShieldCheck,
  Terminal,
  Activity,
  Zap,
  Cpu,
} from 'lucide-react';

interface SecurityAlertsPageProps {
  alerts: Alert[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onNavigateToWorkbench: (caseId: string) => void;
  onNavigateToRiskRipple: (caseId: string) => void;
  onNavigateToAIChat: (caseId: string) => void;
}

export const SecurityAlertsPage: React.FC<SecurityAlertsPageProps> = ({
  alerts,
  activeCaseId,
  onSelectCase,
  onNavigateToWorkbench,
  onNavigateToRiskRipple,
  onNavigateToAIChat,
}) => {
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypology, setSelectedTypology] = useState<string>('ALL');
  const [selectedAlertForAudit, setSelectedAlertForAudit] = useState<Alert | null>(null);


  // Derive unique typologies
  const typologies = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => {
      if (a.pattern_type) set.add(a.pattern_type);
    });
    return Array.from(set);
  }, [alerts]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesPriority =
        selectedPriority === 'ALL' || alert.priority.toUpperCase() === selectedPriority.toUpperCase();

      const matchesTypology =
        selectedTypology === 'ALL' || alert.pattern_type === selectedTypology;

      const matchesSearch =
        alert.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.pattern_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.evidence_summary.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesPriority && matchesTypology && matchesSearch;
    });
  }, [alerts, selectedPriority, selectedTypology, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25324A] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40 shadow-lg shadow-[#F43F5E]/15">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Security Alerts & Forensic Triggers
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Automated rule engine detections, high-velocity smurfing flags, and mule nexus alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#111A2E] border border-[#25324A] text-[#94A3B8]">
            TOTAL ALERTS: <b className="text-[#F43F5E]">{alerts.length}</b> ACTIVE
          </span>
        </div>
      </div>

      {/* Typology Breakdown Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {typologies.slice(0, 4).map((typ, idx) => {
          const count = alerts.filter((a) => a.pattern_type === typ).length;
          const isSelected = selectedTypology === typ;
          return (
            <button
              key={idx}
              onClick={() => setSelectedTypology(isSelected ? 'ALL' : typ)}
              className={`p-3 rounded-xl border text-left transition ${
                isSelected
                  ? 'bg-[#16223B] border-[#2563EB] shadow-md ring-1 ring-[#2563EB]/40'
                  : 'bg-[#111A2E] border-[#25324A] hover:border-[#25324A]/80'
              }`}
            >
              <div className="text-[10px] font-mono text-[#94A3B8] truncate">{typ}</div>
              <div className="text-xl font-black text-[#F8FAFC] mt-0.5">{count} Cases</div>
              <div className="text-[10px] text-[#60A5FA] mt-0.5">Filter typology &rarr;</div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Priority Tabs */}
        <div className="flex items-center bg-[#080D1B] border border-[#25324A] p-1 rounded-xl">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                selectedPriority === p
                  ? p === 'CRITICAL'
                    ? 'bg-[#F43F5E] text-white shadow'
                    : 'bg-[#2563EB] text-white shadow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by Case ID, entity, or description..."
            className="w-full pl-9 pr-4 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-12 text-center text-xs text-[#94A3B8]">
            <ShieldCheck className="w-10 h-10 text-[#10B981] mx-auto mb-2 opacity-80" />
            <p>No security alerts found matching the current criteria.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.priority === 'CRITICAL';
            const isSelected = activeCaseId === alert.case_id;

            return (
              <div
                key={alert.case_id}
                onClick={() => onSelectCase(alert.case_id)}
                className={`bg-[#111A2E] border rounded-2xl p-4 sm:p-5 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                  isSelected
                    ? 'border-[#2563EB] ring-1 ring-[#2563EB]/40 bg-[#16223B]'
                    : isCritical
                    ? 'border-[#F43F5E]/40 hover:border-[#F43F5E]'
                    : 'border-[#25324A] hover:border-[#2563EB]/60'
                }`}
              >
                {/* Left Alert Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full ${
                        isCritical
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                          : 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40'
                      }`}
                    >
                      {alert.priority} PRIORITY
                    </span>

                    <span className="font-mono text-xs font-bold text-[#F8FAFC]">
                      {alert.case_id}
                    </span>

                    <span className="text-[10px] font-mono text-[#94A3B8] px-2 py-0.5 rounded bg-[#080D1B] border border-[#25324A]">
                      RISK SCORE: <b className={isCritical ? 'text-[#F43F5E]' : 'text-[#60A5FA]'}>{alert.risk_score}</b>/100
                    </span>

                    <span className="text-[10px] font-mono text-[#94A3B8] px-2 py-0.5 rounded bg-[#080D1B] border border-[#25324A]">
                      ENTITY: <b className="text-[#F8FAFC]">{alert.customer_id}</b>
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                    <span>{alert.pattern_type}</span>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed font-mono">
                    {alert.evidence_summary}
                  </p>
                </div>

                {/* Right Interactive Actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#25324A]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAlertForAudit(alert);
                    }}
                    className="px-3 py-2 bg-[#2563EB]/15 hover:bg-[#2563EB]/30 border border-[#2563EB]/30 text-[#60A5FA] text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                    title="Audit Deterministic Rule Breakdown"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Audit Rules</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToWorkbench(alert.case_id);
                    }}
                    className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#2563EB]/20 transition"
                  >
                    <span>Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToRiskRipple(alert.case_id);
                    }}
                    className="p-2 bg-[#080D1B] hover:bg-[#152037] border border-[#7C3AED]/40 text-[#A78BFA] rounded-xl transition"
                    title="Inspect in Risk Ripple Network"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToAIChat(alert.case_id);
                    }}
                    className="p-2 bg-[#080D1B] hover:bg-[#152037] border border-[#2563EB]/40 text-[#60A5FA] rounded-xl transition"
                    title="Examine with TRACE AI"
                  >
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rule Breakdown Explainer Modal */}
      <RuleBreakdownModal
        isOpen={Boolean(selectedAlertForAudit)}
        onClose={() => setSelectedAlertForAudit(null)}
        alert={selectedAlertForAudit}
      />
    </div>
  );
};
