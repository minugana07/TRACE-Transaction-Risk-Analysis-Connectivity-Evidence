/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * CallShieldLookup - Phone number reputation & threat intelligence interface
 */

import React, { useState } from 'react';
import { PhoneLookupResult } from '../../contracts/phoneLookup';
import { traceApi } from '../../services/apiClient';
import { PhoneReportCard } from './PhoneReportCard';
import { useAccessibility } from '../../context/AccessibilityContext';

export const CallShieldLookup: React.FC = () => {
  const { highContrast } = useAccessibility();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PhoneLookupResult | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    try {
      const res = await traceApi.lookupPhone(phoneNumber.trim());
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  const setPresetAndCheck = (num: string) => {
    setPhoneNumber(num);
    setIsLoading(true);
    traceApi.lookupPhone(num).then((res) => {
      setResult(res);
      setIsLoading(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📞</span>
          <span>CallShield - Caller & SMS Threat Intelligence</span>
        </h2>
        <p className="text-xs opacity-75 mt-1">
          Verify unknown phone numbers against official institutional registries and citizen scam complaints.
        </p>
      </div>

      {/* Lookup Card */}
      <div className={`p-6 rounded-2xl border ${
        highContrast 
          ? 'bg-black border-2 border-yellow-400 text-white' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="callshield-phone-input">
              Enter Telephone, Mobile Number, or SMS Sender Header
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="callshield-phone-input"
                type="tel"
                placeholder="e.g. 9876543210 or 1930"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className={`flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border text-base font-mono focus:outline-none focus:ring-2 ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400'
                    : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`min-h-[46px] px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {isLoading ? 'Checking...' : 'Check Number'}
              </button>
            </div>
          </div>

          {/* Quick Test Presets */}
          <div>
            <span className="text-[11px] font-semibold opacity-75 uppercase tracking-wide block mb-2">
              Try Test Presets (Demonstrating All 4 States):
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPresetAndCheck('1930')}
                className="px-2.5 py-1 rounded-lg border border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                ✓ 1930 (Official Cyber Helpline)
              </button>
              <button
                type="button"
                onClick={() => setPresetAndCheck('18004253800')}
                className="px-2.5 py-1 rounded-lg border border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                ✓ 1800 425 3800 (SBI Bank)
              </button>
              <button
                type="button"
                onClick={() => setPresetAndCheck('9876543210')}
                className="px-2.5 py-1 rounded-lg border border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                ⚠️ 9876543210 (Flagged QR Scammer)
              </button>
              <button
                type="button"
                onClick={() => setPresetAndCheck('9899887766')}
                className="px-2.5 py-1 rounded-lg border border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                ⚠️ 9899887766 (Electricity Scam)
              </button>
              <button
                type="button"
                onClick={() => setPresetAndCheck('9811122233')}
                className="px-2.5 py-1 rounded-lg border border-amber-400 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                ❓ 9811122233 (No Reports Found)
              </button>
              <button
                type="button"
                onClick={() => setPresetAndCheck('12')}
                className="px-2.5 py-1 rounded-lg border border-slate-400 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕ 12 (Invalid / Unavailable)
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Result Card */}
      {result && (
        <div className="animate-fade-in">
          <PhoneReportCard result={result} />
        </div>
      )}

      {/* CallShield Operational Standards */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs space-y-1.5 opacity-80">
        <h4 className="font-bold text-slate-900 dark:text-white">CallShield Integrity Standards:</h4>
        <p>• Verified sources come exclusively from verified public regulatory registries (RBI, MHA, Telecom Providers).</p>
        <p>• Unverified reports reflect crowdsourced citizen complaints and must be treated as advisory warnings.</p>
        <p>• TRACE never intercepts private phone calls, tracks live device GPS, or fabricates caller identity.</p>
      </div>
    </div>
  );
};
