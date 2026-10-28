import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTraceApiAdapter } from '../api/in-memory-adapter.ts';
import { InvestigationStore } from '../state/investigation-store.ts';

describe('TRACE Investigation Dashboard & Alert Queue', () => {
  test('fetches and sorts alerts by risk score priority descending by default', async () => {
    const api = new InMemoryTraceApiAdapter();
    const alerts = await api.fetchAlerts();

    assert.ok(alerts.length >= 4, 'Should load synthetic demonstration alerts');
    // Verify descending risk priority score
    for (let i = 0; i < alerts.length - 1; i++) {
      assert.ok(
        alerts[i].riskScore >= alerts[i + 1].riskScore,
        `Alert at index ${i} (${alerts[i].riskScore}) should have riskScore >= index ${i + 1} (${alerts[i + 1].riskScore})`
      );
    }
  });

  test('filters alerts by priority level (CRITICAL, HIGH, etc.)', async () => {
    const api = new InMemoryTraceApiAdapter();
    const criticalAlerts = await api.fetchAlerts({ priority: 'CRITICAL' });

    assert.ok(criticalAlerts.length > 0);
    criticalAlerts.forEach((a) => {
      assert.equal(a.priority, 'CRITICAL');
    });
  });

  test('filters alerts by case status', async () => {
    const api = new InMemoryTraceApiAdapter();
    const underReviewAlerts = await api.fetchAlerts({ status: 'UNDER_REVIEW' });

    assert.ok(underReviewAlerts.length > 0);
    underReviewAlerts.forEach((a) => {
      assert.equal(a.status, 'UNDER_REVIEW');
    });
  });

  test('searches alerts across titles, account IDs, and triggered rules', async () => {
    const api = new InMemoryTraceApiAdapter();

    const searchAcc = await api.fetchAlerts({ search: 'ACC-1001' });
    assert.ok(searchAcc.length > 0);
    assert.ok(searchAcc.some((a) => a.primaryAccountId === 'ACC-1001'));

    const searchRule = await api.fetchAlerts({ search: 'Structuring' });
    assert.ok(searchRule.length > 0);
  });

  test('store properly manages selected alert and auto-loads related entities', async () => {
    const api = new InMemoryTraceApiAdapter();
    const store = new InvestigationStore(api);

    await store.loadAlerts();
    const state = store.getState();

    assert.equal(state.status, 'success');
    assert.ok(state.selectedAlertId !== null);
    assert.ok(state.selectedAlert !== null);
    assert.ok(state.selectedAlertTransactions.length > 0);
    assert.ok(state.selectedAlertAccounts.length > 0);
  });

  test('empty dataset test: handles empty alert queue gracefully', async () => {
    const api = new InMemoryTraceApiAdapter([], [], []);
    const store = new InvestigationStore(api);

    await store.loadAlerts();
    const state = store.getState();

    assert.equal(state.status, 'success');
    assert.equal(state.alerts.length, 0);
    assert.equal(state.selectedAlertId, null);
    assert.equal(state.selectedAlert, null);
    assert.equal(state.selectedAlertTransactions.length, 0);
  });
});
