import type { Transaction } from '../../contracts/index.ts';

export interface GeoCluster {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  totalCount: number;
  totalVolume: number;
  flaggedCount: number;
  flaggedVolume: number;
  flaggedRate: number; // 0.0 to 1.0 (e.g. 0.75 = 75%)
  isSyntheticDemo: boolean;
  sampleTransactionIds: string[];
}

export interface GeoAggregationResult {
  clusters: GeoCluster[];
  validTransactionCount: number;
  unmappedTransactionCount: number;
  hasSyntheticDemoCoordinates: boolean;
  isEmpty: boolean;
}

export class GeoAggregator {
  /**
   * Aggregates transactions into geographical clusters.
   * Strictly verifies coordinate boundaries and never guesses coordinates from account or phone numbers.
   */
  static aggregate(transactions: Transaction[]): GeoAggregationResult {
    const clustersMap = new Map<string, GeoCluster>();
    let validCount = 0;
    let unmappedCount = 0;
    let hasSynthetic = false;

    for (const txn of transactions) {
      const loc = txn.location;

      // Strict validation: must be present, numeric, and within Earth latitude/longitude limits
      if (
        !loc ||
        typeof loc.latitude !== 'number' ||
        typeof loc.longitude !== 'number' ||
        isNaN(loc.latitude) ||
        isNaN(loc.longitude) ||
        loc.latitude < -90 ||
        loc.latitude > 90 ||
        loc.longitude < -180 ||
        loc.longitude > 180
      ) {
        unmappedCount++;
        continue;
      }

      validCount++;
      if (loc.isSyntheticDemo) {
        hasSynthetic = true;
      }

      // Group key by city and rounded coordinate to avoid duplicate floating point keys
      const key = `${loc.city || 'Unknown'}-${loc.country || 'Unknown'}-${loc.latitude.toFixed(2)}-${loc.longitude.toFixed(2)}`;

      const isFlagged = txn.status === 'FLAGGED' || (txn.riskIndicators && txn.riskIndicators.length > 0);

      const existing = clustersMap.get(key);
      if (existing) {
        existing.totalCount++;
        existing.totalVolume += txn.amount;
        if (isFlagged) {
          existing.flaggedCount++;
          existing.flaggedVolume += txn.amount;
        }
        existing.flaggedRate = existing.totalCount > 0 ? existing.flaggedCount / existing.totalCount : 0;
        if (existing.sampleTransactionIds.length < 5) {
          existing.sampleTransactionIds.push(txn.transactionId);
        }
      } else {
        clustersMap.set(key, {
          id: key,
          city: loc.city || 'Unspecified City',
          country: loc.country || 'Unspecified Country',
          latitude: loc.latitude,
          longitude: loc.longitude,
          totalCount: 1,
          totalVolume: txn.amount,
          flaggedCount: isFlagged ? 1 : 0,
          flaggedVolume: isFlagged ? txn.amount : 0,
          flaggedRate: isFlagged ? 1.0 : 0.0,
          isSyntheticDemo: !!loc.isSyntheticDemo,
          sampleTransactionIds: [txn.transactionId],
        });
      }
    }

    const clusters = Array.from(clustersMap.values());

    return {
      clusters,
      validTransactionCount: validCount,
      unmappedTransactionCount: unmappedCount,
      hasSyntheticDemoCoordinates: hasSynthetic,
      isEmpty: clusters.length === 0,
    };
  }

  /**
   * Provides explicit human-readable definitions for displayed metrics.
   * Eliminates analyst ambiguity between counts and rates.
   */
  static explainMetric(metric: 'COUNT' | 'RATE'): { label: string; explanation: string; unit: string } {
    if (metric === 'COUNT') {
      return {
        label: 'Observed Transaction Volume (Count)',
        explanation: 'The raw number of recorded transfers originating from or terminating in this geographic location.',
        unit: 'transactions',
      };
    }
    return {
      label: 'Investigation Flagging Rate (Rate)',
      explanation: 'The percentage ratio of flagged transfers relative to total recorded transfers in this location. High rate signifies elevated priority, not definitive wrongdoing.',
      unit: '% flagged',
    };
  }
}
