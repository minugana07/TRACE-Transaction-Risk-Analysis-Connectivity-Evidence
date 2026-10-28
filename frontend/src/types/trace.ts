/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * Shared Data Contracts - TypeScript Definitions
 * 
 * NOTE: These types mirror backend/app/models/contracts.py exactly.
 * Any updates here must be coordinated with Member 1 (Lead Engineer)
 * and kept in sync with the Python Pydantic models.
 */

export type ChannelType = 'WIRE' | 'ONLINE' | 'MOBILE' | 'ATM' | 'CRYPTO_RAMP' | 'POS' | 'ACH';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'FLAGGED';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InvestigationStatus = 
  | 'NEW' 
  | 'IN_PROGRESS' 
  | 'ESCALATED' 
  | 'RESOLVED_BENIGN' 
  | 'RESOLVED_FRAUD' 
  | 'CLOSED';

export interface GeographicData {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  ip_address?: string;
  device_id?: string;
}

export interface Transaction {
  id: string;
  timestamp: string; // ISO 8601 UTC
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  channel: string;
  status: string;
  geographic_data?: GeographicData;
  description?: string;
  risk_score?: number; // 0 - 100
}

export interface Account {
  id: string;
  account_number: string;
  holder_name: string;
  risk_tier: RiskTier | string;
  account_type: 'INDIVIDUAL' | 'BUSINESS' | 'MERCHANT' | 'MULE_SUSPECT' | string;
  created_at: string; // ISO 8601 UTC
}

export interface EvidenceItem {
  id: string;
  type: string;
  description: string;
  severity: RiskTier | string;
  timestamp: string;
  details: Record<string, any>;
}

export interface Alert {
  id: string;
  case_id: string;
  customer_id: string;
  title: string;
  summary: string;
  /**
   * Risk scores represent investigation priority, NOT calibrated probabilities of fraud.
   * Range: 0 - 100
   */
  risk_score: number;
  priority: RiskTier | string;
  related_transaction_ids: string[];
  triggered_rules: string[];
  evidence: EvidenceItem[];
  limitations: string[];
  investigation_status: InvestigationStatus | string;
  created_at: string;
  updated_at: string;
}

export interface DetectionResult {
  summary: string;
  alerts: Alert[];
  transaction_count: intNumber;
  flagged_count: intNumber;
  execution_time_ms: number;
  metadata: Record<string, any>;
}

type intNumber = number;

export interface InvestigationNote {
  id: string;
  case_id: string;
  alert_id?: string;
  author: string;
  note: string;
  timestamp: string;
  status_change?: string;
}

export interface InvestigationNoteCreate {
  case_id: string;
  alert_id?: string;
  author?: string;
  note: string;
  status_change?: string;
}

export interface CaseStatusUpdate {
  case_id: string;
  status: string;
  author?: string;
  reason?: string;
}

export interface AIExplanationRequest {
  case_id: string;
  alert_id?: string;
  mode: 'investigate' | 'protect_me';
  user_prompt?: string;
}

export interface AIExplanationResponse {
  case_id: string;
  mode: 'investigate' | 'protect_me';
  headline: string;
  observations: string[];
  inferences: string[];
  evidence_breakdown: Array<Record<string, any>>;
  limitations: string[];
  recommended_actions: string[];
  engine_used: string;
  disclaimer: string;
}
