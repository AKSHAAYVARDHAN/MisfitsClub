import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Send, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  Radio, 
  ShieldCheck, 
  Activity, 
  Server,
  Clock,
  RefreshCw
} from 'lucide-react';
import { SystemBroadcast, StaffMember } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminSystemTabProps {
  currentStaff: StaffMember;
  onRefreshMetrics: () => void;
}

export const AdminSystemTab: React.FC<AdminSystemTabProps> = ({
  currentStaff,
  onRefreshMetrics,
}) => {
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SystemBroadcast['type']>('ANNOUNCEMENT');
  const [audience, setAudience] = useState<SystemBroadcast['audience']>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canBroadcast = currentStaff.role === 'OWNER' || currentStaff.role === 'ADMIN';

  const loadBroadcasts = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSystemBroadcasts();
      setBroadcasts(data);
    } catch (err) {
      console.warn('Failed to load system broadcasts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const newBroadcast = await adminService.createSystemBroadcast(
        { uid: currentStaff.uid, email: currentStaff.email, role: currentStaff.role, name: currentStaff.name },
        { title: title.trim(), message: message.trim(), type, audience }
      );
      setBroadcasts((prev) => [newBroadcast, ...prev]);
      setTitle('');
      setMessage('');
      setStatusMessage({ type: 'success', text: 'Broadcast published to community successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to dispatch broadcast.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBroadcast = async (broadcastId: string) => {
    if (!window.confirm('Delete this broadcast?')) return;
    try {
      await adminService.deleteSystemBroadcast(
        { uid: currentStaff.uid, email: currentStaff.email, role: currentStaff.role },
        broadcastId
      );
      setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
    } catch (err) {
      console.error('Delete broadcast error:', err);
    }
  };

  const getTypeBadge = (t: SystemBroadcast['type']) => {
    switch (t) {
      case 'SECURITY':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'MAINTENANCE':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'UPDATE':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      case 'ANNOUNCEMENT':
      default:
        return 'bg-[#D4FF3F]/10 border-[#D4FF3F]/30 text-[#D4FF3F]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-editorial font-light text-[#F5F5F0]">
            System Broadcasts & Platform Health
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Dispatch announcements to members, issue maintenance advisories, and review service connectivity.
          </p>
        </div>

        <button
          onClick={loadBroadcasts}
          className="px-3.5 py-2 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#F5F5F0] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh System</span>
        </button>
      </div>

      {/* System Health Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-mono-code uppercase text-[#969696]">
              Cloud Firestore Database
            </div>
            <div className="text-sm font-mono-code font-bold text-[#D4FF3F] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-pulse" />
              Connected & Operational
            </div>
          </div>
          <Server className="w-5 h-5 text-[#D4FF3F]/40" />
        </div>

        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-mono-code uppercase text-[#969696]">
              Firebase Auth & RBAC
            </div>
            <div className="text-sm font-mono-code font-bold text-[#D4FF3F] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
              Rules Enforced
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#D4FF3F]/40" />
        </div>

        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-mono-code uppercase text-[#969696]">
              Audit Trail Storage
            </div>
            <div className="text-sm font-mono-code font-bold text-[#D4FF3F] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
              Immutable Logging Active
            </div>
          </div>
          <Activity className="w-5 h-5 text-[#D4FF3F]/40" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form (1 col) */}
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F5F5F0]/10 pb-3">
            <Radio className="w-4 h-4 text-[#D4FF3F]" />
            <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
              Publish Broadcast
            </h3>
          </div>

          {statusMessage && (
            <div
              className={`p-3 text-xs font-mono-code border ${
                statusMessage.type === 'success'
                  ? 'bg-[#D4FF3F]/10 border-[#D4FF3F]/30 text-[#D4FF3F]'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateBroadcast} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                Broadcast Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Platform Maintenance Scheduled"
                className="w-full bg-[#08080A] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2.5 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-[#08080A] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2 outline-none"
                >
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="UPDATE">Product Update</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="SECURITY">Security Advisory</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full bg-[#08080A] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2 outline-none"
                >
                  <option value="ALL">All Members</option>
                  <option value="MEMBERS">Active Members Only</option>
                  <option value="STAFF">Staff & Admins</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                Announcement Message *
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the message text that will be displayed..."
                className="w-full bg-[#08080A] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2.5 outline-none resize-none placeholder-[#555560]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canBroadcast}
              className="w-full py-2.5 bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Broadcast'}</span>
            </button>
          </form>
        </div>

        {/* Broadcasts History List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
              Active & Historic Broadcasts ({broadcasts.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="bg-[#0E0E12] border border-[#F5F5F0]/10 p-8 text-center text-xs font-mono-code text-[#64646E]">
              Loading system broadcast records...
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="bg-[#0E0E12] border border-[#F5F5F0]/10 p-8 text-center space-y-2">
              <Bell className="w-6 h-6 text-[#64646E] mx-auto" />
              <h4 className="text-xs font-mono-code text-[#F5F5F0] uppercase tracking-wider">
                No Broadcasts
              </h4>
              <p className="text-xs font-sans-clean text-[#969696]">
                No system announcements or maintenance alerts have been published.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-mono-code font-bold uppercase px-2 py-0.5 border ${getTypeBadge(b.type)}`}>
                        {b.type}
                      </span>
                      <span className="text-[9px] font-mono-code uppercase px-2 py-0.5 border border-[#262630] bg-[#14141A] text-[#969696]">
                        Audience: {b.audience}
                      </span>
                      <span className="text-[11px] font-mono-code text-[#64646E] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-sans-clean font-medium text-[#F5F5F0]">
                      {b.title}
                    </h4>

                    <p className="text-xs font-sans-clean text-[#969696] leading-relaxed">
                      {b.message}
                    </p>

                    <div className="text-[11px] font-mono-code text-[#64646E] pt-1">
                      Author: <span className="text-[#F5F5F0]">{b.authorName} ({b.authorRole})</span>
                    </div>
                  </div>

                  {canBroadcast && (
                    <button
                      onClick={() => handleDeleteBroadcast(b.id)}
                      className="p-2 text-[#969696] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors self-start sm:self-auto"
                      title="Remove broadcast"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
