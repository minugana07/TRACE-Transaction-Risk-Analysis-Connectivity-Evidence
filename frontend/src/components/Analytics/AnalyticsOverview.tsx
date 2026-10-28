import React, { useState } from 'react';
import type { Alert, Transaction } from '../../types/trace';
import {
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Activity,
  Layers,
  ChevronRight,
  Info,
  DollarSign,
  Clock,
  Sparkles,
  BarChart2,
  CheckCircle,
  Share2,
} from 'lucide-react';

interface AnalyticsOverviewProps {
  alerts: Alert[];
  transactions: Transaction[];
  onSelectCase: (caseId: string) => void;
  onNavigateToInvestigate: (caseId?: string) => void;
  onNavigateToRiskRipple?: () => void;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  alerts,
  transactions,
  onSelectCase,
  onNavigateToInvestigate,
  onNavigateToRiskRipple,
}) => {
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Compute metrics strictly from real transactions
  const totalVolume = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  // Flagged transactions
  const flaggedTxIds = new Set<string>();
  alerts.forEach((a) => {
    (a.related_transaction_ids || []).forEach((id) => flaggedTxIds.add(id));
  });

  const flaggedTransactions = transactions.filter((t) => flaggedTxIds.has(t.id));
  const flaggedVolume = flaggedTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const flaggedPercentage = transactions.length > 0
    ? ((flaggedTransactions.length / transactions.length) * 100).toFixed(1)
    : '0';

  // Severity counts
  const criticalCount = alerts.filter((a) => a.priority === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.priority === 'HIGH').length;
  const mediumCount = alerts.filter((a) => a.priority === 'MEDIUM').length;
  const lowCount = alerts.filter((a) => a.priority === 'LOW').length;

  // Average transaction value
  const avgTxValue = transactions.length > 0 ? totalVolume / transactions.length : 0;

  // Triggered rule frequency
  const ruleCounts: Record<string, number> = {};
  alerts.forEach((a) => {
    (a.triggered_rules || []).forEach((r) => {
      ruleCounts[r] = (ruleCounts[r] || 0) + 1;
    });
  });
  const topRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);

  // Channel breakdown
  const channelData: Record<string, { total: number; volume: number; flagged: number }> = {};
  transactions.forEach((t) => {
    const ch = (t.channel || 'ONLINE').toUpperCase();
    if (!channelData[ch]) {
      channelData[ch] = { total: 0, volume: 0, flagged: 0 };
    }
    channelData[ch].total += 1;
    channelData[ch].volume += t.amount;
    if (flaggedTxIds.has(t.id)) {
      channelData[ch].flagged += 1;
    }
  });

  // Time-bucketed volume series for temporal bar chart
  const timeBuckets: { label: string; totalVol: number; flaggedVol: number; count: number }[] = [];
  if (transactions.length > 0) {
    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const bucketCount = 8;
    const chunkSize = Math.max(1, Math.ceil(sortedTxs.length / bucketCount));

    for (let i = 0; i < sortedTxs.length; i += chunkSize) {
      const slice = sortedTxs.slice(i, i + chunkSize);
      const firstDate = new Date(slice[0].timestamp);
      const label = firstDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const tVol = slice.reduce((sum, item) => sum + item.amount, 0);
      const fVol = slice.filter((item) => flaggedTxIds.has(item.id)).reduce((sum, item) => sum + item.amount, 0);
      timeBuckets.push({ label, totalVol: tVol, flaggedVol: fVol, count: slice.length });
    }
  }

  const maxBucketVolume = Math.max(...timeBuckets.map((b) => b.totalVol), 1);

  // Filtered alerts for triage table
  const filteredAlerts = alerts.filter((a) => {
    if (selectedPriority !== 'ALL' && a.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Financial Intelligence Header Strip */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40">
                SURVEILLANCE RADAR ACTIVE
              </span>
              <span className="text-xs text-[#94A3B8] font-mono">
                TELEMETRY FEED: 8001
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
              Financial Crime Analytics & Investigator Overview
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-3xl">
              Cross-entity flow surveillance, algorithmic velocity monitoring, and multi-hop counterparty network risk mapping.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {onNavigateToRiskRipple && (
              <button
                onClick={onNavigateToRiskRipple}
                className="px-3.5 py-2 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#A78BFA] border border-[#7C3AED]/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Risk Ripple Canvas</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToInvestigate()}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#2563EB]/25 transition"
            >
              <span>Dossier Workbench</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monitored Ledger Volume */}
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Total Ledger Volume
            </span>
            <span className="p-2 rounded-lg bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/30">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-[#F8FAFC] tabular-nums">
            ₹{totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#25324A] flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Verified Transfers</span>
            <span className="font-mono font-bold text-[#60A5FA]">{transactions.length} Records</span>
          </div>
        </div>

        {/* KPI 2: Suspicious & Flagged Exposure */}
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#F43F5E]">
              Flagged Risk Volume
            </span>
            <span className="p-2 rounded-lg bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-[#F43F5E] tabular-nums">
            ₹{flaggedVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#25324A] flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Exposure Ratio</span>
            <span className="font-mono font-bold text-[#F43F5E]">
              {totalVolume > 0 ? ((flaggedVolume / totalVolume) * 100).toFixed(1) : 0}% of Ledger
            </span>
          </div>
        </div>

        {/* KPI 3: Active Forensic Alerts */}
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Triage Alert Queue
            </span>
            <span className="p-2 rounded-lg bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-[#F8FAFC] tabular-nums">
            {alerts.length} <span className="text-xs font-normal text-[#94A3B8]">Cases</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#25324A] flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="text-[#F43F5E] font-semibold">{criticalCount} Critical</span>
            <span className="text-[#F59E0B] font-semibold">{highCount} High</span>
            <span className="text-[#60A5FA] font-semibold">{mediumCount + lowCount} Med/Low</span>
          </div>
        </div>

        {/* KPI 4: Mean Transaction Settlement */}
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Mean Transaction Value
            </span>
            <span className="p-2 rounded-lg bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/30">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-[#F8FAFC] tabular-nums">
            ₹{avgTxValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#25324A] flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Active Channels</span>
            <span className="font-mono font-bold text-[#60A5FA]">
              {Object.keys(channelData).length} Settlement Rails
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Intelligence Breakdown (7 cols + 5 cols Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Temporal Volume & Risk Distribution */}
        <div className="lg:col-span-7 bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#25324A]">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#F8FAFC] tracking-wide uppercase">
                Temporal Transaction Velocity & Suspicious Volume
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB] inline-block" />
                <span className="text-[#94A3B8] text-[11px]">Monitored Flow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E] inline-block" />
                <span className="text-[#F43F5E] text-[11px] font-semibold">Flagged Flow</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Aggregated settlement amounts chronologically derived from real transaction logs. Rose overlay indicates volume flagged by detection rules.
          </p>

          {/* Temporal Volume Chart */}
          <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[#25324A]">
            {timeBuckets.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#94A3B8]">
                No transactional records loaded. Ingest dataset to visualize temporal distribution.
              </div>
            ) : (
              timeBuckets.map((bucket, idx) => {
                const totalPct = Math.min(100, Math.max(12, (bucket.totalVol / maxBucketVolume) * 100));
                const flaggedPct = bucket.totalVol > 0 ? (bucket.flaggedVol / bucket.totalVol) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] text-[#94A3B8] font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                      ₹{Math.round(bucket.totalVol).toLocaleString()}
                    </div>
                    <div
                      className="w-full rounded-t relative bg-[#080D1B] overflow-hidden transition-all duration-300 group-hover:bg-[#16223B]"
                      style={{ height: `${totalPct}%` }}
                    >
                      <div
                        className="w-full bg-[#2563EB] absolute bottom-0 left-0 transition-all duration-500"
                        style={{ height: '100%' }}
                      />
                      {bucket.flaggedVol > 0 && (
                        <div
                          className="w-full bg-[#F43F5E] absolute bottom-0 left-0 transition-all duration-500"
                          style={{ height: `${flaggedPct}%` }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-mono mt-2 truncate w-full text-center">
                      {bucket.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 text-center text-xs text-[#94A3B8]">
            <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
              <div className="text-[10px] uppercase text-[#94A3B8]">Total Monitored Ledger</div>
              <div className="font-mono font-bold text-[#F8FAFC] text-sm mt-0.5">
                ₹{totalVolume.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
              <div className="text-[10px] uppercase text-[#F43F5E]">Total Flagged Volume</div>
              <div className="font-mono font-bold text-[#F43F5E] text-sm mt-0.5">
                ₹{flaggedVolume.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
              <div className="text-[10px] uppercase text-[#60A5FA]">Flagged Txn Ratio</div>
              <div className="font-mono font-bold text-[#60A5FA] text-sm mt-0.5">
                {flaggedPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Triggered Rules & Rail Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          {/* Top Triggered Forensic Rules */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
                <h2 className="text-sm font-bold text-[#F8FAFC] tracking-wide uppercase">
                  Triggered Forensic Rules
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#94A3B8]">{topRules.length} Active Rules</span>
            </div>

            <div className="space-y-2.5">
              {topRules.slice(0, 4).map(([ruleName, count]) => {
                const pct = alerts.length > 0 ? (count / alerts.length) * 100 : 0;
                return (
                  <div key={ruleName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#F8FAFC] truncate max-w-[220px]">
                        {ruleName}
                      </span>
                      <span className="font-mono text-[#F43F5E] font-bold">
                        {count} hits ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#080D1B] h-1.5 rounded-full overflow-hidden border border-[#25324A]">
                      <div
                        className="bg-gradient-to-r from-[#F43F5E] to-[#7C3AED] h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Rail Velocity Breakdown */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7C3AED]" />
                <h2 className="text-sm font-bold text-[#F8FAFC] tracking-wide uppercase">
                  Payment Settlement Rails
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#94A3B8]">
                {transactions.length} Transfers
              </span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(channelData).map(([channel, stats]) => {
                const volPct = totalVolume > 0 ? (stats.volume / totalVolume) * 100 : 0;
                return (
                  <div key={channel} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#F8FAFC]">{channel}</span>
                      <span className="font-mono text-[#60A5FA]">
                        ₹{stats.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({volPct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#080D1B] h-1.5 rounded-full overflow-hidden border border-[#25324A]">
                      <div
                        className="bg-[#2563EB] h-full rounded-full"
                        style={{ width: `${volPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Forensic Triage Queue */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#25324A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#F8FAFC] tracking-wide uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              Active Priority Investigation Queue
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Showing {filteredAlerts.length} of {alerts.length} prioritized cases awaiting forensic review.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8]">Filter Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-[#080D1B] border border-[#25324A] text-xs text-[#F8FAFC] rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#25324A] bg-[#0A1020] text-[#94A3B8] font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Priority / Risk Score</th>
                <th className="py-3 px-4">Subject Account</th>
                <th className="py-3 px-4">Transfers</th>
                <th className="py-3 px-4">Triggered Forensic Rule</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#25324A]/60 text-[#F8FAFC]">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#94A3B8]">
                    No cases match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isCritical = alert.priority === 'CRITICAL';
                  const isHigh = alert.priority === 'HIGH';

                  return (
                    <tr
                      key={alert.case_id}
                      className="hover:bg-[#16223B]/60 transition-colors cursor-pointer"
                      onClick={() => onNavigateToInvestigate(alert.case_id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#60A5FA]">
                        {alert.case_id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              isCritical
                                ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                                : isHigh
                                ? 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40'
                                : 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40'
                            }`}
                          >
                            {alert.priority}
                          </span>
                          <span className="font-mono text-xs text-[#94A3B8]">
                            Score: <b className="text-[#F8FAFC]">{alert.risk_score}</b>/100
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-[#F8FAFC]">
                        {alert.customer_id}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#94A3B8]">
                        {(alert.related_transaction_ids || []).length} Txs
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#080D1B] border border-[#25324A] text-[#94A3B8] font-mono">
                          {alert.triggered_rules[0] || 'Behavioral Shift'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-[#60A5FA]">
                          {alert.investigation_status || 'NEW'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(alert.case_id);
                            onNavigateToInvestigate(alert.case_id);
                          }}
                          className="px-3 py-1 bg-[#2563EB]/20 hover:bg-[#2563EB] text-[#60A5FA] hover:text-white font-bold rounded-lg text-[11px] uppercase transition border border-[#2563EB]/30"
                        >
                          Investigate &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
