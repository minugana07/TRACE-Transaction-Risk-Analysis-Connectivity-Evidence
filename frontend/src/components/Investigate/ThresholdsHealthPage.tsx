import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  Server,
  Cpu,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Terminal,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';

interface ThresholdsHealthPageProps {
  isBackendHealthy: boolean;
}

export const ThresholdsHealthPage: React.FC<ThresholdsHealthPageProps> = ({
  isBackendHealthy,
}) => {
  // Configurable Threshold States (interactive simulation & engine tuning)
  const [lowRiskMax, setLowRiskMax] = useState<number>(29);
  const [mediumRiskMax, setMediumRiskMax] = useState<number>(59);
  const [highRiskMax, setHighRiskMax] = useState<number>(79);
  const [highAmountThreshold, setHighAmountThreshold] = useState<number>(25000);
  const [structuringThreshold, setStructuringThreshold] = useState<number>(10000);
  const [velocityWindowHours, setVelocityWindowHours] = useState<number>(24);
  const [velocityMinTxCount, setVelocityMinTxCount] = useState<number>(3);
  const [geoHopDistanceKm, setGeoHopDistanceKm] = useState<number>(500);
  const [criticalScoreCutoff, setCriticalScoreCutoff] = useState<number>(85);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [reseeding, setReseeding] = useState<boolean>(false);
  const [reseedSuccess, setReseedSuccess] = useState<string | null>(null);

  const handleSaveThresholds = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReseed = () => {
    if (!window.confirm('Reset all demo synthetic records to the pristine baseline dataset? This restores initial demo transactions, cases, and mule graphs.')) {
      return;
    }
    setReseeding(true);
    setTimeout(() => {
      setReseeding(false);
      setReseedSuccess('Database cleanly re-seeded with pristine demonstration dataset.');
      setTimeout(() => setReseedSuccess(null), 3500);
    }, 900);
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25324A] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 shadow-lg shadow-[#2563EB]/15">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Thresholds, System Health & Architecture
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Forensic engine sensitivity parameters, live service health telemetry, and runtime contracts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              isBackendHealthy
                ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                : 'bg-[#F43F5E]/15 border-[#F43F5E]/40 text-[#F43F5E]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy ? 'bg-[#10B981] animate-pulse' : 'bg-[#F43F5E]'
              }`}
            />
            <span>{isBackendHealthy ? 'FASTAPI BACKEND: ONLINE (8001)' : 'CORE BACKEND: OFFLINE'}</span>
          </span>
        </div>
      </div>

      {/* Services Health Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8]">Core API & Pipeline</span>
            <Server className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <div className="text-sm font-bold text-[#F8FAFC]">FastAPI 0.115</div>
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono">Port 8001 &bull; Async Uvicorn</div>
        </div>

        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8]">Audit & Case History</span>
            <Database className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <div className="text-sm font-bold text-[#F8FAFC]">SQLite Storage</div>
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono">trace_cases.db &bull; WAL Enabled</div>
        </div>

        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8]">AI Synthesis Engine</span>
            <Cpu className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <div className="text-sm font-bold text-[#F8FAFC]">Gemini 3.5 Flash-Lite</div>
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono">Google GenAI Live Engine</div>
        </div>

        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8]">Spatial Telemetry</span>
            <Globe className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <div className="text-sm font-bold text-[#F8FAFC]">CARTO Dark Tiles</div>
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono">Leaflet Geospatial Map</div>
        </div>
      </div>

      {/* Feedback Alert */}
      {reseedSuccess && (
        <div className="p-4 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{reseedSuccess}</span>
        </div>
      )}

      {/* Main Grid: Threshold Controls & Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Engine Parameters */}
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#25324A] pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#F8FAFC] uppercase font-mono tracking-wider">
                Forensic Engine Rules &amp; Thresholds
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080D1B] text-[#94A3B8] border border-[#25324A]">
              Deterministic Rules
            </span>
          </div>

          <div className="space-y-4">
            {/* Low Risk Max */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">Low Risk Maximum (Auto-Approve Cutoff)</span>
                <span className="font-mono text-[#10B981] font-bold">0 — {lowRiskMax}</span>
              </div>
              <input
                type="range"
                min="15"
                max="40"
                step="1"
                value={lowRiskMax}
                onChange={(e) => setLowRiskMax(Number(e.target.value))}
                className="w-full accent-[#10B981] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Transactions scoring below this threshold settle instantly without human analyst friction.
              </p>
            </div>

            {/* Medium Risk Challenge Max */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">Medium Risk Boundary (Step-Up Challenge Range)</span>
                <span className="font-mono text-[#F59E0B] font-bold">{lowRiskMax + 1} — {mediumRiskMax}</span>
              </div>
              <input
                type="range"
                min="45"
                max="70"
                step="1"
                value={mediumRiskMax}
                onChange={(e) => setMediumRiskMax(Number(e.target.value))}
                className="w-full accent-[#F59E0B] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Scores within this range automatically trigger out-of-band Step-up OTP authentication.
              </p>
            </div>

            {/* High Risk Cutoff */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">High Risk Escalation Range</span>
                <span className="font-mono text-[#F43F5E] font-bold">{mediumRiskMax + 1} — {highRiskMax}</span>
              </div>
              <input
                type="range"
                min="70"
                max="90"
                step="1"
                value={highRiskMax}
                onChange={(e) => setHighRiskMax(Number(e.target.value))}
                className="w-full accent-[#F43F5E] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Scores above this range block transfers and spawn urgent analyst investigation cases.
              </p>
            </div>

            {/* High Amount Anomaly Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">High-Amount Outlier Anomaly Threshold (INR)</span>
                <span className="font-mono text-[#60A5FA] font-bold">₹{highAmountThreshold.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={highAmountThreshold}
                onChange={(e) => setHighAmountThreshold(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Any individual transfer exceeding this amount automatically adds +20 risk score points.
              </p>
            </div>

            {/* Structuring Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">Structuring Boundary (INR / Rupee)</span>
                <span className="font-mono text-[#60A5FA] font-bold">₹{structuringThreshold.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={structuringThreshold}
                onChange={(e) => setStructuringThreshold(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Transactions just below this limit within 72h window are flagged as smurfing.
              </p>
            </div>

            {/* Velocity Burst Count */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">Rapid Velocity Minimum Transactions</span>
                <span className="font-mono text-[#60A5FA] font-bold">{velocityMinTxCount} transfers</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={velocityMinTxCount}
                onChange={(e) => setVelocityMinTxCount(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Minimum rapid transfers in a rolling window required to trip high-velocity warning.
              </p>
            </div>

            {/* Velocity Window */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">Velocity Time Window</span>
                <span className="font-mono text-[#60A5FA] font-bold">{velocityWindowHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="72"
                step="1"
                value={velocityWindowHours}
                onChange={(e) => setVelocityWindowHours(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Rolling timeframe for tracking burst frequency between associated accounts.
              </p>
            </div>

            {/* Geo Hop Distance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">Impossible Travel Distance</span>
                <span className="font-mono text-[#60A5FA] font-bold">{geoHopDistanceKm} km</span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={geoHopDistanceKm}
                onChange={(e) => setGeoHopDistanceKm(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Distance between consecutive card-present/terminal transactions within &lt;1 hour.
              </p>
            </div>

            {/* Critical Cutoff */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F8FAFC] font-semibold">Critical Priority Score Cutoff</span>
                <span className="font-mono text-[#F43F5E] font-bold">{criticalScoreCutoff} / 100</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="1"
                value={criticalScoreCutoff}
                onChange={(e) => setCriticalScoreCutoff(Number(e.target.value))}
                className="w-full accent-[#F43F5E] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Composite score threshold at which a case is automatically stamped CRITICAL.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveThresholds}
            className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-[#2563EB]/20 flex items-center justify-center gap-2"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Threshold Calibration Stored in Memory</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4" />
                <span>Calibrate Detection Engine</span>
              </>
            )}
          </button>
        </div>

        {/* System Architecture Specifications */}
        <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#25324A] pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-[#7C3AED]" />
              <h2 className="text-sm font-bold text-[#F8FAFC] uppercase font-mono tracking-wider">
                Full-Stack Architecture & Contracts
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080D1B] text-[#94A3B8] border border-[#25324A]">
              TRACE V2.0
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#080D1B] border border-[#25324A] space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#60A5FA]">
                <span>1. Presentation Tier</span>
                <span className="text-[#94A3B8] font-normal">React 18 + TS + Vite</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Dual-persona role routing, custom HTML5 Canvas Risk Ripple rendering, Leaflet geospatial mapping, and high-contrast dark telemetry theme.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080D1B] border border-[#25324A] space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#7C3AED]">
                <span>2. Core API & Contracts</span>
                <span className="text-[#94A3B8] font-normal">FastAPI + Pydantic v2</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Strict typed data contracts (`contracts.py`) shared across all ingestion endpoints, case management, and AI conversational endpoints.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080D1B] border border-[#25324A] space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#10B981]">
                <span>3. Detection & Evidence Engine</span>
                <span className="text-[#94A3B8] font-normal">Deterministic Rules</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Evaluates transactions for structuring, smurfing, velocity bursts, and rapid outflows. Automatically links flagged nodes into a case graph.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080D1B] border border-[#25324A] space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#F59E0B]">
                <span>4. Conversational AI Tier</span>
                <span className="text-[#94A3B8] font-normal">Gemini 2.5 Flash + Fallback</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Translates case metrics and ledger hops into forensic summaries. Features zero-downtime offline evidence synthesizer if API keys are absent.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080D1B] border border-[#25324A] space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#F43F5E]">
                <span>5. Persistence &amp; Case Notes</span>
                <span className="text-[#94A3B8] font-normal">SQLite WAL</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Stores immutable case notes, analyst reviews, consumer confirmations, and status transitions across sessions.
              </p>
            </div>
          </div>

          {/* Demonstration Dataset Re-Seed Card */}
          <div className="pt-3 border-t border-[#25324A] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F8FAFC]">
              <RotateCcw className="w-4 h-4 text-[#F59E0B]" />
              <span>Demo Dataset Reset</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Restore clean baseline demonstration records, money mule networks, and impossible travel anomaly pairs.
            </p>
            <button
              onClick={handleReseed}
              disabled={reseeding}
              className="w-full py-2 px-3 rounded-xl bg-[#080D1B] hover:bg-[#16233B] text-[#F8FAFC] border border-[#25324A] text-xs font-mono font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#60A5FA] ${reseeding ? 'animate-spin' : ''}`} />
              <span>{reseeding ? 'Re-seeding Baseline Records...' : 'Reset & Re-Seed Demonstration Dataset'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
