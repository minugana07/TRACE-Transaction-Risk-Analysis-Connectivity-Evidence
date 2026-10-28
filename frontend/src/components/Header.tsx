import React from 'react';
import { Shield, Search, UploadCloud, Zap } from 'lucide-react';

interface HeaderProps {
  currentMode: 'investigate' | 'protect_me';
  onModeChange: (mode: 'investigate' | 'protect_me') => void;
  onOpenUpload: () => void;
  isBackendHealthy: boolean;
  activeCaseId: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  onOpenUpload,
  isBackendHealthy,
  activeCaseId,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-mono">TRACE</span>
              <span className="text-[10px] bg-slate-800 text-indigo-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Transaction Risk Analysis, Connectivity & Evidence
            </p>
          </div>
        </div>

        {/* Mode Switcher Nav */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => onModeChange('protect_me')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentMode === 'protect_me'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Protect Me</span>
            <span className="text-[10px] hidden md:inline opacity-75">(Consumer)</span>
          </button>

          <button
            onClick={() => onModeChange('investigate')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentMode === 'investigate'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Investigate</span>
            <span className="text-[10px] hidden md:inline opacity-75">(Analyst)</span>
          </button>
        </div>

        {/* Actions & Health */}
        <div className="flex items-center gap-3">
          {activeCaseId && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-500">Active Case:</span>
              <span className="font-mono text-indigo-300 font-bold">{activeCaseId}</span>
            </div>
          )}

          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700/80 transition shadow"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Upload Dataset</span>
          </button>

          <div
            title={isBackendHealthy ? 'Backend API connected' : 'Backend API disconnected'}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] bg-slate-900 border border-slate-800"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400 text-[10px] hidden sm:inline">
              {isBackendHealthy ? 'API Online' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
