import { useState, useEffect } from 'react';
import type { Alert, Transaction, InvestigationNote, DetectionResult } from './types/trace';
import {
  fetchHealth,
  fetchTransactions,
  fetchAlerts,
  fetchCaseDetail,
  updateCaseStatus,
  addCaseNote,
} from './services/api';
import { Header, TraceWorkspace } from './components/Header';
import { LandingLoginPage } from './components/Auth/LandingLoginPage';
import { InvestigateSidebar, InvestigateSubPage } from './components/Investigate/InvestigateSidebar';
import { ProtectMeSidebar, ProtectMeSubPage } from './components/ProtectMe/ProtectMeSidebar';
import { AnalyticsOverview } from './components/Analytics/AnalyticsOverview';
import { AnalystWorkbench } from './components/Investigate/AnalystWorkbench';
import { RiskRippleWorkspace } from './components/Investigate/RiskRippleWorkspace';
import { InvestigationMapPage } from './components/Investigate/InvestigationMapPage';
import { LedgerExplorer } from './components/Investigate/LedgerExplorer';
import { CSVBatchScoringPage } from './components/Investigate/CSVBatchScoringPage';
import { InvestigationQueuePage } from './components/Investigate/InvestigationQueuePage';
import { SecurityAlertsPage } from './components/Investigate/SecurityAlertsPage';
import { ThresholdsHealthPage } from './components/Investigate/ThresholdsHealthPage';
import { TraceAIChatPage } from './components/AI/TraceAIChatPage';
import { ConsumerSafetyView } from './components/ProtectMe/ConsumerSafetyView';
import { CallShieldPage } from './components/ProtectMe/CallShieldPage';
import { VerificationCenterPage } from './components/ProtectMe/VerificationCenterPage';
import { ScamShieldPage } from './components/ProtectMe/ScamShieldPage';
import { ProtectMeContainer } from './features/protect-me/components/ProtectMeContainer';
import { UploadModal } from './components/Common/UploadModal';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { AuthUserData } from './services/api';

