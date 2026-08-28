import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Shield, 
  Settings,
  Lock,
  Sliders,
  Bell,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { AdminRole, StaffMember, UserProfile } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminSettingsTabProps {
  staffList: StaffMember[];
  currentStaff: StaffMember;
  currentUser: UserProfile;
  onRefresh: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  staffList,
  currentStaff,
  currentUser,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rbac' | 'policies'>('rbac');
  
  // RBAC State
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('MODERATOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Policy Settings State (backed by state/localStorage for persistence without schema disruption)
  const [autoFlagSpam, setAutoFlagSpam] = useState(() => {
    return localStorage.getItem('misfits_admin_policy_spam') !== 'false';
  });
  const [requireOnboardingVerification, setRequireOnboardingVerification] = useState(() => {
    return localStorage.getItem('misfits_admin_policy_onboarding') !== 'false';
  });
  const [triageNotifyEmail, setTriageNotifyEmail] = useState(() => {
    return localStorage.getItem('misfits_admin_policy_email') || 'admin@misfits.club';
  });
  const [policySaved, setPolicySaved] = useState(false);

  const isOwner = currentStaff.role === 'OWNER';

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatusMessage({ type: 'error', text: 'Email is required.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const generatedUid = uid.trim() || `staff_${Date.now()}`;

    try {
      await adminService.assignStaffRole(
        { uid: currentStaff.uid, email: currentStaff.email, role: currentStaff.role },
        {
          uid: generatedUid,
          email: email.trim(),
          name: name.trim() || email.split('@')[0],
          role,
          status: 'active',
        }
      );

      setStatusMessage({ type: 'success', text: `Assigned role ${role} to ${email}.` });
      setEmail('');
      setUid('');
      setName('');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to assign role. Verification error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeRole = async (staff: StaffMember) => {
    if (!window.confirm(`Revoke all administrative access for ${staff.email}?`)) {
      return;
    }

    try {
      await adminService.revokeStaffRole(
        { uid: currentStaff.uid, email: currentStaff.email, role: currentStaff.role },
        staff.uid,
        staff.email
      );
      setStatusMessage({ type: 'success', text: `Revoked privileges for ${staff.email}.` });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to revoke staff role.' });
    }
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('misfits_admin_policy_spam', autoFlagSpam.toString());
    localStorage.setItem('misfits_admin_policy_onboarding', requireOnboardingVerification.toString());
    localStorage.setItem('misfits_admin_policy_email', triageNotifyEmail);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 3000);
  };

  const getRoleBadge = (r: AdminRole) => {
    switch (r) {
      case 'OWNER':
        return 'bg-[#D4FF3F]/15 border-[#D4FF3F]/40 text-[#D4FF3F]';
      case 'ADMIN':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-400';
      case 'MODERATOR':
        return 'bg-sky-500/15 border-sky-500/40 text-sky-400';
      case 'SUPPORT':
        return 'bg-purple-500/15 border-purple-500/40 text-purple-400';
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
            Admin Settings & Staff Access Control
          </h2>
          <p className="text-xs text-[#969696] font-sans-clean mt-1">
            Manage authorized staff roles, RBAC permissions, and operational platform guidelines.
          </p>
        </div>

        <div className="flex bg-[#0E0E12] border border-[#22222A] p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('rbac')}
            className={`px-4 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-2 ${
              activeSubTab === 'rbac'
                ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff & RBAC ({staffList.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-4 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-colors flex items-center gap-2 ${
              activeSubTab === 'policies'
                ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Platform Policies</span>
          </button>
        </div>
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

      {activeSubTab === 'rbac' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
              Staff Member Registry (Cloud Firestore adminRoles)
            </h3>

            {isOwner && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
            )}
          </div>

          {/* Staff Table */}
          <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-[#121217] border-b border-[#F5F5F0]/10 text-[#969696] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-normal">Team Member</th>
                    <th className="py-3.5 px-4 font-normal">Assigned Role</th>
                    <th className="py-3.5 px-4 font-normal">Status</th>
                    <th className="py-3.5 px-4 font-normal">Assigned Date</th>
                    <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F0]/5 text-[#F5F5F0]">
                  {staffList.map((member) => (
                    <tr key={member.uid} className="hover:bg-[#14141A] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-sans-clean font-medium text-sm text-[#F5F5F0]">
                          {member.name || 'Staff Member'}
                        </div>
                        <div className="text-[11px] text-[#969696]">{member.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'active' ? 'bg-[#D4FF3F]' : 'bg-red-400'
                            }`}
                          />
                          <span className="uppercase text-[#969696]">{member.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64646E] text-[11px]">
                        {new Date(member.assignedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isOwner && member.uid !== currentStaff.uid ? (
                          <button
                            onClick={() => handleRevokeRole(member)}
                            className="p-1.5 text-[#969696] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                            title="Revoke access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#64646E] uppercase">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Platform Policies Tab */
        <div className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-6 max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#F5F5F0]/10 pb-3">
            <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
              Community Moderation & Operational Policies
            </h3>
            {policySaved && (
              <span className="text-xs font-mono-code text-[#D4FF3F] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSavePolicies} className="space-y-5">
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFlagSpam}
                  onChange={(e) => setAutoFlagSpam(e.target.checked)}
                  className="mt-1 accent-[#D4FF3F]"
                />
                <div>
                  <span className="text-xs font-mono-code text-[#F5F5F0] block font-bold">
                    Automated Content Quality Heuristics
                  </span>
                  <span className="text-xs text-[#969696] font-sans-clean">
                    Automatically queue sparks containing commercial links or repetitive keywords for admin review.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireOnboardingVerification}
                  onChange={(e) => setRequireOnboardingVerification(e.target.checked)}
                  className="mt-1 accent-[#D4FF3F]"
                />
                <div>
                  <span className="text-xs font-mono-code text-[#F5F5F0] block font-bold">
                    Require Onboarding Profile Completion
                  </span>
                  <span className="text-xs text-[#969696] font-sans-clean">
                    Only allow members with completed bios, skills, and questions to post public sparks.
                  </span>
                </div>
              </label>

              <div className="pt-2">
                <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                  Triage & Feedback Notification Email
                </label>
                <input
                  type="email"
                  value={triageNotifyEmail}
                  onChange={(e) => setTriageNotifyEmail(e.target.value)}
                  className="w-full bg-[#08080A] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2.5 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider hover:bg-[#C2EB2E] transition-colors"
            >
              Save Policy Preferences
            </button>
          </form>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080A]/85 backdrop-blur-sm">
          <div className="bg-[#0E0E12] border border-[#F5F5F0]/20 p-6 max-w-md w-full shadow-2xl text-[#F5F5F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F5F5F0]/10 pb-3">
              <h3 className="font-editorial text-xl font-light text-[#F5F5F0]">
                Assign Staff Privileges
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#969696] hover:text-[#F5F5F0] text-xs font-mono-code uppercase"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="team@domain.com"
                  className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#969696] mb-1">
                  Assign Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] p-2.5 outline-none"
                >
                  <option value="ADMIN">ADMIN (Full management)</option>
                  <option value="MODERATOR">MODERATOR (Sparks & Spaces)</option>
                  <option value="SUPPORT">SUPPORT (Feedback & Inquiries)</option>
                  <option value="OWNER">OWNER (Full Root)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F5F5F0]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-mono-code uppercase text-[#969696] hover:text-[#F5F5F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider hover:bg-[#C2EB2E] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Authorize Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
