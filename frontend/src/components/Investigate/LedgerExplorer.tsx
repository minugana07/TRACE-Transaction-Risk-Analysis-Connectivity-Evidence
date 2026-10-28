import React, { useState, useMemo } from 'react';
import type { Transaction, Alert } from '../../types/trace';
import { Search, Database, ArrowUpDown, Filter, Download, Cpu, KeyRound } from 'lucide-react';
import { RuleBreakdownModal } from '../Common/RuleBreakdownModal';
import { VerificationModal } from '../Common/VerificationModal';

interface LedgerExplorerProps {
  transactions: Transaction[];
  alerts: Alert[];
}

export const LedgerExplorer: React.FC<LedgerExplorerProps> = ({
  transactions,
  alerts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'amount' | 'timestamp'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTxForAudit, setSelectedTxForAudit] = useState<Transaction | null>(null);
  const [selectedTxForVerify, setSelectedTxForVerify] = useState<Transaction | null>(null);


  const flaggedTxIds = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => {
      (a.related_transaction_ids || []).forEach((id) => set.add(id));
    });
    return set;
  }, [alerts]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedChannel !== 'ALL' && tx.channel.toUpperCase() !== selectedChannel.toUpperCase()) {
        return false;
      }
      if (selectedStatus === 'FLAGGED' && !flaggedTxIds.has(tx.id)) {
        return false;
      }
      if (selectedStatus === 'CLEAN' && flaggedTxIds.has(tx.id)) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          tx.id.toLowerCase().includes(term) ||
          tx.sender_id.toLowerCase().includes(term) ||
          tx.receiver_id.toLowerCase().includes(term) ||
          (tx.description && tx.description.toLowerCase().includes(term))
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      return sortOrder === 'desc'
        ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [transactions, selectedChannel, selectedStatus, searchTerm, sortBy, sortOrder, flaggedTxIds]);

  const totalVol = filtered.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40">
              Audit Telemetry
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              {filtered.length} of {transactions.length} Ledger Records
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            Global Settlement Transaction Ledger
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Full forensic ledger of all ingested payment rails, amounts, timestamps, and settlement flags.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[#94A3B8] uppercase text-[10px]">Filtered Volume:</span>
            <div className="text-base font-bold text-[#F8FAFC]">
              ₹{totalVol.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Tx ID, sender, receiver, memo..."
            className="w-full bg-[#080D1B] border border-[#25324A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-[#080D1B] border border-[#25324A] text-xs text-[#94A3B8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">All Rails</option>
            <option value="WIRE">Wire</option>
            <option value="CRYPTO">Crypto</option>
            <option value="ACH">ACH</option>
            <option value="CARD">Card</option>
            <option value="P2P">P2P</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#080D1B] border border-[#25324A] text-xs text-[#94A3B8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">All Risk Statuses</option>
            <option value="FLAGGED">Flagged Risk Only</option>
            <option value="CLEAN">Clean Transfers</option>
          </select>

          <button
            onClick={() => {
              if (sortBy === 'amount') {
                setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
              } else {
                setSortBy('amount');
                setSortOrder('desc');
              }
            }}
            className="px-3 py-2 bg-[#080D1B] hover:bg-[#16223B] border border-[#25324A] rounded-xl text-xs text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1.5 transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by Amount ({sortOrder.toUpperCase()})</span>
          </button>
        </div>
      </div>

      {/* Dense Forensic Table */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#25324A] bg-[#0A1020] text-[#94A3B8] uppercase text-[10px] tracking-wider font-mono">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Sender Account</th>
                <th className="py-3 px-4">Receiver Account</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Rail</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Audit &amp; Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#25324A]/60 font-mono text-[#F8FAFC]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#94A3B8] text-xs font-sans">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isFlagged = flaggedTxIds.has(tx.id);
                  return (
                    <tr key={tx.id} className="hover:bg-[#16223B]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#60A5FA]">{tx.id}</td>
                      <td className="py-3 px-4 text-[#94A3B8] text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#F8FAFC] font-semibold">{tx.sender_id}</td>
                      <td className="py-3 px-4 text-[#A78BFA] font-semibold">{tx.receiver_id}</td>
                      <td className="py-3 px-4 font-bold text-sm">
                        ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#080D1B] border border-[#25324A] text-[10px] text-[#94A3B8]">
                          {tx.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          onClick={() => setSelectedTxForAudit(tx)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer hover:opacity-80 transition ${
                            isFlagged
                              ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30'
                              : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                          }`}
                        >
                          {isFlagged ? 'FLAGGED RISK' : 'VERIFIED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8] text-[11px]">
                        {tx.geographic_data?.city
                          ? `${tx.geographic_data.city}, ${tx.geographic_data.country}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedTxForAudit(tx)}
                          className="px-2.5 py-1 text-[11px] font-sans font-semibold rounded-lg bg-[#2563EB]/15 hover:bg-[#2563EB]/30 text-[#60A5FA] border border-[#2563EB]/30 transition inline-flex items-center gap-1.5"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>Audit Rules</span>
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

      {/* Rule Breakdown Explainer Modal */}
      <RuleBreakdownModal
        isOpen={Boolean(selectedTxForAudit)}
        onClose={() => setSelectedTxForAudit(null)}
        transaction={selectedTxForAudit}
        alert={
          selectedTxForAudit
            ? alerts.find((a) => (a.related_transaction_ids || []).includes(selectedTxForAudit.id))
            : null
        }
        onOpenVerification={(tx) => {
          setSelectedTxForAudit(null);
          setSelectedTxForVerify(tx);
        }}
      />

      {/* Step-Up Challenge Verification Modal */}
      <VerificationModal
        isOpen={Boolean(selectedTxForVerify)}
        transaction={selectedTxForVerify}
        onClose={() => setSelectedTxForVerify(null)}
      />
    </div>
  );
};
