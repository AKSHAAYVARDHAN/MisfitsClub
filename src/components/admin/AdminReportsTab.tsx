import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Layers,
  Check,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { ModerationReport, ReportSeverity, ReportStatus, StaffMember } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminReportsTabProps {
  currentStaff: StaffMember;
  onRefreshMetrics: () => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  currentStaff,
  onRefreshMetrics,
}) => {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED'>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [resolutionNoteDraft, setResolutionNoteDraft] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const canModerate = currentStaff.role === 'OWNER' || currentStaff.role === 'ADMIN' || currentStaff.role === 'MODERATOR';

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllReports();
      setReports(data);
    } catch (err) {
      console.warn('Failed to load moderation reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    if (newStatus === 'RESOLVED' || newStatus === 'DISMISSED') {
      const actionName = newStatus === 'RESOLVED' ? 'resolve' : 'dismiss';
      if (!window.confirm(`Are you sure you want to mark this report as ${actionName.toUpperCase()}?`)) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      await adminService.updateReportStatus(
        { uid: currentStaff.uid, email: currentStaff.email, role: currentStaff.role },
        reportId,
        newStatus,
        resolutionNoteDraft
      );

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: newStatus,
                resolutionNotes: resolutionNoteDraft || r.resolutionNotes,
                resolvedBy: currentStaff.uid,
                resolvedAt: new Date().toISOString(),
              }
            : r
        )
      );

      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                resolutionNotes: resolutionNoteDraft || prev.resolutionNotes,
                resolvedBy: currentStaff.uid,
                resolvedAt: new Date().toISOString(),
              }
            : null
        );
      }

      setActionSuccessMessage(`Report updated to ${newStatus}`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
      setResolutionNoteDraft('');
      onRefreshMetrics();
    } catch (err) {
      console.error('Failed to update report status:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    // Status tab filter
    if (activeStatusTab !== 'ALL') {
      if (activeStatusTab === 'OPEN' && report.status !== 'OPEN') return false;
      if (activeStatusTab === 'IN_REVIEW' && report.status !== 'IN_REVIEW') return false;
      if (activeStatusTab === 'RESOLVED' && report.status !== 'RESOLVED' && report.status !== 'DISMISSED') return false;
    }

    // Severity filter
    if (severityFilter !== 'ALL' && report.severity !== severityFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReason = (report.reason || '').toLowerCase().includes(q);
      const matchReporter = (report.reporterName || '').toLowerCase().includes(q);
      const matchTarget = (report.targetTitle || report.targetSnippet || '').toLowerCase().includes(q);
      const matchReported = (report.reportedUserName || '').toLowerCase().includes(q);
      if (!matchReason && !matchReporter && !matchTarget && !matchReported) return false;
    }

    return true;
  });

  const getSeverityBadge = (sev: ReportSeverity) => {
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

  const getStatusBadge = (st: ReportStatus) => {
    switch (st) {
      case 'OPEN':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'IN_REVIEW':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      case 'RESOLVED':
        return 'bg-[#D4FF3F]/10 border-[#D4FF3F]/30 text-[#D4FF3F]';
      case 'DISMISSED':
        return 'bg-neutral-800 border-neutral-700 text-neutral-400';
      default:
        return 'bg-neutral-800 border-neutral-700 text-neutral-400';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
            Reports & Content Moderation Queue
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Review community incident reports, flagged content, and user conduct inquiries.
          </p>
        </div>

        <button
          onClick={loadReports}
          className="px-3.5 py-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#F5F5F0] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[#D4FF3F] text-xs font-mono-code flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F5F5F0]/10 pb-4">
        {/* Status Subtabs */}
        <div className="flex bg-[#0E0E12] border border-[#22222A] p-1 self-start sm:self-auto">
          {(['OPEN', 'IN_REVIEW', 'RESOLVED', 'ALL'] as const).map((tab) => {
            const count =
              tab === 'ALL'
                ? reports.length
                : tab === 'RESOLVED'
                ? reports.filter((r) => r.status === 'RESOLVED' || r.status === 'DISMISSED').length
                : reports.filter((r) => r.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveStatusTab(tab)}
                className={`px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeStatusTab === tab
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                    : 'text-[#969696] hover:text-[#F5F5F0]'
                }`}
              >
                <span>{tab.replace('_', ' ')}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-sm ${activeStatusTab === tab ? 'bg-[#080808]/20 text-[#080808]' : 'bg-[#14141A] text-[#64646E]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Severity Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#64646E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or authors..."
              className="w-full bg-[#0E0E12] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] pl-8 pr-3 py-1.5 outline-none placeholder-[#555560]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#0E0E12] border border-[#262630] px-2.5 py-1 text-xs font-mono-code text-[#969696]">
            <Filter className="w-3 h-3 text-[#64646E]" />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-[#F5F5F0] outline-none cursor-pointer"
            >
              <option value="ALL">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List & Detail View */}
      {isLoading ? (
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/10 p-12 text-center text-xs font-mono-code text-[#64646E]">
          Loading moderation queue...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/10 p-12 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#D4FF3F] mx-auto" />
          <h3 className="text-sm font-mono-code text-[#F5F5F0] font-bold uppercase tracking-wider">
            No Reports
          </h3>
          <p className="text-xs font-sans-clean text-[#969696]">
            Nothing currently requires moderation in this view.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports Column (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            {filteredReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report);
                    setResolutionNoteDraft(report.resolutionNotes || '');
                  }}
                  className={`bg-[#0E0E12] border p-4 sm:p-5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#D4FF3F] bg-[#121217]'
                      : 'border-[#F5F5F0]/15 hover:border-[#F5F5F0]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-mono-code font-bold uppercase px-2 py-0.5 border ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                        <span className={`text-[9px] font-mono-code font-bold uppercase px-2 py-0.5 border ${getSeverityBadge(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className="text-[10px] font-mono-code text-[#D4FF3F] bg-[#D4FF3F]/5 border border-[#D4FF3F]/20 px-1.5 py-0.5 uppercase">
                          {report.targetType}
                        </span>
                        <span className="text-[11px] font-mono-code text-[#64646E]">
                          {new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-sm font-sans-clean font-medium text-[#F5F5F0]">
                        {report.reason}
                      </h4>

                      {report.targetSnippet && (
                        <p className="text-xs font-sans-clean text-[#969696] line-clamp-2 bg-[#08080A] p-2 border border-[#22222A] italic">
                          "{report.targetSnippet}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono-code text-[#64646E] pt-1">
                        <span>Reporter: <strong className="text-[#F5F5F0] font-normal">{report.reporterName}</strong></span>
                        {report.reportedUserName && (
                          <span>Reported: <strong className="text-amber-400 font-normal">{report.reportedUserName}</strong></span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${isSelected ? 'text-[#D4FF3F] translate-x-1' : 'text-[#64646E]'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Inspection & Action Drawer (1 col) */}
          <div className="space-y-4">
            {selectedReport ? (
              <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 space-y-5 sticky top-20">
                <div className="flex items-center justify-between border-b border-[#F5F5F0]/10 pb-3">
                  <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#D4FF3F]" />
                    <span>Report Inspection</span>
                  </h3>
                  <span className={`text-[9px] font-mono-code font-bold uppercase px-2 py-0.5 border ${getStatusBadge(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>

                <div className="space-y-3 text-xs font-mono-code">
                  <div>
                    <span className="text-[#64646E] uppercase block text-[10px]">Reason:</span>
                    <span className="text-[#F5F5F0] font-sans-clean text-sm font-medium">{selectedReport.reason}</span>
                  </div>

                  <div>
                    <span className="text-[#64646E] uppercase block text-[10px]">Target Type:</span>
                    <span className="text-[#D4FF3F]">{selectedReport.targetType} (#{selectedReport.targetId})</span>
                  </div>

                  {selectedReport.targetSnippet && (
                    <div>
                      <span className="text-[#64646E] uppercase block text-[10px] mb-1">Reported Snippet:</span>
                      <div className="bg-[#08080A] border border-[#22222A] p-2.5 text-xs text-[#F5F5F0] font-sans-clean leading-relaxed">
                        {selectedReport.targetSnippet}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F5F5F0]/10">
                    <div>
                      <span className="text-[#64646E] uppercase block text-[10px]">Reporter:</span>
                      <span className="text-[#F5F5F0]">{selectedReport.reporterName}</span>
                      {selectedReport.reporterEmail && (
                        <span className="text-[10px] text-[#64646E] block truncate">{selectedReport.reporterEmail}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#64646E] uppercase block text-[10px]">Reported User:</span>
                      <span className="text-amber-400">{selectedReport.reportedUserName || 'Unknown'}</span>
                    </div>
                  </div>

                  {selectedReport.details && (
                    <div>
                      <span className="text-[#64646E] uppercase block text-[10px]">Additional Details:</span>
                      <p className="text-xs text-[#969696] font-sans-clean">{selectedReport.details}</p>
                    </div>
                  )}
                </div>

                {/* Resolution Notes & Actions */}
                {canModerate && (
                  <div className="space-y-3 pt-3 border-t border-[#F5F5F0]/10">
                    <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#969696]">
                      Resolution / Investigation Notes
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNoteDraft}
                      onChange={(e) => setResolutionNoteDraft(e.target.value)}
                      placeholder="Add moderation notes or rationale before updating status..."
                      className="w-full bg-[#08080A] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2.5 outline-none resize-none placeholder-[#555560]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(selectedReport.id, 'IN_REVIEW')}
                        disabled={isProcessing || selectedReport.status === 'IN_REVIEW'}
                        className="px-2.5 py-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-sky-400 transition-colors disabled:opacity-40"
                      >
                        In Review
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
                        disabled={isProcessing || selectedReport.status === 'RESOLVED'}
                        className="px-2.5 py-2 bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
                      >
                        Resolve
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(selectedReport.id, 'DISMISSED')}
                        disabled={isProcessing || selectedReport.status === 'DISMISSED'}
                        className="px-2.5 py-2 bg-[#14141A] hover:bg-neutral-800 border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-neutral-400 transition-colors disabled:opacity-40"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-8 text-center space-y-2">
                <Eye className="w-6 h-6 text-[#64646E] mx-auto" />
                <h4 className="text-xs font-mono-code text-[#F5F5F0] uppercase tracking-wider">
                  Select a Report
                </h4>
                <p className="text-xs font-sans-clean text-[#969696]">
                  Click any incident report from the queue to inspect details and take administrative action.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
