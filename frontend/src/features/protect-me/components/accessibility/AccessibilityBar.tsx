/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * Accessibility Toolbar Component
 * 
 * Provides accessible controls:
 * - Text magnification controls
 * - High Contrast mode toggle
 * - Global Audio Narration control
 */

import React from 'react';
import { useAccessibility, TextScale } from '../../context/AccessibilityContext';

export const AccessibilityBar: React.FC<{ pageTitle?: string; pageSummaryText?: string }> = ({
  pageTitle = 'Protect Me',
  pageSummaryText = 'Welcome to TRACE Protect Me. Review your payment safety, check unknown phone numbers with CallShield, and learn how to identify scams with ScamShield.'
}) => {
  const {
    textScale,
    highContrast,
    isSpeaking,
    setTextScale,
    setHighContrast,
    speak,
    stopSpeaking
  } = useAccessibility();

  const handleReadSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(`${pageTitle}. ${pageSummaryText}`);
    }
  };

  return (
    <nav 
      aria-label="Accessibility and display settings" 
      className={`border-b px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm select-none ${
        highContrast 
          ? 'bg-black text-white border-yellow-400' 
          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold flex items-center gap-1.5" aria-hidden="true">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Accessibility:
        </span>
        <span className="text-xs opacity-75">Adjust screen settings for comfortable reading</span>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Text Size Selectors - Minimum 44x44px touch targets */}
        <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5" role="group" aria-label="Text Size Controls">
          <button
            type="button"
            onClick={() => setTextScale('standard')}
            className={`min-w-[44px] min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              textScale === 'standard'
                ? highContrast ? 'bg-yellow-400 text-black font-bold' : 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            aria-pressed={textScale === 'standard'}
            title="Standard Text Size (100%)"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setTextScale('large')}
            className={`min-w-[44px] min-h-[36px] px-2.5 py-1 rounded text-sm font-semibold transition-colors ${
              textScale === 'large'
                ? highContrast ? 'bg-yellow-400 text-black font-bold' : 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            aria-pressed={textScale === 'large'}
            title="Large Text Size (115%)"
          >
            A+
          </button>
          <button
            type="button"
            onClick={() => setTextScale('extra-large')}
            className={`min-w-[44px] min-h-[36px] px-2.5 py-1 rounded text-base font-bold transition-colors ${
              textScale === 'extra-large'
                ? highContrast ? 'bg-yellow-400 text-black font-bold' : 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            aria-pressed={textScale === 'extra-large'}
            title="Extra Large Text Size (130%)"
          >
            A++
          </button>
        </div>

        {/* High Contrast Toggle */}
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          className={`min-h-[36px] px-3 py-1 rounded-lg font-medium text-xs flex items-center gap-1.5 border transition-all ${
            highContrast
              ? 'bg-yellow-400 text-black border-yellow-300 font-bold ring-2 ring-yellow-400'
              : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-pressed={highContrast}
          aria-label="Toggle High Contrast Mode"
        >
          <span className="w-3 h-3 rounded-full border border-current bg-gradient-to-r from-black to-white" aria-hidden="true" />
          <span>{highContrast ? 'High Contrast ON' : 'High Contrast'}</span>
        </button>

        {/* Browser Text-to-Speech Read Aloud */}
        <button
          type="button"
          onClick={handleReadSummary}
          className={`min-h-[36px] px-3 py-1 rounded-lg font-medium text-xs flex items-center gap-1.5 border transition-all ${
            isSpeaking
              ? 'bg-amber-500 text-white border-amber-600 animate-pulse font-bold'
              : highContrast
              ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400/20'
              : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label={isSpeaking ? 'Stop voice reader' : 'Read aloud this page summary'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isSpeaking ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            )}
          </svg>
          <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
        </button>
      </div>
    </nav>
  );
};
