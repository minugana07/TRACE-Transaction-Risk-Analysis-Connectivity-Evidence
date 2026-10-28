import React, { useState } from 'react';
import type { Alert, Transaction, InvestigationNote } from '../../types/trace';
import { TraceAIPanel } from '../Common/TraceAIPanel';
import { HotspotMap } from '../Common/HotspotMap';
import { RiskRippleGraph } from './RiskRippleGraph';
import { CaseNotesPanel } from './CaseNotesPanel';
import {
  ShieldAlert,
  Search,
  Sparkles,
  Share2,
  MapPin,
  ListOrdered,
  FileText,
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

  return (
    <div className="space-y-6">
      {/* Top Metrics Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Total Evaluated Transactions
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {transactions.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active Dataset Records</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Active Priority Cases
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
            {alerts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {criticalCount} Critical &bull; {highCount} High Priority
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Flagged Transactions
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {Array.from(new Set(alerts.flatMap((a) => a.related_transaction_ids))).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tied to active investigations</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Max Investigation Priority
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {alerts.length > 0 ? Math.max(...alerts.map((a) => a.risk_score)).toFixed(0) : 0}/100
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Urgency score (not probability)</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Triage Queue (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-100">Investigation Queue</h2>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full">
              {filteredAlerts.length}
            </span>
          </div>

          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search case, entity, or rule..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 text-xs">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-[11px] focus:outline-none"
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
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-[11px] focus:outline-none"
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
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No alerts matching current filters.
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = activeAlert && activeAlert.case_id === alert.case_id;

                let badgeColor = 'bg-slate-700 text-slate-300';
                if (alert.priority === 'CRITICAL') badgeColor = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
                else if (alert.priority === 'HIGH') badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                else if (alert.priority === 'MEDIUM') badgeColor = 'bg-blue-500/20 text-blue-300 border border-blue-500/40';

                return (
                  <div
                    key={alert.case_id}
                    onClick={() => onSelectCase(alert.case_id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] text-slate-400">{alert.case_id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>
                          Priority {alert.risk_score.toFixed(0)}/100
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{alert.title}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span className="font-mono text-indigo-300">Entity: {alert.customer_id}</span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-medium">
                        {alert.investigation_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-800/60">
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
            {/* Case Header Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded">
                      {activeAlert.case_id}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Entity Subject: <b className="text-slate-200">{activeAlert.customer_id}</b>
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-100 mt-1">{activeAlert.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Investigation Priority
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-400">
                      {activeAlert.risk_score.toFixed(0)}
                      <span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>

                  <select
                    value={activeAlert.investigation_status}
                    onChange={(e) => onStatusChanged(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500"
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
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">{activeAlert.summary}</p>

              {/* Inspector Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-4 mt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'ai'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> TRACE AI Brief
                </button>

                <button
                  onClick={() => setActiveTab('graph')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'graph'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" /> Risk Ripple Graph
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'map'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> Hotspot Map
                </button>

                <button
                  onClick={() => setActiveTab('txs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'txs'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" /> Transactions ({caseTransactions.length})
                </button>

                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'notes'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> SQLite Notes ({caseNotes.length})
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Verified Case Geolocation Hotspots
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Strict empirical coordinates from transaction payload
                  </span>
                </div>
                <HotspotMap transactions={caseTransactions} height="400px" />
              </div>
            )}

            {activeTab === 'txs' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Associated Transaction Audit Records
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Total Volume: $
                    {caseTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Tx ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Sender &rarr; Receiver</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {caseTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/40 text-slate-200">
                          <td className="py-2.5 px-3 font-bold text-indigo-400">{tx.id}</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-blue-300">{tx.sender_id}</span>
                            <span className="text-slate-500 mx-1.5">&rarr;</span>
                            <span className="text-emerald-300">{tx.receiver_id}</span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-100">
                            ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                              {tx.channel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
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
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            Select a case from the queue to start investigating.
          </div>
        )}
      </div>
    </div>
  );
};
