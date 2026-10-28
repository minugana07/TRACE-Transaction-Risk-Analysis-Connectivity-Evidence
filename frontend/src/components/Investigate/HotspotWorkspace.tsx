import React, { useMemo } from 'react';
import type { Transaction } from '../../types/trace';
import { HotspotMap } from '../Common/HotspotMap';
import { MapPin, Globe, Compass, Shield, AlertTriangle } from 'lucide-react';

interface HotspotWorkspaceProps {
  transactions: Transaction[];
}

export const HotspotWorkspace: React.FC<HotspotWorkspaceProps> = ({ transactions }) => {
  // Extract transactions with valid coordinates
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

  // City breakdown
  const cityDistribution = useMemo(() => {
    const counts: Record<string, { count: number; volume: number; country: string }> = {};
    geoTransactions.forEach((tx) => {
      const city = tx.geographic_data?.city || 'Unknown';
      const country = tx.geographic_data?.country || '';
      if (!counts[city]) {
        counts[city] = { count: 0, volume: 0, country };
      }
      counts[city].count += 1;
      counts[city].volume += tx.amount;
    });
    return Object.entries(counts).sort((a, b) => b[1].volume - a[1].volume);
  }, [geoTransactions]);

  const totalGeoVolume = geoTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40">
              Spatial Telemetry
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              {geoTransactions.length} of {transactions.length} Transactions with GPS Coordinates
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            Geographic Hotspot Intelligence & Cross-Border Flows
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5 max-w-3xl">
            Strictly derived from empirical coordinates provided in transaction records. Locations are never invented or simulated.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-right">
            <span className="text-[#94A3B8] text-[10px] uppercase">Geo-Tagged Volume</span>
            <div className="text-base font-bold text-[#10B981]">
              ${totalGeoVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Map + Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Dedicated Large Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#25324A]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Live Coordinate Canvas
              </h3>
            </div>
            <span className="text-xs text-[#94A3B8] font-mono">
              CARTO Voyager &bull; OpenStreetMap
            </span>
          </div>

          <HotspotMap transactions={geoTransactions} height="520px" />
        </div>

        {/* Right Column: Location Distribution List (4 cols) */}
        <div className="lg:col-span-4 bg-[#111A2E] border border-[#25324A] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#25324A]">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Regional Hotspots</h3>
            </div>
            <span className="text-[10px] font-mono text-[#94A3B8]">
              {cityDistribution.length} Hubs
            </span>
          </div>

          {cityDistribution.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#94A3B8] bg-[#080D1B] border border-[#25324A] rounded-xl">
              <MapPin className="w-8 h-8 text-[#25324A] mx-auto mb-2" />
              No geographic coordinates available in current dataset.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {cityDistribution.map(([city, data]) => (
                <div
                  key={city}
                  className="p-3 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs space-y-1 hover:border-[#2563EB]/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                      {city}
                      {data.country ? `, ${data.country}` : ''}
                    </span>
                    <span className="font-mono text-[#60A5FA] font-bold">
                      ${data.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>Recorded Transactions:</span>
                    <span className="font-mono font-semibold text-[#F8FAFC]">{data.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
