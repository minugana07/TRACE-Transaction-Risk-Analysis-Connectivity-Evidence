/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * ProtectMeContainer - Root Feature Container for Member 3
 * 
 * Embeddable inside Member 1's main app or router.
 */

import React, { useState, useEffect } from 'react';
import { Transaction, Alert } from '../contracts/transaction';
import { traceApi } from '../services/apiClient';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { AccessibilityBar } from './accessibility/AccessibilityBar';
import { SafetyOverview } from './dashboard/SafetyOverview';
import { TransactionHistory } from './transactions/TransactionHistory';
import { CallShieldLookup } from './callshield/CallShieldLookup';
import { ScamShieldHome } from './scamshield/ScamShieldHome';
import { SafetyLoop } from './safetyloop/SafetyLoop';

export type ProtectMeTab = 'dashboard' | 'transactions' | 'callshield' | 'scamshield' | 'safetyloop';

export interface ProtectMeContainerProps {
  initialTab?: ProtectMeTab;
  onNavigateParent?: (route: string) => void;
  apiBaseUrl?: string;
  enableLiveBackend?: boolean;
}

const ProtectMeInner: React.FC<ProtectMeContainerProps> = ({
  initialTab = 'dashboard',
  apiBaseUrl,
  enableLiveBackend
}) => {
  const [currentTab, setCurrentTab] = useState<ProtectMeTab>(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    if (apiBaseUrl) {
      traceApi.setLiveBackend(enableLiveBackend ?? true, apiBaseUrl);
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [txnList, alertList] = await Promise.all([
          traceApi.getTransactions(),
          traceApi.getAlerts()
        ]);
        setTransactions(txnList);
        setAlerts(alertList);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [apiBaseUrl, enableLiveBackend]);

  const handleAddTransaction = (newTxn: Transaction) => {
    setTransactions((prev) => [newTxn, ...prev]);
  };

  const handleBatchAdded = async () => {
    const refreshed = await traceApi.getTransactions();
    setTransactions(refreshed);
  };

  const flaggedCount = transactions.filter(
    (t) => t.detectionResult?.riskLevel === 'CRITICAL' || t.detectionResult?.riskLevel === 'HIGH'
  ).length;

  return (
    <div className="trace-protect-me-root min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Accessibility Bar */}
      <AccessibilityBar
        pageTitle="TRACE Protect Me"
        pageSummaryText="Consumer fraud protection suite. Ingest transactions, check caller phone numbers with CallShield, practice scam evasion in ScamShield, and connect concerns with Safety Loop."
      />

      {/* Main Navigation Header */}
      <header className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg tracking-wider shadow-sm">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight">TRACE</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Protect Me
                </span>
              </div>
              <p className="text-[11px] opacity-70">
                Transaction Risk Analysis, Connectivity & Evidence
              </p>
            </div>
          </div>

          {/* Tab Navigation Navigation Items (Large Touch Targets >= 44px) */}
          <nav className="flex items-center flex-wrap gap-1.5" aria-label="Protect Me Sections">
            <button
              type="button"
              onClick={() => setCurrentTab('dashboard')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              aria-current={currentTab === 'dashboard' ? 'page' : undefined}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('transactions')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              aria-current={currentTab === 'transactions' ? 'page' : undefined}
            >
              <span>💳</span>
              <span>Transactions</span>
              {flaggedCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {flaggedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('callshield')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'callshield'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              aria-current={currentTab === 'callshield' ? 'page' : undefined}
            >
              <span>📞</span>
              <span>CallShield</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('scamshield')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'scamshield'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              aria-current={currentTab === 'scamshield' ? 'page' : undefined}
            >
              <span>🛡️</span>
              <span>ScamShield</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('safetyloop')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'safetyloop'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              aria-current={currentTab === 'safetyloop' ? 'page' : undefined}
            >
              <span>🔄</span>
              <span>Safety Loop</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6" role="main">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center" role="status">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">Loading TRACE Safety Intelligence...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <SafetyOverview
                transactions={transactions}
                alerts={alerts}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onSelectTransaction={() => setCurrentTab('transactions')}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionHistory
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onBatchAdded={handleBatchAdded}
              />
            )}

            {currentTab === 'callshield' && <CallShieldLookup />}

            {currentTab === 'scamshield' && <ScamShieldHome />}

            {currentTab === 'safetyloop' && (
              <SafetyLoop
                transactions={transactions}
                alerts={alerts}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-4 py-4 text-center text-xs opacity-75">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TRACE Consumer Safety Experience • Member 3 Modular Component</span>
          <span>Never disclose UPI PIN or OTP • National Cybercrime Helpline: 1930</span>
        </div>
      </footer>
    </div>
  );
};

export const ProtectMeContainer: React.FC<ProtectMeContainerProps> = (props) => {
  return (
    <AccessibilityProvider>
      <ProtectMeInner {...props} />
    </AccessibilityProvider>
  );
};

export default ProtectMeContainer;
