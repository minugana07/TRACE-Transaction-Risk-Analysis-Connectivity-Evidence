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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Upload Transaction Dataset</h2>
              <p className="text-xs text-slate-400">CSV file with transaction and entity records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/40 hover:bg-slate-950/80">
            <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
            <span className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Choose CSV or drag & drop'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Supports standard TRACE CSV format (id, timestamp, sender_id, receiver_id, amount)
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Expected Columns:</div>
            <code className="text-indigo-300">id, timestamp, sender_id, receiver_id, amount, channel, status</code>
            <div>Optional: <code className="text-slate-300">city, country, latitude, longitude, ip_address</code></div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 p-4 bg-slate-950/60 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-300 hover:text-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? 'Processing & Evaluating...' : 'Run Detection on Dataset'}
          </button>
        </div>
      </div>
    </div>
  );
};
