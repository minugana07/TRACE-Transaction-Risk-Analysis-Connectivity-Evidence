import React, { useState } from 'react';
import type { Transaction } from '../../types/trace';
import { ArrowRight, Share2 } from 'lucide-react';

interface RiskRippleGraphProps {
  transactions: Transaction[];
  customerSubjectId: string;
}

export const RiskRippleGraph: React.FC<RiskRippleGraphProps> = ({
  transactions,
  customerSubjectId,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Derive unique nodes
  const accountMap: Record<string, { inbound: number; outbound: number; txCount: number }> = {};

  transactions.forEach((tx) => {
    if (!accountMap[tx.sender_id]) {
      accountMap[tx.sender_id] = { inbound: 0, outbound: 0, txCount: 0 };
    }
    if (!accountMap[tx.receiver_id]) {
      accountMap[tx.receiver_id] = { inbound: 0, outbound: 0, txCount: 0 };
    }
    accountMap[tx.sender_id].outbound += tx.amount;
    accountMap[tx.sender_id].txCount += 1;
    accountMap[tx.receiver_id].inbound += tx.amount;
    accountMap[tx.receiver_id].txCount += 1;
  });

  const nodes = Object.keys(accountMap);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Risk Ripple Connectivity Graph
            </h3>
            <p className="text-xs text-slate-400">
              Direct and multi-hop fund flows mapped from real transaction records ({transactions.length} transfers)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Subject
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Intermediary / Mule
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Counterparty
          </span>
        </div>
      </div>

      {/* Account Nodes Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {nodes.map((accId) => {
          const stats = accountMap[accId];
          const isSubject = accId === customerSubjectId;
          const isIntermediary = stats.inbound > 0 && stats.outbound > 0;
          const isSelected = selectedNode === accId;

          let badgeColor = 'border-slate-700 bg-slate-800/60 text-slate-200';
          if (isSubject) {
            badgeColor = 'border-blue-500/50 bg-blue-950/40 text-blue-300 ring-1 ring-blue-500/30';
          } else if (isIntermediary) {
            badgeColor = 'border-amber-500/50 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/30';
          }

          return (
            <div
              key={accId}
              onClick={() => setSelectedNode(isSelected ? null : accId)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${badgeColor} ${
                isSelected ? 'ring-2 ring-indigo-400 scale-[1.02]' : 'hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold truncate">{accId}</span>
                {isSubject ? (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-medium">
                    Subject
                  </span>
                ) : isIntermediary ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                    Mule/Hub
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-medium">
                    End-Point
                  </span>
                )}
              </div>
              <div className="text-[11px] space-y-0.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Inflow:</span>
                  <span className="text-emerald-400 font-mono">${stats.inbound.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outflow:</span>
                  <span className="text-rose-400 font-mono">${stats.outbound.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connectivity Flow Diagram */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Hop-by-Hop Transaction Edges
        </div>
        {transactions.map((tx, idx) => {
          const isHighlighted =
            selectedNode === null || tx.sender_id === selectedNode || tx.receiver_id === selectedNode;

          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-opacity ${
                isHighlighted
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                  : 'bg-slate-900/40 border-slate-800/50 text-slate-500 opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-mono text-[10px] w-6">#{idx + 1}</span>
                <span className="font-mono font-semibold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded">
                  {tx.sender_id}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                  {tx.receiver_id}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 font-medium">
                  {tx.channel}
                </span>
                <span className="font-mono font-bold text-slate-100 text-sm">
                  ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
