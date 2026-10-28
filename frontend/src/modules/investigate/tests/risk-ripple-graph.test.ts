import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTraceApiAdapter } from '../api/in-memory-adapter.ts';
import { InvestigationStore } from '../state/investigation-store.ts';
import { RiskRippleGraphModel } from '../components/graph/RiskRippleGraph.ts';

describe('TRACE Risk Ripple Transaction Graph', () => {
  test('generates directed graph elements strictly from actual transactions without fabrication', async () => {
    const api = new InMemoryTraceApiAdapter();
    const graphData = await api.fetchConnectivityGraph('ACC-1001', 2);

    assert.ok(graphData.nodes.length > 0);
    assert.ok(graphData.edges.length > 0);

    const elements = RiskRippleGraphModel.toCytoscapeElements(graphData);
    const nodes = elements.filter((e) => e.group === 'nodes');
    const edges = elements.filter((e) => e.group === 'edges');

    assert.equal(nodes.length, graphData.nodes.length);
    assert.equal(edges.length, graphData.edges.length);

    // Verify every edge maps strictly to an actual transaction transfer between accounts
    for (const edge of edges) {
      const match = graphData.edges.find((t) => t.transactionId === edge.data.id);
      assert.ok(match, `Edge ${edge.data.id} must correspond to an actual ledger transfer`);
      assert.equal(edge.data.source, match.sourceAccountId);
      assert.equal(edge.data.target, match.targetAccountId);
      assert.equal(edge.data.amount, match.amount);
    }
  });

  test('sequence highlighting correctly computes chronological transfer ordering', async () => {
    const api = new InMemoryTraceApiAdapter();
    const graphData = await api.fetchConnectivityGraph('ACC-1001', 2);

    const elements = RiskRippleGraphModel.toCytoscapeElements(graphData, { highlightSequence: true });
    const edges = elements.filter((e) => e.group === 'edges') as any[];

    // Verify sequence indices exist and ascend with transaction timestamps
    edges.sort((a, b) => a.data.sequenceIndex - b.data.sequenceIndex);
    for (let i = 0; i < edges.length - 1; i++) {
      const t1 = new Date(edges[i].data.timestamp).getTime();
      const t2 = new Date(edges[i + 1].data.timestamp).getTime();
      assert.ok(t1 <= t2, `Sequence index #${edges[i].data.sequenceIndex} should precede or equal #${edges[i + 1].data.sequenceIndex}`);
    }
  });

  test('filters graph edges by minimum amount threshold and risk indicators', async () => {
    const api = new InMemoryTraceApiAdapter();
    const graphData = await api.fetchConnectivityGraph('ACC-1001', 2);

    // Filter by high amount
    const highAmountElements = RiskRippleGraphModel.toCytoscapeElements(graphData, { minAmount: 140000 });
    const highEdges = highAmountElements.filter((e) => e.group === 'edges');
    highEdges.forEach((e: any) => {
      assert.ok(e.data.amount >= 140000);
    });

    // Filter by risk only
    const riskOnlyElements = RiskRippleGraphModel.toCytoscapeElements(graphData, { riskOnly: true });
    const riskEdges = riskOnlyElements.filter((e) => e.group === 'edges');
    riskEdges.forEach((e: any) => {
      assert.equal(e.data.isFlagged, true);
    });
  });

  test('store allows selecting a graph node or edge and inspects details', async () => {
    const api = new InMemoryTraceApiAdapter();
    const store = new InvestigationStore(api);

    await store.loadAlerts();
    await store.loadGraphForAccount('ACC-1001');

    store.selectGraphNode('ACC-1001');
    assert.equal(store.getState().selectedGraphNode?.accountId, 'ACC-1001');
    assert.equal(store.getState().selectedGraphEdge, null);

    store.selectGraphEdge('TXN-901');
    assert.equal(store.getState().selectedGraphEdge?.transactionId, 'TXN-901');
    assert.equal(store.getState().selectedGraphNode, null);
  });

  test('navigates from a graph element to an associated alert when one exists', async () => {
    const api = new InMemoryTraceApiAdapter();
    const store = new InvestigationStore(api);

    await store.loadAlerts();

    // ACC-1001 is associated with ALT-8801
    const alertForAcc = store.findAssociatedAlert('ACC-1001');
    assert.ok(alertForAcc);
    assert.equal(alertForAcc.alertId, 'ALT-8801');

    // TXN-904 is associated with ALT-8802
    const alertForTxn = store.findAssociatedAlert('TXN-904');
    assert.ok(alertForTxn);
    assert.equal(alertForTxn.alertId, 'ALT-8802');

    // Navigate to alert
    await store.selectAlert(alertForTxn.alertId);
    assert.equal(store.getState().selectedAlertId, 'ALT-8802');
  });

  test('empty graph test: handles disconnected or non-existent account gracefully', async () => {
    const api = new InMemoryTraceApiAdapter();
    const graphData = await api.fetchConnectivityGraph('ACC-NON-EXISTENT', 2);

    assert.equal(graphData.nodes.length, 0);
    assert.equal(graphData.edges.length, 0);

    const elements = RiskRippleGraphModel.toCytoscapeElements(graphData);
    assert.equal(elements.length, 0);
  });
});
