/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * VoiceReaderButton - Accessible inline TTS trigger
 */

import React, { useState } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface VoiceReaderButtonProps {
  textToRead: string;
  label?: string;
  className?: string;
}

export const VoiceReaderButton: React.FC<VoiceReaderButtonProps> = ({
  textToRead,
  label = 'Listen',
  className = ''
}) => {
  const { speak, stopSpeaking, isSpeaking, highContrast } = useAccessibility();
  const [isActiveThisButton, setIsActiveThisButton] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActiveThisButton && isSpeaking) {
      stopSpeaking();
      setIsActiveThisButton(false);
    } else {
      setIsActiveThisButton(true);
      speak(textToRead);
    }
  };

  const isPlayingNow = isActiveThisButton && isSpeaking;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all min-h-[32px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isPlayingNow
          ? 'bg-amber-600 text-white font-bold ring-2 ring-amber-400 animate-pulse'
          : highContrast
          ? 'bg-zinc-900 text-yellow-300 border border-yellow-400 hover:bg-yellow-400 hover:text-black'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      } ${className}`}
      aria-label={`${isPlayingNow ? 'Stop reading' : 'Read aloud'}: ${label}`}
      title={isPlayingNow ? 'Stop voice reading' : 'Read this section aloud'}
    >
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isPlayingNow ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        )}
      </svg>
      <span>{isPlayingNow ? 'Stop' : label}</span>
    </button>
  );
};
