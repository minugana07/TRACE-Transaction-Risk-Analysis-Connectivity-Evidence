export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FLAGGED' | 'REJECTED';

export type TransactionChannel = 'WIRE' | 'ACH' | 'SWIFT' | 'INTERNAL' | 'P2P';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  ipAddress?: string;
  /**
   * If true, this coordinate is synthetic demonstration data and not a confirmed physical location.
   */
  isSyntheticDemo?: boolean;
}

/**
 * Immutable transaction record from core ingestion/pipeline (Member 3).
 * Investigating alerts or changing case statuses must NEVER alter or mutate these records.
 */
export interface Transaction {
  transactionId: string;
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  currency: string;
  timestamp: string; // ISO 8601
  status: TransactionStatus;
  channel: TransactionChannel;
  location?: GeoLocation;
  riskIndicators?: string[];
}
