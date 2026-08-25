import React, { useState } from 'react';
import { Connection, PublicProfile, UserProfile } from '../types';
import { 
  X, 
  MapPin, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Bookmark, 
  ArrowLeft, 
  Globe, 
  Github, 
  Twitter, 
  ExternalLink,
  Code2,
  Lightbulb,
  HelpCircle,
  Hammer,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  UserMinus
} from 'lucide-react';

interface MemberProfileModalProps {
  isOpen: boolean;
  profile: PublicProfile | null;
  currentUser: UserProfile | null;
  connections?: Connection[];
  isBookmarked?: boolean;
  onClose: () => void;
  onConnect: (profile: PublicProfile) => void;
  onOpenChat?: (connectionId: string) => void;
  onAcceptRequest?: (connectionId: string) => Promise<void> | void;
  onDeclineRequest?: (connectionId: string) => Promise<void> | void;
  onCancelRequest?: (connectionId: string) => Promise<void> | void;
  onRemoveConnection?: (connectionId: string) => Promise<void> | void;
  onToggleBookmark?: (profileId: string) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  profile,
  currentUser,
  connections = [],
  isBookmarked = false,
  onClose,
  onConnect,
  onOpenChat,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveConnection,
  onToggleBookmark,
}) => {
  const [actionInProgress, setActionInProgress] = useState(false);

  if (!isOpen || !profile) return null;

  const currentUserId = currentUser?.uid || currentUser?.id;
  const isOwnProfile = currentUserId === profile.id || currentUserId === profile.uid;

  // Determine connection status with this member
  const connection = connections.find(
    (c) =>
      c.profileId === profile.id ||
      c.profileId === profile.uid ||
      (c.requesterId === currentUserId && (c.targetId === profile.id || c.targetId === profile.uid)) ||
      (c.targetId === currentUserId && (c.requesterId === profile.id || c.requesterId === profile.uid)) ||
      (c.participants && c.participants.includes(profile.id) && c.participants.includes(currentUserId || ''))
  );

  let connectionState: 'none' | 'pending_sent' | 'pending_received' | 'connected' = 'none';

  if (connection) {
    if (connection.status === 'connected') {
      connectionState = 'connected';
    } else if (connection.status === 'pending') {
      if (connection.requesterId === currentUserId || (connection.participants && connection.participants[0] === currentUserId)) {
        connectionState = 'pending_sent';
      } else {
        connectionState = 'pending_received';
      }
    }
  }

  // Calculate mutual points of synergy without disclosing private data
  const mutualInterests = currentUser?.interests?.filter((i) =>
    profile.interests?.some((pi) => pi.toLowerCase() === i.toLowerCase())
  ) || [];

  const mutualIntents = currentUser?.intents?.filter((it) =>
    profile.intents?.includes(it)
  ) || [];

  const sameCollege = !!(currentUser?.college && profile.college && 
    currentUser.college.toLowerCase().trim() === profile.college.toLowerCase().trim());

  const handleAction = async (actionFn?: (id: string) => Promise<void> | void) => {
    if (!actionFn || !connection) return;
    setActionInProgress(true);
    try {
      await actionFn(connection.id);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div
      id="member-profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="member-profile-card"
        className="w-full max-w-2xl bg-[#101010] border border-[#242424] shadow-2xl relative flex flex-col my-auto overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-[#242424] bg-[#151516]">
          <button
            id="member-modal-back-btn"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-wider text-[#8A8A8A] hover:text-[#D4FF3F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discovery</span>
          </button>

          <div className="flex items-center gap-2">
            {onToggleBookmark && (
              <button
                id="member-modal-bookmark-btn"
                onClick={() => onToggleBookmark(profile.id)}
                className={`p-2 border transition-colors ${
                  isBookmarked
                    ? 'border-[#D4FF3F] bg-[#D4FF3F]/10 text-[#D4FF3F]'
                    : 'border-[#242424] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838]'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark member'}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}

            <button
              id="member-modal-close-btn"
              onClick={onClose}
              className="p-2 border border-[#242424] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-5 sm:px-8 py-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Identity & Avatar Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b border-[#1F1F1F]">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={profile.avatarUrl || profile.profilePhoto}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-18 h-18 sm:w-20 sm:h-20 object-cover border border-[#242424]"
                />
                {profile.isOnline && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#D4FF3F] border-2 border-[#101010] rounded-full" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[#F2F2ED] font-light">
                    {profile.name}
                  </h2>
                  {profile.roleEmoji && (
                    <span className="text-lg">{profile.roleEmoji}</span>
                  )}
                </div>

                <p className="text-xs text-[#D4FF3F] font-mono-code mt-0.5 uppercase tracking-wider">
                  {profile.role}
                </p>

                <p className="text-[11px] text-[#8A8A8A] uppercase tracking-widest flex items-center gap-1.5 mt-1 font-mono-code">
                  <MapPin className="w-3 h-3 text-[#8A8A8A]" />
                  <span>{profile.location || 'Worldwide'}</span>
                  {profile.joinedDate && (
                    <>
                      <span>·</span>
                      <span>Joined {profile.joinedDate}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Connection Intent Badges & Relationship status */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              {connectionState === 'connected' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 px-2.5 py-0.5 font-mono-code uppercase font-bold">
                  <UserCheck className="w-3 h-3" />
                  <span>Connected</span>
                </span>
              )}
              {connectionState === 'pending_sent' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 font-mono-code uppercase font-bold">
                  <Clock className="w-3 h-3" />
                  <span>Request Sent</span>
                </span>
              )}
              {connectionState === 'pending_received' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 font-mono-code uppercase font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>Invitation Pending</span>
                </span>
              )}

              {profile.intents && Array.isArray(profile.intents) && profile.intents.length > 0 && (
                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1 mt-1">
                  {(profile.intents || []).map((it) => (
                    <span
                      key={it}
                      className="text-[10px] text-[#8A8A8A] border border-[#242424] bg-[#151516] px-2 py-0.5 font-mono-code uppercase tracking-wider"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mutual Synergies / Why Connect */}
          {(mutualInterests.length > 0 || mutualIntents.length > 0 || sameCollege || profile.whyMatch) && (
            <div className="border border-[#D4FF3F]/30 bg-[#D4FF3F]/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold">
                  Points of Synergy
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#D8D8DC]">
                {sameCollege && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Both affiliated with <strong>{profile.college}</strong></span>
                  </li>
                )}
                {mutualInterests.length > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Shared focus on <strong>{mutualInterests.slice(0, 3).join(', ')}</strong></span>
                  </li>
                )}
                {mutualIntents.length > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Looking to <strong>{mutualIntents[0]}</strong></span>
                  </li>
                )}
                {profile.whyMatch && mutualInterests.length === 0 && !sameCollege && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>{profile.whyMatch}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Academic Background */}
          {(profile.college || profile.department || profile.year) && (
            <div className="bg-[#151516] border border-[#242424] p-4">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2.5 font-bold">
                Academic & Institutional Affiliation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {profile.college && (
                  <div className="flex items-center gap-2 text-[#F2F2ED]">
                    <GraduationCap className="w-4 h-4 text-[#D4FF3F] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#8A8A8A] uppercase font-mono-code block">College</span>
                      <span className="font-medium">{profile.college}</span>
                    </div>
                  </div>
                )}
                {profile.department && (
                  <div className="flex items-center gap-2 text-[#F2F2ED]">
                    <BookOpen className="w-4 h-4 text-[#D4FF3F] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#8A8A8A] uppercase font-mono-code block">Department</span>
                      <span className="font-medium">{profile.department}</span>
                    </div>
                  </div>
                )}
                {profile.year && (
                  <div className="flex items-center gap-2 text-[#F2F2ED]">
                    <Calendar className="w-4 h-4 text-[#D4FF3F] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#8A8A8A] uppercase font-mono-code block">Cohort / Year</span>
                      <span className="font-medium">{profile.year}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tagline & Bio */}
          <div>
            {profile.tagline && (
              <p className="font-editorial text-lg sm:text-xl italic text-[#F2F2ED] leading-relaxed mb-3">
                “{profile.tagline}”
              </p>
            )}
            <p className="font-sans-clean text-xs sm:text-sm text-[#8A8A8A] leading-relaxed whitespace-pre-line">
              {profile.bio || 'No public bio provided yet.'}
            </p>
          </div>

          {/* Skills & Superpowers */}
          {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2 font-bold">
                Core Craft & Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(profile.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-[#151516] text-[#D4FF3F] border border-[#D4FF3F]/30 px-2.5 py-1 text-xs font-mono-code uppercase tracking-wide"
                  >
                    <Code2 className="w-3 h-3 opacity-70" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topics & Interests */}
          {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2 font-bold">
                Topics & Obsessions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(profile.interests || []).map((interest) => (
                  <span
                    key={interest}
                    className="text-xs text-[#8A8A8A] bg-[#151516] border border-[#242424] px-2.5 py-1 uppercase font-mono-code"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Building / Learning / Pondering Grid */}
          {(profile.building || profile.learning || profile.openQuestion) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {profile.building && (
                <div className="bg-[#151516] border border-[#242424] p-3.5">
                  <div className="flex items-center gap-1.5 text-[#D4FF3F] text-[10px] font-mono-code uppercase tracking-widest font-bold mb-1">
                    <Hammer className="w-3 h-3" />
                    <span>Currently Building</span>
                  </div>
                  <p className="text-xs text-[#F2F2ED]/90 leading-relaxed">
                    {profile.building}
                  </p>
                </div>
              )}

              {profile.learning && (
                <div className="bg-[#151516] border border-[#242424] p-3.5">
                  <div className="flex items-center gap-1.5 text-[#D4FF3F] text-[10px] font-mono-code uppercase tracking-widest font-bold mb-1">
                    <Lightbulb className="w-3 h-3" />
                    <span>Currently Exploring</span>
                  </div>
                  <p className="text-xs text-[#F2F2ED]/90 leading-relaxed">
                    {profile.learning}
                  </p>
                </div>
              )}

              {profile.openQuestion && (
                <div className="sm:col-span-2 bg-[#151516] border border-[#242424] p-3.5">
                  <div className="flex items-center gap-1.5 text-[#8A8A8A] text-[10px] font-mono-code uppercase tracking-widest font-bold mb-1">
                    <HelpCircle className="w-3 h-3" />
                    <span>Question I'm Pondering</span>
                  </div>
                  <p className="font-editorial text-sm italic text-[#F2F2ED]">
                    “{profile.openQuestion}”
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Links & Handles */}
          {profile.links && Object.values(profile.links).some(Boolean) && (
            <div className="pt-2 border-t border-[#1F1F1F]">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2">
                External Presence
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-mono-code">
                {profile.links.website && (
                  <a
                    href={profile.links.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#D4FF3F] hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
                {profile.links.github && (
                  <a
                    href={profile.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#8A8A8A] hover:text-[#F2F2ED]"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {profile.links.twitter && (
                  <a
                    href={profile.links.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#8A8A8A] hover:text-[#F2F2ED]"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span>X/Twitter</span>
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom CTA Bar with Responsive Connection States */}
        <div className="px-5 sm:px-8 py-4 border-t border-[#242424] bg-[#151516] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            id="member-modal-close-bottom-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-[#242424] text-xs font-mono-code uppercase tracking-widest text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838] transition-colors text-center"
          >
            Back to Discovery
          </button>

          {isOwnProfile ? (
            <span className="text-xs font-mono-code text-[#8A8A8A] uppercase tracking-wider px-4 py-2 bg-[#101010] border border-[#242424]">
              This is your profile
            </span>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              
              {/* Connected: Open Chat & Remove */}
              {connectionState === 'connected' && (
                <>
                  <button
                    onClick={() => handleAction(onRemoveConnection)}
                    disabled={actionInProgress}
                    className="px-3 py-2 text-xs font-mono-code uppercase text-[#8A8A8A] hover:text-red-400 border border-[#242424] hover:border-red-500/30 transition-colors"
                    title="Remove connection"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                  <button
                    id="member-modal-open-chat-btn"
                    onClick={() => {
                      onClose();
                      if (onOpenChat && connection) onOpenChat(connection.id);
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#D4FF3F] text-[#080808] px-6 py-2.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Dialogue</span>
                  </button>
                </>
              )}

              {/* Pending Received: Accept / Decline */}
              {connectionState === 'pending_received' && (
                <>
                  <button
                    id="member-modal-decline-btn"
                    onClick={() => handleAction(onDeclineRequest)}
                    disabled={actionInProgress}
                    className="px-4 py-2 text-xs font-mono-code uppercase text-[#8A8A8A] hover:text-red-400 border border-[#242424] hover:border-red-500/30 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    id="member-modal-accept-btn"
                    onClick={() => handleAction(onAcceptRequest)}
                    disabled={actionInProgress}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#D4FF3F] text-[#080808] px-6 py-2.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept Request</span>
                  </button>
                </>
              )}

              {/* Pending Sent: Cancel Option */}
              {connectionState === 'pending_sent' && (
                <button
                  id="member-modal-cancel-req-btn"
                  onClick={() => handleAction(onCancelRequest)}
                  disabled={actionInProgress}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#242424] text-xs font-mono-code uppercase text-[#8A8A8A] hover:text-red-400 hover:border-red-500/40 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cancel Pending Request</span>
                </button>
              )}

              {/* None: Connect Button */}
              {connectionState === 'none' && (
                <button
                  id="member-modal-connect-btn"
                  onClick={() => onConnect(profile)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#D4FF3F] text-[#080808] px-6 py-2.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Connect with {profile.name.split(' ')[0]}</span>
                </button>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
