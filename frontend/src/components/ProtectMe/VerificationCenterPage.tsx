import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Lock,
  Clock,
  CreditCard,
  MapPin,
  X,
} from 'lucide-react';

interface PendingChallenge {
  caseId: string;
  riskScore: number;
  priority: 'HIGH' | 'CRITICAL';
  status: 'CHALLENGED' | 'VERIFIED' | 'BLOCKED';
  cardholder: string;
  accountId: string;
  recipient: string;
  amount: number;
  location: string;
  reason: string;
  passcode: string;
  expiresIn: string;
}

const INITIAL_CHALLENGES: PendingChallenge[] = [
  {
    caseId: 'CSV-ACC101MF',
    riskScore: 85,
    priority: 'HIGH',
    status: 'CHALLENGED',
    cardholder: 'Jane Batch',
    accountId: 'ACC-BATCH-2',
    recipient: 'Unverified Crypto',
    amount: 7290.0,
    location: 'London',
    reason:
      'High-risk signals detected. Protective Step-Up OTP challenge dispatched to cardholder. High-value transfer >₹5,000.00 exceeds standard risk threshold. First-time transfer.',
    passcode: '948597',
    expiresIn: 'Expires in 3m',
  },
  {
    caseId: 'TXN-70437855',
    riskScore: 88,
    priority: 'HIGH',
    status: 'CHALLENGED',
    cardholder: 'Test Consumer 2',
    accountId: 'ACC-TEST-CONSUMER-2',
    recipient: 'Crypto Offshore Escrow',
    amount: 7500.0,
    location: 'Miami',
    reason:
      'High-risk signals detected. Protective Step-Up OTP challenge dispatched to cardholder. High-value transfer >₹5,000.00 exceeds standard risk threshold. First-time transfer.',
    passcode: '855378',
    expiresIn: 'Expires in 3m',
  },
  {
    caseId: 'TXN-6518-402',
    riskScore: 76,
    priority: 'HIGH',
    status: 'CHALLENGED',
    cardholder: 'Bob Johnson',
    accountId: 'ACC-BOB-002',
    recipient: 'Starcheer Electronics Direct',
    amount: 7290.0,
    location: 'Singapore',
    reason:
      'Cross-border commercial wire exceeding limit to new beneficiary from foreign IP.',
    passcode: '512789',
    expiresIn: 'Expires in 4m',
  },
  {
    caseId: 'TXN-8194-401',
    riskScore: 72,
    priority: 'HIGH',
    status: 'CHALLENGED',
    cardholder: 'David Miller',
    accountId: 'ACC-DAVID-M-001',
    recipient: 'QuickCrypto P2P Exchange',
    amount: 6450.0,
    location: 'Miami',
    reason:
      'High-risk transfer: High value transfer from an unfamiliar device. A protective One-Time Password (OTP) is required.',
    passcode: '849201',
    expiresIn: 'Expires in 5m',
  },
];

