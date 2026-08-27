import React, { useState, useEffect } from 'react';
import { Space, PublicProfile } from '../types';
import { spaceService } from '../services/spaceService';
import { RemoveMemberModal } from './RemoveMemberModal';
import { 
  X, 
  Users, 
  UserMinus, 
  Crown, 
  ExternalLink, 
  Loader2, 
  MapPin, 
  GraduationCap, 
  ShieldCheck, 
  Search, 
  AlertCircle,
  Check
} from 'lucide-react';

interface ManageHubMembersModalProps {
  space: Space;
  hostId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: PublicProfile) => void;
  onSpaceUpdated?: (updated: Space) => void;
}

export const ManageHubMembersModal: React.FC<ManageHubMembersModalProps> = ({
  space,
  hostId,
  isOpen,
  onClose,
  onSelectProfile,
  onSpaceUpdated,
}) => {
  const [members, setMembers] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [memberToRemove, setMemberToRemove] = useState<PublicProfile | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = space.ownerId === hostId;

  // Load member profiles
  useEffect(() => {
    if (!isOpen || !space) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadMembers = async () => {
      try {
        const list = await spaceService.getSpaceMembers(space.memberIds || []);
        if (isMounted) {
          setMembers(list);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to load space members:', err);
        if (isMounted) {
          setError('Failed to load member directory.');
          setIsLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, space.id, space.memberIds]);

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.role && m.role.toLowerCase().includes(q)) ||
      (m.college && m.college.toLowerCase().includes(q)) ||
      (m.location && m.location.toLowerCase().includes(q))
    );
  });

  const handleConfirmRemove = async () => {
    if (!memberToRemove || !space || !hostId || !isOwner) return;
    const targetUid = memberToRemove.uid || memberToRemove.id;
    setIsRemoving(true);
    setError(null);

    try {
      const updated = await spaceService.removeMember(space.id, hostId, targetUid);
      setMembers((prev) => prev.filter((m) => (m.uid || m.id) !== targetUid));
      setSuccessMsg(`Removed ${memberToRemove.name} from the Hub.`);
      setMemberToRemove(null);
      onSpaceUpdated?.(updated);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err?.message || 'Failed to remove member.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div
        id="manage-hub-members-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isRemoving) onClose();
        }}
      >
        <div
          id="manage-hub-members-modal"
          className="relative w-full max-w-2xl bg-[#0D0D10] border border-[#26262B] shadow-2xl p-6 sm:p-8 text-left animate-fadeIn max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-[#1E1E24]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#16161C] border border-[#D4FF3F]/40 flex items-center justify-center text-[#D4FF3F] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold block">
                  HUB MANAGEMENT
                </span>
                <h2 className="text-xl sm:text-2xl font-editorial text-[#F2F2ED] font-light truncate max-w-md">
                  {space.name} — Members ({members.length})
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isRemoving}
              className="p-1 text-[#777] hover:text-[#F2F2ED] transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert feedback */}
          {error && (
            <div className="mb-3 p-3 bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono-code flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-3 bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 text-[#D4FF3F] text-xs font-mono-code flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="mb-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name, role, college..."
              className="w-full bg-[#141418] border border-[#26262E] focus:border-[#D4FF3F] pl-9 pr-4 py-2 text-xs font-mono-code text-[#F2F2ED] placeholder-[#666] outline-none"
            />
          </div>

          {/* Member List Container */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar min-h-[220px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#888]">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4FF3F] mb-2" />
                <span className="text-xs font-mono-code uppercase tracking-wider">Loading members...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-8 text-center border border-[#222] bg-[#121214] text-[#888] space-y-2">
                <Users className="w-8 h-8 mx-auto text-[#555]" />
                <p className="text-xs font-mono-code">No members match "{searchQuery}"</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const memberUid = member.uid || member.id;
                const isMemberOwner = memberUid === space.ownerId;

                return (
                  <div
                    key={memberUid}
                    className="p-3.5 bg-[#121215] border border-[#222228] hover:border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    {/* Member Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={member.avatarUrl || member.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover border border-[#333] rounded-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-[#F2F2ED] truncate">
                            {member.name}
                          </h4>
                          {isMemberOwner && (
                            <span className="text-[9px] font-mono-code uppercase bg-[#D4FF3F]/15 text-[#D4FF3F] border border-[#D4FF3F]/40 px-1.5 py-0.2 font-bold inline-flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5" />
                              Host
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8A8A8A] font-mono-code truncate">
                          {member.role || 'Member'}
                          {member.college && ` · ${member.college}`}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfile(member);
                        }}
                        className="px-3 py-1.5 border border-[#333] hover:border-[#666] text-[#8A8A8A] hover:text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Profile</span>
                      </button>

                      {isOwner && !isMemberOwner && (
                        <button
                          type="button"
                          onClick={() => setMemberToRemove(member)}
                          className="px-3 py-1.5 border border-red-900/40 hover:border-red-600/70 text-red-400 hover:text-red-300 text-xs font-mono-code uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                          title="Remove member from Hub"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-[#1E1E24] flex items-center justify-between">
            <span className="text-[11px] font-mono-code text-[#666]">
              {space.memberCount || space.memberIds?.length || 1} active members in this Hub
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#202026] hover:bg-[#2c2c34] text-[#F2F2ED] text-xs font-mono-code uppercase tracking-wider transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Remove Member Confirmation Modal */}
      <RemoveMemberModal
        isOpen={!!memberToRemove}
        space={space}
        member={memberToRemove}
        isProcessing={isRemoving}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
};
