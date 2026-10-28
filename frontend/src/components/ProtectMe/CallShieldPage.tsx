import React, { useState } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  PhoneForwarded,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mic,
} from 'lucide-react';

interface VoiceScenario {
  id: string;
  title: string;
  phone: string;
  identity: string;
  transcript: string;
  riskScore: number;
  verdict: 'CRITICAL' | 'HIGH' | 'SAFE';
  tactics: string[];
  recommendation: string;
}

const PRELOADED_SCENARIOS: VoiceScenario[] = [
  {
    id: 'irs-arrest',
    title: 'IRS Immediate Arrest Threat',
    phone: '+1 (800) 492-3811',
    identity: 'IRS Senior Enforcement Bureau',
    transcript:
      'This is Officer Mark Nelson from the Internal Revenue Service Criminal Investigation Division. There is a federal arrest warrant issued under your Social Security number for unpaid tax liabilities. To stop law enforcement from arriving at your residence in 45 minutes, you must immediately purchase pre-paid cash cards or transfer ₹1,50,000 to the federal escrow routing number.',
    riskScore: 98,
    verdict: 'CRITICAL',
    tactics: ['Urgency Coercion', 'Arrest Threat', 'Impersonation of Government Agent', 'Irreversible Payment Demand'],
    recommendation: 'DO NOT PAY. Hang up immediately. Government agencies never demand gift cards or immediate wire transfers over the phone.',
  },
  {
    id: 'bank-otp',
    title: 'Bank Fraud OTP Harvesting',
    phone: '+1 (888) 234-8901',
    identity: 'Bank Security Fraud Prevention Desk',
    transcript:
      'Hello, this is Bank Fraud Operations calling regarding an unauthorized transfer of ₹48,500 initiated from an unknown IP address in London. To cancel this transaction immediately, I have sent a 6-digit one-time authorization code to your mobile phone. Please read the code back to me now to verify your ownership and freeze the hacker.',
    riskScore: 95,
    verdict: 'CRITICAL',
    tactics: ['OTP Theft Lure', 'False Security Alert', 'Social Engineering Authority', 'Reverse Authorization'],
    recommendation: 'NEVER SHARE YOUR OTP. Bank staff will NEVER ask for your one-time password or PIN to cancel a transaction.',
  },
  {
    id: 'tech-support',
    title: 'Remote Tech-Support Extortion',
    phone: '+1 (855) 910-4422',
    identity: 'Windows Global Security Support',
    transcript:
      'Warning: Your computer network has reported 14 critical Trojan spyware infections sending your banking passwords to darknet servers. Go to your computer now, press Windows+R, and download our certified remote diagnostics tool so our senior technician can sanitize your system.',
    riskScore: 91,
    verdict: 'HIGH',
    tactics: ['Remote Access Trojan Bait', 'Fear Induction', 'Brand Spoofing', 'Unsolicited Support Call'],
    recommendation: 'Do NOT allow remote access. Legitimate tech firms never call unsolicited to inform you of malware.',
  },
  {
    id: 'clinic-reminder',
    title: 'Legitimate Clinic Reminder',
    phone: '+1 (415) 555-0199',
    identity: 'Dr. Miller Medical Clinic',
    transcript:
      'Hello, this is an automated reminder from Dr. Miller Medical Practice confirming your upcoming dental cleaning on Thursday at 2:30 PM. Please press 1 to confirm, or call our office at 415-555-0199 if you need to reschedule. No payment is required at this time.',
    riskScore: 10,
    verdict: 'SAFE',
    tactics: ['Standard Appointment Routine', 'No Financial Demands', 'No Urgency Coercion'],
    recommendation: 'Verified benign appointment reminder. Safe to confirm or call back on the clinic’s verified number.',
  },
];

