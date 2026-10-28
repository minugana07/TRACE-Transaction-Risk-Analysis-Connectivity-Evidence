/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * Member 3: Protect Me Consumer Safety Experience
 * 
 * Public Module Exports for integration with Member 1 application.
 */

// Root Component
export { ProtectMeContainer, default } from './components/ProtectMeContainer';
export type { ProtectMeTab, ProtectMeContainerProps } from './components/ProtectMeContainer';

// Dashboard & Components
export { SafetyOverview } from './components/dashboard/SafetyOverview';
export { RecentAlertsBanner } from './components/dashboard/RecentAlertsBanner';
export { TransactionHistory } from './components/transactions/TransactionHistory';
export { TransactionCard } from './components/transactions/TransactionCard';
export { TransactionIngestion } from './components/transactions/TransactionIngestion';
export { RiskExplanationModal } from './components/transactions/RiskExplanationModal';
export { CallShieldLookup } from './components/callshield/CallShieldLookup';
export { PhoneReportCard } from './components/callshield/PhoneReportCard';
export { ScamShieldHome } from './components/scamshield/ScamShieldHome';
export { ScenarioInteractive } from './components/scamshield/ScenarioInteractive';
export { ExplainBackCard } from './components/scamshield/ExplainBackCard';
export { SafetyLoop } from './components/safetyloop/SafetyLoop';

// Accessibility
export { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
export type { TextScale, AccessibilityState } from './context/AccessibilityContext';
export { AccessibilityBar } from './components/accessibility/AccessibilityBar';
export { VoiceReaderButton } from './components/accessibility/VoiceReaderButton';

// Services & API
export { traceApi } from './services/apiClient';
export { tts } from './services/ttsService';

// Shared Contracts (Aligned with Member 1)
export * from './contracts/transaction';
export * from './contracts/phoneLookup';
export * from './contracts/scamShield';

// Isolated Mock Data
export { MOCK_TRANSACTIONS, MOCK_ALERTS } from './data/mockData';
export { CURATED_PHONE_ENTRIES, lookupPhoneNumber } from './data/curatedPhoneDataset';
export { SCAM_SCENARIOS } from './data/scamScenarios';
