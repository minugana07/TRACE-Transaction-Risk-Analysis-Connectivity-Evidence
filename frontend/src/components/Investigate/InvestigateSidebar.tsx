import React from 'react';
import {
  LayoutDashboard,
  Share2,
  Briefcase,
  MapPin,
  Database,
  ShieldAlert,
  Sparkles,
  Sliders,
  FileSpreadsheet,
  Server,
  Globe,
  ChevronRight,
} from 'lucide-react';

export type InvestigateSubPage =
  | 'overview'
  | 'ledger'
  | 'batch_scoring'
  | 'queue'
  | 'risk_ripple'
  | 'map'
  | 'alerts'
  | 'ai_chat'
  | 'thresholds'
  | 'workbench';

interface InvestigateSidebarProps {
  activeSubPage: InvestigateSubPage;
  onSelectSubPage: (page: InvestigateSubPage) => void;
  alertCount: number;
  criticalCount: number;
}

interface NavSection {
  title: string;
  items: {
    id: InvestigateSubPage;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const InvestigateSidebar: React.FC<InvestigateSidebarProps> = ({
  activeSubPage,
  onSelectSubPage,
  alertCount,
  criticalCount,
}) => {
  const sections: NavSection[] = [
    {
      title: 'ENTERPRISE INTELLIGENCE',
      items: [
        {
          id: 'overview',
          label: 'Security Overview',
          subtitle: 'Executive Telemetry & KPIs',
          icon: LayoutDashboard,
        },
        {
          id: 'ledger',
          label: 'Transaction Explorer',
          subtitle: 'Forensic Settlement Ledger',
          icon: Database,
        },
        {
          id: 'batch_scoring',
          label: 'CSV Batch Scoring',
          subtitle: 'Bulk Detection Ingestion',
          icon: FileSpreadsheet,
          badge: 'Dataset',
          badgeColor: 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40',
        },
        {
          id: 'queue',
          label: 'Investigation Queue',
          subtitle: 'Case Triage & Registry',
          icon: Briefcase,
          badge: alertCount > 0 ? `${alertCount}` : undefined,
          badgeColor:
            criticalCount > 0
              ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
              : 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40',
        },
        {
          id: 'risk_ripple',
          label: 'Risk Ripple Graph',
          subtitle: 'Multi-Hop Connectivity Network',
          icon: Share2,
          badge: 'Graph',
          badgeColor: 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40',
        },
        {
          id: 'map',
          label: 'Investigation Map',
          subtitle: 'Global Hotspot Geospatial',
          icon: Globe,
        },
        {
          id: 'alerts',
          label: 'Security Alerts',
          subtitle: 'Automated Rule Triggers',
          icon: ShieldAlert,
          badge: criticalCount > 0 ? `${criticalCount} Crit` : undefined,
          badgeColor: 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40',
        },
      ],
    },
    {
      title: 'AI & ANALYSIS',
      items: [
        {
          id: 'ai_chat',
          label: 'Talk to TRACE AI',
          subtitle: 'Conversational Forensics & AML',
          icon: Sparkles,
          badge: 'Gemini',
          badgeColor: 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40',
        },
      ],
    },
    {
      title: 'SYSTEM & ARCHITECTURE',
      items: [
        {
          id: 'thresholds',
          label: 'Thresholds & Health',
          subtitle: 'Engine Rules & Architecture',
          icon: Sliders,
        },
      ],
    },
  ];

  return (
    <aside className="w-full lg:w-72 bg-[#0C1425] border-r border-[#25324A] flex flex-col flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#25324A] bg-[#0A1020]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
              INVESTIGATE WORKSTATION
            </span>
          </div>
          <span className="text-[10px] bg-[#111A2E] text-[#60A5FA] border border-[#25324A] px-2 py-0.5 rounded font-mono">
            V2.0
          </span>
        </div>
        <p className="text-xs font-semibold text-[#F8FAFC] mt-1.5">
          Lead Financial Crime Analyst
        </p>
      </div>

      {/* Navigation Sections */}
      <nav className="p-3 space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]" aria-label="Analyst Navigation">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]/80">
              {sec.title}
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSubPage === item.id ||
                (item.id === 'queue' && activeSubPage === 'workbench');

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSubPage(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#111A2E] text-[#F8FAFC] border border-[#2563EB] shadow-md ring-1 ring-[#2563EB]/30'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A2E]/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg flex-shrink-0 ${
                        isActive
                          ? 'bg-[#2563EB]/20 text-[#60A5FA]'
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
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-[#25324A] bg-[#0A1020] text-[11px] text-[#94A3B8] space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span>Active Flagged:</span>
          <span className="text-[#F43F5E] font-bold">{criticalCount} Critical</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>Engine Status:</span>
          <span className="text-[#10B981]">ONLINE &bull; PORT 8001</span>
        </div>
      </div>
    </aside>
  );
};
