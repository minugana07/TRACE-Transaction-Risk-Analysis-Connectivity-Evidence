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
import { Header } from './components/Header';
import { AnalystWorkbench } from './components/Investigate/AnalystWorkbench';
import { InvestigateModuleView } from './components/Investigate/InvestigateModuleView';
import { ConsumerSafetyView } from './components/ProtectMe/ConsumerSafetyView';
import { ProtectMeContainer } from './features/protect-me/components/ProtectMeContainer';
import { UploadModal } from './components/Common/UploadModal';
import { Loader2, AlertCircle, RefreshCw, Network, ShieldCheck, Activity, PhoneCall } from 'lucide-react';

export function App() {
  const [currentMode, setCurrentMode] = useState<'investigate' | 'protect_me'>('investigate');
  const [investigateSubTab, setInvestigateSubTab] = useState<'workbench' | 'deep_dive'>('workbench');
  const [protectMeSubTab, setProtectMeSubTab] = useState<'portal' | 'suite'>('portal');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [caseTransactions, setCaseTransactions] = useState<Transaction[]>([]);
  const [caseNotes, setCaseNotes] = useState<InvestigationNote[]>([]);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

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

  const handleStatusChanged = async (newStatus: string) => {
    if (!activeCaseId) return;
    try {
      await updateCaseStatus(activeCaseId, {
        case_id: activeCaseId,
        status: newStatus,
        author: currentMode === 'protect_me' ? 'Verified Consumer' : 'Lead Analyst',
        reason: `Updated via ${currentMode === 'protect_me' ? 'Protect Me portal' : 'Investigate workbench'}`,
      });

      // Update in-memory alert status
      setAlerts((prev) =>
        prev.map((a) => (a.case_id === activeCaseId ? { ...a, investigation_status: newStatus } : a))
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
      handleStatusChanged('RESOLVED_BENIGN');
    } else if (actionType === 'LOCK_ACCOUNT') {
      await addCaseNote(caseId, {
        case_id: caseId,
        author: `Consumer (${customer})`,
        note: 'SECURITY LOCK ACTIVATED by customer: "I did not make these transfers. Account frozen."',
        status_change: 'ESCALATED',
      });
      handleStatusChanged('ESCALATED');
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Persistent Application Header */}
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        isBackendHealthy={isBackendHealthy}
        activeCaseId={activeCaseId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <h3 className="text-base font-semibold text-slate-200">Connecting to TRACE Engine</h3>
            <p className="text-xs text-slate-400 mt-1">
              Loading shared contracts, active alerts, and transaction records...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/30 border border-rose-800/80 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-base font-bold text-rose-200">Unable to Connect to Backend</h2>
            <p className="text-xs text-slate-400">{error}</p>
            <p className="text-xs text-slate-500 font-mono">
              Ensure FastAPI backend is running on http://127.0.0.1:8000
            </p>
            <button
              onClick={loadInitialData}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reconnect
            </button>
          </div>
        ) : currentMode === 'investigate' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvestigateSubTab('workbench')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    investigateSubTab === 'workbench'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" /> Analyst Workbench
                </button>
                <button
                  onClick={() => setInvestigateSubTab('deep_dive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    investigateSubTab === 'deep_dive'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" /> Connectivity & Geo Matrix
                </button>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                TRACE Core Engine &bull; Shared Investigation Context
              </span>
            </div>

            {investigateSubTab === 'workbench' ? (
              <AnalystWorkbench
                alerts={alerts}
                transactions={transactions}
                activeCaseId={activeCaseId}
                onSelectCase={handleSelectCase}
                caseTransactions={caseTransactions}
                caseNotes={caseNotes}
                onNoteAdded={handleNoteAdded}
                onStatusChanged={handleStatusChanged}
              />
            ) : (
              <InvestigateModuleView />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProtectMeSubTab('portal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    protectMeSubTab === 'portal'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Case Guidance & Actions
                </button>
                <button
                  onClick={() => setProtectMeSubTab('suite')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    protectMeSubTab === 'suite'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" /> CallShield & ScamShield Suite
                </button>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Citizen Safety &bull; Voice Reader &bull; Interactive Defense
              </span>
            </div>

            {protectMeSubTab === 'portal' ? (
              <ConsumerSafetyView
                alerts={alerts}
                activeCaseId={activeCaseId}
                onSelectCase={handleSelectCase}
                caseTransactions={caseTransactions}
                onTakeAction={handleConsumerAction}
              />
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <ProtectMeContainer enableLiveBackend={true} apiBaseUrl="" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dataset Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <b>TRACE</b> &bull; Transaction Risk Analysis, Connectivity & Evidence
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            One Integrated Platform &bull; Investigate & Protect Me
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
