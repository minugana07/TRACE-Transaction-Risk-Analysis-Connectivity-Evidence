import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GeoAggregator } from '../components/map/GeoAggregator.ts';
import type { Transaction } from '../contracts/index.ts';

describe('TRACE Geographic Hotspot Map & GeoAggregator', () => {
  test('accurately aggregates valid geographic data into regional clusters', () => {
    const transactions: Transaction[] = [
      {
        transactionId: 'TXN-1',
        sourceAccountId: 'A1',
        targetAccountId: 'A2',
        amount: 50000,
        currency: 'USD',
        timestamp: '2026-10-27T10:00:00Z',
        status: 'FLAGGED',
        channel: 'WIRE',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          city: 'New York',
          country: 'US',
          isSyntheticDemo: true,
        },
      },
      {
        transactionId: 'TXN-2',
        sourceAccountId: 'A3',
        targetAccountId: 'A4',
        amount: 25000,
        currency: 'USD',
        timestamp: '2026-10-27T11:00:00Z',
        status: 'COMPLETED',
        channel: 'ACH',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          city: 'New York',
          country: 'US',
          isSyntheticDemo: true,
        },
      },
    ];

    const result = GeoAggregator.aggregate(transactions);
    assert.equal(result.clusters.length, 1);
    assert.equal(result.validTransactionCount, 2);
    assert.equal(result.unmappedTransactionCount, 0);

    const cluster = result.clusters[0];
    assert.equal(cluster.city, 'New York');
    assert.equal(cluster.totalCount, 2);
    assert.equal(cluster.totalVolume, 75000);
    assert.equal(cluster.flaggedCount, 1);
    assert.equal(cluster.flaggedRate, 0.5); // 50% flagged rate
    assert.equal(cluster.isSyntheticDemo, true);
  });

  test('gracefully isolates missing and invalid coordinates without crashing', () => {
    const mixedTxns: Transaction[] = [
      {
        transactionId: 'TXN-VALID',
        sourceAccountId: 'A1',
        targetAccountId: 'A2',
        amount: 1000,
        currency: 'USD',
        timestamp: '2026-10-27T10:00:00Z',
        status: 'COMPLETED',
        channel: 'WIRE',
        location: { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'GB' },
      },
      {
        transactionId: 'TXN-NO-LOC',
        sourceAccountId: 'A3',
        targetAccountId: 'A4',
        amount: 2000,
        currency: 'USD',
        timestamp: '2026-10-27T10:00:00Z',
        status: 'COMPLETED',
        channel: 'WIRE',
        location: undefined, // Missing location
      },
      {
        transactionId: 'TXN-INVALID-LAT',
        sourceAccountId: 'A5',
        targetAccountId: 'A6',
        amount: 3000,
        currency: 'USD',
        timestamp: '2026-10-27T10:00:00Z',
        status: 'COMPLETED',
        channel: 'WIRE',
        location: { latitude: 999.0, longitude: -74.0, city: 'BadCoords', country: 'XX' }, // Out of range
      },
      {
        transactionId: 'TXN-NAN-COORDS',
        sourceAccountId: 'A7',
        targetAccountId: 'A8',
        amount: 4000,
        currency: 'USD',
        timestamp: '2026-10-27T10:00:00Z',
        status: 'COMPLETED',
        channel: 'WIRE',
        location: { latitude: NaN, longitude: NaN, city: 'Corrupt', country: 'XX' },
      },
    ];

    const result = GeoAggregator.aggregate(mixedTxns);
    assert.equal(result.validTransactionCount, 1);
    assert.equal(result.unmappedTransactionCount, 3);
    assert.equal(result.clusters.length, 1);
    assert.equal(result.clusters[0].city, 'London');
  });

  test('empty locations test: handles completely unmapped datasets with an empty state', () => {
    const unmappedTxns: Transaction[] = [
      {
        transactionId: 'TXN-1',
        sourceAccountId: 'A1',
        targetAccountId: 'A2',
        amount: 1000,
        currency: 'USD',
        timestamp: '2026-10-27T10:00:00Z',
        status: 'COMPLETED',
        channel: 'WIRE',
        location: undefined,
      },
    ];

    const result = GeoAggregator.aggregate(unmappedTxns);
    assert.equal(result.isEmpty, true);
    assert.equal(result.clusters.length, 0);
    assert.equal(result.unmappedTransactionCount, 1);
    assert.equal(result.validTransactionCount, 0);
  });

  test('explains whether displayed value is a count or a rate to prevent analyst misinterpretation', () => {
    const countExplanation = GeoAggregator.explainMetric('COUNT');
    assert.ok(countExplanation.label.includes('Count'));
    assert.ok(countExplanation.explanation.includes('raw number'));

    const rateExplanation = GeoAggregator.explainMetric('RATE');
    assert.ok(rateExplanation.label.includes('Rate'));
    assert.ok(rateExplanation.explanation.includes('percentage'));
  });
});
