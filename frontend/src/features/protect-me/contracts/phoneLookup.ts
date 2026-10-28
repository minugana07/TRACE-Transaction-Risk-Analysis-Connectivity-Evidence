/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * CallShield Contracts - Consumer Phone Reputation & Threat Intelligence
 * 
 * Complies with strict safety principles:
 * - Never implies "safe" just because no report was found.
 * - Distinguishes verified sources from community/unverified reports.
 * - Does not claim to fabricate live carrier/telecom interception or GPS tracking.
 */

export type PhoneLookupStatus = 
  | 'VERIFIED_SOURCE'
  | 'UNVERIFIED_REPORT'
  | 'NO_REPORTS_FOUND'
  | 'LOOKUP_UNAVAILABLE';

export interface VerifiedSourceDetails {
  entityName: string;
  officialCategory: 'GOVERNMENT_SERVICE' | 'BANK_OFFICIAL' | 'EMERGENCY_HELPLINE' | 'REGISTERED_ENTERPRISE';
  verifiedBadge: boolean;
  sourceRegistry: string; // e.g. "RBI Official Registry / Telecom Directory"
  officialWebsite?: string;
  tollFreeHelpline?: string;
  verificationDate: string;
}

export interface UnverifiedReportDetails {
  reportCount: number;
  primaryReportCategory: 
    | 'UPI_COLLECT_REQUEST'
    | 'ELECTRICITY_BILL_THREAT'
    | 'FAKE_BANK_KYC'
    | 'PART_TIME_JOB_OFFER'
    | 'LOTTERY_PARCEL_CUSTOMS'
    | 'OTHER_SUSPICIOUS';
  recentUserNotes: string[];
  firstReportedAt: string;
  lastReportedAt: string;
  communityCautionNotice: string;
}

export interface PhoneLookupResult {
  query: string;
  cleanedNumber: string;
  formattedNumber: string;
  status: PhoneLookupStatus;
  
  verifiedSource?: VerifiedSourceDetails;
  unverifiedReport?: UnverifiedReportDetails;
  
  safetyAdvice: string[];
  disclaimer: string;
  queriedAt: string;
}
