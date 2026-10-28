import React, { useState } from 'react';
import {
  Gamepad2,
  ShieldAlert,
  ShieldCheck,
  Search,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Zap,
  Globe,
  Mail,
  MessageSquare,
  FileText,
  Lock,
} from 'lucide-react';

interface ScamPreset {
  id: string;
  title: string;
  type: 'SMS' | 'EMAIL' | 'URL';
  text: string;
  threatScore: number;
  category: 'PHISH / MALICIOUS' | 'LEGITIMATE BENIGN';
  flags: string[];
  explanation: string;
}

const PRELOADED_SCAMS: ScamPreset[] = [
  {
    id: 'chase-debit',
    title: 'Chase Debit Locked Smishing (Top)',
    type: 'SMS',
    text: 'URGENT: Chase account locked due to suspicious transfer of ₹48,000. Re-verify debit card details immediately to unlock: https://chase-secure-verify.billing-update.cc/auth',
    threatScore: 100,
    category: 'PHISH / MALICIOUS',
    flags: ['Punycode / Homograph Brand Spoofing', 'Unregistered Dynamic DNS Domain (.cc)', 'Urgency Trap', 'Credential Harvesting Form'],
    explanation:
      'Domain `billing-update.cc` is not operated by JPMorgan Chase. The link routes to an unverified phishing kit designed to capture debit card numbers, expiration dates, and CVVs.',
  },
  {
    id: 'usps-bait',
    title: 'USPS Package Redelivery Bait (IP Host)',
    type: 'SMS',
    text: 'USPS Notice: Your postal package 940011120255523 cannot be delivered due to an incorrect house address. Update address & pay ₹25.00 redelivery fee within 12h: http://194.38.22.109/usps-tracking',
    threatScore: 92,
    category: 'PHISH / MALICIOUS',
    flags: ['Raw IP Address URL', 'Government Mail Impersonation', 'Micro-Payment Card Harvesting Trap', 'Artificial 12-Hour Deadline'],
    explanation:
      'The link targets an unencrypted raw IPv4 address hosted in Eastern Europe. Legitimate postal carriers never use direct IP URLs or demand micro-fees via unsolicited SMS.',
  },
  {
    id: 'amazon-update',
    title: 'Legitimate Amazon Order Update',
    type: 'EMAIL',
    text: 'Your Amazon order #402-9182391-29182 has shipped via UPS. Tracking number: 1Z9999999999999999. Track package inside your Amazon app or at https://www.amazon.in/gp/your-account/order-history.',
    threatScore: 5,
    category: 'LEGITIMATE BENIGN',
    flags: ['Official Root Domain (amazon.in)', 'Valid HTTPS Certificate Rail', 'No Third-Party Redirects'],
    explanation:
      'The URL strictly points to the official Amazon top-level domain without obfuscation or homograph character substitution. No threat markers detected.',
  },
];