export const VerificationCenterPage: React.FC = () => {
  const [challenges, setChallenges] = useState<PendingChallenge[]>(INITIAL_CHALLENGES);
  const [activeChallenge, setActiveChallenge] = useState<PendingChallenge | null>(null);
  const [inputOtp, setInputOtp] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const pendingCount = challenges.filter((c) => c.status === 'CHALLENGED').length;

  const handleOpenVerifyModal = (challenge: PendingChallenge) => {
    setActiveChallenge(challenge);
    setInputOtp('');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge) return;

    if (inputOtp.trim() === activeChallenge.passcode) {
      setModalSuccess('OTP Verified! Payment successfully authorized and released.');
      setTimeout(() => {
        setChallenges((prev) =>
          prev.map((c) =>
            c.caseId === activeChallenge.caseId ? { ...c, status: 'VERIFIED' } : c
          )
        );
        setActiveChallenge(null);
      }, 1200);
    } else {
      setModalError('Invalid OTP passcode. Please enter the simulated 6-digit code.');
    }
  };

  const handleBlockPayment = (caseId: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.caseId === caseId ? { ...c, status: 'BLOCKED' } : c))
    );
    if (activeChallenge?.caseId === caseId) {
      setModalSuccess('Payment immediately blocked and transaction frozen.');
      setTimeout(() => setActiveChallenge(null), 1200);
    }
  };

  const handleResetQueue = () => {
    setChallenges(INITIAL_CHALLENGES);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#25324A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Verification Center
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40">
              {pendingCount} Pending Challenges
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5 max-w-3xl">
            Step-up authentication portal for transactions flagged by high-risk rule combinations. Requires cardholder out-of-band OTP confirmation.
          </p>
        </div>

        <button
          onClick={handleResetQueue}
          className="px-3.5 py-1.5 bg-[#111A2E] hover:bg-[#16223B] border border-[#25324A] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl flex items-center gap-1.5 transition shadow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 4 Cards Grid (matching Image 5 Panel 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {challenges.map((item) => {
          const isResolved = item.status === 'VERIFIED';
          const isBlocked = item.status === 'BLOCKED';

          return (
            <div
              key={item.caseId}
              className={`bg-[#111A2E] border rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between ${
                isResolved
                  ? 'border-[#10B981]/50 bg-[#111A2E]/80'
                  : isBlocked
                  ? 'border-[#F43F5E]/50 bg-[#111A2E]/80'
                  : 'border-[#25324A] hover:border-[#D97706]/60'
              }`}
            >
              <div className="space-y-3">
                {/* Top Card Bar */}
                <div className="flex items-center justify-between border-b border-[#25324A] pb-2.5">
                  <span className="font-mono text-xs font-bold text-[#F8FAFC]">
                    {item.caseId}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                      {item.riskScore} {item.priority}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : isBlocked
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                          : 'bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Cardholder Information */}
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Cardholder Name</div>
                  <div className="text-sm font-bold text-[#F8FAFC]">
                    {item.cardholder}{' '}
                    <span className="text-xs font-mono font-normal text-[#94A3B8]">({item.accountId})</span>
                  </div>
                </div>

                {/* Recipient & Amount Telemetry */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#080D1B] border border-[#25324A] text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Recipient Beneficiary</span>
                    <span className="font-semibold text-[#F8FAFC] truncate block">{item.recipient}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Attempted Amount</span>
                    <span className="font-mono font-bold text-sm text-[#F59E0B]">
                      ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Initiation Context</span>
                    <span className="font-mono text-[#94A3B8]">{item.location}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Channel</span>
                    <span className="font-mono text-[#60A5FA]">ONLINE Wire</span>
                  </div>
                </div>

                {/* Reason */}
                <p className="text-[11px] text-[#94A3B8] leading-relaxed font-mono">
                  {item.reason}
                </p>

                {/* Passcode Reminder */}
                {!isResolved && !isBlocked && (
                  <div className="flex items-center justify-between text-[11px] font-mono px-3 py-2 rounded-xl bg-[#16223B] border border-[#25324A]">
                    <div className="flex items-center gap-1.5 text-[#94A3B8]">
                      <span>SIMULATED DEMO PASSCODE:</span>
                      <b className="text-[#F8FAFC] tracking-wider">{item.passcode}</b>
                    </div>
                    <span className="text-[#F59E0B] text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.expiresIn}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[#25324A]">
                {isResolved ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#10B981] bg-[#10B981]/15 rounded-xl border border-[#10B981]/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transaction Verified & Settled</span>
                  </div>
                ) : isBlocked ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#F43F5E] bg-[#F43F5E]/15 rounded-xl border border-[#F43F5E]/30">
                    <XCircle className="w-4 h-4" />
                    <span>Fraud Blocked & Account Frozen</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenVerifyModal(item)}
                    className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-[#D97706]/25 flex items-center justify-center gap-2 transition"
                  >
                    <span>Enter Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OTP Challenge Verification Modal */}
      {activeChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111A2E] border-2 border-[#D97706] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#25324A] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">Step-Up OTP Challenge</h3>
                  <p className="text-[10px] text-[#94A3B8] font-mono">Case Ref: {activeChallenge.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveChallenge(null)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-xs text-[#F43F5E] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-xs text-[#10B981] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#080D1B] border border-[#25324A] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Attempted Transfer:</span>
                <span className="font-mono font-bold text-[#F59E0B]">
                  ₹{activeChallenge.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Beneficiary:</span>
                <span className="text-[#F8FAFC] font-semibold">{activeChallenge.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Location:</span>
                <span className="text-[#94A3B8] font-mono">{activeChallenge.location}</span>
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-semibold text-[#F8FAFC]">Enter 6-Digit Passcode</label>
                  <button
                    type="button"
                    onClick={() => setInputOtp(activeChallenge.passcode)}
                    className="text-[#60A5FA] text-[11px] hover:underline font-mono"
                  >
                    Paste: {activeChallenge.passcode}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  placeholder="e.g. 948597"
                  className="w-full px-4 py-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-center text-lg font-mono font-black tracking-widest text-[#F8FAFC] focus:outline-none focus:border-[#D97706]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition"
              >
                Confirm OTP & Authorize Payment
              </button>

              <button
                type="button"
                onClick={() => handleBlockPayment(activeChallenge.caseId)}
                className="w-full py-2 bg-[#F43F5E]/20 hover:bg-[#F43F5E]/30 text-[#F43F5E] border border-[#F43F5E]/40 text-xs font-bold uppercase rounded-xl transition"
              >
                I Did Not Make This &bull; Freeze Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
