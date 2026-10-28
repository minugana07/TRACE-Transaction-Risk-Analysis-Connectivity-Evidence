import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Activity,
  Sun,
  Moon,
  Database,
  Terminal,
  LogOut,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';

export type TraceWorkspace = 'investigate' | 'protect_me';

interface HeaderProps {
  currentWorkspace: TraceWorkspace;
  onWorkspaceChange: (ws: TraceWorkspace) => void;
  onOpenUpload: () => void;
  isBackendHealthy: boolean;
  activeCaseId: string | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWorkspace,
  onWorkspaceChange,
  onOpenUpload,
  isBackendHealthy,
  activeCaseId,
  isDarkMode,
  onToggleTheme,
  onSignOut,
}) => {
  const [showLogoutPrompt, setShowLogoutPrompt] = useState<'investigate' | 'protect_me' | null>(null);

  const handleWorkspaceButtonClick = (target: TraceWorkspace) => {
    if (target !== currentWorkspace) {
      // Require logout to view other role's dashboard as per security compliance
      setShowLogoutPrompt(target);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#25324A] bg-[#080D1B]/95 backdrop-blur-md">
        {/* Top Cyber Telemetry Line */}
        <div className="border-b border-[#1A253A] bg-[#050813] px-4 sm:px-6 py-1 text-[11px] text-[#94A3B8]">
          <div className="max-w-7xl mx-auto flex items-center justify-between font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#2563EB] font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                TRACE COMMAND CENTRE
              </span>
              <span className="text-[#25324A] hidden md:inline">|</span>
              <span className="text-[10px] text-[#94A3B8] hidden md:inline">
                FINANCIAL RISK INTELLIGENCE, CONNECTIVITY & EVIDENCE
              </span>
            </div>

            <div className="flex items-center gap-4 text-[10px]">
              <span className="hidden lg:flex items-center gap-1 text-[#94A3B8]">
                <Terminal className="w-3 h-3 text-[#7C3AED]" />
                ENGINE: <b className="text-[#F8FAFC]">GEMINI 2.5 & FORENSIC RULES</b>
              </span>
              <span className="text-[#25324A] hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBackendHealthy ? 'bg-[#10B981] animate-pulse' : 'bg-[#F43F5E]'
                  }`}
                />
                <span className={isBackendHealthy ? 'text-[#10B981] font-bold' : 'text-[#F43F5E] font-bold'}>
                  {isBackendHealthy ? 'CORE API 8001: ONLINE' : 'CORE API: OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Command Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-lg shadow-[#2563EB]/25">
              TR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#F8FAFC] font-sans">
                  TRACE V2.0
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#111A2E] text-[#60A5FA] border border-[#25324A]">
                  {currentWorkspace === 'investigate' ? 'ANALYST WORKSTATION' : 'CONSUMER DEFENSE'}
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8] hidden sm:block">
                Fraud Intelligence & Consumer Defense
              </p>
            </div>
          </div>

          {/* Central Workspace Switcher (Two Separate Experiences) */}
          <div className="flex items-center bg-[#111A2E] border border-[#25324A] p-1 rounded-xl shadow-inner">
            <button
              onClick={() => handleWorkspaceButtonClick('investigate')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                currentWorkspace === 'investigate'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-[#2563EB]/20 ring-1 ring-white/20'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title={currentWorkspace !== 'investigate' ? 'Click to switch (Logout required)' : undefined}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>TRACE Investigate</span>
            </button>

            <button
              onClick={() => handleWorkspaceButtonClick('protect_me')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                currentWorkspace === 'protect_me'
                  ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20 ring-1 ring-white/20'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title={currentWorkspace !== 'protect_me' ? 'Click to switch (Logout required)' : undefined}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TRACE Protect Me</span>
            </button>
          </div>

          {/* Right Financial Utilities */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {activeCaseId && (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111A2E] border border-[#25324A] text-xs">
                <span className="text-[#94A3B8] text-[10px] uppercase font-mono">Case:</span>
                <span className="font-mono text-[#F43F5E] font-bold">{activeCaseId}</span>
              </div>
            )}

            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 bg-[#111A2E] hover:bg-[#16223B] text-[#F8FAFC] text-xs font-semibold rounded-lg border border-[#25324A] flex items-center gap-1.5 transition shadow"
              title="Ingest CSV transaction dataset"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="hidden sm:inline">Ingest Dataset</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-[#111A2E] hover:bg-[#16223B] border border-[#25324A] text-[#94A3B8] hover:text-[#F8FAFC] transition"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#F59E0B]" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
            </button>

            {/* Role Switch / Sign Out Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-2 rounded-lg bg-[#111A2E] hover:bg-[#F43F5E]/20 border border-[#25324A] text-[#94A3B8] hover:text-[#F43F5E] transition flex items-center gap-1.5 text-xs font-mono"
                title="Log Out of TRACE"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Logout Required Confirmation Modal (as requested in Image 2) */}
      {showLogoutPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111A2E] border-2 border-[#F59E0B] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Logout Required</h3>
                  <p className="text-[11px] text-[#94A3B8] font-mono">Role-Based Access Separation</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutPrompt(null)}
                className="text-[#94A3B8] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {showLogoutPrompt === 'protect_me' ? (
                <>
                  You are currently authenticated in an enterprise <b>Lead Financial Crime Analyst</b> session.
                  To access the consumer <b>Protect Me dashboard</b>, please log out and sign in with a consumer account.
                </>
              ) : (
                <>
                  You are currently authenticated in a retail <b>Protected Consumer</b> session.
                  To access the enterprise <b>Investigate workstation</b>, please log out and sign in with an analyst credential.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#25324A]">
              <button
                onClick={() => setShowLogoutPrompt(null)}
                className="px-4 py-2 bg-[#080D1B] hover:bg-[#16223B] border border-[#25324A] text-xs font-semibold text-[#F8FAFC] rounded-xl transition"
              >
                Stay in Current Dashboard
              </button>
              <button
                onClick={() => {
                  setShowLogoutPrompt(null);
                  if (onSignOut) onSignOut();
                }}
                className="px-4 py-2 bg-[#F43F5E] hover:bg-[#E11D48] text-xs font-bold text-white rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out to Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

