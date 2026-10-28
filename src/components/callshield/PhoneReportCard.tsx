/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * PhoneReportCard - Renders phone lookup result with clear distinction across all 4 states
 */

import React from 'react';
import { PhoneLookupResult } from '../../contracts/phoneLookup';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

export const PhoneReportCard: React.FC<{ result: PhoneLookupResult }> = ({ result }) => {
  const { highContrast } = useAccessibility();

  const isVerified = result.status === 'VERIFIED_SOURCE';
  const isUnverified = result.status === 'UNVERIFIED_REPORT';
  const isNotFound = result.status === 'NO_REPORTS_FOUND';
  const isUnavailable = result.status === 'LOOKUP_UNAVAILABLE';

  const audioSummary = isVerified
    ? `CallShield report for ${result.formattedNumber}. Status: Verified Source. Organization: ${result.verifiedSource?.entityName}. Remember: Legitimate entities will never ask for your UPI PIN or OTP.`
    : isUnverified
    ? `CallShield warning for ${result.formattedNumber}. Status: Flagged by ${result.unverifiedReport?.reportCount} citizen reports for ${result.unverifiedReport?.primaryReportCategory}. Exercise extreme caution.`
    : isNotFound
    ? `CallShield report for ${result.formattedNumber}. Status: No reports found. Critical reminder: The absence of reports does NOT mean this number is safe. Scammers frequently rotate numbers.`
    : `CallShield notice for ${result.query}. Format invalid or lookup unavailable.`;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        highContrast
          ? 'bg-black border-2 border-yellow-400 text-white'
          : isVerified
          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
          : isUnverified
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
          : isNotFound
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
      }`}
      role="region"
      aria-label="Phone Lookup Intelligence Report"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-current/15">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                isVerified
                  ? 'bg-blue-600 text-white'
                  : isUnverified
                  ? 'bg-rose-600 text-white animate-pulse'
                  : isNotFound
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-600 text-white'
              }`}
            >
              {isVerified && '✓ VERIFIED OFFICIAL SOURCE'}
              {isUnverified && '⚠️ UNVERIFIED CITIZEN REPORTS'}
              {isNotFound && '❓ NO MATCHING REPORTS FOUND'}
              {isUnavailable && '⚠️ LOOKUP UNAVAILABLE'}
            </span>
          </div>
          <h3 className="text-xl font-bold font-mono mt-1.5">{result.formattedNumber}</h3>
        </div>

        <VoiceReaderButton textToRead={audioSummary} label="Listen to Report" />
      </div>

      {/* STATE 1: VERIFIED OFFICIAL SOURCE */}
      {isVerified && result.verifiedSource && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold opacity-75">Registered Entity:</span>
              <span className="font-bold text-sm text-blue-700 dark:text-blue-300">
                {result.verifiedSource.entityName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold opacity-75">Category:</span>
              <span className="font-medium">{result.verifiedSource.officialCategory.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold opacity-75">Registry Source:</span>
              <span className="font-medium">{result.verifiedSource.sourceRegistry}</span>
            </div>
            {result.verifiedSource.officialWebsite && (
              <div className="flex items-center justify-between">
                <span className="font-semibold opacity-75">Official Portal:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{result.verifiedSource.officialWebsite}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-blue-100/60 dark:bg-blue-900/30 text-xs text-blue-950 dark:text-blue-100">
            <span className="font-bold">⚠️ Caller ID Spoof Warning:</span> Even if a caller ID appears to match this number, remember that legitimate bank officials NEVER ask for your UPI PIN, password, or OTP. If someone requests secrets, hang up and dial the bank back directly.
          </div>
        </div>
      )}

      {/* STATE 2: UNVERIFIED COMMUNITY FRAUD REPORTS */}
      {isUnverified && result.unverifiedReport && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold opacity-75">Community Complaint Count:</span>
              <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
                {result.unverifiedReport.reportCount} Report(s) Recorded
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold opacity-75">Primary Scam Pattern:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {result.unverifiedReport.primaryReportCategory.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold opacity-75">Activity Window:</span>
              <span>{result.unverifiedReport.firstReportedAt} to {result.unverifiedReport.lastReportedAt}</span>
            </div>
          </div>

          {result.unverifiedReport.recentUserNotes.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1.5">
                Community Experience Notes:
              </h4>
              <ul className="space-y-1.5 text-xs">
                {result.unverifiedReport.recentUserNotes.map((note, idx) => (
                  <li key={idx} className="p-2 rounded-lg bg-rose-100/50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50 italic">
                    "{note}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-600 text-white text-xs font-semibold">
            🚫 Safety Directive: Do NOT transfer money, scan QR codes, or install APK software requested by this caller.
          </div>
        </div>
      )}

      {/* STATE 3: NO MATCHING REPORTS FOUND */}
      {isNotFound && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border-2 border-amber-400 text-amber-950 dark:text-amber-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h4 className="font-bold text-sm">Absence of Reports Does NOT Imply Safety!</h4>
            </div>
            <p className="text-xs leading-relaxed">
              No previous citizen complaints or verified registry records exist for this number in TRACE CallShield. 
              However, <strong>scammers routinely buy and rotate new prepaid SIM cards</strong> every few days to evade fraud databases.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-bold block mb-1">Standard Safety Precautions:</span>
            <ul className="space-y-1 opacity-90">
              <li>• Never enter your UPI PIN to "receive" funds.</li>
              <li>• Never install remote access applications (AnyDesk, TeamViewer, RustDesk).</li>
              <li>• If the caller claims to represent an organization, hang up and call their official website number.</li>
            </ul>
          </div>
        </div>
      )}

      {/* STATE 4: LOOKUP UNAVAILABLE */}
      {isUnavailable && (
        <div className="p-4 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs space-y-2">
          <h4 className="font-bold text-sm">Invalid Format or Input</h4>
          <p className="opacity-90 leading-relaxed">
            Please enter a standard 10-digit mobile number, verified toll-free helpline (e.g. 1800 425 3800), or emergency number (1930).
          </p>
        </div>
      )}

      {/* Transparent Disclaimer */}
      <div className="mt-4 pt-3 border-t border-current/15 text-[11px] opacity-70 italic">
        {result.disclaimer}
      </div>
    </div>
  );
};
