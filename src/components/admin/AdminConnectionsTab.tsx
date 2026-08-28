import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw, 
  ArrowRight, 
  Shield, 
  Activity,
  Users
} from 'lucide-react';
import { AdminConnectionItem, StaffMember } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminConnectionsTabProps {
  currentStaff: StaffMember;
  onRefreshMetrics: () => void;
}

export const AdminConnectionsTab: React.FC<AdminConnectionsTabProps> = ({
  currentStaff,
  onRefreshMetrics,
}) => {
  const [connections, setConnections] = useState<AdminConnectionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'pending' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllConnections();
      setConnections(data);
    } catch (err) {
      console.warn('Failed to load connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const filteredConnections = connections.filter((conn) => {
    if (statusFilter !== 'all' && conn.status !== statusFilter) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (conn.requesterName || '').toLowerCase().includes(q) ||
      (conn.targetName || '').toLowerCase().includes(q) ||
      (conn.introNote || '').toLowerCase().includes(q)
    );
  });

  const totalConnected = connections.filter((c) => c.status === 'connected').length;
  const totalPending = connections.filter((c) => c.status === 'pending').length;
  const totalDeclined = connections.filter((c) => c.status === 'declined').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-[#D4FF3F]/10 border-[#D4FF3F]/30 text-[#D4FF3F]';
      case 'pending':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'declined':
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
            Platform Connections & Network Graph
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Monitor community network health, introductions, and collaborative connection requests.
          </p>
        </div>

        <button
          onClick={loadConnections}
          className="px-3.5 py-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#F5F5F0] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Graph</span>
        </button>
      </div>

      {/* Network Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-code uppercase text-[#969696]">
              Accepted Connections
            </div>
            <div className="text-2xl font-editorial text-[#D4FF3F] font-light">
              {totalConnected}
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-[#D4FF3F]/40" />
        </div>

        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-code uppercase text-[#969696]">
              Pending Requests
            </div>
            <div className="text-2xl font-editorial text-amber-400 font-light">
              {totalPending}
            </div>
          </div>
          <Clock className="w-6 h-6 text-amber-400/40" />
        </div>

        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-code uppercase text-[#969696]">
              Total Relationship Links
            </div>
            <div className="text-2xl font-editorial text-[#F5F5F0] font-light">
              {connections.length}
            </div>
          </div>
          <Share2 className="w-6 h-6 text-[#64646E]" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex bg-[#0E0E12] border border-[#22222A] p-1 self-start sm:self-auto">
          {(['all', 'connected', 'pending', 'declined'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#64646E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by member name or note..."
            className="w-full bg-[#0E0E12] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] pl-8 pr-3 py-2 outline-none placeholder-[#555560]"
          />
        </div>
      </div>

      {/* Connections Table & Mobile Cards */}
      <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#64646E]">
            Loading network connections from Cloud Firestore...
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono-code text-[#969696]">
            No connections found matching criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-[#121217] border-b border-[#F5F5F0]/10 text-[#969696] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-normal">Requester</th>
                    <th className="py-3.5 px-2 font-normal text-center">Direction</th>
                    <th className="py-3.5 px-4 font-normal">Target Member</th>
                    <th className="py-3.5 px-4 font-normal">Status</th>
                    <th className="py-3.5 px-4 font-normal">Intro Note</th>
                    <th className="py-3.5 px-4 font-normal text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F0]/5 text-[#F5F5F0]">
                  {filteredConnections.map((conn) => (
                    <tr key={conn.id} className="hover:bg-[#14141A] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-sans-clean font-medium text-sm text-[#F5F5F0]">
                          {conn.requesterName}
                        </div>
                        {conn.requesterRole && (
                          <div className="text-[10px] text-[#969696]">{conn.requesterRole}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-2 text-center">
                        <ArrowRight className="w-3.5 h-3.5 text-[#64646E] mx-auto" />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-sans-clean font-medium text-sm text-[#F5F5F0]">
                          {conn.targetName}
                        </div>
                        {conn.targetRole && (
                          <div className="text-[10px] text-[#969696]">{conn.targetRole}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${getStatusBadge(conn.status)}`}>
                          {conn.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#969696] font-sans-clean text-xs max-w-xs truncate">
                        {conn.introNote || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right text-[#64646E] text-[11px] whitespace-nowrap">
                        {conn.createdAt ? new Date(conn.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-[#F5F5F0]/10">
              {filteredConnections.map((conn) => (
                <div key={conn.id} className="p-4 space-y-2.5 text-xs font-mono-code">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${getStatusBadge(conn.status)}`}>
                      {conn.status}
                    </span>
                    <span className="text-[#64646E] text-[11px]">
                      {conn.createdAt ? new Date(conn.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 font-sans-clean">
                    <div className="font-medium text-[#F5F5F0]">
                      {conn.requesterName}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64646E] shrink-0" />
                    <div className="font-medium text-[#D4FF3F]">
                      {conn.targetName}
                    </div>
                  </div>

                  {conn.introNote && (
                    <div className="text-xs text-[#969696] font-sans-clean bg-[#08080A] p-2 border border-[#22222A]">
                      "{conn.introNote}"
                    </div>
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
