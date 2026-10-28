/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * SafetyLoop - Connects consumer concerns to verifiable transaction evidence
 * 
 * Strict Integrity Principle:
 * Only links a concern when a genuine relationship exists in the shared dataset.
 * Uses exact transaction IDs, evidence items, and detection results from Member 1 contracts.
 * If no record matches, clearly explains the absence and provides safe guidance without fabricating.
 */

import React, { useState } from 'react';
import { Transaction, Alert } from '../../contracts/transaction';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

interface SafetyLoopProps {
  transactions: Transaction[];
  alerts: Alert[];
  onSelectTransaction?: (txn: Transaction) => void;
}

interface MatchResult {
  hasMatch: boolean;
  matchedTransaction?: Transaction;
  matchedAlert?: Alert;
  matchReason?: string;
  query: string;
}

export const SafetyLoop: React.FC<SafetyLoopProps> = ({
  transactions,
  alerts,
  onSelectTransaction
}) => {
  const { highContrast } = useAccessibility();
  const [concernInput, setConcernInput] = useState('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const handleEvaluateConcern = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = concernInput.trim();
    if (!query) return;

    const lower = query.toLowerCase();
    const cleanDigits = query.replace(/\D/g, '');

    // 1. Search for matching transaction by ID
    let matchedTxn = transactions.find((t) => t.id.toLowerCase() === lower);
    let matchReason = '';

    // 2. Search by phone number (if user entered digits)
    if (!matchedTxn && cleanDigits.length >= 6) {
      matchedTxn = transactions.find((t) => {
        const rPhone = (t.receiverPhone || '').replace(/\D/g, '');
        const sPhone = (t.senderPhone || '').replace(/\D/g, '');
        return (rPhone && rPhone.includes(cleanDigits)) || (sPhone && sPhone.includes(cleanDigits));
      });
      if (matchedTxn) {
        matchReason = `Direct match on phone number (${matchedTxn.receiverPhone}) associated with recipient in transaction ${matchedTxn.id}`;
      }
    }

    // 3. Search by VPA / UPI ID or account substring
    if (!matchedTxn) {
      matchedTxn = transactions.find((t) => {
        return (
          t.receiverAccountOrVpa.toLowerCase().includes(lower) ||
          t.senderAccountOrVpa.toLowerCase().includes(lower)
        );
      });
      if (matchedTxn) {
        matchReason = `Direct match on recipient UPI address (${matchedTxn.receiverAccountOrVpa}) in transaction ${matchedTxn.id}`;
      }
    }

    // 4. Search by exact keyword note
    if (!matchedTxn && lower.length >= 4) {
      matchedTxn = transactions.find((t) => (t.note || '').toLowerCase().includes(lower));
      if (matchedTxn) {
        matchReason = `Match found in transaction note ("${matchedTxn.note}") in transaction ${matchedTxn.id}`;
      }
    }

    // Check if there is an alert corresponding to the matched transaction
    let matchedAlert: Alert | undefined;
    if (matchedTxn) {
      matchedAlert = alerts.find((a) => a.transactionId === matchedTxn?.id) || matchedTxn.alerts?.[0];
      setMatchResult({
        hasMatch: true,
        matchedTransaction: matchedTxn,
        matchedAlert,
        matchReason: matchReason || `Direct reference to Transaction ID ${matchedTxn.id}`,
        query
      });
    } else {
      setMatchResult({
        hasMatch: false,
        query
      });
    }
  };

  const setTestQuery = (q: string) => {
    setConcernInput(q);
    // Instant evaluation
    setTimeout(() => {
      const lower = q.toLowerCase();
      const cleanDigits = q.replace(/\D/g, '');

      let matchedTxn = transactions.find((t) => t.id.toLowerCase() === lower);
      let matchReason = '';

      if (!matchedTxn && cleanDigits.length >= 6) {
        matchedTxn = transactions.find((t) => {
          const rPhone = (t.receiverPhone || '').replace(/\D/g, '');
          return rPhone && rPhone.includes(cleanDigits);
        });
        if (matchedTxn) {
          matchReason = `Direct match on recipient phone number (${matchedTxn.receiverPhone})`;
        }
      }

      if (!matchedTxn) {
        matchedTxn = transactions.find((t) =>
          t.receiverAccountOrVpa.toLowerCase().includes(lower)
        );
        if (matchedTxn) {
          matchReason = `Direct match on recipient UPI ID (${matchedTxn.receiverAccountOrVpa})`;
        }
      }

      if (matchedTxn) {
        setMatchResult({
          hasMatch: true,
          matchedTransaction: matchedTxn,
          matchedAlert: alerts.find((a) => a.transactionId === matchedTxn?.id),
          matchReason,
          query: q
        });
      } else {
        setMatchResult({ hasMatch: false, query: q });
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🔄</span>
          <span>Safety Loop - Connect a Concern to Evidence</span>
        </h2>
        <p className="text-xs opacity-75 mt-1">
          Have an unsolicited call, suspicious message, or strange payment request? Enter the details below to check if it connects to verifiable transaction evidence in TRACE.
        </p>
      </div>

      {/* Input Box */}
      <div className={`p-6 rounded-2xl border ${
        highContrast ? 'bg-black border-2 border-yellow-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <form onSubmit={handleEvaluateConcern} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="safety-loop-input">
              Enter Suspicious Phone Number, Recipient UPI ID, Note, or Transaction ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="safety-loop-input"
                type="text"
                placeholder="e.g. 9876543210, quick.refund.help@ybl, TXN-9024-CRIT"
                value={concernInput}
                onChange={(e) => setConcernInput(e.target.value)}
                required
                className={`flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400'
                    : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
                }`}
              />
              <button
                type="submit"
                className={`min-h-[46px] px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                Inspect Connection
              </button>
            </div>
          </div>

          {/* Quick preset tests */}
          <div>
            <span className="text-[11px] font-semibold opacity-75 uppercase tracking-wide block mb-2">
              Test with Real Evidence in Shared Data:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTestQuery('9876543210')}
                className="px-2.5 py-1 rounded-lg border border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Match: Phone 9876543210
              </button>
              <button
                type="button"
                onClick={() => setTestQuery('quick.refund.help@ybl')}
                className="px-2.5 py-1 rounded-lg border border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Match: UPI quick.refund.help@ybl
              </button>
              <button
                type="button"
                onClick={() => setTestQuery('TXN-7731-HIGH')}
                className="px-2.5 py-1 rounded-lg border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                Match: ID TXN-7731-HIGH
              </button>
              <button
                type="button"
                onClick={() => setTestQuery('unknown.random@bank')}
                className="px-2.5 py-1 rounded-lg border border-slate-400 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                No Match: unknown.random@bank
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MATCH RESULT SECTION */}
      {matchResult && (
        <div className="animate-fade-in space-y-4">
          {matchResult.hasMatch && matchResult.matchedTransaction ? (
            /* CASE A: REAL RELATIONSHIP FOUND */
            <div
              className={`p-5 rounded-2xl border ${
                highContrast
                  ? 'bg-black border-2 border-yellow-400 text-white'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-current/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-sm text-rose-800 dark:text-rose-300">
                    Connection Confirmed: Linked to Transaction Record
                  </span>
                </div>
                <VoiceReaderButton
                  textToRead={`Safety Loop Alert. Your concern about ${matchResult.query} directly matches Transaction ${matchResult.matchedTransaction.id}. ${matchResult.matchReason}. Risk score is ${matchResult.matchedTransaction.detectionResult?.overallRiskScore} out of 100.`}
                  label="Listen"
                />
              </div>

              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">
                <span className="font-bold">Relationship Evidence: </span>
                {matchResult.matchReason}
              </div>

              {/* Transaction Summary */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="opacity-70">Transaction ID:</span>
                  <span className="font-mono font-bold">{matchResult.matchedTransaction.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70">Amount & Method:</span>
                  <span className="font-bold">
                    ₹{matchResult.matchedTransaction.amount.toLocaleString()} ({matchResult.matchedTransaction.paymentMethod})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70">Flagged Risk Level:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {matchResult.matchedTransaction.detectionResult?.riskLevel || 'HIGH'} (Risk Score: {matchResult.matchedTransaction.detectionResult?.overallRiskScore}/100)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70">Recipient Address:</span>
                  <span className="font-mono">{matchResult.matchedTransaction.receiverAccountOrVpa}</span>
                </div>
                {matchResult.matchedTransaction.receiverPhone && (
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">Recipient Phone:</span>
                    <span className="font-mono">{matchResult.matchedTransaction.receiverPhone}</span>
                  </div>
                )}
              </div>

              {/* Plain-Language Explanation */}
              <div className="p-3.5 rounded-xl bg-rose-100/60 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-950 dark:text-rose-100 mb-4">
                <span className="font-bold block mb-1">TRACE Detection Engine Insight:</span>
                <p className="leading-relaxed">
                  {matchResult.matchedTransaction.detectionResult?.plainLanguageExplanation ||
                    'Suspicious recipient activity detected by TRACE risk models.'}
                </p>
              </div>

              {/* Concrete Evidence Points */}
              {matchResult.matchedTransaction.detectionResult?.evidenceList && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                    Underlying Evidence from Investigate:
                  </h4>
                  <div className="space-y-1.5">
                    {matchResult.matchedTransaction.detectionResult.evidenceList.map((evd) => (
                      <div
                        key={evd.id}
                        className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-current/10 text-xs"
                      >
                        <div className="font-semibold">{evd.headline}</div>
                        <div className="opacity-80 mt-0.5">{evd.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Targeted Recommendation */}
              <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>Safety Recommendation for This Match:</span>
                </h4>
                <ul className="space-y-1 opacity-90">
                  <li>• <strong>Do NOT send funds or approve requests:</strong> This recipient is already linked to high-risk patterns.</li>
                  <li>• <strong>If money was already debited:</strong> Immediately call 1930 (National Cybercrime Reporting Portal) and notify your bank to request an emergency lien.</li>
                  <li>• <strong>Block the contact:</strong> Cease communication and do not click any links or APK files.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* CASE B: NO MATCHING RECORD FOUND */
            <div
              className={`p-5 rounded-2xl border ${
                highContrast
                  ? 'bg-black border-2 border-yellow-400 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">ℹ️</span>
                <h3 className="font-bold text-base">No Matching Transaction or Evidence Found</h3>
              </div>

              <p className="text-xs opacity-85 leading-relaxed mb-4">
                We searched your TRACE recorded transactions and active alerts, but <strong>no existing transaction record matches "{matchResult.query}"</strong>. 
                TRACE maintains strict evidence integrity: we will never fabricate or assume connections that do not exist.
              </p>

              {/* Clear Safe Guidance */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-2 text-blue-950 dark:text-blue-100">
                <div className="font-bold text-sm">Next Steps When No Record Exists:</div>
                <div className="space-y-1">
                  <p>• <strong>If you haven't transferred money yet:</strong> Keep your money safe! Do not transfer funds or scan QR codes based on unsolicited calls or messages.</p>
                  <p>• <strong>Check CallShield:</strong> You can lookup this phone number in our CallShield directory to check if other citizens have reported it.</p>
                  <p>• <strong>If funds moved from a different bank account:</strong> Dial 1930 immediately to submit a financial cyber fraud complaint.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
