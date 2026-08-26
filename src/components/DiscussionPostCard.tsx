import React, { useState, useEffect } from 'react';
import { SpacePost, SpaceComment, UserProfile, PublicProfile, DiscussionPostType } from '../types';
import { discussionService } from '../services/discussionService';
import { 
  MessageSquare, 
  Sparkles, 
  HelpCircle, 
  Lightbulb, 
  Heart, 
  Trash2, 
  Edit3, 
  Send, 
  Loader2, 
  Check, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  CornerDownRight 
} from 'lucide-react';

interface DiscussionPostCardProps {
  post: SpacePost;
  spaceId: string;
  spaceOwnerId: string;
  currentUser: UserProfile | null;
  isMember: boolean;
  hasReacted?: boolean;
  onSelectAuthor?: (author: PublicProfile) => void;
  onPromptJoin?: () => void;
}

export const DiscussionPostCard: React.FC<DiscussionPostCardProps> = ({
  post,
  spaceId,
  spaceOwnerId,
  currentUser,
  isMember,
  hasReacted = false,
  onSelectAuthor,
  onPromptJoin,
}) => {
  const currentUserId = currentUser?.uid || currentUser?.id;
  const isAuthor = currentUserId && post.authorId === currentUserId;
  const isSpaceOwner = currentUserId && spaceOwnerId === currentUserId;
  const canModerate = isAuthor || isSpaceOwner;

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SpaceComment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<DiscussionPostType>(post.type);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete post state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Reaction state
  const [isReacting, setIsReacting] = useState(false);
  const [localHasReacted, setLocalHasReacted] = useState(hasReacted);
  const [localReactionCount, setLocalReactionCount] = useState(post.reactionCount || 0);

  useEffect(() => {
    setLocalHasReacted(hasReacted);
  }, [hasReacted]);

  useEffect(() => {
    setLocalReactionCount(post.reactionCount || 0);
  }, [post.reactionCount]);

  // Subscribe to comments when expanded
  useEffect(() => {
    if (!showComments) return;

    const unsubscribe = discussionService.subscribeComments(
      spaceId,
      post.id,
      (fetchedComments) => {
        setComments(fetchedComments);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [showComments, spaceId, post.id]);

  const handleToggleReaction = async () => {
    if (!currentUserId || !isMember) {
      onPromptJoin?.();
      return;
    }
    if (isReacting) return;

    setIsReacting(true);
    // Optimistic update
    const previousReacted = localHasReacted;
    const previousCount = localReactionCount;
    setLocalHasReacted(!previousReacted);
    setLocalReactionCount(previousReacted ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const result = await discussionService.toggleReaction(
        spaceId,
        post.id,
        currentUserId,
        post.authorId,
        post.title,
        currentUser
      );
      setLocalHasReacted(result.reacted);
      setLocalReactionCount(result.count);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      // Revert on error
      setLocalHasReacted(previousReacted);
      setLocalReactionCount(previousCount);
    } finally {
      setIsReacting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !isAuthor || !editContent.trim()) return;

    setIsSavingEdit(true);
    try {
      await discussionService.updatePost({
        spaceId,
        postId: post.id,
        authorId: currentUserId,
        type: editType,
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentUserId || !canModerate) return;

    setIsDeletingPost(true);
    try {
      await discussionService.deletePost(spaceId, post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
      setIsDeletingPost(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !isMember || !newCommentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      await discussionService.addComment({
        spaceId,
        postId: post.id,
        authorId: currentUserId,
        content: newCommentContent.trim(),
        postAuthorId: post.authorId,
        postTitle: post.title,
        currentUserProfile: currentUser,
      });
      setNewCommentContent('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;
    setDeletingCommentId(commentId);
    try {
      await discussionService.deleteComment(spaceId, post.id, commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const authorName = post.authorProfile?.name || 'Misfit Thinker';
  const authorAvatar =
    post.authorProfile?.avatarUrl ||
    post.authorProfile?.profilePhoto ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
  const authorRole = post.authorProfile?.role;
  const authorCollege = post.authorProfile?.college || post.authorProfile?.location;

  const formattedTime = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  const getTypeIcon = (type: DiscussionPostType) => {
    switch (type) {
      case 'Question':
        return <HelpCircle className="w-3.5 h-3.5 text-[#FFB84C]" />;
      case 'Idea':
        return <Lightbulb className="w-3.5 h-3.5 text-[#4CC9F0]" />;
      case 'Discussion':
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-[#D4FF3F]" />;
    }
  };

  const getTypeBadgeClass = (type: DiscussionPostType) => {
    switch (type) {
      case 'Question':
        return 'bg-[#FFB84C]/15 border-[#FFB84C]/40 text-[#FFB84C]';
      case 'Idea':
        return 'bg-[#4CC9F0]/15 border-[#4CC9F0]/40 text-[#4CC9F0]';
      case 'Discussion':
      default:
        return 'bg-[#D4FF3F]/15 border-[#D4FF3F]/40 text-[#D4FF3F]';
    }
  };

  return (
    <article 
      id={`discussion-post-${post.id}`} 
      className="bg-[#0C0C0F] border border-[#202026] hover:border-[#2C2C35] transition-all p-5 sm:p-6 mb-5"
    >
      {/* Top Bar: Author & Post Metadata */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <img
            src={authorAvatar}
            alt={authorName}
            referrerPolicy="no-referrer"
            onClick={() => post.authorProfile && onSelectAuthor?.(post.authorProfile)}
            className="w-10 h-10 rounded-none object-cover border border-[#333] hover:border-[#D4FF3F] transition-colors cursor-pointer shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => post.authorProfile && onSelectAuthor?.(post.authorProfile)}
                className="text-sm font-bold text-[#F5F5F0] hover:text-[#D4FF3F] font-mono-code transition-colors text-left"
              >
                {authorName}
              </button>
              {post.authorId === spaceOwnerId && (
                <span className="px-1.5 py-0.5 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[10px] font-mono-code text-[#D4FF3F]">
                  HOST
                </span>
              )}
              {isAuthor && post.authorId !== spaceOwnerId && (
                <span className="text-[10px] font-mono-code text-[#888]">(You)</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code text-[#7A7A7A] mt-0.5">
              {authorRole && <span>{authorRole}</span>}
              {authorRole && authorCollege && <span>•</span>}
              {authorCollege && <span>{authorCollege}</span>}
              <span>•</span>
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Post Type Badge & Control Actions */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono-code font-bold uppercase tracking-wider border ${getTypeBadgeClass(
              post.type
            )}`}
          >
            {getTypeIcon(post.type)}
            {post.type}
          </span>

          {canModerate && !isEditing && (
            <div className="flex items-center gap-1 ml-1">
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-[#777] hover:text-[#D4FF3F] hover:bg-[#18181D] transition-colors"
                  title="Edit post"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="p-1.5 text-[#777] hover:text-red-400 hover:bg-[#18181D] transition-colors"
                title={isAuthor ? 'Delete post' : 'Moderate / Remove post'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Banner */}
      {isConfirmingDelete && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-800 text-xs font-mono-code flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {isAuthor
                ? 'Are you sure you want to delete this discussion?'
                : 'As Space Host, remove this post from the discussion feed?'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={isDeletingPost}
              className="px-2.5 py-1 bg-[#1A1A20] text-[#AAA] hover:text-[#FFF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={isDeletingPost}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white font-bold transition-colors inline-flex items-center gap-1"
            >
              {isDeletingPost ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Post Editing Form */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="mb-4 bg-[#121216] border border-[#2A2A32] p-4">
          <div className="flex items-center gap-2 mb-3">
            {(['Discussion', 'Question', 'Idea'] as DiscussionPostType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEditType(t)}
                className={`px-2.5 py-1 text-xs font-mono-code ${
                  editType === t ? 'bg-[#D4FF3F] text-[#080808] font-bold' : 'text-[#888] bg-[#1A1A20]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title (Optional)"
            className="w-full bg-[#0E0E12] border border-[#222] focus:border-[#D4FF3F] px-3 py-1.5 text-sm text-[#F5F5F0] mb-2 outline-none font-sans-clean"
          />

          <textarea
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-[#0E0E12] border border-[#222] focus:border-[#D4FF3F] p-3 text-sm text-[#E0E0DB] mb-3 outline-none font-sans-clean leading-relaxed"
            required
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSavingEdit}
              className="px-3 py-1 text-xs font-mono-code text-[#888] hover:text-[#CCC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit || !editContent.trim()}
              className="px-4 py-1.5 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code font-bold uppercase transition-all"
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        /* Post Content Display */
        <div className="mb-4">
          {post.title && (
            <h3 className="text-base sm:text-lg font-bold font-sans-clean text-[#F5F5F0] mb-2 tracking-tight">
              {post.title}
            </h3>
          )}
          <p className="text-sm text-[#C8C8C0] leading-relaxed font-sans-clean whitespace-pre-line break-words">
            {post.content}
          </p>
        </div>
      )}

      {/* Post Actions Row */}
      <div className="pt-3 border-t border-[#1C1C22] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Reaction Button (Appreciate) */}
          <button
            type="button"
            id={`post-appreciate-btn-${post.id}`}
            onClick={handleToggleReaction}
            disabled={isReacting}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-code transition-all border ${
              localHasReacted
                ? 'bg-[#D4FF3F]/15 border-[#D4FF3F]/40 text-[#D4FF3F] font-bold'
                : 'bg-[#121216] hover:bg-[#18181E] border-[#25252E] text-[#8A8A8A] hover:text-[#F5F5F0]'
            }`}
            title={localHasReacted ? 'Remove appreciation' : 'Appreciate this thought'}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                localHasReacted ? 'fill-[#D4FF3F] text-[#D4FF3F]' : 'text-current'
              }`}
            />
            <span>Appreciate</span>
            <span className="font-bold ml-0.5">({localReactionCount})</span>
          </button>

          {/* Comments Toggle */}
          <button
            type="button"
            id={`post-comments-toggle-${post.id}`}
            onClick={() => setShowComments(!showComments)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-code transition-all border ${
              showComments
                ? 'bg-[#181820] border-[#3A3A45] text-[#F5F5F0]'
                : 'bg-[#121216] hover:bg-[#18181E] border-[#25252E] text-[#8A8A8A] hover:text-[#F5F5F0]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Replies</span>
            <span className="font-bold ml-0.5">({post.commentCount || 0})</span>
          </button>
        </div>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-[#1C1C22] bg-[#0A0A0D] p-4 sm:p-5 -mx-2 sm:-mx-3">
          <div className="flex items-center gap-2 mb-4">
            <CornerDownRight className="w-4 h-4 text-[#D4FF3F]" />
            <h4 className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#F5F5F0]">
              Discussion Thread ({comments.length})
            </h4>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono-code text-[#666] bg-[#0E0E12] border border-[#1A1A20] mb-4">
              No replies yet.
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => {
                const commentAuthorName = comment.authorProfile?.name || 'Misfit Member';
                const commentAuthorAvatar =
                  comment.authorProfile?.avatarUrl ||
                  comment.authorProfile?.profilePhoto ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                const isCommentAuthor = currentUserId && comment.authorId === currentUserId;
                const canModerateComment = isCommentAuthor || isSpaceOwner;

                const commentTime = comment.createdAt
                  ? new Date(comment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent';

                return (
                  <div
                    key={comment.id}
                    id={`comment-item-${comment.id}`}
                    className="bg-[#111116] border border-[#1E1E26] p-3 sm:p-4 group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={commentAuthorAvatar}
                          alt={commentAuthorName}
                          referrerPolicy="no-referrer"
                          onClick={() => comment.authorProfile && onSelectAuthor?.(comment.authorProfile)}
                          className="w-7 h-7 rounded-none object-cover border border-[#333] hover:border-[#D4FF3F] transition-colors cursor-pointer shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => comment.authorProfile && onSelectAuthor?.(comment.authorProfile)}
                              className="text-xs font-bold text-[#F5F5F0] font-mono-code hover:text-[#D4FF3F] cursor-pointer transition-colors"
                            >
                              {commentAuthorName}
                            </span>
                            {comment.authorId === spaceOwnerId && (
                              <span className="text-[9px] font-mono-code text-[#D4FF3F] bg-[#D4FF3F]/10 px-1 border border-[#D4FF3F]/30">
                                HOST
                              </span>
                            )}
                            {isCommentAuthor && (
                              <span className="text-[9px] font-mono-code text-[#777]">(You)</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono-code text-[#666]">
                            {commentTime}
                          </span>
                        </div>
                      </div>

                      {canModerateComment && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="p-1 text-[#666] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete reply"
                        >
                          {deletingCommentId === comment.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#CCC] font-sans-clean leading-relaxed pl-9 whitespace-pre-line break-words">
                      {comment.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Composer */}
          {isMember ? (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                id={`comment-input-${post.id}`}
                type="text"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Write a thoughtful reply..."
                className="flex-1 bg-[#121217] border border-[#25252E] focus:border-[#D4FF3F] px-3.5 py-2 text-xs text-[#F5F5F0] placeholder-[#555] font-sans-clean outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newCommentContent.trim()}
                className="px-4 py-2 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-all disabled:opacity-40 inline-flex items-center gap-1 shrink-0"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Reply
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-3 bg-[#111116] border border-[#202026] text-center">
              <p className="text-xs text-[#888] font-mono-code mb-2">
                Join this Space to participate in the conversation.
              </p>
              {onPromptJoin && (
                <button
                  type="button"
                  onClick={onPromptJoin}
                  className="px-3 py-1 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code font-bold uppercase"
                >
                  Join Space
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
