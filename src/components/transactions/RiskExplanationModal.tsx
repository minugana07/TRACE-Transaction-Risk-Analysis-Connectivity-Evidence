/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * RiskExplanationModal - Plain-language breakdown of DetectionResult and Alert data
 */

import React, { useEffect } from 'react';
import { Transaction } from '../../contracts/transaction';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

interface RiskExplanationModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const RiskExplanationModal: React.FC<RiskExplanationModalProps> = ({
  transaction,
  onClose
}) => {
  const { highContrast } = useAccessibility();

  // Keyboard accessibility: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!transaction) return null;

  const det = transaction.detectionResult;
  const isCritical = det?.riskLevel === 'CRITICAL';
  const isHigh = det?.riskLevel === 'HIGH';
  const isMed = det?.riskLevel === 'MEDIUM';

  const speechText = `Risk explanation for transaction ${transaction.id}. Amount: Rupees ${transaction.amount}. Recipient: ${transaction.receiverAccountOrVpa}. Risk level is ${det?.riskLevel || 'unassessed'}. ${det?.plainLanguageExplanation || ''}. Key advice: Never enter your UPI PIN to receive money. For suspicious debits, contact 1930 immediately.`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-risk-title"
    >
      <div 
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
          highContrast 
            ? 'bg-black border-2 border-yellow-400 text-white' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-4 mb-4 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                isCritical
                  ? 'bg-rose-600 text-white'
                  : isHigh
                  ? 'bg-amber-600 text-white'
                  : isMed
                  ? 'bg-yellow-500 text-black'
                  : 'bg-emerald-600 text-white'
              }`}>
                {det?.riskLevel || 'SAFE'} RISK (Score: {det?.overallRiskScore ?? 0}/100)
              </span>
              {transaction.isSampleDemonstration && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                  Sample Demonstration
                </span>
              )}
            </div>
            <h2 id="modal-risk-title" className="text-xl font-bold mt-1.5">
              Why Was This Transaction Flagged?
            </h2>
            <p className="text-xs opacity-75 font-mono">
              Txn ID: {transaction.id} • {new Date(transaction.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <VoiceReaderButton textToRead={speechText} label="Listen" />
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div className={`p-3.5 rounded-xl border mb-5 text-sm ${
          highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="block opacity-70">Amount</span>
              <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="block opacity-70">Payment Method</span>
              <span className="font-semibold">{transaction.paymentMethod}</span>
            </div>
            <div>
              <span className="block opacity-70">Recipient</span>
              <span className="font-mono truncate block" title={transaction.receiverAccountOrVpa}>
                {transaction.receiverAccountOrVpa}
              </span>
            </div>
            <div>
              <span className="block opacity-70">Status</span>
              <span className="font-bold">{transaction.status}</span>
            </div>
          </div>
          {transaction.note && (
            <div className="mt-2 pt-2 border-t border-dashed border-current/20 text-xs">
              <span className="opacity-70 font-medium">Transaction Note: </span>
              <span className="italic">"{transaction.note}"</span>
            </div>
          )}
        </div>

        {/* Plain Language Explanation */}
        <div className="space-y-4 mb-6">
          <div className={`p-4 rounded-xl border ${
            isCritical
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-200'
              : isHigh
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
          }`}>
            <h3 className="font-bold text-sm mb-1 flex items-center gap-1.5">
              <span>{isCritical || isHigh ? '⚠️' : '✓'}</span>
              <span>Consumer Summary</span>
            </h3>
            <p className="text-sm leading-relaxed">
              {det?.plainLanguageExplanation || 'Standard evaluation completed. No severe risk patterns observed.'}
            </p>
          </div>

          {/* Evidence Breakdown */}
          {det?.evidenceList && det.evidenceList.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 opacity-80">
                Evidence Observed by TRACE ({det.evidenceList.length})
              </h3>
              <div className="space-y-2">
                {det.evidenceList.map((evd) => (
                  <div
                    key={evd.id}
                    className={`p-3 rounded-xl border text-xs ${
                      highContrast 
                        ? 'border-yellow-400 bg-zinc-900' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm">{evd.headline}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        evd.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        {evd.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="opacity-90 leading-normal">{evd.detail}</p>
                    {evd.confidenceScore && (
                      <span className="text-[10px] opacity-60 mt-1 block">
                        Engine Confidence: {Math.round(evd.confidenceScore * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graph Insights if present */}
          {det?.graphInsights && (
            <div className={`p-3.5 rounded-xl border text-xs ${
              highContrast ? 'border-yellow-400 bg-zinc-900' : 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20'
            }`}>
              <h4 className="font-bold text-sm mb-1.5 text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <span>🕸️</span>
                <span>Connectivity & Graph Insights</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="opacity-70">Mule Cluster Match:</span>{' '}
                  <span className="font-bold">{det.graphInsights.isMuleAccount ? 'Yes (Mule Wallet)' : 'No'}</span>
                </div>
                <div>
                  <span className="opacity-70">Distance to Known Fraud:</span>{' '}
                  <span className="font-bold">{det.graphInsights.hopsFromKnownScammer ?? 'N/A'} Hop(s)</span>
                </div>
                {det.graphInsights.associatedReportCount !== undefined && (
                  <div>
                    <span className="opacity-70">Citizen Reports:</span>{' '}
                    <span className="font-bold">{det.graphInsights.associatedReportCount} Complaint(s)</span>
                  </div>
                )}
                {det.graphInsights.clusterTag && (
                  <div>
                    <span className="opacity-70">Cluster Tag:</span>{' '}
                    <span className="font-mono font-semibold">{det.graphInsights.clusterTag}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Steps for Safe Action */}
          <div className={`p-4 rounded-xl border ${
            highContrast ? 'border-yellow-400 bg-black text-white' : 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30'
          }`}>
            <h4 className="font-bold text-sm mb-2 text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Practical Next Steps</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">1.</span>
                <span><strong>Never Enter PIN:</strong> You never need to enter your UPI PIN or password to receive refunds, prizes, or customer support credits.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">2.</span>
                <span><strong>Contact Bank Directly:</strong> If funds were sent by mistake or extortion, call the phone number printed on the back of your official debit/credit card immediately.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">3.</span>
                <span><strong>Report to Helpline 1930:</strong> Call 1930 (National Cybercrime Reporting Helpline) within 2-3 hours to initiate emergency lien hold on beneficiary accounts.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] px-6 py-2 rounded-xl font-semibold text-sm transition-all ${
              highContrast 
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold' 
                : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
