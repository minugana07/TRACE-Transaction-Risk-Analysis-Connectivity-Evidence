import React, { useState } from 'react';
import { uploadDataset } from '../../services/api';
import type { DetectionResult } from '../../types/trace';
import { UploadCloud, X, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (result: DetectionResult) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      onUploadSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to parse and upload CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0C182B] border border-[#1E314B] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#1E314B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 rounded">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC] uppercase tracking-wide">
                Ingest Transaction Dataset
              </h2>
              <p className="text-xs text-[#94A3B8]">CSV file with settlement and entity records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="border-2 border-dashed border-[#1E314B] hover:border-[#06B6D4] rounded p-8 flex flex-col items-center justify-center cursor-pointer transition bg-[#08101E] hover:bg-[#12233D]/50">
            <UploadCloud className="w-10 h-10 text-[#06B6D4] mb-2" />
            <span className="text-sm font-semibold text-[#F8FAFC]">
              {file ? file.name : 'Choose CSV or drag & drop'}
            </span>
            <span className="text-xs text-[#94A3B8] mt-1 font-mono">
              Supports standard TRACE schema (id, timestamp, sender_id, receiver_id, amount)
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center justify-between p-3 bg-[#08101E] border border-[#1E314B] rounded text-xs text-[#F8FAFC]">
              <span className="flex items-center gap-2 font-mono">
                <FileText className="w-4 h-4 text-[#06B6D4]" />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <span className="text-[#10B981] flex items-center gap-1 font-medium font-mono">
                <CheckCircle className="w-3.5 h-3.5" /> Ready for Analysis
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/40 rounded text-xs text-[#EF4444] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-[#08101E] p-3 rounded border border-[#1E314B] text-[11px] text-[#94A3B8] space-y-1 font-mono">
            <div className="font-semibold text-[#F8FAFC]">Expected Column Headers:</div>
            <code className="text-[#06B6D4]">id, timestamp, sender_id, receiver_id, amount, channel, status</code>
            <div>Optional: <code className="text-[#94A3B8]">city, country, latitude, longitude, ip_address</code></div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 p-4 bg-[#08101E] border-t border-[#1E314B]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] rounded transition uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-50 text-[#060D1A] rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition shadow"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? 'Evaluating Engine...' : 'Run Forensic Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};
