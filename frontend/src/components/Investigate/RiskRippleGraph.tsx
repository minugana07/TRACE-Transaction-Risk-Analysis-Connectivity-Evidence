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
    <div className="bg-[#0C182B] border border-[#1E314B] rounded-lg p-5 shadow">
      <div className="flex items-center justify-between pb-4 border-b border-[#1E314B] mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 rounded">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider">
              Risk Ripple Connectivity Graph
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Direct and multi-hop fund flows mapped from real transaction records ({transactions.length} transfers)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#94A3B8] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] inline-block" /> Subject
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" /> Intermediary / Mule
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" /> Counterparty
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

          let badgeColor = 'border-[#1E314B] bg-[#08101E] text-[#F8FAFC]';
          if (isSubject) {
            badgeColor = 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4] ring-1 ring-[#06B6D4]/40';
          } else if (isIntermediary) {
            badgeColor = 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B] ring-1 ring-[#F59E0B]/40';
          }

          return (
            <div
              key={accId}
              onClick={() => setSelectedNode(isSelected ? null : accId)}
              className={`p-3 rounded border cursor-pointer transition-all ${badgeColor} ${
                isSelected ? 'ring-2 ring-[#06B6D4] scale-[1.01]' : 'hover:border-[#06B6D4]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold truncate">{accId}</span>
                {isSubject ? (
                  <span className="text-[10px] bg-[#06B6D4]/20 text-[#06B6D4] px-1.5 py-0.5 rounded font-mono font-bold">
                    Subject
                  </span>
                ) : isIntermediary ? (
                  <span className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-mono font-bold">
                    Mule/Hub
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#0C182B] text-[#94A3B8] border border-[#1E314B] px-1.5 py-0.5 rounded font-mono">
                    End-Point
                  </span>
                )}
              </div>
              <div className="text-[11px] space-y-0.5 text-[#94A3B8]">
                <div className="flex justify-between">
                  <span>Inflow:</span>
                  <span className="text-[#10B981] font-mono font-semibold">${stats.inbound.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outflow:</span>
                  <span className="text-[#EF4444] font-mono font-semibold">${stats.outbound.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connectivity Flow Diagram */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">
          Hop-by-Hop Transaction Edges
        </div>
        {transactions.map((tx, idx) => {
          const isHighlighted =
            selectedNode === null || tx.sender_id === selectedNode || tx.receiver_id === selectedNode;

          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-2.5 rounded border text-xs transition-opacity ${
                isHighlighted
                  ? 'bg-[#08101E] border-[#1E314B] text-[#F8FAFC]'
                  : 'bg-[#08101E]/40 border-[#1E314B]/40 text-[#94A3B8] opacity-35'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[#94A3B8] font-mono text-[10px] w-6">#{idx + 1}</span>
                <span className="font-mono font-semibold text-[#06B6D4] bg-[#06B6D4]/15 px-2 py-0.5 rounded border border-[#06B6D4]/30">
                  {tx.sender_id}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="font-mono font-semibold text-[#F59E0B] bg-[#F59E0B]/15 px-2 py-0.5 rounded border border-[#F59E0B]/30">
                  {tx.receiver_id}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#0C182B] text-[#94A3B8] border border-[#1E314B] font-mono">
                  {tx.channel}
                </span>
                <span className="font-mono font-bold text-[#F8FAFC] text-sm tabular-nums">
                  ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono">
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