export function App() {
  // Operational Role Selection (null shows role selector Landing page)
  const [currentRole, setCurrentRole] = useState<'analyst' | 'consumer' | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(null);

  // Two distinct products inside TRACE
  const [currentWorkspace, setCurrentWorkspace] = useState<TraceWorkspace>('investigate');
  const [investigateSubPage, setInvestigateSubPage] = useState<InvestigateSubPage>('overview');
  const [protectMeSubPage, setProtectMeSubPage] = useState<ProtectMeSubPage>('safety_overview');

  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [caseTransactions, setCaseTransactions] = useState<Transaction[]>([]);
  const [caseNotes, setCaseNotes] = useState<InvestigationNote[]>([]);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Dark / Light Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('trace_theme') !== 'light';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('trace_theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('trace_theme', 'light');
    }
  }, [isDarkMode]);

  // Initial load
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const health = await fetchHealth().catch(() => null);
      setIsBackendHealthy(health?.status === 'healthy');

      const [txsData, alertsData] = await Promise.all([
        fetchTransactions(),
        fetchAlerts(),
      ]);

      setTransactions(txsData);
      setAlerts(alertsData);

      if (alertsData.length > 0) {
        const firstCaseId = alertsData[0].case_id;
        setActiveCaseId(firstCaseId);
        await loadCaseDetail(firstCaseId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to TRACE Backend');
      setIsBackendHealthy(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaseDetail = async (caseId: string) => {
    try {
      const detail = await fetchCaseDetail(caseId);
      setCaseTransactions(detail.transactions);
      setCaseNotes(detail.notes);
    } catch (err) {
      console.error('Error fetching case detail:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectCase = async (caseId: string) => {
    setActiveCaseId(caseId);
    await loadCaseDetail(caseId);
  };

  const handleNoteAdded = (newNote: InvestigationNote) => {
    setCaseNotes((prev) => [...prev, newNote]);
  };

  const handleStatusChanged = async (caseId: string, newStatus: string) => {
    try {
      await updateCaseStatus(caseId, {
        case_id: caseId,
        status: newStatus,
        author: currentWorkspace === 'protect_me' ? 'Verified Consumer' : 'Lead Analyst',
        reason: `Updated via ${currentWorkspace === 'protect_me' ? 'Protect Me portal' : 'Investigate workbench'}`,
      });

      // Update in-memory alert status
      setAlerts((prev) =>
        prev.map((a) => (a.case_id === caseId ? { ...a, investigation_status: newStatus } : a))
      );
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleConsumerAction = async (
    caseId: string,
    actionType: 'CONFIRM_ME' | 'LOCK_ACCOUNT' | 'CALLBACK'
  ) => {
    const targetAlert = alerts.find((a) => a.case_id === caseId);
    const customer = targetAlert?.customer_id || 'Consumer';

    if (actionType === 'CONFIRM_ME') {
      await addCaseNote(caseId, {
        case_id: caseId,
        author: `Consumer (${customer})`,
        note: 'Customer confirmed via Protect Me portal: "Yes, I authorized these transfers."',
        status_change: 'RESOLVED_BENIGN',
      });
      handleStatusChanged(caseId, 'RESOLVED_BENIGN');
    } else if (actionType === 'LOCK_ACCOUNT') {
      await addCaseNote(caseId, {
        case_id: caseId,
        author: `Consumer (${customer})`,
        note: 'SECURITY LOCK ACTIVATED by customer: "I did not make these transfers. Account frozen."',
        status_change: 'ESCALATED',
      });
      handleStatusChanged(caseId, 'ESCALATED');
    } else if (actionType === 'CALLBACK') {
      await addCaseNote(caseId, {
        case_id: caseId,
        author: `Consumer (${customer})`,
        note: 'Customer requested a callback regarding this alert.',
      });
    }

    await loadCaseDetail(caseId);
  };

  const handleUploadSuccess = async (result: DetectionResult) => {
    setAlerts(result.alerts);
    const txs = await fetchTransactions();
    setTransactions(txs);
    if (result.alerts.length > 0) {
      const firstCaseId = result.alerts[0].case_id;
      setActiveCaseId(firstCaseId);
      await loadCaseDetail(firstCaseId);
    }
  };

  const handleSelectRoleFromLanding = (
    role: 'analyst' | 'consumer',
    selectedAccount?: string,
    user?: AuthUserData
  ) => {
    setCurrentRole(role);
    if (user) setCurrentUser(user);
    if (role === 'analyst') {
      setCurrentWorkspace('investigate');
      setInvestigateSubPage('overview');
    } else {
      setCurrentWorkspace('protect_me');
      setProtectMeSubPage('safety_overview');
    }
  };

  const criticalCount = alerts.filter((a) => a.priority === 'CRITICAL').length;
  const unresolvedAlerts = alerts.filter(
    (a) => a.investigation_status !== 'RESOLVED_BENIGN' && a.investigation_status !== 'CLOSED'
  ).length;

  const sampleAccounts = Array.from(new Set(transactions.map((t) => t.account_id))).slice(0, 5);

  // If user hasn't selected a role, render role selection landing page
  if (currentRole === null) {
    return (
      <LandingLoginPage
        onSelectRole={handleSelectRoleFromLanding}
        isBackendHealthy={isBackendHealthy}
        sampleAccounts={sampleAccounts}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-[#080D1B] text-[#F8FAFC]' : 'bg-[#F1F5F9] text-[#0F172A]'
      }`}
    >
      {/* Persistent Application Command Header */}
      <Header
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={(ws) => {
          setCurrentWorkspace(ws);
          setCurrentRole(ws === 'investigate' ? 'analyst' : 'consumer');
        }}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        isBackendHealthy={isBackendHealthy}
        activeCaseId={activeCaseId}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onSignOut={() => setCurrentRole(null)}
      />

      {/* Main Workspace Body: Dual-Navigation + Dedicated Subpages */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-[calc(100vh-64px)]">
        {/* Dedicated Sidebar for Current Product Experience */}
        {currentWorkspace === 'investigate' ? (
          <InvestigateSidebar
            activeSubPage={investigateSubPage}
            onSelectSubPage={setInvestigateSubPage}
            alertCount={alerts.length}
            criticalCount={criticalCount}
          />
        ) : (
          <ProtectMeSidebar
            activeSubPage={protectMeSubPage}
            onSelectSubPage={setProtectMeSubPage}
            unresolvedCount={unresolvedAlerts}
          />
        )}

        {/* Dedicated Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 cyber-grid overflow-y-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin mb-4" />
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                Initializing TRACE Intelligence Workspace
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 font-mono">
                Connecting shared contracts, alert graphs, and transaction rails...
              </p>
            </div>
          ) : error ? (
            <div className="bg-[#111A2E] border border-[#F43F5E]/60 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-3 shadow-xl">
              <AlertCircle className="w-10 h-10 text-[#F43F5E] mx-auto" />
              <h2 className="text-base font-bold text-[#F8FAFC]">Unable to Connect to Backend</h2>
              <p className="text-xs text-[#94A3B8]">{error}</p>
              <p className="text-xs text-[#94A3B8] font-mono">
                Ensure FastAPI backend is running on http://127.0.0.1:8001
              </p>
              <button
                onClick={loadInitialData}
                className="mt-4 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase rounded-xl inline-flex items-center gap-1.5 transition shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reconnect API
              </button>
            </div>
          ) : currentWorkspace === 'investigate' ? (
            /* TRACE INVESTIGATE (Analyst & Investigator Workstation) */
            <>
              {investigateSubPage === 'overview' && (
                <AnalyticsOverview
                  alerts={alerts}
                  transactions={transactions}
                  onSelectCase={handleSelectCase}
                  onNavigateToInvestigate={(caseId) => {
                    setInvestigateSubPage('workbench');
                    if (caseId) handleSelectCase(caseId);
                  }}
                  onNavigateToRiskRipple={() => setInvestigateSubPage('risk_ripple')}
                />
              )}

              {investigateSubPage === 'ledger' && (
                <LedgerExplorer transactions={transactions} alerts={alerts} />
              )}

              {investigateSubPage === 'batch_scoring' && (
                <CSVBatchScoringPage onScoringComplete={handleUploadSuccess} />
              )}

              {investigateSubPage === 'queue' && (
                <InvestigationQueuePage
                  alerts={alerts}
                  transactions={transactions}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                  onNavigateToWorkbench={(cid) => {
                    handleSelectCase(cid);
                    setInvestigateSubPage('workbench');
                  }}
                  onNavigateToRiskRipple={(cid) => {
                    handleSelectCase(cid);
                    setInvestigateSubPage('risk_ripple');
                  }}
                  onNavigateToAIChat={(cid) => {
                    handleSelectCase(cid);
                    setInvestigateSubPage('ai_chat');
                  }}
                  onStatusChanged={handleStatusChanged}
                />
              )}

              {investigateSubPage === 'risk_ripple' && (
                <RiskRippleWorkspace
                  transactions={transactions}
                  alerts={alerts}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                />
              )}

              {investigateSubPage === 'map' && (
                <InvestigationMapPage
                  transactions={transactions}
                  alerts={alerts}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                />
              )}

              {investigateSubPage === 'alerts' && (
                <SecurityAlertsPage
                  alerts={alerts}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                  onNavigateToWorkbench={(cid) => {
                    handleSelectCase(cid);
                    setInvestigateSubPage('workbench');
                  }}
                  onNavigateToRiskRipple={(cid) => {
                    handleSelectCase(cid);
                    setInvestigateSubPage('risk_ripple');
                  }}
                  onNavigateToAIChat={(cid) => {
                    handleSelectCase(cid);
                    setInvestigateSubPage('ai_chat');
                  }}
                />
              )}

              {investigateSubPage === 'ai_chat' && (
                <TraceAIChatPage
                  alerts={alerts}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                  mode="investigate"
                />
              )}

              {investigateSubPage === 'thresholds' && (
                <ThresholdsHealthPage isBackendHealthy={isBackendHealthy} />
              )}

              {investigateSubPage === 'workbench' && (
                <AnalystWorkbench
                  alerts={alerts}
                  transactions={transactions}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                  caseTransactions={caseTransactions}
                  caseNotes={caseNotes}
                  onNoteAdded={handleNoteAdded}
                  onStatusChanged={(newSt) => {
                    if (activeCaseId) handleStatusChanged(activeCaseId, newSt);
                  }}
                />
              )}
            </>
          ) : (
            /* TRACE PROTECT ME (Consumer Safety Platform) */
            <>
              {protectMeSubPage === 'safety_overview' && (
                <ConsumerSafetyView
                  alerts={alerts}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                  caseTransactions={caseTransactions}
                  onTakeAction={handleConsumerAction}
                  viewMode="overview"
                />
              )}

              {protectMeSubPage === 'my_transactions' && (
                <div className="rounded-2xl overflow-hidden border border-[#25324A] shadow-xl">
                  <ProtectMeContainer
                    enableLiveBackend={true}
                    apiBaseUrl=""
                    initialTab="transactions"
                  />
                </div>
              )}

              {protectMeSubPage === 'risk_analysis' && (
                <ConsumerSafetyView
                  alerts={alerts}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                  caseTransactions={caseTransactions}
                  onTakeAction={handleConsumerAction}
                  viewMode="risk_score"
                />
              )}

              {protectMeSubPage === 'callshield' && (
                <CallShieldPage />
              )}

              {protectMeSubPage === 'verification' && (
                <VerificationCenterPage />
              )}

              {protectMeSubPage === 'scamshield' && (
                <ScamShieldPage />
              )}

              {protectMeSubPage === 'safetyloop' && (
                <div className="rounded-2xl overflow-hidden border border-[#25324A] shadow-xl">
                  <ProtectMeContainer
                    enableLiveBackend={true}
                    apiBaseUrl=""
                    initialTab="safetyloop"
                  />
                </div>
              )}

              {protectMeSubPage === 'consumer_chat' && (
                <TraceAIChatPage
                  alerts={alerts}
                  activeCaseId={activeCaseId}
                  onSelectCase={handleSelectCase}
                  mode="protect_me"
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Dataset Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Desktop Command Footer */}
      <footer className="border-t border-[#25324A] bg-[#080D1B] py-3 text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#F8FAFC]">TRACE V2.0</span>
            <span className="text-[#25324A]">|</span>
            <span className="text-[11px] text-[#94A3B8]">
              Transaction Risk Analysis, Connectivity & Evidence &bull; Command Workstation
            </span>
          </div>
          <div className="font-mono text-[10px] text-[#94A3B8] flex items-center gap-3">
            <span>SURVEILLANCE WORKSTATION V2.0</span>
            <span className="text-[#25324A]">&bull;</span>
            <span className="text-[#2563EB]">CYBER INTELLIGENCE ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
