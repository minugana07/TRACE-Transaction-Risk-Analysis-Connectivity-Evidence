/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * RecentAlertsBanner - Plain-language consumer warnings for active alerts
 */

import React from 'react';
import { Alert } from '../../contracts/transaction';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VoiceReaderButton } from '../accessibility/VoiceReaderButton';

interface RecentAlertsBannerProps {
  alerts: Alert[];
  onSelectAlert?: (alert: Alert) => void;
}

export const RecentAlertsBanner: React.FC<RecentAlertsBannerProps> = ({ alerts, onSelectAlert }) => {
  const { highContrast } = useAccessibility();

  if (!alerts || alerts.length === 0) {
    return (
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${
        highContrast 
          ? 'bg-zinc-900 border-green-500 text-white' 
          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
      }`}>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm">No Active High-Risk Warnings</h4>
          <p className="text-xs opacity-90">All recent transactions have verified or normal risk profiles. Continue staying vigilant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="region" aria-label="Active Security Warnings">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" aria-hidden="true" />
          Attention Needed ({alerts.length} Alert{alerts.length > 1 ? 's' : ''})
        </h3>
        <span className="text-xs opacity-75">Derived from TRACE Risk Analysis</span>
      </div>

      {alerts.map((alert) => {
        const isCritical = alert.severity === 'CRITICAL';
        const isHigh = alert.severity === 'HIGH';

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border transition-all ${
              highContrast
                ? 'bg-black border-2 border-yellow-400 text-white shadow-md'
                : isCritical
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-slate-900 dark:text-slate-100'
                : isHigh
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-slate-100'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                  isCritical 
                    ? 'bg-rose-600 text-white' 
                    : isHigh 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {alert.severity} Risk
                </span>
                <span className="text-xs opacity-60 font-mono">ID: {alert.transactionId}</span>
              </div>
              <VoiceReaderButton 
                textToRead={`Warning: ${alert.title}. ${alert.plainLanguageSummary}. Recommended action: ${alert.recommendedActions.join('. ')}`}
                label="Listen"
              />
            </div>

            <h4 className="font-bold text-base mb-1">{alert.title}</h4>
            <p className="text-sm mb-3 leading-relaxed opacity-90">{alert.plainLanguageSummary}</p>

            {alert.recommendedActions && alert.recommendedActions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dashed border-current/20">
                <p className="text-xs font-bold uppercase tracking-wide mb-1.5 opacity-80">Recommended Next Steps:</p>
                <ul className="space-y-1 text-xs">
                  {alert.recommendedActions.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold" aria-hidden="true">✓</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
