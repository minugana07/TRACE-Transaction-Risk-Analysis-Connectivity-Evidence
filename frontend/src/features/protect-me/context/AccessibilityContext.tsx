/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * Accessibility Context & Provider
 * 
 * Manages:
 * - Text size scaling (Standard, Large, Extra Large)
 * - High Contrast theme toggle
 * - Global Audio narration / Read-aloud TTS status
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { tts } from '../services/ttsService';

export type TextScale = 'standard' | 'large' | 'extra-large';

export interface AccessibilityState {
  textScale: TextScale;
  highContrast: boolean;
  isSpeaking: boolean;
  setTextScale: (scale: TextScale) => void;
  setHighContrast: (enabled: boolean) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  getTextScaleClass: () => string;
}

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textScale, setTextScaleState] = useState<TextScale>('standard');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    // Load saved preferences if available
    try {
      const savedScale = localStorage.getItem('trace_text_scale') as TextScale;
      if (savedScale && ['standard', 'large', 'extra-large'].includes(savedScale)) {
        setTextScaleState(savedScale);
      }
      const savedContrast = localStorage.getItem('trace_high_contrast');
      if (savedContrast !== null) {
        setHighContrastState(savedContrast === 'true');
      }
    } catch {
      // Ignore localStorage restrictions in isolated environments
    }

    // Subscribe to TTS status changes
    const unsubscribe = tts.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });

    return () => {
      tts.stop();
      unsubscribe();
    };
  }, []);

  const setTextScale = (scale: TextScale) => {
    setTextScaleState(scale);
    try {
      localStorage.setItem('trace_text_scale', scale);
    } catch {}
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      localStorage.setItem('trace_high_contrast', String(enabled));
    } catch {}
  };

  const speak = (text: string) => {
    tts.speak(text);
  };

  const stopSpeaking = () => {
    tts.stop();
  };

  const getTextScaleClass = (): string => {
    switch (textScale) {
      case 'large':
        return 'text-scale-large text-[1.125rem] leading-relaxed';
      case 'extra-large':
        return 'text-scale-xl text-[1.25rem] leading-loose';
      default:
        return 'text-scale-standard text-base leading-normal';
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textScale,
        highContrast,
        isSpeaking,
        setTextScale,
        setHighContrast,
        speak,
        stopSpeaking,
        getTextScaleClass
      }}
    >
      <div 
        className={`trace-accessibility-root transition-colors duration-200 ${
          highContrast ? 'theme-high-contrast' : ''
        } ${getTextScaleClass()}`}
        aria-live="polite"
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityState => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
