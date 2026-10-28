/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * Shared Contracts - Aligned with Member 1 Core Specification
 * 
 * Note: Product name is strictly TRACE.
 */

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FLAGGED' | 'BLOCKED';

export type PaymentMethod = 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'CARD' | 'WALLET';

export interface EvidenceItem {
  id: string;
  category: 'RULE_TRIGGER' | 'NETWORK_GRAPH' | 'BEHAVIORAL_ANOMALY' | 'KNOWN_SCAMMER_PATTERN' | 'DEVICE_FINGERPRINT';
  severity: RiskLevel;
  headline: string;
  detail: string;
  confidenceScore?: number; // 0.0 - 1.0
  sourceMetric?: string;
}

export interface GraphInsight {
  isMuleAccount?: boolean;
  hopsFromKnownScammer?: number;
  communityRisk?: number; // 0.0 - 1.0
  associatedReportCount?: number;
  clusterTag?: string;
}

export interface Alert {
  id: string;
  transactionId: string;
  severity: RiskLevel;
  title: string;
  plainLanguageSummary: string;
  technicalDetails?: string;
  createdAt: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  recommendedActions: string[];
}

export interface DetectionResult {
  transactionId: string;
  overallRiskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  evaluatedAt: string;
  flags: string[];
  plainLanguageExplanation: string;
  technicalSummary?: string;
  evidenceList: EvidenceItem[];
  ruleHits: string[];
  graphInsights?: GraphInsight;
  isEngineEvaluated: boolean;
}

export interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  currency: string;
  senderId: string;
  senderAccountOrVpa: string;
  senderPhone?: string;
  receiverId: string;
  receiverAccountOrVpa: string;
  receiverPhone?: string;
  paymentMethod: PaymentMethod;
  category?: string;
  note?: string;
  status: TransactionStatus;
  
  // Member 1 Detection integration
  detectionResult?: DetectionResult;
  alerts?: Alert[];
  
  // Consumer safety flags
  isSampleDemonstration?: boolean;
}

export interface TransactionManualInput {
  amount: number;
  currency: string;
  receiverAccountOrVpa: string;
  receiverPhone?: string;
  paymentMethod: PaymentMethod;
  note?: string;
  senderAccountOrVpa: string;
}
