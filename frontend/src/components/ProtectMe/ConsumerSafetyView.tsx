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
  viewMode?: 'overview' | 'transactions_only';
}

export const ConsumerSafetyView: React.FC<ConsumerSafetyViewProps> = ({
  alerts,
  activeCaseId,
  onSelectCase,
  caseTransactions,
  onTakeAction,
  viewMode = 'overview',
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Account Persona Selector & Security Console Header */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#2563EB]/15 text-[#60A5FA] rounded-xl border border-[#2563EB]/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#F8FAFC]">Consumer Protection Console</h2>
              <span className="text-[10px] font-mono uppercase bg-[#080D1B] text-[#60A5FA] px-2 py-0.5 rounded-full border border-[#25324A]">
                PROTECTED ACCOUNT
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Automated account surveillance and guided fraud dispute resolution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider">Simulate Account:</span>
          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value);
              const firstAlert = alerts.find((a) => a.customer_id === e.target.value);
              if (firstAlert) onSelectCase(firstAlert.case_id);
              setFeedbackMessage(null);
            }}
            className="bg-[#080D1B] border border-[#25324A] text-xs text-[#F8FAFC] rounded-xl px-3 py-1.5 font-mono focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
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
      {viewMode === 'overview' && (
        customerAlerts.length > 0 ? (
          <div className="bg-[#111A2E] border border-[#F43F5E]/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-[#F43F5E]/15 text-[#F43F5E] rounded-xl border border-[#F43F5E]/30">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F43F5E] bg-[#F43F5E]/15 px-2.5 py-0.5 rounded-full border border-[#F43F5E]/30">
                    Security Verification Required
                  </span>
                  <h1 className="text-lg font-bold text-[#F8FAFC] mt-1.5">
                    Unusual Transfer Activity Flagged for Account {selectedAccount}
                  </h1>
                </div>
              </div>

              <span className="text-xs font-mono bg-[#080D1B] text-[#94A3B8] px-3 py-1 rounded-full border border-[#25324A]">
                Case Ref: <b className="text-[#60A5FA]">{currentAlert.case_id}</b>
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-4xl">
              TRACE Continuous Safety Shield detected transfer velocity and counterparty flows differing from normal account baseline. Please review the transfers below and authorize or dispute.
            </p>

            {/* Demonstration Notice */}
            <div className="flex items-center gap-2.5 p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-[11px] text-[#94A3B8]">
              <Info className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
              <span>
                <b className="text-[#F8FAFC]">Guidance Note:</b> Action triggers record your audit response in the TRACE investigation log and update SQLite case state. External card rail APIs and telephony dispatch are simulated for this demonstration.
              </span>
            </div>

            {feedbackMessage && (
              <div className="p-3 bg-[#2563EB]/15 border border-[#2563EB]/40 rounded-xl text-xs text-[#F8FAFC] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Quick Action Resolution Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleActionClick('CONFIRM_ME')}
                title="Demo action: Records confirmation note and marks case benign in SQLite database"
                className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#10B981]/20 transition"
              >
                <CheckCircle className="w-4 h-4" /> Yes, I Made These Transfers (Demo)
              </button>

              <button
                onClick={() => handleActionClick('LOCK_ACCOUNT')}
                title="Demo action: Records lock note and escalates case status in SQLite database"
                className="px-4 py-2 bg-[#F43F5E] hover:bg-[#E11D48] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#F43F5E]/20 transition"
              >
                <Lock className="w-4 h-4" /> No! Freeze My Account (Demo)
              </button>

              <button
                onClick={() => handleActionClick('CALLBACK')}
                title="Demo action: Records callback request note in SQLite database"
                className="px-4 py-2 bg-[#080D1B] hover:bg-[#16223B] text-[#F8FAFC] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#25324A] transition"
              >
                <PhoneCall className="w-4 h-4 text-[#60A5FA]" /> Request Security Call (Demo)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#111A2E] border border-[#10B981]/40 rounded-2xl p-8 text-center space-y-3 shadow-xl">
            <ShieldCheck className="w-12 h-12 text-[#10B981] mx-auto" />
            <h2 className="text-lg font-bold text-[#F8FAFC]">All Monitored Accounts Secure</h2>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
              TRACE Continuous Safety Shield is actively monitoring your accounts. No unauthorized attempts or anomalies detected.
            </p>
          </div>
        )
      )}

      {/* Case Investigation Details in Clean Two-Column Layout */}
      {currentAlert && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left: TRACE AI Consumer Guidance (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <TraceAIPanel caseId={currentAlert.case_id} mode="protect_me" />

            {/* If transactions have location, show verification map */}
            {caseTransactions.some((tx) => tx.geographic_data?.latitude) && (
              <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
                  <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#2563EB]" /> Where Did These Payments Occur?
                  </h3>
                  <span className="text-[11px] text-[#94A3B8] font-mono">Recorded transaction coordinates</span>
                </div>
                <HotspotMap transactions={caseTransactions} height="280px" />
              </div>
            )}
          </div>

          {/* Right: Transactions Checklist for Verification (5 cols) */}
          <div className="md:col-span-5 bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#25324A]">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                Transfers Under Review ({caseTransactions.length})
              </h3>
              <span className="text-xs text-[#94A3B8] font-mono">
                ₹{caseTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {caseTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs space-y-1.5 hover:border-[#2563EB]/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F8FAFC] text-sm font-mono">
                      ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] bg-[#111A2E] text-[#94A3B8] border border-[#25324A] px-2 py-0.5 rounded font-mono">
                      {tx.channel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px]">
                    <span>Sent to: <b className="text-[#F8FAFC]">{tx.receiver_id}</b></span>
                    <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                  </div>

                  {tx.geographic_data?.city && (
                    <div className="text-[10px] text-[#94A3B8]">
                      Location: {tx.geographic_data.city}, {tx.geographic_data.country}
                    </div>
                  )}

                  {tx.description && (
                    <div className="text-[11px] text-[#94A3B8] italic">
                      Memo: "{tx.description}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-[11px] text-[#94A3B8] space-y-1">
              <div className="font-semibold text-[#F8FAFC]">Why was this flagged?</div>
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
