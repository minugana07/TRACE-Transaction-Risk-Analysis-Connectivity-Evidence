/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * TransactionCard - Accessible consumer card view for transactions
 */

import React from 'react';
import { Transaction } from '../../contracts/transaction';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

interface TransactionCardProps {
  transaction: Transaction;
  onSelect: (txn: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onSelect
}) => {
  const { highContrast } = useAccessibility();
  const det = transaction.detectionResult;
  const isCritical = det?.riskLevel === 'CRITICAL';
  const isHigh = det?.riskLevel === 'HIGH';
  const isMed = det?.riskLevel === 'MEDIUM';

  const riskBadgeClass = isCritical
    ? 'bg-rose-600 text-white font-bold'
    : isHigh
    ? 'bg-amber-600 text-white font-bold'
    : isMed
    ? 'bg-yellow-500 text-black font-semibold'
    : 'bg-emerald-600 text-white font-semibold';

  const audioSummary = `Transaction of Rupees ${transaction.amount} to ${transaction.receiverAccountOrVpa}. Risk evaluation: ${
    det?.riskLevel || 'Safe'
  }. ${det?.plainLanguageExplanation || 'Standard retail transaction.'}`;

  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:shadow-md ${
        highContrast
          ? 'bg-black border-2 border-yellow-400 text-white'
          : isCritical
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
          : isHigh
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide ${riskBadgeClass}`}>
              {det?.riskLevel || 'SAFE'}
            </span>
            <span className="text-xs font-mono opacity-60">{transaction.id}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
              {transaction.paymentMethod}
            </span>
            {transaction.isSampleDemonstration && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                Sample Record
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">
              ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs opacity-75">to</span>
            <span className="font-mono text-sm font-semibold truncate max-w-[240px]" title={transaction.receiverAccountOrVpa}>
              {transaction.receiverAccountOrVpa}
            </span>
          </div>

          {transaction.note && (
            <p className="text-xs opacity-80 italic truncate">
              "{transaction.note}"
            </p>
          )}

          <div className="text-[11px] opacity-60">
            {new Date(transaction.timestamp).toLocaleDateString()} at {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-current/10">
          <VoiceReaderButton textToRead={audioSummary} label="Listen" />
          <button
            type="button"
            onClick={() => onSelect(transaction)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
                : isCritical || isHigh
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isCritical || isHigh ? 'Why Flagged? →' : 'Inspect Risk →'}
          </button>
        </div>
      </div>
    </div>
  );
};
