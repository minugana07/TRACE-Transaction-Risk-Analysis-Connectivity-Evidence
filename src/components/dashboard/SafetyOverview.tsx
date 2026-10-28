/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * SafetyOverview - Consumer Safety Dashboard
 */

import React from 'react';
import { Transaction, Alert } from '../../contracts/transaction';
import { useAccessibility } from '../../context/AccessibilityContext';
import { RecentAlertsBanner } from './RecentAlertsBanner';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

interface SafetyOverviewProps {
  transactions: Transaction[];
  alerts: Alert[];
  onNavigateTab: (tabId: 'dashboard' | 'transactions' | 'callshield' | 'scamshield' | 'safetyloop') => void;
  onSelectTransaction: (txn: Transaction) => void;
}

export const SafetyOverview: React.FC<SafetyOverviewProps> = ({
  transactions,
  alerts,
  onNavigateTab,
  onSelectTransaction
}) => {
  const { highContrast } = useAccessibility();

  // Transparent metrics calculated from actual transactions
  const totalCount = transactions.length;
  const criticalCount = transactions.filter(t => t.detectionResult?.riskLevel === 'CRITICAL').length;
  const highCount = transactions.filter(t => t.detectionResult?.riskLevel === 'HIGH').length;
  const flaggedCount = criticalCount + highCount;
  const safeCount = transactions.filter(t => t.detectionResult?.riskLevel === 'SAFE').length;

  // Derive safety status purely from actual data
  const hasSevereRisk = criticalCount > 0 || highCount > 0;

  const dashboardVoiceText = `TRACE Protect Me Dashboard. You have ${totalCount} recorded transactions. ${
    hasSevereRisk 
      ? `Attention: You have ${flaggedCount} flagged transactions requiring immediate review.` 
      : 'All current transactions are within standard risk thresholds.'
  } Four tools are ready: Transaction Checker, CallShield phone directory, ScamShield simulator, and Safety Loop concern matcher.`;

  return (
    <div className="space-y-6">
      {/* Header with Title and Read Aloud */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Protect Me - Consumer Safety</h1>
          <p className="text-sm opacity-80 mt-1">
            Real-time fraud defense, transaction clarity, and scam awareness powered by TRACE.
          </p>
        </div>
        <VoiceReaderButton textToRead={dashboardVoiceText} label="Listen to Overview" />
      </div>

      {/* Safety Status Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        highContrast
          ? 'bg-black border-2 border-yellow-400 text-white'
          : hasSevereRisk
          ? 'bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30 border-rose-200 dark:border-rose-900'
          : 'bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border-emerald-200 dark:border-emerald-900'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
              hasSevereRisk ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {hasSevereRisk ? '⚠️' : '🛡️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                  Consumer Shield Status
                </span>
                {transactions.some(t => t.isSampleDemonstration) && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Sample Data Active
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold mt-1">
                {hasSevereRisk 
                  ? 'Urgent: High Risk Pattern Flagged' 
                  : 'Your Payment Activity Appears Guarded'}
              </h2>
              <p className="text-sm opacity-85 mt-0.5">
                {hasSevereRisk
                  ? `TRACE has flagged ${flaggedCount} transaction(s) requiring caution. Review flagged items below.`
                  : 'No high-risk scams or unauthorized fund transfers detected in your recorded activity.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasSevereRisk ? (
              <button
                type="button"
                onClick={() => onNavigateTab('transactions')}
                className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
              >
                Review Flagged Items ({flaggedCount})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('transactions')}
                className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
              >
                Inspect Transactions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Tiles - Large Touch Targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('transactions')}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
            highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          role="button"
          tabIndex={0}
          aria-label="View all transactions"
        >
          <div className="flex items-center justify-between text-xs opacity-75 mb-1">
            <span>Total Evaluated</span>
            <span className="text-base">💳</span>
          </div>
          <div className="text-2xl font-bold">{totalCount}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Click to inspect history →</div>
        </div>

        <div 
          onClick={() => onNavigateTab('transactions')}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
            highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          role="button"
          tabIndex={0}
          aria-label="View flagged transactions"
        >
          <div className="flex items-center justify-between text-xs opacity-75 mb-1">
            <span>Flagged by TRACE</span>
            <span className="text-base">⚠️</span>
          </div>
          <div className={`text-2xl font-bold ${flaggedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'}`}>
            {flaggedCount}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
            {flaggedCount > 0 ? 'Review plain explanations' : 'Zero items flagged'}
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('callshield')}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
            highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Open CallShield Phone Check"
        >
          <div className="flex items-center justify-between text-xs opacity-75 mb-1">
            <span>CallShield Check</span>
            <span className="text-base">📞</span>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">Phone Directory</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Lookup suspect caller/SMS →</div>
        </div>

        <div 
          onClick={() => onNavigateTab('scamshield')}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
            highContrast ? 'bg-zinc-900 border-yellow-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Open ScamShield interactive lessons"
        >
          <div className="flex items-center justify-between text-xs opacity-75 mb-1">
            <span>ScamShield Training</span>
            <span className="text-base">🎓</span>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">Interactive Lessons</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">Practice evasion scenarios →</div>
        </div>
      </div>

      {/* Active Alerts Banner */}
      <RecentAlertsBanner alerts={alerts} />

      {/* Quick Action Matrix */}
      <div className={`p-5 rounded-xl border ${
        highContrast ? 'bg-black border-yellow-400 text-white' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
      }`}>
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <span>⚡</span>
          <span>Consumer Protection Tools</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('callshield')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-colors min-h-[56px] ${
              highContrast 
                ? 'border-yellow-400 hover:bg-yellow-400/20' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500'
            }`}
          >
            <span className="text-xl">📞</span>
            <div>
              <div className="font-semibold text-sm">CallShield</div>
              <div className="text-xs opacity-75 mt-0.5">Check phone numbers against official registries and scam reports.</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('scamshield')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-colors min-h-[56px] ${
              highContrast 
                ? 'border-yellow-400 hover:bg-yellow-400/20' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-500'
            }`}
          >
            <span className="text-xl">🛡️</span>
            <div>
              <div className="font-semibold text-sm">ScamShield Simulator</div>
              <div className="text-xs opacity-75 mt-0.5">Interactive roleplays on UPI collect, power cuts, and fake support.</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('safetyloop')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-colors min-h-[56px] ${
              highContrast 
                ? 'border-yellow-400 hover:bg-yellow-400/20' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-500'
            }`}
          >
            <span className="text-xl">🔄</span>
            <div>
              <div className="font-semibold text-sm">Safety Loop</div>
              <div className="text-xs opacity-75 mt-0.5">Connect an unsolicited call or message to actual transaction evidence.</div>
            </div>
          </button>
        </div>
      </div>

      {/* Safety Principle Card */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <span className="text-base shrink-0">ℹ️</span>
        <div>
          <span className="font-bold">TRACE Consumer Safeguard Notice:</span> TRACE analyzes risk patterns, evidence, and connectivity to help protect you. TRACE will never ask for your UPI PIN, banking password, or SMS OTP. Entering your UPI PIN always transfers money out of your account.
        </div>
      </div>
    </div>
  );
};
