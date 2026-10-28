import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTraceApiAdapter } from '../api/in-memory-adapter.ts';
import { InvestigationStore } from '../state/investigation-store.ts';
import { GeoAggregator } from '../components/map/GeoAggregator.ts';
import { RiskRippleGraphModel } from '../components/graph/RiskRippleGraph.ts';
import type { Alert, Transaction } from '../contracts/index.ts';

describe('TRACE Malformed & Edge Case Data Handling', () => {
  test('handles alerts with empty detection results or missing rules without crashing', async () => {
    const malformedAlert: Alert = {
      alertId: 'ALT-MALFORMED-1',
      caseId: 'CASE-MALFORMED',
      title: 'Alert with Empty Rules Array',
      description: 'Edge case test for missing rules',
      priority: 'LOW',
      riskScore: 10,
      status: 'NEW',
      createdAt: '2026-10-27T00:00:00Z',
      updatedAt: '2026-10-27T00:00:00Z',
      primaryAccountId: 'ACC-EMPTY',
      relatedAccountIds: [],
      transactionIds: [],
      detectionResult: {
        resultId: 'DET-EMPTY',
        engineVersion: 'v1',
        timestamp: '2026-10-27T00:00:00Z',
        overallRiskScore: 10,
        triggeredRules: [], // Empty rules array
      },
      evidence: [], // Empty evidence array
      notes: [],
    };

    const api = new InMemoryTraceApiAdapter([malformedAlert], [], []);
    const store = new InvestigationStore(api);

    await store.loadAlerts();
    const state = store.getState();

    assert.equal(state.status, 'success');
    assert.equal(state.alerts.length, 1);
    assert.equal(state.selectedAlert?.alertId, 'ALT-MALFORMED-1');
  });

  test('GeoAggregator safely ignores transactions with null, undefined, or string coordinates', () => {
    const corruptedTransactions = [
      {
        transactionId: 'TXN-CORRUPT-1',
        sourceAccountId: 'A1',
        targetAccountId: 'A2',
        amount: 1000,
        currency: 'USD',
        timestamp: '2026-10-27T00:00:00Z',
        status: 'COMPLETED' as const,
        channel: 'WIRE' as const,
        location: {
          latitude: 'invalid-string' as any,
          longitude: null as any,
          city: 'Faulty',
          country: 'XX',
        },
      },
      {
        transactionId: 'TXN-CORRUPT-2',
        sourceAccountId: 'A1',
        targetAccountId: 'A2',
        amount: 1000,
        currency: 'USD',
        timestamp: '2026-10-27T00:00:00Z',
        status: 'COMPLETED' as const,
        channel: 'WIRE' as const,
        location: null as any,
      },
    ] as Transaction[];

    const result = GeoAggregator.aggregate(corruptedTransactions);
    assert.equal(result.validTransactionCount, 0);
    assert.equal(result.unmappedTransactionCount, 2);
    assert.equal(result.isEmpty, true);
  });

  test('RiskRippleGraphModel safely handles empty nodes and edges arrays', () => {
    const emptyGraph = {
      nodes: [],
      edges: [],
    };

    const elements = RiskRippleGraphModel.toCytoscapeElements(emptyGraph);
    assert.equal(elements.length, 0);
  });
});
