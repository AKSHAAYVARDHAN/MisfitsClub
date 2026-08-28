import React, { useState, useEffect } from 'react';
import { ShieldCheck, History, Clock, RefreshCw, User, Tag } from 'lucide-react';
import { AuditLogItem, StaffMember } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminAuditTabProps {
  currentStaff: StaffMember;
}

export const AdminAuditTab: React.FC<AdminAuditTabProps> = ({ currentStaff }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAuditLogs(100);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
            Immutable Security & Audit Trail
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Tamper-proof append-only record of all administrative and RBAC mutations.
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

      <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#64646E]">
            Loading audit records from Firestore...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#969696]">
            No administrative actions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead className="bg-[#121217] border-b border-[#F5F5F0]/10 text-[#969696] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-normal">Timestamp</th>
                  <th className="py-3.5 px-4 font-normal">Actor</th>
                  <th className="py-3.5 px-4 font-normal">Role</th>
                  <th className="py-3.5 px-4 font-normal">Action</th>
                  <th className="py-3.5 px-4 font-normal">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F0]/5 text-[#F5F5F0]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#14141A] transition-colors">
                    <td className="py-3.5 px-4 text-[#64646E] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#F5F5F0] whitespace-nowrap">
                      {log.actorEmail || log.actorId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2 py-0.5 uppercase">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-amber-400">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-[#969696] font-sans-clean text-xs max-w-md truncate">
                      {log.details || log.targetType || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
