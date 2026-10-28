import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Transaction } from '../../types/trace';
import { MapPin } from 'lucide-react';

interface HotspotMapProps {
  transactions: Transaction[];
  height?: string;
  selectedTxId?: string;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({
  transactions,
  height = '360px',
  selectedTxId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Extract real locations only
  const geoTransactions = transactions.filter(
    (tx) =>
      tx.geographic_data &&
      typeof tx.geographic_data.latitude === 'number' &&
      typeof tx.geographic_data.longitude === 'number' &&
      !isNaN(tx.geographic_data.latitude) &&
      !isNaN(tx.geographic_data.longitude)
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [25.0, 10.0],
        zoom: 2,
        zoomControl: true,
      });

      const cartoApiKey = (import.meta.env.CARTO_API_KEY || import.meta.env.VITE_CARTO_API_KEY || '').trim();
      const tileUrl = cartoApiKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoApiKey)}`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!markersLayer || !map) return;

    markersLayer.clearLayers();

    if (geoTransactions.length === 0) return;

    const bounds = L.latLngBounds([]);

    geoTransactions.forEach((tx) => {
      const g = tx.geographic_data!;
      const isSelected = selectedTxId === tx.id;
      const lat = g.latitude!;
      const lon = g.longitude!;

      bounds.extend([lat, lon]);

      // Custom marker icon
      const markerHtml = `
        <div style="
          background-color: ${isSelected ? '#ef4444' : '#3b82f6'};
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 11px;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          border: 2px solid white;
        ">
          $
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'trace-hotspot-pin',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 2px;">
          <div style="font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 4px;">
            ${tx.id} &bull; $${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div><b>Location:</b> ${g.city || 'Unknown'}, ${g.country || ''}</div>
          <div><b>Channel:</b> ${tx.channel}</div>
          <div><b>Sender:</b> ${tx.sender_id}</div>
          <div><b>Receiver:</b> ${tx.receiver_id}</div>
          <div><b>Timestamp:</b> ${new Date(tx.timestamp).toLocaleString()}</div>
          ${g.ip_address ? `<div><b>IP:</b> <code>${g.ip_address}</code></div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
    });

    if (geoTransactions.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [transactions, selectedTxId, geoTransactions]);

  if (geoTransactions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 text-center"
        style={{ height }}
      >
        <MapPin className="w-10 h-10 text-slate-600 mb-2" />
        <p className="font-medium text-slate-300">No Geolocation Coordinates in Selection</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          TRACE strictly maps actual dataset coordinates. Locations are never artificially synthesized or invented.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-lg">
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 10 }} />
      <div className="absolute top-2 right-2 z-20 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 shadow">
        <MapPin className="w-3.5 h-3.5 text-blue-400" />
        <span>
          <b>{geoTransactions.length}</b> verified coordinate point{geoTransactions.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
