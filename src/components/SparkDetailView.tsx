import React, { useState, useEffect, useRef } from 'react';
import {
  CuriousBoardPost,
  SparkReply,
  UserProfile,
  PublicProfile,
  Connection,
  SparkThinker,
} from '../types';
import { sparkService } from '../services/sparkService';
import {
  ArrowLeft,
  Sparkles,
  MessageCircle,
  Users,
  Send,
  UserPlus,
  MessageSquare,
  Edit3,
  Trash2,
  Check,
  X,
  Share2,
  Compass,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react';

interface SparkDetailViewProps {
  sparkId: string;
  currentUser: UserProfile | null;
  connections: Connection[];
  allProfiles: (UserProfile | PublicProfile)[];
  onBack: () => void;
  onSelectProfile: (profile: PublicProfile) => void;
  onConnect: (profile: PublicProfile) => void;
  onOpenChat: (connectionId: string) => void;
  onOpenOnboarding: () => void;
  onDeleteSparkSuccess?: (sparkId: string) => void;
}

export const SparkDetailView: React.FC<SparkDetailViewProps> = ({
  sparkId,
  currentUser,
  connections,
  allProfiles,
  onBack,
  onSelectProfile,
  onConnect,
  onOpenChat,
  onOpenOnboarding,
  onDeleteSparkSuccess,
}) => {
  const [spark, setSpark] = useState<CuriousBoardPost | null>(null);
  const [replies, setReplies] = useState<SparkReply[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Edit spark modal/inline state
  const [isEditingSpark, setIsEditingSpark] = useState<boolean>(false);
  const [editSparkContent, setEditSparkContent] = useState<string>('');
  const [editSparkTags, setEditSparkTags] = useState<string>('');
  const [isSavingSparkEdit, setIsSavingSparkEdit] = useState<boolean>(false);
  const [isConfirmingDeleteSpark, setIsConfirmingDeleteSpark] = useState<boolean>(false);

  // Edit reply inline state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState<string>('');

  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch / Subscribe to Spark details & replies
  useEffect(() => {
    let unsubscribeReplies: (() => void) | null = null;

    const loadData = async () => {
      setIsLoading(true);
      const foundSpark = await sparkService.getSpark(sparkId);
      if (foundSpark) {
        setSpark(foundSpark);
        setEditSparkContent(foundSpark.content);
        setEditSparkTags((foundSpark.tags || []).join(', '));
      }
      setIsLoading(false);

      // Subscribe to replies
      unsubscribeReplies = sparkService.subscribeSparkReplies(sparkId, (updatedReplies) => {
        setReplies(updatedReplies);
      });
    };

    loadData();

    return () => {
      if (unsubscribeReplies) unsubscribeReplies();
    };
  }, [sparkId]);

  // Helper to find a public profile by UID
  const findProfile = (userId: string): PublicProfile | null => {
    if (!userId) return null;
    const p = allProfiles.find((prof) => (prof as any).uid === userId || prof.id === userId);
    if (p) {
      return {
        ...p,
        id: (p as any).uid || p.id,
        uid: (p as any).uid || p.id,
      } as PublicProfile;
    }
    return null;
  };

  // Helper to check connection status with user
  const getConnectionWithUser = (userId: string): Connection | undefined => {
    if (!userId || !currentUser) return undefined;
    return connections.find(
      (c) =>
        c.profileId === userId ||
        c.targetId === userId ||
        c.requesterId === userId ||
        (c.participants && c.participants.includes(userId))
    );
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmitReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      onOpenOnboarding();
      return;
    }
    if (!replyText.trim() || isSubmittingReply || !spark) return;

    setIsSubmittingReply(true);
    const currentUserId = currentUser.uid || currentUser.id;

    try {
      await sparkService.addReply({
        sparkId: spark.id,
        authorId: currentUserId,
        authorName: currentUser.name || 'Anonymous Thinker',
        authorRole: currentUser.role || 'Member',
        authorLocation: currentUser.location || currentUser.city || 'Worldwide',
        authorAvatar: currentUser.avatarUrl || currentUser.profilePhoto,
        content: replyText.trim(),
        sparkAuthorId: spark.authorId,
        sparkTitleOrSnippet: spark.content,
        currentUserProfile: currentUser,
      });

      setReplyText('');
      // Update local spark thinker state
      setSpark((prev) => {
        if (!prev) return null;
        const thinkersSummary = { ...(prev.thinkersSummary || {}) };
        thinkersSummary[currentUserId] = {
          id: currentUserId,
          name: currentUser.name,
          role: currentUser.role,
          location: currentUser.location,
          avatarUrl: currentUser.avatarUrl || currentUser.profilePhoto,
        };
        const thinkerIds = Array.from(new Set([...(prev.thinkerIds || []), currentUserId]));
        return {
          ...prev,
          repliesCount: (prev.repliesCount || 0) + 1,
          thinkerIds,
          thinkersSummary,
        };
      });
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSaveSparkEdit = async () => {
    if (!currentUser || !spark || !editSparkContent.trim()) return;
    setIsSavingSparkEdit(true);

    const tags = editSparkTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await sparkService.updateSpark({
        sparkId: spark.id,
        authorId: currentUser.uid || currentUser.id,
        content: editSparkContent.trim(),
        tags: tags.length ? tags : spark.tags,
      });

      setSpark((prev) => (prev ? { ...prev, content: editSparkContent.trim(), tags } : null));
      setIsEditingSpark(false);
    } catch (err) {
      console.error('Failed to update spark:', err);
    } finally {
      setIsSavingSparkEdit(false);
    }
  };

  const handleDeleteSpark = async () => {
    if (!currentUser || !spark) return;
    try {
      await sparkService.deleteSpark(spark.id, currentUser.uid || currentUser.id);
      if (onDeleteSparkSuccess) {
        onDeleteSparkSuccess(spark.id);
      }
      onBack();
    } catch (err) {
      console.error('Failed to delete spark:', err);
    }
  };

  const handleSaveReplyEdit = async (replyId: string) => {
    if (!currentUser || !spark || !editReplyText.trim()) return;
    const currentUserId = currentUser.uid || currentUser.id;

    try {
      await sparkService.updateReply(spark.id, replyId, currentUserId, editReplyText.trim());
      setReplies((prev) =>
        prev.map((r) => (r.id === replyId ? { ...r, content: editReplyText.trim() } : r))
      );
      setEditingReplyId(null);
    } catch (err) {
      console.error('Failed to update reply:', err);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!currentUser || !spark) return;
    const currentUserId = currentUser.uid || currentUser.id;

    try {
      await sparkService.deleteReply(spark.id, replyId, currentUserId);
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      setSpark((prev) =>
        prev ? { ...prev, repliesCount: Math.max(0, (prev.repliesCount || 1) - 1) } : null
      );
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  const currentUserId = currentUser?.uid || currentUser?.id;
  const isSparkAuthor = currentUserId && spark && spark.authorId === currentUserId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-[#F5F5F0]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4FF3F] animate-ping" />
          <span className="text-xs font-mono-code uppercase tracking-widest text-[#8E8E93]">
            Loading Rabbit Hole Discussion...
          </span>
        </div>
      </div>
    );
  }

  if (!spark) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#F5F5F0] py-16 px-4 max-w-3xl mx-auto flex flex-col items-center justify-center text-center">
        <Sparkles className="w-12 h-12 text-[#64646E] mb-4" />
        <h2 className="font-editorial text-3xl text-[#F5F5F0] mb-2 font-light">
          Spark Note Not Found
        </h2>
        <p className="text-sm text-[#8E8E93] max-w-md mb-8">
          This question or rabbit hole may have been archived or removed by its author.
        </p>
        <button
          onClick={onBack}
          className="btn-primary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Questions & Rabbit Holes</span>
        </button>
      </div>
    );
  }

  // Aggregate unique thinkers from spark metadata and loaded replies
  const thinkersMap: Map<string, SparkThinker> = new Map();
  // Add author first
  if (spark.authorId) {
    thinkersMap.set(spark.authorId, {
      id: spark.authorId,
      name: spark.authorName,
      role: spark.authorRole,
      location: spark.authorLocation,
      avatarUrl: spark.authorAvatar,
    });
  }
  // Add spark summary thinkers
  if (spark.thinkersSummary) {
    (Object.values(spark.thinkersSummary) as SparkThinker[]).forEach((t) => {
      if (t && t.id) thinkersMap.set(t.id, t);
    });
  }
  // Add reply authors
  replies.forEach((r) => {
    if (r.authorId && !thinkersMap.has(r.authorId)) {
      thinkersMap.set(r.authorId, {
        id: r.authorId,
        name: r.authorName,
        role: r.authorRole,
        location: r.authorLocation,
        avatarUrl: r.authorAvatar,
      });
    }
  });

  const thinkersList = Array.from(thinkersMap.values());
  const sparkAuthorConn = getConnectionWithUser(spark.authorId);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F0] py-8 px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto pb-32 selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* 1. TOP NAVIGATION & ACTIONS BAR */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[#1E1E24]">
        <button
          id="spark-back-button"
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-[#8E8E93] hover:text-[#D4FF3F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Questions & Rabbit Holes</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#222228] bg-[#121216] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] text-[11px] font-mono-code uppercase tracking-wider transition-all"
            title="Share Spark URL"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span className="text-[#D4FF3F]">Link Copied</span>
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

      {/* 2. MAIN SPARK EDITORIAL CARD */}
      <article className="border border-[#222228] bg-[#0E0E12] p-6 sm:p-10 mb-10 relative">
        {/* Topic Tag & Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
            <span className="text-[11px] font-mono-code text-[#D4FF3F] uppercase tracking-widest font-bold">
              Public Spark
            </span>
          </div>

          <span className="text-[11px] font-mono-code text-[#7A7A82] uppercase tracking-widest">
            {spark.timestamp}
          </span>
        </div>

        {/* The Spark Inquiry Text */}
        {!isEditingSpark ? (
          <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl text-[#F5F5F0] font-light leading-relaxed mb-8">
            “{spark.content}”
          </h1>
        ) : (
          <div className="mb-8 space-y-4">
            <label className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold block">
              Edit Spark Thought
            </label>
            <textarea
              rows={4}
              value={editSparkContent}
              onChange={(e) => setEditSparkContent(e.target.value)}
              className="w-full border border-[#2E2E38] bg-[#080808] p-4 text-base text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none font-editorial leading-relaxed"
            />
            <div>
              <label className="text-[10px] font-mono-code uppercase tracking-widest text-[#8E8E93] block mb-1">
                Topic Tags (comma separated)
              </label>
              <input
                type="text"
                value={editSparkTags}
                onChange={(e) => setEditSparkTags(e.target.value)}
                className="w-full border border-[#2E2E38] bg-[#080808] px-3.5 py-2 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveSparkEdit}
                disabled={isSavingSparkEdit || !editSparkContent.trim()}
                className="btn-primary py-1.5 px-4 text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
              <button
                onClick={() => setIsEditingSpark(false)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(spark.tags || []).map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono-code text-[#A0A0AA] bg-[#14141A] border border-[#262630] px-3 py-1 uppercase tracking-wider"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Author Details & Interaction Bar */}
        <div className="pt-6 border-t border-[#1C1C22] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Author info */}
          <div className="flex items-center gap-3.5">
            <img
              src={spark.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={spark.authorName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 object-cover border border-[#2E2E38] cursor-pointer hover:border-[#D4FF3F] transition-colors"
              onClick={() => {
                const profile = findProfile(spark.authorId);
                if (profile) onSelectProfile(profile);
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2
                  onClick={() => {
                    const profile = findProfile(spark.authorId);
                    if (profile) onSelectProfile(profile);
                  }}
                  className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0] hover:text-[#D4FF3F] cursor-pointer transition-colors"
                >
                  {spark.authorName}
                </h2>
                {isSparkAuthor && (
                  <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#080808] bg-[#D4FF3F] px-1.5 py-0.2 font-bold">
                    Author (You)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8E8E93] font-mono-code">
                {spark.authorLocation} · {spark.authorRole}
              </p>
            </div>
          </div>

          {/* Author CTA Actions */}
          <div className="flex items-center gap-2.5">
            {!isSparkAuthor ? (
              <>
                <button
                  id="view-author-profile-btn"
                  onClick={() => {
                    const profile = findProfile(spark.authorId);
                    if (profile) onSelectProfile(profile);
                  }}
                  className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
                >
                  <span>View Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                {sparkAuthorConn?.status === 'connected' ? (
                  <button
                    onClick={() => onOpenChat(sparkAuthorConn.id)}
                    className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 border-[#D4FF3F]/40 text-[#D4FF3F]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                ) : sparkAuthorConn?.status === 'pending' ? (
                  <span className="text-[11px] font-mono-code text-[#8E8E93] px-3 py-2 border border-[#222228] bg-[#101014]">
                    Request Pending
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      const profile = findProfile(spark.authorId);
                      if (profile) {
                        onConnect(profile);
                      } else {
                        onOpenOnboarding();
                      }
                    }}
                    className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingSpark(true)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Spark</span>
                </button>
                <button
                  onClick={() => setIsConfirmingDeleteSpark(true)}
                  className="btn-secondary text-xs py-1.5 px-3 text-[#FF5555] border-[#441111] hover:border-[#FF5555] flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </article>

      {/* 3. THINKERS EXPLORING SECTION */}
      <section className="mb-12 border border-[#1E1E24] bg-[#0B0B0E] p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 font-mono-code">
            <Users className="w-4 h-4 text-[#D4FF3F]" />
            <h3 className="text-xs text-[#F5F5F0] uppercase tracking-widest font-bold">
              Thinkers Exploring ({thinkersList.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono-code text-[#7A7A82] uppercase tracking-widest hidden sm:inline">
            Click any member to explore profile
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {thinkersList.map((thinker) => {
            const isSelf = currentUserId === thinker.id;
            const profile = findProfile(thinker.id);

            return (
              <div
                key={thinker.id}
                onClick={() => {
                  if (profile) onSelectProfile(profile);
                }}
                className="flex items-center gap-3 p-2.5 border border-[#1C1C22] bg-[#101014] hover:border-[#383844] cursor-pointer transition-all group"
              >
                <img
                  src={thinker.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={thinker.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 object-cover border border-[#24242C] group-hover:border-[#D4FF3F] transition-colors"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#F5F5F0] truncate group-hover:text-[#D4FF3F] transition-colors">
                      {thinker.name}
                    </p>
                    {isSelf && (
                      <span className="text-[8px] font-mono-code text-[#D4FF3F] uppercase">
                        (You)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#7A7A82] font-mono-code truncate">
                    {thinker.role || thinker.location || 'Thinker'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PUBLIC DISCUSSION THREAD */}
      <section className="space-y-6">
        
        {/* Discussion Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-4 h-4 text-[#D4FF3F]" />
            <h2 className="text-sm font-mono-code uppercase tracking-widest font-bold text-[#F5F5F0]">
              Public Discussion ({replies.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono-code text-[#7A7A82] uppercase tracking-widest">
            Chronological
          </span>
        </div>

        {/* Replies List */}
        {replies.length === 0 ? (
          <div className="border border-dashed border-[#222228] bg-[#0E0E12] p-10 text-center text-[#8E8E93]">
            <Compass className="w-8 h-8 text-[#555560] mx-auto mb-3" />
            <p className="text-sm text-[#F5F5F0] font-editorial mb-1 font-light">
              No replies yet. Be the first mind to explore this rabbit hole.
            </p>
            <p className="text-xs text-[#7A7A82] max-w-md mx-auto">
              Share an angle, a relevant research paper, an intuition, or a physical experience.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => {
              const isOwnReply = currentUserId && reply.authorId === currentUserId;
              const replyConn = getConnectionWithUser(reply.authorId);
              const isEditingThisReply = editingReplyId === reply.id;
              const replyProfile = findProfile(reply.authorId);

              return (
                <div
                  key={reply.id}
                  className={`border p-5 sm:p-6 transition-all ${
                    isOwnReply
                      ? 'border-[#2E2E38] bg-[#101015]'
                      : 'border-[#1C1C22] bg-[#0D0D11] hover:border-[#2A2A34]'
                  }`}
                >
                  {/* Reply Author Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={reply.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={reply.authorName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 object-cover border border-[#24242C] cursor-pointer hover:border-[#D4FF3F] transition-colors"
                        onClick={() => {
                          if (replyProfile) onSelectProfile(replyProfile);
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => {
                              if (replyProfile) onSelectProfile(replyProfile);
                            }}
                            className="text-xs font-bold uppercase tracking-wider text-[#F5F5F0] hover:text-[#D4FF3F] cursor-pointer transition-colors"
                          >
                            {reply.authorName}
                          </h4>
                          {isOwnReply && (
                            <span className="text-[8px] font-mono-code uppercase tracking-widest text-[#080808] bg-[#D4FF3F] px-1 font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#7A7A82] font-mono-code">
                          {reply.authorLocation} · {reply.authorRole}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono-code text-[#7A7A82] uppercase tracking-widest">
                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Reply Content or Inline Edit */}
                  {!isEditingThisReply ? (
                    <p className="text-xs sm:text-sm text-[#E0E0DB] leading-relaxed mb-4 whitespace-pre-wrap font-sans-clean">
                      {reply.content}
                    </p>
                  ) : (
                    <div className="mb-4 space-y-3">
                      <textarea
                        rows={3}
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        className="w-full border border-[#2E2E38] bg-[#080808] p-3 text-xs sm:text-sm text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none leading-relaxed"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveReplyEdit(reply.id)}
                          className="btn-primary py-1 px-3 text-[11px]"
                        >
                          <Check className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingReplyId(null)}
                          className="btn-secondary py-1 px-2.5 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reply Actions Footer */}
                  <div className="pt-3 border-t border-[#18181F] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {!isOwnReply ? (
                        <>
                          <button
                            onClick={() => {
                              if (replyProfile) onSelectProfile(replyProfile);
                            }}
                            className="text-[11px] font-mono-code text-[#8E8E93] hover:text-[#F5F5F0] flex items-center gap-1 transition-colors"
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>

                          {replyConn?.status === 'connected' ? (
                            <button
                              onClick={() => onOpenChat(replyConn.id)}
                              className="text-[11px] font-mono-code text-[#D4FF3F] hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Private Message</span>
                            </button>
                          ) : replyConn?.status === 'pending' ? (
                            <span className="text-[10px] font-mono-code text-[#7A7A82]">
                              Pending Connection
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (replyProfile) {
                                  onConnect(replyProfile);
                                } else {
                                  onOpenOnboarding();
                                }
                              }}
                              className="text-[11px] font-mono-code text-[#8E8E93] hover:text-[#D4FF3F] flex items-center gap-1 transition-colors"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Connect</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingReplyId(reply.id);
                              setEditReplyText(reply.content);
                            }}
                            className="text-[11px] font-mono-code text-[#8E8E93] hover:text-[#D4FF3F] flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            className="text-[11px] font-mono-code text-[#8E8E93] hover:text-[#FF5555] flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] font-mono-code text-[#555560] uppercase">
                      Spark Discussion
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* 5. REPLY COMPOSER */}
        <div className="mt-8 pt-6 border-t border-[#222228]">
          <div className="border border-[#282834] bg-[#0E0E13] p-5 sm:p-6 shadow-xl">
            
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <CornerDownRight className="w-4 h-4 text-[#D4FF3F]" />
                <span className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
                  Add Your Thought To This Rabbit Hole
                </span>
              </div>
              <span className="text-[10px] font-mono-code text-[#7A7A82] uppercase tracking-widest">
                Public to all members
              </span>
            </div>

            <form onSubmit={handleSubmitReply} className="space-y-4">
              <textarea
                ref={replyInputRef}
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmitReply();
                  }
                }}
                placeholder={
                  currentUser
                    ? 'Share your perspective, propose a counter-hypothesis, or branch into an adjacent rabbit hole...'
                    : 'Sign in to join this public discussion and explore together...'
                }
                className="w-full border border-[#24242E] bg-[#080808] p-4 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#64646E] focus:border-[#D4FF3F] focus:outline-none leading-relaxed font-sans-clean"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-mono-code text-[#7A7A82]">
                  <span className="hidden sm:inline">Press ⌘ + Enter to post</span>
                </div>

                <button
                  id="submit-spark-reply-btn"
                  type="submit"
                  disabled={!replyText.trim() || isSubmittingReply}
                  className="btn-primary py-2 px-5 text-xs flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReply ? 'Posting...' : 'Post Thought'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>

      </section>

      {/* 6. DELETE SPARK CONFIRMATION MODAL */}
      {isConfirmingDeleteSpark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4 selection:bg-[#D4FF3F] selection:text-[#080808]">
          <div className="w-full max-w-md border border-[#331111] bg-[#100C0C] p-6 shadow-2xl text-[#F5F5F0]">
            <div className="flex items-center gap-2 text-[#FF5555] mb-3">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold uppercase tracking-wider font-sans-clean">
                Delete Spark Question?
              </h3>
            </div>
            <p className="text-xs text-[#A0A0A5] mb-6 leading-relaxed">
              Are you sure you want to delete this spark inquiry? All public replies in this thread will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsConfirmingDeleteSpark(false)}
                className="btn-secondary text-xs py-1.5 px-3.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSpark}
                className="bg-[#FF3333] hover:bg-[#FF4444] text-[#080808] font-bold text-xs py-1.5 px-4 uppercase tracking-wider transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
