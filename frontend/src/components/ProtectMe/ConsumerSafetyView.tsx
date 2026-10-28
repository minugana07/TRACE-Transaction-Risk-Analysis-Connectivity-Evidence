import React, { useState } from 'react';
import type { Alert, Transaction } from '../../types/trace';
import { TraceAIPanel } from '../Common/TraceAIPanel';
import { HotspotMap } from '../Common/HotspotMap';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  PhoneCall,
  CheckCircle,
  User,
  Info,
} from 'lucide-react';

interface ConsumerSafetyViewProps {
  alerts: Alert[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  caseTransactions: Transaction[];
  onTakeAction: (caseId: string, actionType: 'CONFIRM_ME' | 'LOCK_ACCOUNT' | 'CALLBACK') => void;
}

export const ConsumerSafetyView: React.FC<ConsumerSafetyViewProps> = ({
  alerts,
  activeCaseId,
  onSelectCase,
  caseTransactions,
  onTakeAction,
}) => {
  // Find accounts with alerts
  const accountsWithAlerts = Array.from(new Set(alerts.map((a) => a.customer_id)));
  const defaultAccount = accountsWithAlerts[0] || 'ACC-101';
  const [selectedAccount, setSelectedAccount] = useState<string>(defaultAccount);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filter alerts for the selected consumer account
  const customerAlerts = alerts.filter((a) => a.customer_id === selectedAccount);
  const currentAlert = customerAlerts.find((a) => a.case_id === activeCaseId) || customerAlerts[0] || alerts[0];

  const handleActionClick = (actionType: 'CONFIRM_ME' | 'LOCK_ACCOUNT' | 'CALLBACK') => {
    if (!currentAlert) return;
    onTakeAction(currentAlert.case_id, actionType);

    if (actionType === 'CONFIRM_ME') {
      setFeedbackMessage(
        '[Demo Action]: Authorization logged in SQLite audit trail. Case status updated to RESOLVED BENIGN. (No real core banking API connected).'
      );
    } else if (actionType === 'LOCK_ACCOUNT') {
      setFeedbackMessage(
        '[Demo Action]: Emergency freeze request logged in SQLite audit trail. Case status escalated. (In production, this triggers card network API block).'
      );
    } else {
      setFeedbackMessage(
        '[Demo Action]: Security callback request logged in SQLite case notes. (In production, this dispatches a priority ticket to telephony queue).'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Account Persona Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Consumer Security Portal</h2>
            <p className="text-xs text-slate-400">Viewing protected consumer profile</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Simulate Account:</span>
          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value);
              const firstAlert = alerts.find((a) => a.customer_id === e.target.value);
              if (firstAlert) onSelectCase(firstAlert.case_id);
              setFeedbackMessage(null);
            }}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 font-mono focus:ring-1 focus:ring-blue-500"
          >
            {accountsWithAlerts.map((accId) => (
              <option key={accId} value={accId}>
                {accId} ({alerts.filter((a) => a.customer_id === accId).length} Flagged Case)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Safety Status Banner */}
      {customerAlerts.length > 0 ? (
        <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Security Check Required
                </span>
                <h1 className="text-lg font-bold text-slate-100 mt-0.5">
                  We noticed unusual transfer activity on your account
                </h1>
              </div>
            </div>

            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              Case Ref: {currentAlert.case_id}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Our automated safety shield noticed transfers that differ from your usual pattern.
            To keep your money safe, please review the activity below and select the appropriate resolution.
          </p>

          {/* Demonstration Notice */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              <b>Workflow Guidance Note:</b> Actions below record your response in the TRACE investigation log and update SQLite case state. External card network APIs and telephone systems are simulated for this demonstration.
            </span>
          </div>

          {feedbackMessage && (
            <div className="p-3 bg-blue-950/50 border border-blue-500/40 rounded-xl text-xs text-blue-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Quick Action Resolution Buttons (Clearly labeled as Demo / Workflow Actions) */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleActionClick('CONFIRM_ME')}
              title="Demo action: Records confirmation note and marks case benign in SQLite database"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <CheckCircle className="w-4 h-4" /> Yes, I Made These Transfers (Demo)
            </button>

            <button
              onClick={() => handleActionClick('LOCK_ACCOUNT')}
              title="Demo action: Records lock note and escalates case status in SQLite database"
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/20 transition"
            >
              <Lock className="w-4 h-4" /> No! Freeze My Account (Demo)
            </button>

            <button
              onClick={() => handleActionClick('CALLBACK')}
              title="Demo action: Records callback request note in SQLite database"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
            >
              <PhoneCall className="w-4 h-4 text-blue-400" /> Request Security Call (Demo)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">All Protected Accounts Clear</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            TRACE Continuous Safety Shield is actively monitoring your accounts. No unauthorized attempts detected.
          </p>
        </div>
      )}

      {/* Case Investigation Details in Consumer-Friendly Language */}
      {currentAlert && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: TRACE AI Consumer Guidance (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <TraceAIPanel caseId={currentAlert.case_id} mode="protect_me" />

            {/* If transactions have location, show verification map */}
            {caseTransactions.some((tx) => tx.geographic_data?.latitude) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" /> Where Did These Payments Occur?
                  </h3>
                  <span className="text-[11px] text-slate-400">Recorded transaction locations</span>
                </div>
                <HotspotMap transactions={caseTransactions} height="280px" />
              </div>
            )}
          </div>

          {/* Right: Transactions Checklist for Verification (5 cols) */}
          <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">
                Transactions Under Review ({caseTransactions.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ${caseTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {caseTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs space-y-1.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {tx.channel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Sent to: <b className="text-slate-200">{tx.receiver_id}</b></span>
                    <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                  </div>

                  {tx.geographic_data?.city && (
                    <div className="text-[10px] text-slate-500">
                      Location: {tx.geographic_data.city}, {tx.geographic_data.country}
                    </div>
                  )}

                  {tx.description && (
                    <div className="text-[11px] text-slate-400 italic">
                      Memo: "{tx.description}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Why was this flagged?</div>
              <p>
                {currentAlert.evidence[0]?.description ||
                  'Automated velocity or channel shift detection.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
