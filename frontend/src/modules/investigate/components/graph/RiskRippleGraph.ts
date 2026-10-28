import type { Account, Transaction } from '../../contracts/index.ts';
import type { GraphData } from '../../api/client.ts';

export interface CytoscapeNodeData {
  group: 'nodes';
  data: {
    id: string;
    label: string;
    holderName: string;
    holderType: string;
    riskScore: number;
    status: string;
    balance: number;
    currency: string;
    country: string;
    isFocus: boolean;
  };
}

export interface CytoscapeEdgeData {
  group: 'edges';
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    amount: number;
    currency: string;
    timestamp: string;
    channel: string;
    status: string;
    isFlagged: boolean;
    sequenceIndex?: number;
    riskIndicators: string[];
  };
}

export type CytoscapeElement = CytoscapeNodeData | CytoscapeEdgeData;

export class RiskRippleGraphModel {
  /**
   * Transforms raw Accounts and Transactions into strict Cytoscape-compatible element definitions.
   * Never fabricates edges; every edge corresponds to an actual recorded transaction transfer.
   */
  static toCytoscapeElements(
    graphData: GraphData,
    options: {
      minAmount?: number;
      riskOnly?: boolean;
      highlightSequence?: boolean;
    } = {}
  ): CytoscapeElement[] {
    const { nodes, edges, focusAccountId } = graphData;
    const minAmount = options.minAmount || 0;
    const riskOnly = !!options.riskOnly;

    // Filter edges by criteria
    let filteredEdges = edges.filter((e) => {
      if (e.amount < minAmount) return false;
      if (riskOnly) {
        const hasRisk = e.status === 'FLAGGED' || (e.riskIndicators && e.riskIndicators.length > 0);
        if (!hasRisk) return false;
      }
      return true;
    });

    // Sort edges chronologically to establish temporal sequence indices
    const sortedEdges = [...filteredEdges].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const edgeMap = new Map<string, number>();
    sortedEdges.forEach((e, idx) => {
      edgeMap.set(e.transactionId, idx + 1);
    });

    const elements: CytoscapeElement[] = [];

    // Map Nodes
    for (const node of nodes) {
      elements.push({
        group: 'nodes',
        data: {
          id: node.accountId,
          label: `${node.holderName}\n(${node.accountId})`,
          holderName: node.holderName,
          holderType: node.holderType,
          riskScore: node.riskScore,
          status: node.status,
          balance: node.balance,
          currency: node.currency,
          country: node.country,
          isFocus: node.accountId === focusAccountId,
        },
      });
    }

    // Map Directed Edges
    for (const edge of filteredEdges) {
      const isFlagged = edge.status === 'FLAGGED' || (edge.riskIndicators && edge.riskIndicators.length > 0);
      elements.push({
        group: 'edges',
        data: {
          id: edge.transactionId,
          source: edge.sourceAccountId,
          target: edge.targetAccountId,
          label: `$${edge.amount.toLocaleString()} (${edge.channel})`,
          amount: edge.amount,
          currency: edge.currency,
          timestamp: edge.timestamp,
          channel: edge.channel,
          status: edge.status,
          isFlagged,
          sequenceIndex: edgeMap.get(edge.transactionId),
          riskIndicators: edge.riskIndicators || [],
        },
      });
    }

    return elements;
  }

  /**
   * Cytoscape.js stylesheet definition configured for high-contrast investigative analysis.
   */
  static getCytoscapeStylesheet() {
    return [
      {
        selector: 'node',
        style: {
          'background-color': '#1e293b',
          'border-width': 2,
          'border-color': '#64748b',
          'label': 'data(label)',
          'color': '#f8fafc',
          'font-size': '11px',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'width': 60,
          'height': 60,
        },
      },
      {
        selector: 'node[isFocus = true]',
        style: {
          'border-width': 4,
          'border-color': '#38bdf8',
          'background-color': '#0f172a',
          'width': 70,
          'height': 70,
        },
      },
      {
        selector: 'node[riskScore >= 75]',
        style: {
          'border-color': '#ef4444',
        },
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#64748b',
          'target-arrow-color': '#64748b',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '10px',
          'color': '#cbd5e1',
          'text-background-opacity': 0.85,
          'text-background-color': '#0f172a',
          'text-background-padding': '2px',
        },
      },
      {
        selector: 'edge[isFlagged = true]',
        style: {
          'line-color': '#ef4444',
          'target-arrow-color': '#ef4444',
          'width': 3,
        },
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#38bdf8',
          'target-arrow-color': '#38bdf8',
          'width': 4,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#38bdf8',
          'border-width': 4,
        },
      },
    ];
  }
}
