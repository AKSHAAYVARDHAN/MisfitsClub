import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  History, 
  Clock, 
  RefreshCw, 
  User, 
  Tag, 
  Search, 
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { AuditLogItem, StaffMember } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminAuditTabProps {
  currentStaff: StaffMember;
}

export const AdminAuditTab: React.FC<AdminAuditTabProps> = ({ currentStaff }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAuditLogs(150);
      setLogs(data);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionCategories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      const prefix = l.action.split('_')[0];
      if (prefix) set.add(prefix);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'ALL') {
        if (!log.action.startsWith(actionFilter)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesActor = (log.actorEmail || log.actorId).toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDetails = (log.details || '').toLowerCase().includes(q);
        const matchesTarget = (log.targetType || '').toLowerCase().includes(q);
        if (!matchesActor && !matchesAction && !matchesDetails && !matchesTarget) return false;
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('SUSPEND')) {
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
    if (action.includes('ASSIGN') || action.includes('CREATE') || action.includes('RESOLVE')) {
      return 'text-[#D4FF3F] bg-[#D4FF3F]/10 border-[#D4FF3F]/30';
    }
    if (action.includes('STATUS') || action.includes('UPDATE') || action.includes('REVIEW')) {
      return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
    }
    return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
            Immutable Security & Audit Trail
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Tamper-proof append-only record of all administrative, RBAC mutations, and content moderation actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#F5F5F0] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64646E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, action, target..."
            className="w-full bg-[#0E0E12] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] pl-9 pr-3 py-2 outline-none placeholder-[#555560]"
          />
        </div>

        {actionCategories.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#0E0E12] border border-[#262630] px-3 py-1.5 text-xs font-mono-code text-[#969696]">
            <Filter className="w-3.5 h-3.5 text-[#64646E]" />
            <span>Category:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent text-[#F5F5F0] outline-none cursor-pointer uppercase"
            >
              <option value="ALL">All Actions</option>
              {actionCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table / Cards Container */}
      <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#64646E]">
            Loading audit records from Cloud Firestore...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#969696]">
            No administrative actions match criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-[#121217] border-b border-[#F5F5F0]/10 text-[#969696] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-normal">Timestamp</th>
                    <th className="py-3.5 px-4 font-normal">Actor</th>
                    <th className="py-3.5 px-4 font-normal">Role</th>
                    <th className="py-3.5 px-4 font-normal">Action</th>
                    <th className="py-3.5 px-4 font-normal">Target</th>
                    <th className="py-3.5 px-4 font-normal">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F0]/5 text-[#F5F5F0]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#14141A] transition-colors">
                      <td className="py-3.5 px-4 text-[#64646E] whitespace-nowrap text-[11px]">
                        {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#F5F5F0] whitespace-nowrap">
                        {log.actorEmail || log.actorId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5 uppercase">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#D4FF3F] uppercase text-[10px]">
                        {log.targetType || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[#969696] font-sans-clean text-xs max-w-md truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#F5F5F0]/10">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2 text-xs font-mono-code">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-[#64646E] text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-[#F5F5F0]">{log.actorEmail || log.actorId}</span>
                    <span className="text-[#D4FF3F] uppercase text-[9px]">[{log.actorRole}]</span>
                  </div>

                  {log.details && (
                    <p className="text-xs text-[#969696] font-sans-clean bg-[#08080A] p-2 border border-[#22222A]">
                      {log.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
