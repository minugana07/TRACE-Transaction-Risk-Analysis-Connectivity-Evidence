import type { DetectionResult } from './detection.ts';
import type { EvidenceItem } from './evidence.ts';
import type { InvestigationNote } from './investigation-note.ts';

export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'ESCALATED'
  | 'CLOSED_FALSE_POSITIVE'
  | 'CLOSED_RESOLVED';

/**
 * Alert contract published by Member 1.
 * Note: riskScore represents an investigation priority score (0-100),
 * not absolute legal proof of fraudulent conduct.
 */
export interface Alert {
  alertId: string;
  caseId: string;
  title: string;
  description: string;
  priority: AlertPriority;
  riskScore: number; // 0-100 investigation priority
  status: CaseStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  assignedTo?: string;
  primaryAccountId: string;
  relatedAccountIds: string[];
  transactionIds: string[];
  detectionResult: DetectionResult;
  evidence: EvidenceItem[];
  notes: InvestigationNote[];
}
