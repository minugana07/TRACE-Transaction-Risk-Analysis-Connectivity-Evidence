import React from 'react';
import type { Transaction, Alert } from '../../types/trace';
import {
  X,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

export interface RuleEvaluationItem {
  rule_id: string;
  rule_name: string;
  category: string;
  triggered: boolean;
  score_contribution: number;
  explanation: string;
}

interface RuleBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  alert?: Alert | null;
  onOpenVerification?: (tx: Transaction) => void;
}

export const RuleBreakdownModal: React.FC<RuleBreakdownModalProps> = ({
  isOpen,
  onClose,
  transaction,
  alert,
  onOpenVerification,
}) => {
  if (!isOpen || (!transaction && !alert)) return null;

  const txId = transaction?.id || alert?.related_transaction_ids?.[0] || alert?.case_id || 'TX-AUDIT';
  const amount = transaction?.amount || 0;
  const channel = transaction?.channel || 'ONLINE';
  const city = transaction?.geographic_data?.city || 'Unknown';
  const riskScore = alert?.risk_score ?? (transaction && transaction.amount >= 50000 ? 88 : 25);
  const priority = alert?.priority || (riskScore >= 85 ? 'CRITICAL' : riskScore >= 70 ? 'HIGH' : 'LOW');

  // Executive threat narrative
  const explanation =
    alert?.summary ||
    (transaction?.amount && transaction.amount >= 50000
      ? `High-value capital movement of ₹${transaction.amount.toLocaleString()} on channel ${channel} flagged for structural review and step-up challenge.`
      : 'Deterministic rule evaluation completed across ingested rails. No active multi-hop mule contagion detected.');

  // Build evaluated rules list from alert or transaction facts
  const rulesList: RuleEvaluationItem[] = [
    {
      rule_id: 'R101_STRUCTURING_SMURFING',
      rule_name: 'Smurfing & Structuring Patterns',
      category: 'VELOCITY',
      triggered: alert ? alert.triggered_rules.some((r) => r.includes('STRUCTURING') || r.includes('R101')) : false,
      score_contribution: 35,
      explanation: 'Rapid successive transfers clustered just below regulatory cash transaction reporting thresholds.',
    },
    {
      rule_id: 'R202_IMPOSSIBLE_TRAVEL_SPEED',
      rule_name: 'Impossible Travel Physical Velocity',
      category: 'GEOSPATIAL',
      triggered: alert
        ? alert.triggered_rules.some((r) => r.includes('GEO') || r.includes('TRAVEL') || r.includes('R202'))
        : false,
      score_contribution: 40,
      explanation: 'Consecutive transactions separated by distances exceeding commercial aviation transit speeds (>800 km/h).',
    },
    {
      rule_id: 'R303_RAPID_MULE_DISPERSAL',
      rule_name: 'Rapid Multi-Hop Mule Dispersal',
      category: 'TOPOLOGY',
      triggered: alert
        ? alert.triggered_rules.some((r) => r.includes('MULE') || r.includes('DISPERSAL') || r.includes('R303'))
        : false,
      score_contribution: 30,
      explanation: 'Inflow funds systematically partitioned and dispersed to downstream intermediary nodes within minutes.',
    },
    {
      rule_id: 'R404_HIGH_VALUE_OUTLIER',
      rule_name: 'High-Value Outlier Anomaly',
      category: 'AMOUNT',
      triggered: amount >= 25000 || (alert ? alert.risk_score >= 80 : false),
      score_contribution: 20,
      explanation: `Transaction volume (₹${amount.toLocaleString()}) substantially exceeds baseline historical account mean.`,
    },
    {
      rule_id: 'R505_HIGH_RISK_CHANNEL',
      rule_name: 'Unfamiliar Device / High-Risk Channel Rail',
      category: 'CHANNEL',
      triggered: channel === 'CRYPTO_RAMP' || channel === 'WIRE' || channel === 'ATM',
      score_contribution: 15,
      explanation: `Payment routed via expedited or irreversible settlement channel (${channel}).`,
    },
  ];

  const triggeredCount = rulesList.filter((r) => r.triggered).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#080D1B] border border-[#25324A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#25324A] bg-[#111A2E]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#60A5FA]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                Explainable Risk Audit
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#080D1B] text-[#60A5FA] border border-[#25324A]">
                  {txId}
                </span>
              </h2>
              <p className="text-xs text-[#94A3B8]">Deterministic rule evaluations &amp; signal telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A2E] border border-transparent hover:border-[#25324A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto font-sans">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#111A2E] border border-[#25324A]">
            <div>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold font-mono">
                Composite Fraud Score
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={`text-sm font-mono font-black px-2.5 py-1 rounded-lg ${
                    riskScore >= 85
                      ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                      : riskScore >= 70
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                  }`}
                >
                  SCORE: {riskScore.toFixed(0)}/100
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    priority === 'CRITICAL'
                      ? 'bg-[#F43F5E]/20 text-[#F43F5E]'
                      : priority === 'HIGH'
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      : 'bg-[#10B981]/20 text-[#10B981]'
                  }`}
                >
                  {priority} PRIORITY
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-mono">Transfer Amount</p>
              <p className="text-xl font-bold font-mono text-[#F8FAFC] mt-0.5">
                ₹{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-[#94A3B8] font-mono">
                Rail: <span className="text-[#A78BFA]">{channel}</span> &bull; {city}
              </p>
            </div>
          </div>

          {/* AI Threat Narrative */}
          <div className="p-4 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/30 space-y-1.5">
            <div className="flex items-center gap-2 text-[#60A5FA] text-xs font-semibold uppercase tracking-wider font-mono">
              <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
              Executive Threat Narrative
            </div>
            <p className="text-xs leading-relaxed text-[#F8FAFC]/90">
              {explanation}
            </p>
          </div>

          {/* Rule Breakdown List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] font-mono">
                Evaluated Forensic Rules ({triggeredCount} Triggered of {rulesList.length})
              </h3>
              <span className="text-[10px] text-[#94A3B8] font-mono">Deterministic Weights</span>
            </div>

            <div className="space-y-2.5">
              {rulesList.map((rule) => (
                <div
                  key={rule.rule_id}
                  className={`p-3.5 rounded-xl border transition ${
                    rule.triggered
                      ? 'bg-[#F43F5E]/10 border-[#F43F5E]/30'
                      : 'bg-[#111A2E]/50 border-[#25324A]/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {rule.triggered ? (
                        <AlertTriangle className="w-4 h-4 text-[#F43F5E] shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                      )}
                      <span className="text-xs font-bold text-[#F8FAFC]">{rule.rule_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#080D1B] text-[#94A3B8] border border-[#25324A]">
                        {rule.category}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        rule.triggered
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E]'
                          : 'bg-[#080D1B] text-[#94A3B8]'
                      }`}
                    >
                      {rule.triggered ? `+${rule.score_contribution} pts` : '0 pts'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] pl-6 leading-relaxed">
                    {rule.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#25324A] bg-[#111A2E]/80">
          <p className="text-xs text-[#94A3B8] font-mono">
            Audit Record: <span className="text-[#F8FAFC]">{txId}</span>
          </p>
          <div className="flex items-center gap-2.5">
            {transaction && onOpenVerification && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVerification(transaction);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition flex items-center gap-1.5 shadow-lg shadow-[#7C3AED]/20"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Issue Step-Up OTP</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-[#080D1B] border border-[#25324A] hover:bg-[#111A2E] text-[#F8FAFC] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