export const ScamShieldPage: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'SMS' | 'EMAIL' | 'URL'>('SMS');
  const [scanContent, setScanContent] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScamPreset | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleSelectPreset = (preset: ScamPreset) => {
    setSelectedPresetId(preset.id);
    setActiveTab(preset.type);
    setScanContent(preset.text);
    setScanResult(null);
  };

  const handleScan = () => {
    if (!scanContent.trim()) return;
    setIsScanning(true);

    setTimeout(() => {
      const matched = PRELOADED_SCAMS.find((s) => s.id === selectedPresetId);
      if (matched) {
        setScanResult(matched);
      } else {
        const lower = scanContent.toLowerCase();
        const hasPhishLink = lower.includes('http://') || lower.includes('.cc') || lower.includes('.ru') || lower.includes('.xyz') || lower.includes('verify') || lower.includes('update');
        const hasUrgency = lower.includes('urgent') || lower.includes('locked') || lower.includes('immediately') || lower.includes('suspend');

        let score = 15;
        const flags: string[] = [];
        if (hasPhishLink) { score += 55; flags.push('Suspicious URL / External Redirection'); }
        if (hasUrgency) { score += 25; flags.push('High-Urgency Threat Lure'); }

        setScanResult({
          id: 'custom',
          title: 'Custom Scan Target',
          type: activeTab,
          text: scanContent,
          threatScore: Math.min(100, score),
          category: score >= 60 ? 'PHISH / MALICIOUS' : 'LEGITIMATE BENIGN',
          flags: flags.length > 0 ? flags : ['No Suspicious Redirection Tokens Found'],
          explanation:
            score >= 60
              ? 'Potentially dangerous phishing or spoofed message. Do not tap links, do not reply, and do not input passwords.'
              : 'Content does not trigger high-risk lexical heuristic thresholds. Exercise standard caution.',
        });
      }
      setIsScanning(false);
    }, 450);
  };

  const handleClear = () => {
    setSelectedPresetId('');
    setScanContent('');
    setScanResult(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-[#25324A] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40 shadow-lg shadow-[#06B6D4]/10">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                ScamShield
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#111A2E] text-[#06B6D4] border border-[#06B6D4]/40">
                Phishing & Safe Link Scanner
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5 max-w-3xl">
              Safely inspect suspicious SMS messages, emails, and URLs. Analyzes lexical patterns, homograph brand spoofing, and social engineering lures without visiting the link.
            </p>
          </div>
        </div>
      </div>

      {/* Select Pre-Loaded Scam Scenario to Test */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-xl space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#94A3B8]">
          <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>SELECT PRE-LOADED SCAM SCENARIO TO TEST</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRELOADED_SCAMS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-[#16223B] border-[#06B6D4] ring-1 ring-[#06B6D4]/40 shadow-md'
                    : 'bg-[#080D1B] border-[#25324A] hover:border-[#25324A]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#111A2E] text-[#60A5FA] border border-[#25324A]">
                    {preset.type}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#F43F5E]">
                    {preset.threatScore}% Score
                  </span>
                </div>
                <div className="text-xs font-bold text-[#F8FAFC] truncate">{preset.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Scanner Form & Inspection Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Message or Link Scanner (7 cols) */}
        <div className="lg:col-span-7 bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#25324A] pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#06B6D4]" />
              <h2 className="text-sm font-bold text-[#F8FAFC] uppercase font-mono tracking-wider">
                Message or Link Scanner
              </h2>
            </div>

            {/* Input Type Tabs */}
            <div className="flex items-center bg-[#080D1B] border border-[#25324A] p-0.5 rounded-lg">
              {(['SMS', 'EMAIL', 'URL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition ${
                    activeTab === tab
                      ? 'bg-[#06B6D4] text-white shadow'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F8FAFC]">
              Raw Message Text, Email Body, or Suspicious URL
            </label>
            <textarea
              rows={6}
              value={scanContent}
              onChange={(e) => setScanContent(e.target.value)}
              placeholder="Paste SMS content, phishing email text, or suspicious link to scan..."
              className="w-full p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] font-mono leading-relaxed focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Safety Notice Banner */}
          <div className="p-3 rounded-xl bg-[#080D1B] border border-[#25324A] flex items-center gap-2.5 text-[11px] text-[#94A3B8]">
            <Lock className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            <span>
              <b>Safe Air-Gapped Lexical Analysis:</b> TRACE evaluates domain mechanics, homograph characters, and URL structure without connecting to the remote host.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-[#080D1B] hover:bg-[#16223B] border border-[#25324A] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl transition"
            >
              Clear
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning || !scanContent.trim()}
              className="px-5 py-2.5 bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-[#0891B2]/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isScanning ? 'Executing Lexical Heuristics...' : 'Scan with ScamShield'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Scan Result & Past Reports (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Scan Result Box */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
            {scanResult ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#25324A] pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        scanResult.threatScore >= 80
                          ? 'bg-[#F43F5E] animate-pulse'
                          : scanResult.threatScore >= 40
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#10B981]'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-[#F8FAFC]">Threat Analysis Report</h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      scanResult.threatScore >= 80
                        ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                        : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    }`}
                  >
                    {scanResult.threatScore}/100 {scanResult.category}
                  </span>
                </div>

                <div className="bg-[#080D1B] border border-[#25324A] rounded-xl p-3 space-y-2">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Detected Indicators</div>
                  <div className="space-y-1">
                    {scanResult.flags.map((flag, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#F8FAFC]">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E] flex-shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Forensic Finding</div>
                  <div className="p-3 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F8FAFC] leading-relaxed font-mono">
                    {scanResult.explanation}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#94A3B8]">
                <div className="p-3 rounded-2xl bg-[#080D1B] border border-[#25324A] text-[#94A3B8]">
                  <Globe className="w-7 h-7" />
                </div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Awaiting Scan Target</h4>
                <p className="text-[11px] leading-relaxed max-w-xs">
                  Click a preset or enter message text above to validate URLs and audit against the scam database.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Past Scan Reports (matching Image 5 Panel 3) */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#25324A] pb-2">
              <span className="text-xs font-mono font-bold uppercase text-[#94A3B8]">
                PAST SCAN REPORTS (3)
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A] flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#111A2E] text-[#60A5FA] border border-[#25324A] mr-1.5">
                    SMS
                  </span>
                  <span className="font-bold text-[#F8FAFC] truncate">
                    URGENT: Chase account locked. Re-verify de...
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 flex-shrink-0">
                  100 CRITICAL
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A] flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#111A2E] text-[#60A5FA] border border-[#25324A] mr-1.5">
                    SMS
                  </span>
                  <span className="font-bold text-[#F8FAFC] truncate">
                    CHASE ALERT: Unauthorized login detected fr...
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 flex-shrink-0">
                  99 CRITICAL
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A] flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#111A2E] text-[#60A5FA] border border-[#25324A] mr-1.5">
                    SMS
                  </span>
                  <span className="font-bold text-[#F8FAFC] truncate">
                    USPS Notice: Your postal package 940011120...
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 flex-shrink-0">
                  92 CRITICAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
