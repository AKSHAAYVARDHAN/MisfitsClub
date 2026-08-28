import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  Layers, 
  MessageSquareHeart, 
  Mail, 
  ShieldAlert, 
  Activity, 
  Zap,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { PlatformMetric, StaffMember, ModerationReport, FeedbackItem, ContactMessageItem } from '../../types';
import { adminService } from '../../services/adminService';
import { feedbackService } from '../../services/feedbackService';
import { contactService } from '../../services/contactService';

interface AdminOverviewTabProps {
  metrics: PlatformMetric;
  currentStaff: StaffMember;
  onNavigateTab: (tab: string) => void;
}

interface AttentionItem {
  id: string;
  type: 'REPORT' | 'FEEDBACK' | 'CONTACT' | 'SECURITY';
  title: string;
  description: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionLabel: string;
  targetTab: string;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  metrics,
  currentStaff,
  onNavigateTab,
}) => {
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

  useEffect(() => {
    const loadAttentionQueue = async () => {
      setIsLoadingQueue(true);
      try {
        const [reports, feedback, contacts] = await Promise.all([
          adminService.getAllReports(),
          feedbackService.getAllFeedback(),
          contactService.getAllContactMessages(),
        ]);

        const queue: AttentionItem[] = [];

        // 1. Unresolved reports
        const openReports = reports.filter((r) => r.status === 'OPEN' || r.status === 'IN_REVIEW');
        openReports.slice(0, 3).forEach((r) => {
          queue.push({
            id: r.id,
            type: 'REPORT',
            title: `Report: ${r.reason}`,
            description: r.targetSnippet || `Reported target (${r.targetType}) by ${r.reporterName}`,
            timestamp: r.createdAt,
            severity: r.severity || 'MEDIUM',
            actionLabel: 'Review Report',
            targetTab: 'reports',
          });
        });

        // 2. Pending Feedback
        const pendingFb = feedback.filter((f) => f.status === 'new' || f.status === 'in_review');
        pendingFb.slice(0, 2).forEach((f) => {
          queue.push({
            id: f.id,
            type: 'FEEDBACK',
            title: `Member Feedback [${f.category}]`,
            description: f.content.length > 80 ? `${f.content.slice(0, 80)}...` : f.content,
            timestamp: f.createdAt,
            severity: 'LOW',
            actionLabel: 'Triage Feedback',
            targetTab: 'inbox',
          });
        });

        // 3. Unresolved Contact Inquiries
        const pendingCt = contacts.filter((c) => c.status === 'new' || c.status === 'in_progress');
        pendingCt.slice(0, 2).forEach((c) => {
          queue.push({
            id: c.id,
            type: 'CONTACT',
            title: `Direct Inquiry from ${c.name}`,
            description: c.message.length > 80 ? `${c.message.slice(0, 80)}...` : c.message,
            timestamp: c.createdAt,
            severity: 'MEDIUM',
            actionLabel: 'Respond in Inbox',
            targetTab: 'inbox',
          });
        });

        // Sort by timestamp desc
        queue.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAttentionItems(queue);
      } catch (err) {
        console.warn('Failed to compile attention queue:', err);
      } finally {
        setIsLoadingQueue(false);
      }
    };

    loadAttentionQueue();
  }, []);

  const statKPIs = [
    {
      id: 'members',
      label: 'MEMBERS',
      value: metrics.totalUsers.toLocaleString(),
      subtext: 'Registered Builders',
      icon: Users,
      action: () => onNavigateTab('members'),
      badge: 'Active',
      color: 'text-[#D4FF3F]',
    },
    {
      id: 'reports',
      label: 'PENDING REPORTS',
      value: (attentionItems.filter((i) => i.type === 'REPORT').length || 0).toString(),
      subtext: 'Awaiting Moderation',
      icon: ShieldAlert,
      action: () => onNavigateTab('reports'),
      badge: attentionItems.some((i) => i.type === 'REPORT') ? 'Action' : 'Clear',
      color: attentionItems.some((i) => i.type === 'REPORT') ? 'text-amber-400' : 'text-[#969696]',
      highlight: attentionItems.some((i) => i.type === 'REPORT'),
    },
    {
      id: 'sparks',
      label: 'NEW SPARKS',
      value: metrics.totalSparks.toLocaleString(),
      subtext: 'Notes & Discussions',
      icon: Sparkles,
      action: () => onNavigateTab('sparks'),
      badge: 'Live',
      color: 'text-amber-400',
    },
    {
      id: 'inbox',
      label: 'PENDING INBOX',
      value: (metrics.pendingFeedbackCount + metrics.pendingContactCount).toString(),
      subtext: 'Feedback & Contact',
      icon: Mail,
      action: () => onNavigateTab('inbox'),
      badge: metrics.pendingFeedbackCount + metrics.pendingContactCount > 0 ? 'Review' : 'Clear',
      color: metrics.pendingFeedbackCount + metrics.pendingContactCount > 0 ? 'text-rose-400' : 'text-[#969696]',
      highlight: metrics.pendingFeedbackCount + metrics.pendingContactCount > 0,
    },
  ];

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/15 border-red-500/40 text-red-400';
      case 'HIGH':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-400';
      case 'MEDIUM':
        return 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300';
      case 'LOW':
      default:
        return 'bg-[#14141A] border-[#262630] text-[#969696]';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'REPORT':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'FEEDBACK':
        return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
      case 'CONTACT':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      default:
        return 'text-[#D4FF3F] bg-[#D4FF3F]/10 border-[#D4FF3F]/30';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* KPI Row */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#969696] font-bold">
            Platform Attention & KPI Metrics
          </h3>
          <span className="text-[11px] font-mono-code text-[#64646E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
            Live Cloud Firestore
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {statKPIs.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.id}
                onClick={kpi.action}
                className={`bg-[#0E0E12] border p-4 sm:p-5 cursor-pointer transition-all group flex flex-col justify-between ${
                  kpi.highlight
                    ? 'border-amber-500/40 hover:border-amber-400 bg-[#121117]'
                    : 'border-[#F5F5F0]/10 hover:border-[#F5F5F0]/25'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#969696]">
                      {kpi.label}
                    </span>
                    <span className="text-[9px] font-mono-code uppercase px-1.5 py-0.5 border border-[#262630] bg-[#14141A] text-[#969696]">
                      {kpi.badge}
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-editorial font-light text-[#F5F5F0] mb-1 group-hover:text-[#D4FF3F] transition-colors">
                    {kpi.value}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F5F5F0]/5 flex items-center justify-between text-[10px] font-mono-code text-[#64646E]">
                  <span>{kpi.subtext}</span>
                  <ArrowUpRight className="w-3 h-3 text-[#64646E] group-hover:text-[#D4FF3F] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Needs Attention & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Attention Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
                Needs Attention
              </h3>
              <span className="text-[10px] font-mono-code bg-[#14141A] border border-[#262630] px-2 py-0.5 text-[#D4FF3F]">
                {attentionItems.length} Pending Items
              </span>
            </div>

            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-mono-code text-[#969696] hover:text-[#D4FF3F] transition-colors flex items-center gap-1"
            >
              <span>View All Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoadingQueue ? (
            <div className="bg-[#0E0E12] border border-[#F5F5F0]/10 p-8 text-center text-xs font-mono-code text-[#64646E]">
              Scanning platform action queue...
            </div>
          ) : attentionItems.length === 0 ? (
            <div className="bg-[#0E0E12] border border-[#F5F5F0]/10 p-8 text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-[#D4FF3F] mx-auto" />
              <div className="text-xs font-mono-code text-[#F5F5F0] font-bold uppercase tracking-wider">
                All Clear
              </div>
              <p className="text-xs font-sans-clean text-[#969696]">
                There are no open reports or urgent items awaiting administrator review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 sm:p-5 hover:border-[#F5F5F0]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-mono-code font-bold uppercase px-2 py-0.5 border ${getTypeBadge(item.type)}`}>
                        {item.type}
                      </span>
                      <span className={`text-[9px] font-mono-code font-bold uppercase px-2 py-0.5 border ${getSeverityBadge(item.severity)}`}>
                        {item.severity}
                      </span>
                      <span className="text-[11px] font-mono-code text-[#64646E] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-sans-clean font-medium text-[#F5F5F0] truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs font-sans-clean text-[#969696] line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigateTab(item.targetTab)}
                    className="px-3.5 py-2 bg-[#14141A] hover:bg-[#D4FF3F] hover:text-[#08080A] border border-[#262630] hover:border-[#D4FF3F] text-xs font-mono-code font-bold uppercase tracking-wider text-[#F5F5F0] transition-colors whitespace-nowrap self-start sm:self-auto inline-flex items-center gap-1.5"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Platform Health (1 col) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 space-y-4">
            <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => onNavigateTab('reports')}
                className="w-full text-left px-3.5 py-2.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] hover:border-[#D4FF3F]/40 text-xs font-mono-code text-[#F5F5F0] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Review Reports Queue</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#64646E] group-hover:text-[#D4FF3F]" />
              </button>

              <button
                onClick={() => onNavigateTab('members')}
                className="w-full text-left px-3.5 py-2.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] hover:border-[#D4FF3F]/40 text-xs font-mono-code text-[#F5F5F0] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#D4FF3F]" />
                  <span>Search & Inspect Member</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#64646E] group-hover:text-[#D4FF3F]" />
              </button>

              <button
                onClick={() => onNavigateTab('sparks')}
                className="w-full text-left px-3.5 py-2.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] hover:border-[#D4FF3F]/40 text-xs font-mono-code text-[#F5F5F0] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Moderate Sparks & Spaces</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#64646E] group-hover:text-[#D4FF3F]" />
              </button>

              <button
                onClick={() => onNavigateTab('audit')}
                className="w-full text-left px-3.5 py-2.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] hover:border-[#D4FF3F]/40 text-xs font-mono-code text-[#F5F5F0] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>View Security Audit Log</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#64646E] group-hover:text-[#D4FF3F]" />
              </button>

              <button
                onClick={() => onNavigateTab('system')}
                className="w-full text-left px-3.5 py-2.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] hover:border-[#D4FF3F]/40 text-xs font-mono-code text-[#F5F5F0] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[#D4FF3F]" />
                  <span>System Broadcast & Alerts</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#64646E] group-hover:text-[#D4FF3F]" />
              </button>
            </div>
          </div>

          {/* Operating Identity */}
          <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#969696]">
                Admin Identity
              </span>
              <span className="text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[#D4FF3F]">
                {currentStaff.role}
              </span>
            </div>
            <div>
              <div className="text-sm font-sans-clean font-medium text-[#F5F5F0]">
                {currentStaff.name || 'Platform Administrator'}
              </div>
              <div className="text-xs font-mono-code text-[#969696] truncate">
                {currentStaff.email}
              </div>
            </div>
            <p className="text-[11px] font-sans-clean text-[#64646E] pt-2 border-t border-[#F5F5F0]/5">
              All privileged mutations are recorded with immutable cryptographic timestamps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
