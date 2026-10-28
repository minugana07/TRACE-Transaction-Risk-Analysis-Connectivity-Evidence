/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * Text-to-Speech (TTS) Accessibility Service
 * 
 * Provides voice read-aloud support for consumers, seniors, and visually impaired users
 * utilizing the browser's native SpeechSynthesis API without external dependencies.
 */

class TtsService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(isSpeaking: boolean) => void> = new Set();
  private rate: number = 0.95; // Slightly slower for maximum clarity

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public subscribe(callback: (isSpeaking: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(isSpeaking: boolean): void {
    this.listeners.forEach((cb) => cb(isSpeaking));
  }

  public setRate(newRate: number): void {
    this.rate = Math.min(Math.max(newRate, 0.5), 1.5);
  }

  /**
   * Pre-processes text to sound natural when read aloud
   */
  private cleanTextForAudio(rawText: string): string {
    return rawText
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/INR|₹/g, 'Rupees ')
      .replace(/VPA/g, 'UPI Address')
      .replace(/KYC/g, 'Know Your Customer')
      .replace(/OTP/g, 'One Time Password')
      .replace(/APK/g, 'App File')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public speak(text: string, onFinished?: () => void): void {
    if (!this.synth) {
      console.warn('TRACE Audio: Speech synthesis not available in this environment.');
      return;
    }

    // Stop ongoing speech
    this.stop();

    const clean = this.cleanTextForAudio(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    this.currentUtterance = utterance;

    utterance.rate = this.rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN'; // Indian English voice preferred if available

    // Pick best available English voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN')) || 
                           voices.find(v => v.lang.startsWith('en')) || 
                           voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.notify(false);
      if (onFinished) onFinished();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      this.currentUtterance = null;
      this.notify(false);
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.notify(false);
    }
  }

  public isSpeaking(): boolean {
    return this.synth !== null && this.synth.speaking;
  }
}

export const tts = new TtsService();
