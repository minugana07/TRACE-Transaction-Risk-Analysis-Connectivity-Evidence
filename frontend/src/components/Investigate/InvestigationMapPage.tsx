import React, { useState, useMemo } from 'react';
import type { Transaction, Alert } from '../../types/trace';
import { HotspotMap, computeImpossibleTravelAnomalies, ImpossibleTravelAnomaly } from '../Common/HotspotMap';
import {
  Compass,
  MapPin,
  Globe,
  ShieldAlert,
  Layers,
  ArrowRight,
  Filter,
  DollarSign,
  Info,
  Zap,
  Plane,
} from 'lucide-react';

interface InvestigationMapPageProps {
  transactions: Transaction[];
  alerts: Alert[];
}

export const InvestigationMapPage: React.FC<InvestigationMapPageProps> = ({
  transactions,
  alerts,
}) => {
  const [selectedTxId, setSelectedTxId] = useState<string | undefined>(undefined);
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState<boolean>(false);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);

  // Derive impossible travel anomalies
  const impossibleAnomalies = useMemo(() => {
    return computeImpossibleTravelAnomalies(transactions);
  }, [transactions]);

  const flaggedTxIds = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => {
      (a.related_transaction_ids || []).forEach((id) => set.add(id));
    });
    // Also include any impossible travel transactions
    impossibleAnomalies.forEach((anom) => {
      set.add(anom.t1_id);
      set.add(anom.t2_id);
    });
    return set;
  }, [alerts, impossibleAnomalies]);


  // Extract real locations only
  const geoTransactions = useMemo(() => {
    return transactions.filter(
      (tx) =>
        tx.geographic_data &&
        typeof tx.geographic_data.latitude === 'number' &&
        typeof tx.geographic_data.longitude === 'number' &&
        !isNaN(tx.geographic_data.latitude) &&
        !isNaN(tx.geographic_data.longitude)
    );
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    if (!filterSuspiciousOnly) return geoTransactions;
    return geoTransactions.filter((tx) => flaggedTxIds.has(tx.id));
  }, [geoTransactions, filterSuspiciousOnly, flaggedTxIds]);

  // Regional breakdown
  const regionalHubs = useMemo(() => {
    const hubs: Record<
      string,
      {
        city: string;
        country: string;
        count: number;
        volume: number;
        flaggedCount: number;
        txs: Transaction[];
      }
    > = {};

    geoTransactions.forEach((tx) => {
      const city = tx.geographic_data?.city || 'Unknown';
      const country = tx.geographic_data?.country || '';
      const key = `${city}-${country}`;
      if (!hubs[key]) {
        hubs[key] = { city, country, count: 0, volume: 0, flaggedCount: 0, txs: [] };
      }
      hubs[key].count += 1;
      hubs[key].volume += tx.amount;
      hubs[key].txs.push(tx);
      if (flaggedTxIds.has(tx.id)) {
        hubs[key].flaggedCount += 1;
      }
    });

    return Object.values(hubs).sort((a, b) => b.volume - a.volume);
  }, [geoTransactions, flaggedTxIds]);

  // Selected Transaction Details
  const selectedTx = useMemo(() => {
    if (!selectedTxId) return displayedTransactions[0];
    return displayedTransactions.find((tx) => tx.id === selectedTxId) || displayedTransactions[0];
  }, [displayedTransactions, selectedTxId]);

  const totalGeoVolume = geoTransactions.reduce((acc, t) => acc + t.amount, 0);
  const flaggedGeoVolume = geoTransactions
    .filter((t) => flaggedTxIds.has(t.id))
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Cinematic Header */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40">
              Global Spatial Surveillance Radar
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              CARTO Dark Canvas &bull; {geoTransactions.length} Verified Coordinates
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            World Fraud Hotspot Map & Cross-Border Flows
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5 max-w-3xl">
            Real-time geospatial mapping of transaction rail nodes. Blinking red dots indicate active/unresolved fraud cases, blinking green dots indicate resolved/remediated fraud cases, and blue indicates clean settlements.
          </p>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterSuspiciousOnly((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
              filterSuspiciousOnly
                ? 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40 shadow-lg shadow-[#F43F5E]/10'
                : 'bg-[#080D1B] text-[#94A3B8] border-[#25324A] hover:text-[#F8FAFC]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Pulsing Hotspots Only</span>
          </button>
        </div>
      </div>

      {/* Impossible Travel Velocity Anomalies Banner */}
      {impossibleAnomalies.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 space-y-3 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F43F5E] font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 animate-pulse" />
              <span>Impossible Travel Velocity Anomalies Detected ({impossibleAnomalies.length})</span>
            </div>
            <span className="text-[11px] font-mono text-[#94A3B8]">
              Dashed red arcs trace supernatural physical velocity hops exceeding commercial aviation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {impossibleAnomalies.map((anom) => {
              const isSelected = selectedAnomalyId === anom.id;
              return (
                <div
                  key={anom.id}
                  onClick={() => {
                    setSelectedAnomalyId(anom.id);
                    setSelectedTxId(anom.t1_id);
                  }}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition space-y-1.5 ${
                    isSelected
                      ? 'bg-[#111A2E] border-[#F43F5E] ring-1 ring-[#F43F5E]/50 shadow-lg shadow-[#F43F5E]/15'
                      : 'bg-[#080D1B]/90 border-[#F43F5E]/25 hover:border-[#F43F5E]/60 hover:bg-[#111A2E]/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#F8FAFC] flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-[#F43F5E]" />
                      {anom.sender_account}
                    </span>
                    <span className="font-mono text-[#F43F5E] font-extrabold text-xs">
                      {anom.implied_speed_kmh.toLocaleString()} km/h
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#94A3B8] text-[11px]">
                    <span className="text-[#60A5FA] font-semibold">{anom.from_city}</span>
                    <span className="text-[#F43F5E] font-bold">&rarr;</span>
                    <span className="text-[#A78BFA] font-semibold">{anom.to_city}</span>
                    <span className="text-[#94A3B8] font-mono text-[10px] ml-auto">
                      {anom.distance_km} km in {anom.time_elapsed_minutes}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#25324A]/60 text-[10px] font-mono">
                    <span className="text-[#94A3B8]">Txs: {anom.t1_id} &amp; {anom.t2_id}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#F43F5E]/20 text-[#F43F5E] font-bold">
                      {anom.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Map + Side Hotspot Intelligence Panel (8 cols + 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Cinematic Full Viewport World Map (8 cols) */}
        <div className="lg:col-span-8 bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#25324A]">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#F43F5E] font-bold">
                <span className="w-3 h-3 rounded-full bg-[#F43F5E] inline-block animate-pulse shadow-sm shadow-[#F43F5E]" />
                Active Fraud (Red)
              </span>
              <span className="flex items-center gap-1.5 text-[#10B981] font-bold">
                <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block animate-pulse shadow-sm shadow-[#10B981]" />
                Remediated (Green)
              </span>
              <span className="flex items-center gap-1.5 text-[#60A5FA]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block" />
                Clean Settlement
              </span>
            </div>

            <span className="text-[11px] font-mono text-[#94A3B8] hidden sm:inline">
              Click pin or dashed red arc to inspect transfer
            </span>
          </div>

          {/* Map Container */}
          <HotspotMap
            transactions={displayedTransactions}
            height="580px"
            selectedTxId={selectedTx?.id}
            flaggedTxIds={flaggedTxIds}
            anomalies={impossibleAnomalies}
            onSelectTx={(txId) => setSelectedTxId(txId)}
            onSelectAnomaly={(anom) => {
              setSelectedAnomalyId(anom.id);
              setSelectedTxId(anom.t1_id);
            }}
          />

          {/* Bottom Map Stats */}
          <div className="grid grid-cols-3 gap-3 pt-1 text-center text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
              <div className="text-[10px] text-[#94A3B8] uppercase">Geo-Tagged Volume</div>
              <div className="text-sm font-bold text-[#F8FAFC] mt-0.5">
                ₹{totalGeoVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
              <div className="text-[10px] text-[#F43F5E] uppercase">Flagged Hotspot Volume</div>
              <div className="text-sm font-bold text-[#F43F5E] mt-0.5">
                ₹{flaggedGeoVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#25324A]">
              <div className="text-[10px] text-[#60A5FA] uppercase">Regional Hubs</div>
              <div className="text-sm font-bold text-[#60A5FA] mt-0.5">
                {regionalHubs.length} Cities
              </div>
            </div>
          </div>
        </div>

        {/* Right: Regional Hotspot Telemetry & Selected Record Details (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Hotspot Detail Panel */}
          {selectedTx && (
            <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#F8FAFC]">Selected Node Detail</h3>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    flaggedTxIds.has(selectedTx.id)
                      ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30'
                      : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                  }`}
                >
                  {flaggedTxIds.has(selectedTx.id) ? 'SUSPICIOUS' : 'VERIFIED'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">Transaction ID:</span>
                  <span className="font-mono font-bold text-[#60A5FA]">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">Amount:</span>
                  <span className="font-mono font-bold text-sm text-[#F8FAFC]">
                    ₹{selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">City & Country:</span>
                  <span className="font-semibold text-[#F8FAFC]">
                    {selectedTx.geographic_data?.city || 'Unknown'}, {selectedTx.geographic_data?.country || ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">GPS Coordinates:</span>
                  <span className="font-mono text-[#94A3B8]">
                    {selectedTx.geographic_data?.latitude?.toFixed(4)}, {selectedTx.geographic_data?.longitude?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">Rail Channel:</span>
                  <span className="font-mono text-[#A78BFA]">{selectedTx.channel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">Sender / Receiver:</span>
                  <span className="font-mono text-[#94A3B8]">
                    <b className="text-[#F8FAFC]">{selectedTx.sender_id}</b> &rarr; <b className="text-[#F8FAFC]">{selectedTx.receiver_id}</b>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Regional Hubs List */}
          <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">Regional Hubs</h3>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                {regionalHubs.length} Registered
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {regionalHubs.map((hub) => (
                <div
                  key={`${hub.city}-${hub.country}`}
                  onClick={() => {
                    if (hub.txs.length > 0) setSelectedTxId(hub.txs[0].id);
                  }}
                  className="p-3 bg-[#080D1B] border border-[#25324A] hover:border-[#2563EB]/50 rounded-xl text-xs space-y-1.5 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between font-semibold text-[#F8FAFC]">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                      {hub.city}{hub.country ? `, ${hub.country}` : ''}
                    </span>
                    <span className="font-mono text-[#60A5FA]">
                      ₹{hub.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>{hub.count} transfer{hub.count > 1 ? 's' : ''}</span>
                    {hub.flaggedCount > 0 ? (
                      <span className="text-[#F43F5E] font-bold font-mono">
                        {hub.flaggedCount} suspicious
                      </span>
                    ) : (
                      <span className="text-[#10B981] font-mono">Clean</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
