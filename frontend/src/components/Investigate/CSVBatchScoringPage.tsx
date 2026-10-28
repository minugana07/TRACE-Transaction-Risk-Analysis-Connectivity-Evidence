import React, { useState } from 'react';
import type { DetectionResult } from '../../types/trace';
import { uploadDataset, triggerDetectionRun } from '../../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Database,
  Play,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface CSVBatchScoringPageProps {
  onUploadSuccess: (result: DetectionResult) => void;
}

export const CSVBatchScoringPage: React.FC<CSVBatchScoringPageProps> = ({
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const result = await uploadDataset(file);
      setLastResult(result);
      onUploadSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to score uploaded CSV dataset');
    } finally {
      setUploading(false);
    }
  };

  const handleRunSyntheticBatch = async () => {
    setUploading(true);
    setError(null);
    try {
      const result = await triggerDetectionRun();
      setLastResult(result);
      onUploadSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to execute synthetic detection run');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40">
              Forensic Ingestion Rail
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              Batch CSV Scoring & Detection Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            CSV Batch Ingestion & Rule Scoring
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Upload custom banking or payment CSV records to execute the deterministic fraud detection engine and compute prioritized case alerts.
          </p>
        </div>

        <button
          onClick={handleRunSyntheticBatch}
          disabled={uploading}
          className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C3AED]/25 transition flex-shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Re-Run Default Dataset</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-8 shadow-xl space-y-6">
        <label className="border-2 border-dashed border-[#25324A] hover:border-[#2563EB] rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition bg-[#080D1B] hover:bg-[#080D1B]/80 text-center">
          <div className="p-4 rounded-2xl bg-[#2563EB]/15 text-[#60A5FA] mb-3">
            <UploadCloud className="w-10 h-10" />
          </div>
          <span className="text-sm font-bold text-[#F8FAFC]">
            {file ? file.name : 'Select or drag & drop CSV transaction file'}
          </span>
          <span className="text-xs text-[#94A3B8] mt-1 font-mono">
            Standard TRACE CSV schema (id, timestamp, sender_id, receiver_id, amount, channel, status)
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <div className="flex items-center justify-between p-4 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC]">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#2563EB]" />
              <div>
                <div className="font-semibold">{file.name}</div>
                <div className="text-[10px] text-[#94A3B8] font-mono">
                  {(file.size / 1024).toFixed(1)} KB &bull; Text/CSV
                </div>
              </div>
            </div>
            <span className="text-[#10B981] flex items-center gap-1 font-bold font-mono">
              <CheckCircle className="w-4 h-4" /> Ready for Ingestion
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#F43F5E]/10 border border-[#F43F5E]/40 rounded-xl text-xs text-[#F43F5E] flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-[#25324A]">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#2563EB]/25 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            <span>{uploading ? 'Parsing & Scoring Dataset...' : 'Execute Ingestion & Batch Score'}</span>
          </button>
        </div>
      </div>

      {/* Scoring Result Summary Panel */}
      {lastResult && (
        <div className="bg-[#111A2E] border border-[#10B981]/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#25324A]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Ingestion & Detection Summary</h3>
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              Execution Time: {lastResult.execution_time_ms.toFixed(1)} ms
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-[#080D1B] rounded-xl border border-[#25324A]">
              <div className="text-[10px] text-[#94A3B8] uppercase">Parsed Transactions</div>
              <div className="text-lg font-bold text-[#F8FAFC] mt-0.5">{lastResult.transaction_count}</div>
            </div>
            <div className="p-3 bg-[#080D1B] rounded-xl border border-[#25324A]">
              <div className="text-[10px] text-[#F43F5E] uppercase">Flagged Transfers</div>
              <div className="text-lg font-bold text-[#F43F5E] mt-0.5">{lastResult.flagged_count}</div>
            </div>
            <div className="p-3 bg-[#080D1B] rounded-xl border border-[#25324A]">
              <div className="text-[10px] text-[#60A5FA] uppercase">Prioritized Cases</div>
              <div className="text-lg font-bold text-[#60A5FA] mt-0.5">{lastResult.alerts.length}</div>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8]">{lastResult.summary}</p>
        </div>
      )}

      {/* Required CSV Schema Guidelines */}
      <div className="bg-[#111A2E] border border-[#25324A] rounded-2xl p-6 shadow-xl space-y-3 text-xs">
        <h3 className="text-sm font-bold text-[#F8FAFC]">Standard TRACE CSV Schema Guidelines</h3>
        <p className="text-[#94A3B8]">
          The TRACE parser validates standard financial ledger headers. Optional columns (such as latitude and longitude) will automatically populate the world hotspot map and Risk Ripple network graph.
        </p>

        <div className="p-3 bg-[#080D1B] border border-[#25324A] rounded-xl font-mono text-[11px] space-y-1">
          <div className="text-[#60A5FA]">Required: id, timestamp, sender_id, receiver_id, amount, channel, status</div>
          <div className="text-[#94A3B8]">Optional: city, country, latitude, longitude, ip_address, description</div>
        </div>
      </div>
    </div>
  );
};
