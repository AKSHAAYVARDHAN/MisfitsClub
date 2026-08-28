import React from 'react';
import { 
  Users, 
  Sparkles, 
  Layers, 
  MessageSquareHeart, 
  Mail, 
  ShieldCheck, 
  Activity, 
  Zap,
  ArrowUpRight,
  TrendingUp,
  Server
} from 'lucide-react';
import { PlatformMetric, StaffMember } from '../../types';

interface AdminOverviewTabProps {
  metrics: PlatformMetric;
  currentStaff: StaffMember;
  onNavigateTab: (tab: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  metrics,
  currentStaff,
  onNavigateTab,
}) => {
  const statCards = [
    {
      label: 'Total Registered Members',
      value: metrics.totalUsers,
      subtext: 'Across all global hubs',
      icon: Users,
      action: () => onNavigateTab('roles'),
      color: 'text-[#D4FF3F]',
      badge: 'Live',
    },
    {
      label: 'Public Sparks & Discussions',
      value: metrics.totalSparks,
      subtext: 'Curious notes & insights',
      icon: Sparkles,
      action: () => onNavigateTab('moderation'),
      color: 'text-amber-400',
      badge: 'Active',
    },
    {
      label: 'Active Community Spaces',
      value: metrics.totalSpaces,
      subtext: 'Thematic builder groups',
      icon: Layers,
      action: () => onNavigateTab('moderation'),
      color: 'text-blue-400',
      badge: 'Spaces',
    },
    {
      label: 'Pending Feedback Notes',
      value: metrics.pendingFeedbackCount,
      subtext: 'Awaiting team review',
      icon: MessageSquareHeart,
      action: () => onNavigateTab('inbox'),
      color: 'text-rose-400',
      badge: metrics.pendingFeedbackCount > 0 ? 'Action Needed' : 'Clear',
      highlight: metrics.pendingFeedbackCount > 0,
    },
    {
      label: 'Pending Direct Inquiries',
      value: metrics.pendingContactCount,
      subtext: 'Contact form submissions',
      icon: Mail,
      action: () => onNavigateTab('inbox'),
      color: 'text-purple-400',
      badge: metrics.pendingContactCount > 0 ? 'Inbox' : 'Up to Date',
      highlight: metrics.pendingContactCount > 0,
    },
    {
      label: 'Active Staff & Team',
      value: metrics.activeStaffCount,
      subtext: 'Verified RBAC personnel',
      icon: ShieldCheck,
      action: () => onNavigateTab('roles'),
      color: 'text-emerald-400',
      badge: 'Staff',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-pulse" />
            <span className="text-xs font-mono-code text-[#D4FF3F] uppercase tracking-widest font-bold">
              System Active & Healthy
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-editorial font-light text-[#F5F5F0]">
            Welcome back, {currentStaff.name || 'Admin'}
          </h2>
          <p className="text-xs sm:text-sm text-[#969696] font-sans-clean max-w-xl">
            You are operating with <span className="text-[#D4FF3F] font-bold font-mono-code">{currentStaff.role}</span> privileges. All administrative events are permanently logged in the audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('inbox')}
            className="px-4 py-2.5 bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Open Triage Inbox</span>
          </button>
          <button
            onClick={() => onNavigateTab('moderation')}
            className="px-4 py-2.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#F5F5F0] transition-colors inline-flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Moderate Content</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#969696] font-bold">
            Platform Metrics Overview
          </h3>
          <span className="text-[11px] font-mono-code text-[#64646E]">
            Synced with Cloud Firestore
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                onClick={card.action}
                className={`bg-[#0E0E12] border transition-all p-5 sm:p-6 cursor-pointer group flex flex-col justify-between ${
                  card.highlight
                    ? 'border-amber-500/40 hover:border-amber-400'
                    : 'border-[#F5F5F0]/10 hover:border-[#F5F5F0]/25'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 bg-[#14141A] border border-[#262630] ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono-code uppercase tracking-wider px-2 py-0.5 border border-[#262630] bg-[#14141A] text-[#969696]">
                      {card.badge}
                    </span>
                  </div>

                  <div className="text-3xl sm:text-4xl font-editorial font-light text-[#F5F5F0] mb-1 group-hover:text-[#D4FF3F] transition-colors">
                    {card.value}
                  </div>
                  <div className="text-xs font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                    {card.label}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F5F5F0]/5 flex items-center justify-between text-[11px] font-mono-code text-[#64646E]">
                  <span>{card.subtext}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#64646E] group-hover:text-[#D4FF3F] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architecture & RBAC Invariant Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#D4FF3F]" />
            <h4 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
              Database & Security Invariants
            </h4>
          </div>
          <p className="text-xs text-[#969696] leading-relaxed">
            All administrative privileges are strictly governed by Cloud Firestore security rules at <code className="text-[#D4FF3F] bg-[#14141A] px-1 py-0.5">adminRoles/&#123;uid&#125;</code>.
          </p>
          <ul className="text-xs font-mono-code text-[#969696] space-y-2 border-t border-[#F5F5F0]/10 pt-3">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#D4FF3F]" />
              <span>Two-level security: React route guards + Firestore Rules</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#D4FF3F]" />
              <span>Immutable audit logging for privileged actions</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#D4FF3F]" />
              <span>Encrypted Firestore transmission via SSL/TLS</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
              Role Matrix Privileges
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
            <div className="bg-[#121217] p-2.5 border border-[#22222A]">
              <span className="text-[#D4FF3F] font-bold block mb-1">OWNER</span>
              <span className="text-[11px] text-[#969696]">Full root access & role assignment</span>
            </div>
            <div className="bg-[#121217] p-2.5 border border-[#22222A]">
              <span className="text-amber-400 font-bold block mb-1">ADMIN</span>
              <span className="text-[11px] text-[#969696]">Content moderation & member management</span>
            </div>
            <div className="bg-[#121217] p-2.5 border border-[#22222A]">
              <span className="text-sky-400 font-bold block mb-1">MODERATOR</span>
              <span className="text-[11px] text-[#969696]">Sparks & Spaces community triage</span>
            </div>
            <div className="bg-[#121217] p-2.5 border border-[#22222A]">
              <span className="text-purple-400 font-bold block mb-1">SUPPORT</span>
              <span className="text-[11px] text-[#969696]">Feedback & Contact inbox resolution</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
