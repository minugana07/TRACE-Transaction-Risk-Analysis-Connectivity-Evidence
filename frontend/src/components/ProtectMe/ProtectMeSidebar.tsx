import React from 'react';
import {
  ShieldCheck,
  Receipt,
  PhoneCall,
  Gamepad2,
  Users,
  AlertTriangle,
  Lock,
  Sparkles,
  Search,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';

export type ProtectMeSubPage =
  | 'safety_overview'
  | 'my_transactions'
  | 'risk_analysis'
  | 'callshield'
  | 'scamshield'
  | 'verification'
  | 'safetyloop'
  | 'consumer_chat';

interface ProtectMeSidebarProps {
  activeSubPage: ProtectMeSubPage;
  onSelectSubPage: (page: ProtectMeSubPage) => void;
  unresolvedCount: number;
}

export const ProtectMeSidebar: React.FC<ProtectMeSidebarProps> = ({
  activeSubPage,
  onSelectSubPage,
  unresolvedCount,
}) => {
  const navItems = [
    {
      id: 'safety_overview' as ProtectMeSubPage,
      label: 'Protect Me Overview',
      subtitle: 'Account Health & Alerts',
      icon: ShieldCheck,
      badge: unresolvedCount > 0 ? `${unresolvedCount} Alert` : 'Secure',
      badgeColor:
        unresolvedCount > 0
          ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
          : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40',
    },
    {
      id: 'my_transactions' as ProtectMeSubPage,
      label: 'My Transactions',
      subtitle: 'Recent Account Activity',
      icon: Receipt,
    },
    {
      id: 'risk_analysis' as ProtectMeSubPage,
      label: 'Transaction Risk Analysis',
      subtitle: 'Anomaly Detection & Score',
      icon: TrendingDown,
      badge: 'Risk Engine',
      badgeColor: 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40',
    },
    {
      id: 'callshield' as ProtectMeSubPage,
      label: 'CallShield Defense',
      subtitle: 'Live Scam Caller Lookup',
      icon: PhoneCall,
      badge: 'Live',
      badgeColor: 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40',
    },
    {
      id: 'scamshield' as ProtectMeSubPage,
      label: 'ScamShield Scanner',
      subtitle: 'Interactive Scam Academy',
      icon: Gamepad2,
      badge: 'Simulator',
      badgeColor: 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40',
    },
    {
      id: 'verification' as ProtectMeSubPage,
      label: 'Verification Center',
      subtitle: 'Official Bank Channel Check',
      icon: CheckCircle2,
    },
    {
      id: 'safetyloop' as ProtectMeSubPage,
      label: 'Safety Loop',
      subtitle: 'Family & Elder Protection Network',
      icon: Users,
    },
    {
      id: 'consumer_chat' as ProtectMeSubPage,
      label: 'Talk to TRACE AI',
      subtitle: 'Consumer Financial Guardian',
      icon: Sparkles,
      badge: 'Gemini',
      badgeColor: 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40',
    },
  ];

  return (
    <aside className="w-full lg:w-72 bg-[#0C1425] border-r border-[#25324A] flex flex-col flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#25324A] bg-[#0A1020]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
              CONSUMER SHIELD
            </span>
          </div>
          <span className="text-[10px] bg-[#111A2E] text-[#10B981] border border-[#25324A] px-2 py-0.5 rounded font-mono">
            V2.0
          </span>
        </div>
        <p className="text-xs font-semibold text-[#F8FAFC] mt-1.5">
          Protected Consumer Portal
        </p>
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]" aria-label="Consumer Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSubPage(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-[#111A2E] text-[#F8FAFC] border border-[#10B981] shadow-md ring-1 ring-[#10B981]/30'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A2E]/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg flex-shrink-0 ${
                    isActive
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-[#080D1B] text-[#94A3B8]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{item.label}</div>
                  <div className="text-[10px] text-[#94A3B8] truncate">{item.subtitle}</div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-[#25324A] bg-[#0A1020] text-[11px] text-[#94A3B8] space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span>Shield Protection:</span>
          <span className="text-[#10B981] font-bold">24/7 Active</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>Security Protocol:</span>
          <span className="text-[#60A5FA]">Zero-Trust Verified</span>
        </div>
      </div>
    </aside>
  );
};
