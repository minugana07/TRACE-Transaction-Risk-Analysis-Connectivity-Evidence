export type AccountStatus = 'ACTIVE' | 'DORMANT' | 'FROZEN' | 'RESTRICTED';

export type HolderType = 'INDIVIDUAL' | 'BUSINESS';

/**
 * Account entity contract published by Member 1.
 * Connected accounts identified in Risk Ripple are investigative leads,
 * not definitive proof of wrongdoing or complicity.
 */
export interface Account {
  accountId: string;
  accountNumber: string;
  holderName: string;
  holderType: HolderType;
  createdAt: string; // ISO 8601
  status: AccountStatus;
  riskScore: number; // 0-100 investigation priority
  country: string;
  balance: number;
  currency: string;
}