export const CallShieldPage: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [claimedIdentity, setClaimedIdentity] = useState('');
  const [transcript, setTranscript] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<VoiceScenario | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const handleSelectScenario = (sc: VoiceScenario) => {
    setSelectedScenarioId(sc.id);
    setPhone(sc.phone);
    setClaimedIdentity(sc.identity);
    setTranscript(sc.transcript);
    setAssessmentResult(null);
  };

  const handleAssess = () => {
    if (!transcript.trim()) return;
    setIsAssessing(true);

    setTimeout(() => {
      // Find matching scenario or generate dynamic analysis
      const matched = PRELOADED_SCENARIOS.find((s) => s.id === selectedScenarioId);
      if (matched) {
        setAssessmentResult(matched);
      } else {
        const lower = transcript.toLowerCase();
        const hasUrgency = lower.includes('arrest') || lower.includes('urgent') || lower.includes('immediate') || lower.includes('police');
        const hasOtp = lower.includes('otp') || lower.includes('code') || lower.includes('password') || lower.includes('pin');
        const hasMoney = lower.includes('rupee') || lower.includes('transfer') || lower.includes('card') || lower.includes('₹') || lower.includes('$');

        let score = 20;
        const tactics: string[] = [];
        if (hasUrgency) { score += 35; tactics.push('High-Pressure Urgency Tactics'); }
        if (hasOtp) { score += 35; tactics.push('Out-of-Band Passcode / OTP Harvesting'); }
        if (hasMoney) { score += 20; tactics.push('Unverified Payment Solicitation'); }

        setAssessmentResult({
          id: 'custom',
          title: 'Custom Caller Assessment',
          phone: phone || 'Unknown Caller',
          identity: claimedIdentity || 'Unverified Identity',
          transcript,
          riskScore: Math.min(99, score),
          verdict: score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : 'SAFE',
          tactics: tactics.length > 0 ? tactics : ['Routine Non-Threat Dialogue'],
          recommendation:
            score >= 60
              ? 'HIGH RISK OF SOCIAL ENGINEERING FRAUD. Terminate call immediately and contact institution via official channels.'
              : 'Low risk markers observed. Always ensure you never share sensitive credentials.',
        });
      }
      setIsAssessing(false);
    }, 450);
  };

  const handleClear = () => {
    setSelectedScenarioId('');
    setPhone('');
    setClaimedIdentity('');
    setTranscript('');
    setAssessmentResult(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-[#25324A] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 shadow-lg shadow-[#F59E0B]/10">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                CallShield
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#111A2E] text-[#F59E0B] border border-[#F59E0B]/40">
                Voice Scam Defense
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5 max-w-3xl">
              Real-time suspicious voice caller assessment. Analyzes conversation transcripts and caller claims for social engineering, urgency tactics, and OTP phishing.
            </p>
          </div>
        </div>
      </div>

      {/* Select Pre-Loaded Voice Scenario to Test */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-xl space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#94A3B8]">
          <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>SELECT PRE-LOADED VOICE SCENARIO TO TEST</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRELOADED_SCENARIOS.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className={`p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-[#16223B] border-[#F59E0B] ring-1 ring-[#F59E0B]/40 shadow-md'
                    : 'bg-[#080D1B] border-[#25324A] hover:border-[#25324A]/80'
                }`}
              >
                <div className="text-xs font-bold text-[#F8FAFC] truncate">{sc.title}</div>
                <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">{sc.phone}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Input Form & Assessment Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Caller Intelligence Input (7 cols) */}
        <div className="lg:col-span-7 bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#25324A] pb-3">
            <Mic className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-[#F8FAFC] uppercase font-mono tracking-wider">
              Caller Intelligence Input
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#F8FAFC]">Caller Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (888) 234-8901"
                className="w-full px-3 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#F8FAFC]">Caller Claimed Identity</label>
              <input
                type="text"
                value={claimedIdentity}
                onChange={(e) => setClaimedIdentity(e.target.value)}
                placeholder="e.g. IRS / Bank Officer"
                className="w-full px-3 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#F8FAFC]">Call Transcript or Speech Excerpt</label>
            <textarea
              rows={6}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste caller's words or transcript from voicemail/audio..."
              className="w-full p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] font-mono leading-relaxed focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-[#080D1B] hover:bg-[#16223B] border border-[#25324A] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl transition"
            >
              Clear
            </button>
            <button
              onClick={handleAssess}
              disabled={isAssessing || !transcript.trim()}
              className="px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-[#D97706]/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isAssessing ? 'Analyzing Voice Dialect...' : 'Assess Caller Risk & Social Engineering'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Assessment Result & Past Reports (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Assessment Box */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
            {assessmentResult ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#25324A] pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        assessmentResult.verdict === 'CRITICAL'
                          ? 'bg-[#F43F5E] animate-pulse'
                          : assessmentResult.verdict === 'HIGH'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#10B981]'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-[#F8FAFC]">Voice Risk Evaluation</h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      assessmentResult.verdict === 'CRITICAL'
                        ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                        : assessmentResult.verdict === 'HIGH'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                        : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    }`}
                  >
                    {assessmentResult.riskScore}% {assessmentResult.verdict} SCAM
                  </span>
                </div>

                <div className="bg-[#080D1B] border border-[#25324A] rounded-xl p-3 space-y-2">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Detected Tactics</div>
                  <div className="flex flex-wrap gap-1.5">
                    {assessmentResult.tactics.map((tac, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#111A2E] text-[#F59E0B] border border-[#F59E0B]/30"
                      >
                        {tac}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Immediate Defense Advice</div>
                  <div className="p-3 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F8FAFC] leading-relaxed">
                    {assessmentResult.recommendation}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#94A3B8]">
                <div className="p-3 rounded-2xl bg-[#080D1B] border border-[#25324A] text-[#94A3B8]">
                  <PhoneForwarded className="w-7 h-7" />
                </div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Ready for Assessment</h4>
                <p className="text-[11px] leading-relaxed max-w-xs">
                  Select a demo preset or paste a phone conversation transcript to view conversational threat scores and risk breakdown.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Past Scanned Reports */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#25324A] pb-2">
              <span className="text-xs font-mono font-bold uppercase text-[#94A3B8]">
                PAST SCANNED REPORTS (3)
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#F8FAFC]">Dr. Office</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">+1 (415) 555-0199</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                  10% LOW SAFE
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#F8FAFC]">Fake IRS Officer</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">+1 (800) 492-3811</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30">
                  98% CRITICAL SCAM
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#F8FAFC]">IRS Enforcement Bureau (Spoofed)</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">+1 (888) 234-8901</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30">
                  95% HIGH RISK SCAM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
