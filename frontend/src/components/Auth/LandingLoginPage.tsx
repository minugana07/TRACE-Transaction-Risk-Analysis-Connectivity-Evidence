import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Lock,
  ArrowRight,
  User,
  Sparkles,
  Database,
  Activity,
  CheckCircle2,
  UserPlus,
  LogIn,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { loginUser, registerUser, AuthUserData } from '../../services/api';

interface LandingLoginPageProps {
  onSelectRole: (role: 'analyst' | 'consumer', selectedAccount?: string, user?: AuthUserData) => void;
  isBackendHealthy: boolean;
  sampleAccounts: string[];
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  onSelectRole,
  isBackendHealthy,
  sampleAccounts,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'demo'>('demo');

  // Sign In Form States
  const [identifier, setIdentifier] = useState('analyst');
  const [password, setPassword] = useState('password123');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'analyst' | 'consumer'>('analyst');
  const [regAccountId, setRegAccountId] = useState('ACC-101');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setIsSigningIn(true);
    try {
      const user = await loginUser(identifier, password);
      onSelectRole(user.role, user.account_id, user);
    } catch (err: any) {
      setSignInError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    setIsRegistering(true);

    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegisterError('All fields are required');
      setIsRegistering(false);
      return;
    }

    try {
      const user = await registerUser({
        full_name: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        role: regRole,
        account_id: regRole === 'consumer' ? regAccountId : undefined,
      });

      setRegisterSuccess(`Account created for ${user.full_name}! Launching dashboard...`);
      setTimeout(() => {
        onSelectRole(user.role, user.account_id, user);
      }, 1000);
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to create account');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D1B] cyber-grid flex flex-col justify-between text-[#F8FAFC] selection:bg-[#2563EB] selection:text-white p-4 sm:p-8">
      {/* Top Banner */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-[#25324A]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center font-black text-xs text-white shadow-lg shadow-[#2563EB]/30">
            TR
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight font-mono">TRACE V2.0</span>
            <span className="text-[10px] text-[#94A3B8] ml-2 hidden sm:inline">
              Fraud Intelligence & Consumer Defense
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy ? 'bg-[#10B981] animate-pulse' : 'bg-[#F43F5E]'
            }`}
          />
          <span className={isBackendHealthy ? 'text-[#10B981]' : 'text-[#F43F5E]'}>
            {isBackendHealthy ? 'FastAPI 8001: Connected' : 'FastAPI: Offline'}
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl w-full mx-auto text-center my-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111A2E] border border-[#25324A] text-xs font-mono text-[#60A5FA]">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>CYBER-FINANCIAL INTELLIGENCE COMMAND WORKSTATION</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#F8FAFC]">
          TRACE Intelligence Portal
        </h1>
        <p className="text-sm text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          Unified fraud detection, multi-hop risk ripple connectivity, and consumer scam defense backed by SQLite persistence.
        </p>

        {/* Auth Mode Toggle */}
        <div className="inline-flex items-center bg-[#111A2E] border border-[#25324A] p-1 rounded-xl shadow-lg mt-2">
          <button
            onClick={() => setAuthMode('demo')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition ${
              authMode === 'demo'
                ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            1-Click Demo Access
          </button>
          <button
            onClick={() => setAuthMode('signin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition ${
              authMode === 'signin'
                ? 'bg-[#2563EB] text-white shadow'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition ${
              authMode === 'register'
                ? 'bg-[#10B981] text-white shadow'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {/* Main Container Based on Auth Mode */}
      {authMode === 'demo' ? (
        /* 1-Click Role Selection Cards */
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
          {/* Role 1: TRACE Investigate (Analyst) */}
          <div className="bg-[#111A2E] border-2 border-[#25324A] hover:border-[#2563EB] rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/10 rounded-full blur-2xl group-hover:bg-[#2563EB]/20 transition-all pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 shadow-lg shadow-[#2563EB]/15">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#080D1B] text-[#60A5FA] border border-[#25324A]">
                  FINANCIAL FORENSICS
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#F8FAFC]">TRACE Investigate</h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  For financial crime analysts, compliance officers, and AML investigators.
                </p>
              </div>

              <ul className="text-xs text-[#94A3B8] space-y-2 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <span>Multi-Hop Risk Ripple transaction graph</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <span>Geospatial fraud hotspot telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <span>Deterministic smurfing & velocity rule engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <span>Audit-trail SQLite case management & SAR queue</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-[#25324A] mt-6 space-y-3">
              <div className="text-[11px] text-[#94A3B8] flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Demo Credential: <code className="text-[#F8FAFC]">analyst</code> / <code className="text-[#F8FAFC]">password123</code></span>
              </div>

              <button
                onClick={() => onSelectRole('analyst')}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#2563EB]/25 flex items-center justify-center gap-2 transition"
              >
                <span>Enter as Lead Analyst</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role 2: TRACE Protect Me (Consumer) */}
          <div className="bg-[#111A2E] border-2 border-[#25324A] hover:border-[#10B981] rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-2xl group-hover:bg-[#10B981]/20 transition-all pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 shadow-lg shadow-[#10B981]/15">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#080D1B] text-[#10B981] border border-[#25324A]">
                  CONSUMER DEFENSE
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#F8FAFC]">TRACE Protect Me</h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  For retail banking customers verifying transactions and defending against scams.
                </p>
              </div>

              <ul className="text-xs text-[#94A3B8] space-y-2 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <span>CallShield voice fraud & social engineering lookup</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <span>Verification Center step-up authentication challenges</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <span>ScamShield phishing & fake SMS link scanner</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <span>Zero-Trust Security Loop emergency account freeze</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-[#25324A] mt-6 space-y-3">
              <div className="text-[11px] text-[#94A3B8] flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Demo Credential: <code className="text-[#F8FAFC]">consumer</code> / <code className="text-[#F8FAFC]">password123</code></span>
              </div>

              <button
                onClick={() => onSelectRole('consumer', 'ACC-101')}
                className="w-full py-3 px-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#10B981]/25 flex items-center justify-center gap-2 transition"
              >
                <span>Enter as Protected Consumer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : authMode === 'signin' ? (
        /* Sign In Form */
        <div className="max-w-md w-full mx-auto bg-[#111A2E] border border-[#25324A] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-[#F8FAFC]">Sign In to TRACE</h2>
            <p className="text-xs text-[#94A3B8]">Authenticated session loaded from SQLite database</p>
          </div>

          {signInError && (
            <div className="p-3 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-xs text-[#F43F5E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{signInError}</span>
            </div>
          )}

          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#F8FAFC]">Username or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="analyst or consumer"
                className="w-full px-3 py-2.5 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#F8FAFC]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full px-3 py-2.5 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Authenticate & Launch</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[#94A3B8] pt-2 border-t border-[#25324A]">
            Don't have an account?{' '}
            <button
              onClick={() => setAuthMode('register')}
              className="text-[#60A5FA] hover:underline font-semibold"
            >
              Create Account
            </button>
          </div>
        </div>
      ) : (
        /* Create Account (Register) Form */
        <div className="max-w-lg w-full mx-auto bg-[#111A2E] border border-[#25324A] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-[#F8FAFC]">Create TRACE Account</h2>
            <p className="text-xs text-[#94A3B8]">Persisted directly into SQLite database `trace.db`</p>
          </div>

          {registerError && (
            <div className="p-3 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-xs text-[#F43F5E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          {registerSuccess && (
            <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-xs text-[#10B981] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{registerSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#F8FAFC]">Full Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Maya Sharma"
                  className="w-full px-3 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#F8FAFC]">Username</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. maya_analyst"
                  className="w-full px-3 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#F8FAFC]">Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full px-3 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#F8FAFC]">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimum 4 characters"
                className="w-full px-3 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>

            {/* Operational Role Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-[#F8FAFC]">Select Operational Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('analyst')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    regRole === 'analyst'
                      ? 'bg-[#2563EB]/20 border-[#2563EB] text-[#60A5FA]'
                      : 'bg-[#080D1B] border-[#25324A] text-[#94A3B8]'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Lead Analyst</span>
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-0.5">TRACE Investigate</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('consumer')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    regRole === 'consumer'
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                      : 'bg-[#080D1B] border-[#25324A] text-[#94A3B8]'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Protected Consumer</span>
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-0.5">TRACE Protect Me</div>
                </button>
              </div>
            </div>

            {regRole === 'consumer' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#F8FAFC]">Consumer Account Reference</label>
                <input
                  type="text"
                  value={regAccountId}
                  onChange={(e) => setRegAccountId(e.target.value)}
                  placeholder="e.g. ACC-101"
                  className="w-full px-3 py-2 bg-[#080D1B] border border-[#25324A] rounded-xl text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-[#10B981]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Account & Log In</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[#94A3B8] pt-2 border-t border-[#25324A]">
            Already registered?{' '}
            <button
              onClick={() => setAuthMode('signin')}
              className="text-[#60A5FA] hover:underline font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="max-w-4xl w-full mx-auto text-center py-4 border-t border-[#25324A]/60 text-xs text-[#94A3B8] space-y-1">
        <p className="font-mono text-[11px]">
          TRACE &bull; Transaction Risk Analysis, Connectivity & Evidence &bull; Multi-Role Fraud Defence
        </p>
        <p className="text-[10px] text-[#94A3B8]/60">
          User accounts and investigation notes are persisted in SQLite WAL database &bull; Google Gemini 2.5 Flash synthesis
        </p>
      </div>
    </div>
  );
};
