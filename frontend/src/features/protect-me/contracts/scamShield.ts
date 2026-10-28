/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * ScamShield Contracts - Interactive Educational Simulator
 * 
 * Teaches consumers how to identify and evade digital-payment scams.
 */

export type ScamType = 
  | 'UPI_COLLECT' 
  | 'FAKE_SUPPORT' 
  | 'UTILITY_BILL' 
  | 'TASK_INVESTMENT' 
  | 'URGENT_FRIEND';

export interface ChatMessage {
  id: string;
  sender: 'scammer' | 'user' | 'system';
  senderName: string;
  avatarText: string;
  text: string;
  timestamp: string;
  highlightedPhrase?: string;
  attachmentType?: 'QR_CODE' | 'APK_FILE' | 'SCREENSHOT' | 'LINK';
  attachmentLabel?: string;
}

export interface DecisionOption {
  id: string;
  text: string;
  isSafe: boolean;
  immediateFeedback: string;
  explanation: string;
}

export interface ExplainBackQuestion {
  question: string;
  promptGuidance: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }>;
  keyRuleToRemember: string;
}

export interface ScamScenario {
  id: string;
  scamType: ScamType;
  title: string;
  shortSummary: string;
  realWorldContext: string;
  channel: 'SMS' | 'WHATSAPP' | 'PHONE_CALL' | 'TELEGRAM';
  
  // Interactive roleplay chat
  fictionalMessages: ChatMessage[];
  
  // Red flag educational highlights
  warningSigns: Array<{
    phrase: string;
    explanation: string;
  }>;
  
  // Multiple-choice interactive choice
  decisionPrompt: string;
  decisionOptions: DecisionOption[];
  
  // Explain-back verification question
  explainBack: ExplainBackQuestion;
  
  // Practical safe next steps
  safeNextSteps: string[];
}
