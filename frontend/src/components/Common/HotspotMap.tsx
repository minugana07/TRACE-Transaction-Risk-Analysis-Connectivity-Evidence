import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import type { Transaction } from '../../types/trace';
import { MapPin, Zap } from 'lucide-react';

export interface ImpossibleTravelAnomaly {
  id: string;
  sender_account: string;
  sender_name?: string;
  from_city: string;
  from_country?: string;
  from_coords: [number, number];
  to_city: string;
  to_country?: string;
  to_coords: [number, number];
  distance_km: number;
  time_elapsed_minutes: number;
  implied_speed_kmh: number;
  t1_id: string;
  t2_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

interface HotspotMapProps {
  transactions: Transaction[];
  height?: string;
  selectedTxId?: string;
  flaggedTxIds?: Set<string>;
  anomalies?: ImpossibleTravelAnomaly[];
  onSelectTx?: (txId: string) => void;
  onSelectAnomaly?: (anomaly: ImpossibleTravelAnomaly) => void;
}

// Haversine distance in kilometers
function haversineDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function computeImpossibleTravelAnomalies(txs: Transaction[]): ImpossibleTravelAnomaly[] {
  const bySender: Record<string, Transaction[]> = {};
  txs.forEach((tx) => {
    if (
      tx.geographic_data &&
      typeof tx.geographic_data.latitude === 'number' &&
      typeof tx.geographic_data.longitude === 'number' &&
      !isNaN(tx.geographic_data.latitude) &&
      !isNaN(tx.geographic_data.longitude)
    ) {
      if (!bySender[tx.sender_id]) bySender[tx.sender_id] = [];
      bySender[tx.sender_id].push(tx);
    }
  });

  const anomalies: ImpossibleTravelAnomaly[] = [];

  Object.entries(bySender).forEach(([senderId, sTxs]) => {
    const sorted = [...sTxs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const t1 = sorted[i];
      const t2 = sorted[i + 1];
      const g1 = t1.geographic_data!;
      const g2 = t2.geographic_data!;

      const time1 = new Date(t1.timestamp).getTime();
      const time2 = new Date(t2.timestamp).getTime();
      const diffHours = Math.abs(time2 - time1) / 3600000.0;
      const diffMins = diffHours * 60.0;

      const distKm = haversineDistKm(
        g1.latitude!,
        g1.longitude!,
        g2.latitude!,
        g2.longitude!
      );

      // Flag speed > 800 km/h with distance > 300 km within 3 hours
      if (diffHours < 3.0 && distKm > 300.0) {
        const speedKmh = distKm / Math.max(diffHours, 0.04);
        if (speedKmh > 800.0) {
          anomalies.push({
            id: `anom_${t1.id}_${t2.id}`,
            sender_account: senderId,
            sender_name: senderId,
            from_city: g1.city || 'Unknown',
            from_country: g1.country || '',
            from_coords: [g1.latitude!, g1.longitude!],
            to_city: g2.city || 'Unknown',
            to_country: g2.country || '',
            to_coords: [g2.latitude!, g2.longitude!],
            distance_km: Math.round(distKm * 10) / 10,
            time_elapsed_minutes: Math.round(diffMins * 10) / 10,
            implied_speed_kmh: Math.round(speedKmh * 10) / 10,
            t1_id: t1.id,
            t2_id: t2.id,
            severity: speedKmh > 1500 ? 'CRITICAL' : 'HIGH',
          });
        }
      }
    }
  });

  return anomalies;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({
  transactions,
  height = '500px',
  selectedTxId,
  flaggedTxIds,
  anomalies: externalAnomalies,
  onSelectTx,
  onSelectAnomaly,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);

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

  // Derived or provided impossible travel anomalies
  const resolvedAnomalies = useMemo(() => {
    if (externalAnomalies && externalAnomalies.length > 0) {
      return externalAnomalies;
    }
    return computeImpossibleTravelAnomalies(transactions);
  }, [transactions, externalAnomalies]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map with dark theme
      const map = L.map(mapContainerRef.current, {
        center: [20.0, 10.0],
        zoom: 2,
        zoomControl: true,
      });

      // Clean OpenStreetMap tiles styled to dark theme matching Image 4 (zero watermarks)
      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      polylinesLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polylinesLayer = polylinesLayerRef.current;
    if (!markersLayer || !polylinesLayer || !map) return;

    markersLayer.clearLayers();
    polylinesLayer.clearLayers();

    if (geoTransactions.length === 0) return;

    const bounds = L.latLngBounds([]);

    // 1. Plot Geo Transaction Hotspot Markers
    geoTransactions.forEach((tx) => {
      const g = tx.geographic_data!;
      const isSelected = selectedTxId === tx.id;
      const isFlagged = flaggedTxIds ? flaggedTxIds.has(tx.id) : (tx.amount >= 5000);
      const isFixed = (tx as any).status === 'RESOLVED_BENIGN' || (tx as any).status === 'CLOSED';
      const lat = g.latitude!;
      const lon = g.longitude!;

      bounds.extend([lat, lon]);

      // Blinking dots in RED (unresolved fraud) and GREEN (fixed / resolved fraud)
      const dotColor = isFixed ? '#10B981' : isFlagged ? '#F43F5E' : '#2563EB';
      const pulseColor = isFixed ? 'rgba(16, 185, 129, 0.45)' : isFlagged ? 'rgba(244, 63, 94, 0.5)' : 'rgba(37, 99, 235, 0.3)';
      const pulseBorder = isFixed ? 'rgba(16, 185, 129, 0.9)' : isFlagged ? 'rgba(244, 63, 94, 0.9)' : 'rgba(37, 99, 235, 0.6)';

      const markerHtml = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div class="animate-pulse-ring" style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${pulseColor}; border: 1.5px solid ${pulseBorder};"></div>
          <div style="
            width: ${isSelected ? '22px' : '18px'};
            height: ${isSelected ? '22px' : '18px'};
            border-radius: 50%;
            background: ${dotColor};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 10px;
            box-shadow: 0 0 12px ${dotColor};
            border: 2px solid #F8FAFC;
            position: relative;
            z-index: 2;
          ">
            ${isFixed ? '✓' : isFlagged ? '!' : '₹'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'trace-hotspot-pin',
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupContent = `
        <div style="font-family: -apple-system, sans-serif; font-size: 12px; color: #F8FAFC; background: #111A2E; border: 1px solid #25324A; border-radius: 8px; padding: 10px; min-width: 200px;">
          <div style="font-weight: 800; font-family: monospace; color: ${dotColor}; border-bottom: 1px solid #25324A; padding-bottom: 4px; margin-bottom: 6px;">
            ${tx.id} &bull; ₹${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div><b style="color: #94A3B8;">Location:</b> ${g.city || 'Unknown'}, ${g.country || ''}</div>
          <div><b style="color: #94A3B8;">Rail:</b> ${tx.channel}</div>
          <div><b style="color: #94A3B8;">From:</b> <code style="color: #60A5FA;">${tx.sender_id}</code></div>
          <div><b style="color: #94A3B8;">To:</b> <code style="color: #A78BFA;">${tx.receiver_id}</code></div>
          <div><b style="color: #94A3B8;">Risk Status:</b> <span style="color: ${dotColor}; font-weight: bold;">${isFixed ? '🟢 FRAUD REMEDIATED / RESOLVED' : isFlagged ? '🔴 ACTIVE FRAUD INVESTIGATION' : 'CLEAN SETTLEMENT'}</span></div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectTx) onSelectTx(tx.id);
      });
      markersLayer.addLayer(marker);
    });

    // 2. Draw Impossible Travel Connecting Polyline Flight Arcs
    resolvedAnomalies.forEach((anom) => {
      bounds.extend(anom.from_coords);
      bounds.extend(anom.to_coords);

      const polyline = L.polyline([anom.from_coords, anom.to_coords], {
        color: '#F43F5E',
        weight: 3.5,
        dashArray: '6, 8',
        opacity: 0.88,
      });

      const tooltipContent = `
        <div style="font-family: monospace; font-size: 11px; background: #111A2E; color: #F8FAFC; border: 1px solid #F43F5E; padding: 5px 8px; border-radius: 6px; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);">
          <div style="color: #F43F5E; font-weight: bold;">⚡ IMPOSSIBLE TRAVEL: ${anom.implied_speed_kmh.toLocaleString()} km/h</div>
          <div style="color: #94A3B8; font-size: 10px;">${anom.from_city} &rarr; ${anom.to_city} (${anom.distance_km} km in ${anom.time_elapsed_minutes}m)</div>
        </div>
      `;

      const popupContent = `
        <div style="font-family: -apple-system, sans-serif; font-size: 12px; color: #F8FAFC; background: #111A2E; border: 1px solid #F43F5E; border-radius: 8px; padding: 10px; min-width: 220px;">
          <div style="font-weight: 800; font-family: monospace; color: #F43F5E; border-bottom: 1px solid #25324A; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>⚡ IMPOSSIBLE TRAVEL ANOMALY</span>
            <span style="font-size: 10px; background: rgba(244,63,94,0.2); padding: 1px 4px; border-radius: 4px;">${anom.severity}</span>
          </div>
          <div style="margin-bottom: 3px;"><b style="color: #94A3B8;">Sender Account:</b> <code style="color: #60A5FA;">${anom.sender_account}</code></div>
          <div style="margin-bottom: 3px;"><b style="color: #94A3B8;">Route:</b> ${anom.from_city} &rarr; ${anom.to_city}</div>
          <div style="margin-bottom: 3px;"><b style="color: #94A3B8;">Distance:</b> ${anom.distance_km} km</div>
          <div style="margin-bottom: 3px;"><b style="color: #94A3B8;">Elapsed Time:</b> ${anom.time_elapsed_minutes} minutes</div>
          <div style="margin-bottom: 3px;"><b style="color: #94A3B8;">Implied Speed:</b> <span style="color: #F43F5E; font-weight: bold; font-family: monospace;">${anom.implied_speed_kmh.toLocaleString()} km/h</span></div>
          <div style="color: #94A3B8; font-size: 10px; border-top: 1px solid #25324A; padding-top: 5px; margin-top: 6px; font-style: italic;">
            Exceeds physical commercial aviation speed. Indicates concurrent session sharing, proxy evasion, or stolen account credentials.
          </div>
        </div>
      `;

      polyline.bindTooltip(tooltipContent, { sticky: true });
      polyline.bindPopup(popupContent);
      polyline.on('click', () => {
        if (onSelectAnomaly) onSelectAnomaly(anom);
      });

      polylinesLayer.addLayer(polyline);
    });

    if (geoTransactions.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [transactions, selectedTxId, geoTransactions, flaggedTxIds, resolvedAnomalies]);

  if (geoTransactions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-[#0C1425] border border-[#25324A] rounded-2xl p-8 text-[#94A3B8] text-center"
        style={{ height }}
      >
        <MapPin className="w-10 h-10 text-[#25324A] mb-2 animate-bounce" />
        <p className="font-semibold text-[#F8FAFC]">No Geolocation Coordinates in Selection</p>
        <p className="text-xs text-[#94A3B8] max-w-sm mt-1">
          TRACE strictly plots empirical dataset coordinates. Synthetic coordinates are never manufactured without factual backing.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#25324A] shadow-2xl">
      <div ref={mapContainerRef} className="dark-map-tiles" style={{ height, width: '100%', zIndex: 10 }} />
      <div className="absolute top-3 right-3 z-20 bg-[#0C1425]/95 backdrop-blur-md border border-[#25324A] px-3 py-1.5 rounded-xl text-xs text-[#F8FAFC] flex items-center gap-3 shadow-lg">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="font-mono">
            <b className="text-[#60A5FA]">{geoTransactions.length}</b> points
          </span>
        </span>
        {resolvedAnomalies.length > 0 && (
          <span className="flex items-center gap-1.5 border-l border-[#25324A] pl-2.5 text-[#F43F5E] font-bold">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-mono">{resolvedAnomalies.length} velocity anomaly hops</span>
          </span>
        )}
      </div>
    </div>
  );
};

