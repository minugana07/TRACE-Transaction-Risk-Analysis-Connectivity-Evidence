import React, { useState, useMemo } from 'react';
import type { Transaction, Alert } from '../../types/trace';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Filter,
  DollarSign,
  Info,
  Maximize2,
  Activity,
  Layers,
} from 'lucide-react';

interface RiskRippleWorkspaceProps {
  transactions: Transaction[];
  alerts: Alert[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
}

export const RiskRippleWorkspace: React.FC<RiskRippleWorkspaceProps> = ({
  transactions,
  alerts,
  activeCaseId,
  onSelectCase,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [onlySuspicious, setOnlySuspicious] = useState<boolean>(false);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Set of flagged transaction IDs from alerts
  const flaggedTxIds = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => {
      (a.related_transaction_ids || []).forEach((id) => set.add(id));
    });
    return set;
  }, [alerts]);

  // Filtered transactions (real data only, never invented)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.amount < minAmount) return false;
      if (onlySuspicious && !flaggedTxIds.has(tx.id)) return false;
      return true;
    });
  }, [transactions, minAmount, onlySuspicious, flaggedTxIds]);

  // Derive accounts from filtered transactions
  const accountStats = useMemo(() => {
    const map: Record<
      string,
      {
        inflow: number;
        outflow: number;
        txCount: number;
        flaggedCount: number;
        counterparties: Set<string>;
      }
    > = {};

    filteredTransactions.forEach((tx) => {
      if (!map[tx.sender_id]) {
        map[tx.sender_id] = { inflow: 0, outflow: 0, txCount: 0, flaggedCount: 0, counterparties: new Set() };
      }
      if (!map[tx.receiver_id]) {
        map[tx.receiver_id] = { inflow: 0, outflow: 0, txCount: 0, flaggedCount: 0, counterparties: new Set() };
      }

      map[tx.sender_id].outflow += tx.amount;
      map[tx.sender_id].txCount += 1;
      map[tx.sender_id].counterparties.add(tx.receiver_id);

      map[tx.receiver_id].inflow += tx.amount;
      map[tx.receiver_id].txCount += 1;
      map[tx.receiver_id].counterparties.add(tx.sender_id);

      if (flaggedTxIds.has(tx.id)) {
        map[tx.sender_id].flaggedCount += 1;
        map[tx.receiver_id].flaggedCount += 1;
      }
    });

    return map;
  }, [filteredTransactions, flaggedTxIds]);

  const accountIds = useMemo(() => Object.keys(accountStats), [accountStats]);

  // Find active alert's primary customer ID if any
  const primarySubjectId = useMemo(() => {
    const cur = alerts.find((a) => a.case_id === activeCaseId);
    return cur ? cur.customer_id : accountIds[0] || '';
  }, [alerts, activeCaseId, accountIds]);

  // Compute 2D coordinates for nodes in a clean layout canvas (width 900, height 520)
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; isCenter: boolean }> = {};
    if (accountIds.length === 0) return positions;

    const centerX = 450;
    const centerY = 260;

    // The primary subject is centered
    const subject = accountIds.includes(primarySubjectId) ? primarySubjectId : accountIds[0];
    positions[subject] = { x: centerX, y: centerY, isCenter: true };

    const remaining = accountIds.filter((id) => id !== subject);
    const count = remaining.length;

    // Distribute others in an ellipse/concentric rings
    remaining.forEach((id, idx) => {
      // Split into inner and outer ring if many nodes
      const isOuter = idx % 2 === 1 && count > 6;
      const radiusX = isOuter ? 360 : 250;
      const radiusY = isOuter ? 200 : 140;
      const angle = (2 * Math.PI * idx) / count - Math.PI / 2;

      positions[id] = {
        x: Math.round(centerX + radiusX * Math.cos(angle)),
        y: Math.round(centerY + radiusY * Math.sin(angle)),
        isCenter: false,
      };
    });

    return positions;
  }, [accountIds, primarySubjectId]);

  // Selected node stats
  const activeNodeInfo = selectedNode ? accountStats[selectedNode] : null;

  // Transactions linked to active selection
  const relevantTransactions = useMemo(() => {
    if (!selectedNode) return filteredTransactions;
    return filteredTransactions.filter(
      (tx) => tx.sender_id === selectedNode || tx.receiver_id === selectedNode
    );
  }, [filteredTransactions, selectedNode]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Workspace Header */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40">
              Risk Ripple Intelligence Canvas
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              {accountIds.length} Entity Nodes &bull; {filteredTransactions.length} Hops
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            Multi-Hop Transaction Network & Financial Flow Graph
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-3xl">
            Derived directly from real transaction records. Red/Rose edges indicate flagged suspicious transfers, violet highlights intermediaries/hubs, and blue indicates primary subjects.
          </p>
        </div>

        {/* Graph Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setOnlySuspicious((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              onlySuspicious
                ? 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40'
                : 'bg-[#080D1B] text-[#94A3B8] border-[#25324A] hover:text-[#F8FAFC]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Suspicious Only</span>
          </button>

          <div className="flex items-center gap-1 bg-[#080D1B] border border-[#25324A] rounded-xl p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] rounded transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-[#94A3B8] px-1">
              {(zoomLevel * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] rounded transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setSelectedNode(null);
                setMinAmount(0);
                setOnlySuspicious(false);
              }}
              className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] rounded transition"
              title="Reset graph"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph Canvas (8 cols) + Entity Dossier & Edges (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Big Interactive Network Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-[#111A2E] border border-[#25324A] rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Top Canvas Bar with Legend */}
          <div className="p-3.5 border-b border-[#25324A] bg-[#0A1020]/90 backdrop-blur flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-[#F8FAFC]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block shadow-sm shadow-[#2563EB]" />
                Primary Subject
              </span>
              <span className="flex items-center gap-1.5 text-[#F8FAFC]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] inline-block shadow-sm shadow-[#7C3AED]" />
                Mule / Hub
              </span>
              <span className="flex items-center gap-1.5 text-[#F8FAFC]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-sm shadow-[#10B981]" />
                Counterparty
              </span>
              <span className="flex items-center gap-1.5 text-[#F43F5E] font-semibold">
                <span className="w-4 h-0.5 bg-[#F43F5E] inline-block" />
                Suspicious Flow
              </span>
            </div>

            <span className="text-[10px] text-[#94A3B8] font-mono hidden sm:inline">
              Click node to inspect dossier
            </span>
          </div>

          {/* SVG Canvas Area */}
          <div className="relative w-full h-[540px] graph-canvas-grid overflow-hidden flex items-center justify-center">
            {accountIds.length === 0 ? (
              <div className="text-center p-8 text-[#94A3B8] text-xs">
                No matching transactions found with current filter parameters.
              </div>
            ) : (
              <svg
                viewBox="0 0 900 520"
                className="w-full h-full transition-transform duration-200 select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <defs>
                  {/* Rose marker for flagged flows */}
                  <marker
                    id="arrow-flagged"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#F43F5E" />
                  </marker>

                  {/* Blue marker for normal flows */}
                  <marker
                    id="arrow-normal"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563EB" />
                  </marker>

                  {/* Glowing filters */}
                  <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* 1. Transaction Flow Edges */}
                <g className="edges">
                  {filteredTransactions.map((tx) => {
                    const src = nodePositions[tx.sender_id];
                    const dst = nodePositions[tx.receiver_id];
                    if (!src || !dst) return null;

                    const isFlagged = flaggedTxIds.has(tx.id);
                    const isEdgeActive =
                      !selectedNode || tx.sender_id === selectedNode || tx.receiver_id === selectedNode;

                    const strokeColor = isFlagged ? '#F43F5E' : '#2563EB';
                    const markerUrl = isFlagged ? 'url(#arrow-flagged)' : 'url(#arrow-normal)';

                    // Curved quadratic bezier path
                    const midX = (src.x + dst.x) / 2;
                    const midY = (src.y + dst.y) / 2;
                    // Offset curve slightly perpendicular
                    const dx = dst.x - src.x;
                    const dy = dst.y - src.y;
                    const curveOffset = isFlagged ? 22 : 12;
                    const qx = midX - (dy / Math.max(1, Math.hypot(dx, dy))) * curveOffset;
                    const qy = midY + (dx / Math.max(1, Math.hypot(dx, dy))) * curveOffset;

                    return (
                      <g
                        key={tx.id}
                        className={`transition-opacity duration-300 ${isEdgeActive ? 'opacity-100' : 'opacity-15'}`}
                      >
                        <path
                          d={`M ${src.x} ${src.y} Q ${qx} ${qy} ${dst.x} ${dst.y}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isFlagged ? (isEdgeActive ? 2.5 : 1.8) : (isEdgeActive ? 1.5 : 1)}
                          strokeDasharray={isFlagged ? '5 3' : undefined}
                          markerEnd={markerUrl}
                          filter={isFlagged ? 'url(#glow-rose)' : undefined}
                        />

                        {/* Amount Badge on Midpoint */}
                        <g transform={`translate(${qx}, ${qy})`}>
                          <rect
                            x="-24"
                            y="-8"
                            width="48"
                            height="16"
                            rx="4"
                            fill="#0A1020"
                            stroke={strokeColor}
                            strokeWidth="1"
                            opacity="0.9"
                          />
                          <text
                            x="0"
                            y="3"
                            textAnchor="middle"
                            fill="#F8FAFC"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            ₹{tx.amount >= 1000 ? `${(tx.amount / 1000).toFixed(1)}k` : tx.amount}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>

                {/* 2. Account Entity Nodes */}
                <g className="nodes">
                  {accountIds.map((accId) => {
                    const pos = nodePositions[accId];
                    if (!pos) return null;

                    const stats = accountStats[accId];
                    const isSelected = selectedNode === accId;
                    const isSubject = accId === primarySubjectId;
                    const isIntermediary = stats.inflow > 0 && stats.outflow > 0;
                    const hasFlagged = stats.flaggedCount > 0;

                    let nodeColor = '#10B981'; // Counterparty default green
                    if (isSubject) nodeColor = '#2563EB'; // Subject blue
                    else if (hasFlagged) nodeColor = '#F43F5E'; // Flagged critical
                    else if (isIntermediary) nodeColor = '#7C3AED'; // Mule / Hub violet

                    const nodeRadius = isSubject ? 22 : isIntermediary ? 18 : 15;

                    return (
                      <g
                        key={accId}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(isSelected ? null : accId)}
                        className="cursor-pointer group"
                      >
                        {/* Outer pulsating ring for selected or subject */}
                        {(isSelected || isSubject) && (
                          <circle
                            r={nodeRadius + 7}
                            fill="none"
                            stroke={nodeColor}
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                            opacity="0.8"
                            className="animate-spin-slow"
                          />
                        )}

                        {/* Node Background Disc */}
                        <circle
                          r={nodeRadius}
                          fill="#0C1425"
                          stroke={nodeColor}
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all duration-200 group-hover:scale-110"
                          filter={isSelected ? 'url(#glow-blue)' : undefined}
                        />

                        {/* Inner Core */}
                        <circle
                          r={nodeRadius - 6}
                          fill={nodeColor}
                          opacity={isSelected ? 0.9 : 0.4}
                        />

                        {/* Node Label (Text below node) */}
                        <rect
                          x="-36"
                          y={nodeRadius + 4}
                          width="72"
                          height="18"
                          rx="4"
                          fill="#080D1B"
                          stroke="#25324A"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y={nodeRadius + 16}
                          textAnchor="middle"
                          fill="#F8FAFC"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {accId}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Right Column: Entity Dossier & Hop Stream (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Entity Dossier Card */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#25324A]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">Entity Node Dossier</h3>
              </div>
              <span className="text-[10px] font-mono bg-[#080D1B] text-[#94A3B8] border border-[#25324A] px-2 py-0.5 rounded">
                {selectedNode ? selectedNode : 'All Nodes'}
              </span>
            </div>

            {selectedNode && activeNodeInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Entity Identifier:</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">{selectedNode}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
                    <div className="text-[10px] uppercase text-[#94A3B8]">Total Inflow</div>
                    <div className="text-sm font-bold font-mono text-[#10B981] mt-0.5">
                      ₹{activeNodeInfo.inflow.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
                    <div className="text-[10px] uppercase text-[#94A3B8]">Total Outflow</div>
                    <div className="text-sm font-bold font-mono text-[#F43F5E] mt-0.5">
                      ₹{activeNodeInfo.outflow.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Direct Counterparties:</span>
                    <span className="font-mono text-[#F8FAFC] font-semibold">
                      {activeNodeInfo.counterparties.size} accounts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Flagged Suspicions:</span>
                    <span className="font-mono text-[#F43F5E] font-bold">
                      {activeNodeInfo.flaggedCount} transfers
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Flow Classification:</span>
                    <span className="font-mono text-[#A78BFA] font-semibold">
                      {activeNodeInfo.inflow > 0 && activeNodeInfo.outflow > 0
                        ? 'Intermediary / Hub'
                        : activeNodeInfo.outflow > 0
                        ? 'Originator'
                        : 'Beneficiary'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-full py-1.5 bg-[#080D1B] hover:bg-[#16223B] text-xs text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg border border-[#25324A] transition"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#080D1B] border border-[#25324A] rounded-xl text-center text-xs text-[#94A3B8]">
                Click any account node on the network canvas to view its counterparty topology, inbound/outbound fund flows, and linked risk indicators.
              </div>
            )}
          </div>

          {/* Hop-by-Hop Stream */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  Flow Edges ({relevantTransactions.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#94A3B8] font-mono">Real Ledger</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {relevantTransactions.map((tx) => {
                const isFlagged = flaggedTxIds.has(tx.id);
                return (
                  <div
                    key={tx.id}
                    className={`p-2.5 rounded-xl border text-xs space-y-1 transition ${
                      isFlagged
                        ? 'bg-[#080D1B] border-[#F43F5E]/40'
                        : 'bg-[#080D1B] border-[#25324A]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-[#60A5FA]">{tx.sender_id}</span>
                      <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                      <span className="font-bold text-[#A78BFA]">{tx.receiver_id}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold font-mono text-[#F8FAFC]">
                        ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isFlagged
                            ? 'bg-[#F43F5E]/20 text-[#F43F5E]'
                            : 'bg-[#111A2E] text-[#94A3B8]'
                        }`}
                      >
                        {isFlagged ? 'FLAGGED RISK' : tx.channel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
