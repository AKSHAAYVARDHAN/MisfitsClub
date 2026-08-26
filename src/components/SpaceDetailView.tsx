import React, { useState, useEffect } from 'react';
import { Space, UserProfile, PublicProfile } from '../types';
import { spaceService } from '../services/spaceService';
import { DiscussionFeed } from './DiscussionFeed';
import { EditSpaceModal } from './EditSpaceModal';
import { RemoveMemberModal } from './RemoveMemberModal';
import { 
  ArrowLeft, 
  Users, 
  ShieldCheck, 
  Check, 
  Share2, 
  Calendar, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Edit3,
  UserMinus,
  Settings
} from 'lucide-react';

interface SpaceDetailViewProps {
  spaceId: string;
  initialSpace?: Space | null;
  currentUser: UserProfile | null;
  onBack: () => void;
  onSelectMember: (member: PublicProfile) => void;
  onStartMessage?: (recipientUid: string) => void;
}

export const SpaceDetailView: React.FC<SpaceDetailViewProps> = ({
  spaceId,
  initialSpace,
  currentUser,
  onBack,
  onSelectMember,
  onStartMessage,
}) => {
  const [space, setSpace] = useState<Space | null>(initialSpace || null);
  const [members, setMembers] = useState<PublicProfile[]>([]);
  const [isLoadingSpace, setIsLoadingSpace] = useState(!initialSpace);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussion' | 'members'>('discussion');

  // Host Management Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<PublicProfile | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const currentUserId = currentUser?.uid || currentUser?.id;
  const isOwner = currentUserId && space?.ownerId === currentUserId;
  const isMember = currentUserId && (space?.memberIds?.includes(currentUserId) || isOwner);

  // Subscribe to live space updates
  useEffect(() => {
    setIsLoadingSpace(true);
    const unsubscribe = spaceService.subscribeSpace(spaceId, (updatedSpace) => {
      setSpace(updatedSpace);
      setIsLoadingSpace(false);
    });

    return () => unsubscribe();
  }, [spaceId]);

  // Load member public profiles whenever memberIds change
  useEffect(() => {
    if (!space?.memberIds) return;

    let isMounted = true;
    setIsLoadingMembers(true);

    spaceService.getSpaceMembers(space.memberIds).then((profiles) => {
      if (isMounted) {
        setMembers(profiles);
        setIsLoadingMembers(false);
      }
    }).catch((err) => {
      console.warn('Failed to load space members:', err);
      if (isMounted) setIsLoadingMembers(false);
    });

    return () => {
      isMounted = false;
    };
  }, [space?.memberIds]);

  const handleJoin = async () => {
    if (!currentUserId || !space) return;
    setIsProcessingAction(true);
    setActionError(null);

    try {
      const updated = await spaceService.joinSpace(space.id, currentUserId);
      setSpace(updated);
    } catch (err: any) {
      console.error('Failed to join space:', err);
      setActionError(err?.message || 'Failed to join space.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId || !space || isOwner) return;
    setIsProcessingAction(true);
    setActionError(null);

    try {
      const updated = await spaceService.leaveSpace(space.id, currentUserId);
      setSpace(updated);
    } catch (err: any) {
      console.error('Failed to leave space:', err);
      setActionError(err?.message || 'Failed to leave space.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !space || !currentUserId || !isOwner) return;
    const targetUid = memberToRemove.uid || memberToRemove.id;
    setIsRemovingMember(true);
    setActionError(null);

    try {
      const updated = await spaceService.removeMember(space.id, currentUserId, targetUid);
      setSpace(updated);
      setMembers((prev) => prev.filter((m) => (m.uid || m.id) !== targetUid));
      setSuccessBanner(`Removed ${memberToRemove.name} from the Hub.`);
      setMemberToRemove(null);
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setActionError(err?.message || 'Failed to remove member.');
    } finally {
      setIsRemovingMember(false);
    }
  };

  if (isLoadingSpace && !space) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4FF3F] mb-4" />
        <p className="font-mono-code text-xs text-[#8A8A8A] uppercase tracking-wider">
          Loading Hub details...
        </p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-[#FF5555] mx-auto mb-3" />
        <h2 className="text-xl font-bold font-mono-code text-[#F5F5F0] mb-2">
          Hub Not Found
        </h2>
        <p className="text-sm text-[#888] mb-6">
          This Hub may have been archived or removed by its host.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#1A1A1E] border border-[#333] text-[#F5F5F0] font-mono-code text-xs hover:border-[#D4FF3F] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hubs
        </button>
      </div>
    );
  }

  const formattedDate = space.createdAt
    ? new Date(space.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div id="space-detail-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          id="space-detail-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#121215] hover:bg-[#1C1C20] border border-[#26262B] hover:border-[#D4FF3F]/50 text-xs font-mono-code text-[#A0A09A] hover:text-[#F5F5F0] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Hubs
        </button>

        <div className="flex items-center gap-2">
          {/* Host Edit Hub Button */}
          {isOwner && (
            <button
              id="space-detail-edit-hub-btn"
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141418] hover:bg-[#1E1E24] border border-[#D4FF3F]/40 hover:border-[#D4FF3F] text-xs font-mono-code text-[#D4FF3F] transition-all shadow-sm"
              title="Edit Hub Settings and Details"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Hub</span>
            </button>
          )}

          <button
            id="space-detail-share-btn"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#121215] hover:bg-[#1C1C20] border border-[#26262B] text-xs font-mono-code text-[#A0A09A] hover:text-[#D4FF3F] transition-all"
            title="Copy Hub Link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span className="text-[#D4FF3F]">Copied Link</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mb-6 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono-code flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {successBanner && (
        <div className="mb-6 p-3 bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 text-[#D4FF3F] text-xs font-mono-code flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Space Hero Banner */}
      <div className="bg-[#0D0D10] border border-[#F5F5F0]/15 p-6 sm:p-8 mb-8 relative overflow-hidden">
        {/* Subtle grid pattern background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4FF3F]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          {/* Header Row: Category, Photo, and Founded Date */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {space.profilePhoto && (
              <img
                src={space.profilePhoto}
                alt={space.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 object-cover border border-[#D4FF3F]/40 shadow-sm"
              />
            )}
            <span className="px-3 py-1 text-xs font-mono-code font-bold uppercase tracking-wider bg-[#D4FF3F] text-[#080808]">
              {space.category}
            </span>
            <span className="px-2.5 py-1 text-[11px] font-mono-code text-[#8A8A8A] bg-[#16161A] border border-[#2A2A30]">
              PUBLIC HUB
            </span>
            <div className="flex items-center gap-1 text-xs font-mono-code text-[#888] ml-auto">
              <Calendar className="w-3.5 h-3.5 text-[#666]" />
              <span>Founded {formattedDate}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-sans-clean text-[#F5F5F0] tracking-tight mb-4">
            {space.name}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#B5B5B0] leading-relaxed max-w-4xl mb-6 font-sans-clean whitespace-pre-line">
            {space.description}
          </p>

          {/* Tags */}
          {space.tags && space.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {space.tags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="px-2.5 py-1 bg-[#141418] border border-[#282830] text-[#D4FF3F] text-xs font-mono-code"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action & Stats Footer */}
          <div className="pt-6 border-t border-[#202026] flex flex-wrap items-center justify-between gap-4">
            {/* Host Snippet */}
            <div className="flex items-center gap-3">
              <img
                src={space.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                alt={space.ownerName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-none object-cover border border-[#444]"
              />
              <div>
                <p className="text-xs font-mono-code text-[#777]">
                  Hub Host & Founder
                </p>
                <p className="text-sm font-mono-code font-bold text-[#F5F5F0]">
                  {space.ownerName}{' '}
                  {space.ownerRole && (
                    <span className="text-xs text-[#8A8A8A] font-normal">
                      • {space.ownerRole}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Membership Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#141418] border border-[#26262D]">
                <Users className="w-4 h-4 text-[#D4FF3F]" />
                <span className="text-xs font-mono-code font-bold text-[#F5F5F0]">
                  {space.memberCount || space.memberIds?.length || 1} Misfits Joined
                </span>
              </div>

              {isOwner ? (
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4FF3F]/15 border border-[#D4FF3F]/40 text-[#D4FF3F] text-xs font-mono-code font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    You are the Host
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-[#1A1A20] hover:bg-[#25252D] border border-[#333] hover:border-[#D4FF3F] text-xs font-mono-code text-[#F5F5F0] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#D4FF3F]" />
                    Edit
                  </button>
                </div>
              ) : isMember ? (
                <button
                  id="space-detail-leave-btn"
                  onClick={handleLeave}
                  disabled={isProcessingAction}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1A20] hover:bg-red-950/40 border border-[#333] hover:border-red-800 text-[#D4FF3F] hover:text-red-400 text-xs font-mono-code font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isProcessingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Joined (Click to Leave)
                    </>
                  )}
                </button>
              ) : (
                <button
                  id="space-detail-join-btn"
                  onClick={handleJoin}
                  disabled={isProcessingAction || !currentUserId}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider shadow-lg transition-all disabled:opacity-50"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Join Hub
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Space Internal Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-[#202028]">
        <button
          id="space-tab-discussion"
          type="button"
          onClick={() => setActiveTab('discussion')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono-code font-bold uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
            activeTab === 'discussion'
              ? 'border-[#D4FF3F] text-[#D4FF3F] bg-[#121216]'
              : 'border-transparent text-[#777] hover:text-[#BBB] hover:bg-[#0E0E12]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discussion</span>
        </button>

        <button
          id="space-tab-members"
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono-code font-bold uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
            activeTab === 'members'
              ? 'border-[#D4FF3F] text-[#D4FF3F] bg-[#121216]'
              : 'border-transparent text-[#777] hover:text-[#BBB] hover:bg-[#0E0E12]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members ({members.length || space.memberCount || 1})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'discussion' ? (
        <div id="space-tab-content-discussion" className="mb-12">
          <DiscussionFeed
            spaceId={space.id}
            spaceOwnerId={space.ownerId}
            currentUser={currentUser}
            isMember={Boolean(isMember)}
            onSelectAuthor={onSelectMember}
            onPromptJoin={handleJoin}
          />
        </div>
      ) : (
        /* Members Gathering Section */
        <div id="space-tab-content-members" className="mb-12">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F5F5F0]/10">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-[#D4FF3F]" />
              <h2 className="text-base font-bold font-mono-code text-[#F5F5F0] uppercase tracking-wider">
                MEMBERS IN THIS HUB ({members.length})
              </h2>
            </div>
            <span className="text-xs font-mono-code text-[#777]">
              {isOwner ? 'Host Moderation Active' : 'Click any member card to view their profile'}
            </span>
          </div>

          {isLoadingMembers ? (
            <div className="py-12 text-center font-mono-code text-xs text-[#8A8A8A]">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4FF3F] mx-auto mb-2" />
              Loading member profiles...
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center bg-[#0D0D10] border border-[#202026] p-8">
              <p className="text-sm font-mono-code text-[#888]">
                No public member details available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const isMemberHost = member.uid === space.ownerId || member.id === space.ownerId;
                const isCurrentUser = member.uid === currentUserId || member.id === currentUserId;

                return (
                  <div
                    key={member.uid || member.id}
                    id={`space-member-card-${member.uid || member.id}`}
                    onClick={() => onSelectMember(member)}
                    className="group bg-[#0E0E11] hover:bg-[#141418] border border-[#222] hover:border-[#D4FF3F]/50 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Avatar & Name */}
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={member.avatarUrl || member.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-none object-cover border border-[#333] shrink-0 group-hover:border-[#D4FF3F] transition-colors"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors truncate">
                              {member.name}
                            </h4>
                            {member.roleEmoji && (
                              <span className="text-xs">{member.roleEmoji}</span>
                            )}
                          </div>
                          <p className="text-xs text-[#8A8A8A] truncate font-mono-code">
                            {member.role || 'Member'}
                          </p>
                          {member.location && (
                            <p className="text-[10px] text-[#666] truncate font-mono-code">
                              {member.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bio Snippet */}
                      {member.bio && (
                        <p className="text-xs text-[#999] line-clamp-2 mb-3 leading-relaxed">
                          {member.bio}
                        </p>
                      )}

                      {/* Skills / Interests */}
                      {((member.skills && member.skills.length > 0) || (member.interests && member.interests.length > 0)) && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(member.skills || member.interests || []).slice(0, 3).map((item, idx) => (
                            <span
                              key={`${item}-${idx}`}
                              className="px-2 py-0.5 bg-[#18181C] border border-[#2A2A30] text-[#777] text-[10px] font-mono-code"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer: Role status / Direct Action / Host Moderation */}
                    <div className="pt-3 border-t border-[#1C1C22] flex items-center justify-between gap-2 mt-2">
                      <div>
                        {isMemberHost ? (
                          <span className="text-[10px] font-mono-code font-bold text-[#D4FF3F] bg-[#D4FF3F]/10 px-2 py-0.5 border border-[#D4FF3F]/30">
                            HUB HOST
                          </span>
                        ) : isCurrentUser ? (
                          <span className="text-[10px] font-mono-code text-[#888]">
                            (You)
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono-code text-[#666]">
                            Member
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Host Remove Member Button (Only visible to Host, and only for non-Host members) */}
                        {isOwner && !isMemberHost && !isCurrentUser && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberToRemove(member);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-950/30 hover:bg-red-900/60 border border-red-900/50 hover:border-red-600 text-red-400 hover:text-white text-[10px] font-mono-code transition-colors"
                            title="Remove Member from Hub"
                          >
                            <UserMinus className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}

                        {!isCurrentUser && onStartMessage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartMessage(member.uid || member.id);
                            }}
                            className="p-1.5 bg-[#18181C] hover:bg-[#D4FF3F] text-[#888] hover:text-[#080808] border border-[#333] transition-colors"
                            title="Message Member"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-[10px] font-mono-code text-[#888] group-hover:text-[#D4FF3F] flex items-center gap-1 transition-colors">
                          Profile <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Host Edit Hub Modal */}
      {isOwner && currentUserId && (
        <EditSpaceModal
          space={space}
          hostId={currentUserId}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSpaceUpdated={(updated) => {
            setSpace(updated);
          }}
        />
      )}

      {/* Host Remove Member Confirmation Modal */}
      {isOwner && (
        <RemoveMemberModal
          isOpen={Boolean(memberToRemove)}
          space={space}
          member={memberToRemove}
          isProcessing={isRemovingMember}
          onClose={() => setMemberToRemove(null)}
          onConfirm={handleConfirmRemoveMember}
        />
      )}
    </div>
  );
};


