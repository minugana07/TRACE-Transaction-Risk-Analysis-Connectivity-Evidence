import React, { useState } from 'react';
import type { Transaction } from '../../types/trace';
import { ShieldCheck, KeyRound, AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onVerified?: (txId: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onVerified,
}) => {
  if (!isOpen || !transaction) return null;

  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const demoOtp = '849201';

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    // Validate 6 digit OTP
    setTimeout(() => {
      if (otpCode === demoOtp || otpCode.length === 6) {
        setSuccessMsg('Step-Up Authentication successfully confirmed. Transaction validated.');
        setTimeout(() => {
          if (onVerified) onVerified(transaction.id);
          onClose();
        }, 1200);
      } else {
        setErrorMsg('Invalid authentication code. Please try again or use the demo passcode.');
      }
      setSubmitting(false);
    }, 600);
  };

  const handleResend = () => {
    setResending(true);
    setErrorMsg(null);
    setTimeout(() => {
      setSuccessMsg('New 6-digit out-of-band verification passcode generated.');
      setTimeout(() => setSuccessMsg(null), 3000);
      setResending(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#080D1B] border border-[#25324A] rounded-2xl shadow-2xl overflow-hidden p-6 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#25324A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A78BFA]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F8FAFC]">Step-Up Authentication</h3>
              <p className="text-xs text-[#94A3B8]">High Risk Out-of-Band Challenge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Transaction Metadata Card */}
          <div className="p-3.5 rounded-xl bg-[#111A2E] border border-[#25324A] text-xs text-[#94A3B8] space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>Originating Account:</span>
              <span className="font-bold text-[#F8FAFC]">{transaction.sender_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer Volume:</span>
              <span className="font-bold text-[#10B981]">
                ₹{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Target Beneficiary:</span>
              <span className="font-bold text-[#A78BFA]">{transaction.receiver_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Channel:</span>
              <span className="text-[#60A5FA]">{transaction.channel}</span>
            </div>
          </div>

          {/* Hackathon Demo Helper Banner */}
          <div className="p-3 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider block font-mono">
                Demonstration Passcode
              </span>
              <span className="text-base font-mono font-black text-[#F8FAFC] tracking-widest">{demoOtp}</span>
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(demoOtp)}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#2563EB]/20 hover:bg-[#2563EB]/30 text-[#60A5FA] border border-[#2563EB]/40 font-mono font-semibold transition"
            >
              Auto-Fill
            </button>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#94A3B8] mb-1.5 font-mono">
                Enter 6-Digit Verification OTP
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#111A2E] border border-[#25324A] rounded-xl font-mono text-center text-lg tracking-widest text-[#F8FAFC] placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#2563EB]"
                  autoFocus
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl border border-[#25324A] hover:bg-[#111A2E] text-[#94A3B8] hover:text-[#F8FAFC] transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                Resend OTP
              </button>
              <button
                type="submit"
                disabled={submitting || otpCode.length < 6}
                className="flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#2563EB]/25"
              >
                {submitting ? 'Verifying...' : 'Validate Passcode'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
