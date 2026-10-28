/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * TransactionHistory - Search, filter, history views and detail inspection
 */

import React, { useState } from 'react';
import { Transaction } from '../../contracts/transaction';
import { TransactionCard } from './TransactionCard';
import { TransactionIngestion } from './TransactionIngestion';
import { RiskExplanationModal } from './RiskExplanationModal';
import { useAccessibility } from '../../context/AccessibilityContext';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onAddTransaction: (newTxn: Transaction) => void;
  onBatchAdded: (count: number) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onAddTransaction,
  onBatchAdded
}) => {
  const { highContrast } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'FLAGGED' | 'MODERATE' | 'SAFE'>('ALL');
  const [showIngestion, setShowIngestion] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    // Risk filter
    const risk = txn.detectionResult?.riskLevel || 'SAFE';
    if (filterRisk === 'FLAGGED' && risk !== 'CRITICAL' && risk !== 'HIGH') return false;
    if (filterRisk === 'MODERATE' && risk !== 'MEDIUM') return false;
    if (filterRisk === 'SAFE' && risk !== 'SAFE' && risk !== 'LOW') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = txn.id.toLowerCase().includes(q);
      const matchReceiver = txn.receiverAccountOrVpa.toLowerCase().includes(q);
      const matchPhone = txn.receiverPhone?.toLowerCase().includes(q);
      const matchNote = txn.note?.toLowerCase().includes(q);
      return matchId || matchReceiver || matchPhone || matchNote;
    }

    return true;
  });

  const flaggedTotal = transactions.filter(
    (t) => t.detectionResult?.riskLevel === 'CRITICAL' || t.detectionResult?.riskLevel === 'HIGH'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Ingestion Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Transaction History & Risk Status</h2>
          <p className="text-xs opacity-75 mt-0.5">
            Review past transfers, analyze incoming requests, and inspect flagged risk evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowIngestion(!showIngestion)}
          className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-sm ${
            showIngestion
              ? 'bg-slate-700 text-white'
              : highContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <span>{showIngestion ? '✕ Close Form' : '+ Ingest / Check Transaction'}</span>
        </button>
      </div>

      {/* Expandable Ingestion Section */}
      {showIngestion && (
        <div className="animate-fade-in">
          <TransactionIngestion
            onTransactionAdded={(txn) => {
              onAddTransaction(txn);
              setShowIngestion(false);
            }}
            onBatchAdded={(count) => {
              onBatchAdded(count);
              setShowIngestion(false);
            }}
          />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
        highContrast ? 'bg-black border-yellow-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by receiver, note, ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 ${
              highContrast
                ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400'
                : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
            }`}
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto" role="group" aria-label="Risk Filter">
          <button
            type="button"
            onClick={() => setFilterRisk('ALL')}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterRisk === 'ALL'
                ? highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRisk('FLAGGED')}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              filterRisk === 'FLAGGED'
                ? highContrast ? 'bg-yellow-400 text-black' : 'bg-rose-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span>Flagged ({flaggedTotal})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRisk('MODERATE')}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterRisk === 'MODERATE'
                ? highContrast ? 'bg-yellow-400 text-black' : 'bg-amber-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Moderate
          </button>
          <button
            type="button"
            onClick={() => setFilterRisk('SAFE')}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterRisk === 'SAFE'
                ? highContrast ? 'bg-yellow-400 text-black' : 'bg-emerald-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Safe
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className={`p-10 rounded-2xl border text-center ${
          highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="font-bold text-base">No Transactions Found</h3>
          <p className="text-xs opacity-75 mt-1 max-w-sm mx-auto">
            {searchQuery 
              ? `No records match "${searchQuery}". Try searching by another keyword or reset the filter.`
              : 'No transactions present in this risk category.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterRisk('ALL');
              }}
              className="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((txn) => (
            <TransactionCard
              key={txn.id}
              transaction={txn}
              onSelect={(selected) => setSelectedTransaction(selected)}
            />
          ))}
        </div>
      )}

      {/* Risk Explanation Modal */}
      <RiskExplanationModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};
