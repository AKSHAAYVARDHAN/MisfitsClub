import React, { useState } from 'react';
import { DiscussionPostType, UserProfile } from '../types';
import { discussionService } from '../services/discussionService';
import { 
  MessageSquare, 
  HelpCircle, 
  Lightbulb, 
  Send, 
  Loader2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface CreatePostComposerProps {
  spaceId: string;
  currentUser: UserProfile | null;
  isMember: boolean;
  onPostCreated?: () => void;
  onPromptJoin?: () => void;
}

const POST_TYPES: { type: DiscussionPostType; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  {
    type: 'Discussion',
    label: 'Discussion',
    icon: MessageSquare,
    desc: 'Open reflection or topic',
  },
  {
    type: 'Question',
    label: 'Question',
    icon: HelpCircle,
    desc: 'Seeking insight or perspective',
  },
  {
    type: 'Idea',
    label: 'Idea',
    icon: Lightbulb,
    desc: 'New hypothesis or concept',
  },
];

export const CreatePostComposer: React.FC<CreatePostComposerProps> = ({
  spaceId,
  currentUser,
  isMember,
  onPostCreated,
  onPromptJoin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [postType, setPostType] = useState<DiscussionPostType>('Discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = currentUser?.uid || currentUser?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !isMember || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await discussionService.createPost({
        spaceId,
        authorId: currentUserId,
        type: postType,
        title: title.trim() || undefined,
        content: content.trim(),
      });

      setTitle('');
      setContent('');
      setPostType('Discussion');
      setIsOpen(false);
      onPostCreated?.();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err?.message || 'Failed to start discussion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMember) {
    return (
      <div className="bg-[#0C0C0F] border border-[#222228] p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#16161C] border border-[#2A2A34] flex items-center justify-center text-[#D4FF3F] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono-code text-[#F5F5F0]">
              Join Hub to Participate
            </h3>
            <p className="text-xs text-[#8A8A8A] font-sans-clean mt-0.5">
              Members can start discussions, ask questions, share ideas, and leave replies.
            </p>
          </div>
        </div>
        {onPromptJoin && (
          <button
            type="button"
            onClick={onPromptJoin}
            className="px-5 py-2 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-all whitespace-nowrap"
          >
            Join Hub
          </button>
        )}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div 
        id="discussion-composer-collapsed"
        className="bg-[#0E0E12] border border-[#222228] hover:border-[#D4FF3F]/40 p-4 mb-8 transition-colors cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-3">
          <img
            src={currentUser?.avatarUrl || currentUser?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt="You"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-none object-cover border border-[#333] shrink-0"
          />
          <div className="flex-1 bg-[#141418] border border-[#222] px-4 py-2 text-xs font-mono-code text-[#777] group-hover:text-[#AAA] group-hover:border-[#333] transition-colors">
            Start a thought, question, or idea in this Hub...
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-[#1A1A20] text-[#D4FF3F] group-hover:bg-[#D4FF3F] group-hover:text-[#080808] border border-[#333] text-xs font-mono-code font-bold uppercase tracking-wider transition-all hidden sm:inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="discussion-composer-expanded" className="bg-[#0D0D11] border border-[#2D2D35] p-5 sm:p-6 mb-8 relative">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#1E1E24]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#D4FF3F] rounded-full inline-block" />
          <h3 className="text-xs font-mono-code font-bold text-[#F5F5F0] uppercase tracking-wider">
            Start a Discussion
          </h3>
        </div>

        {/* Post Type Selector */}
        <div className="flex items-center gap-1.5 bg-[#141418] p-1 border border-[#26262E]">
          {POST_TYPES.map((item) => {
            const Icon = item.icon;
            const isSelected = postType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setPostType(item.type)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-code transition-all ${
                  isSelected
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold shadow-sm'
                    : 'text-[#888] hover:text-[#CCC] hover:bg-[#1C1C22]'
                }`}
                title={item.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono-code flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Optional Title */}
        <div className="mb-3">
          <input
            id="discussion-post-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              postType === 'Question'
                ? 'What is your question? (Optional title)'
                : postType === 'Idea'
                ? 'What is the idea? (Optional title)'
                : 'Title or topic header (Optional)'
            }
            maxLength={180}
            className="w-full bg-[#121216] border border-[#25252D] focus:border-[#D4FF3F] px-3.5 py-2 text-sm text-[#F5F5F0] placeholder-[#555] font-sans-clean outline-none transition-colors"
          />
        </div>

        {/* Content Textarea */}
        <div className="mb-4">
          <textarea
            id="discussion-post-content-input"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === 'Question'
                ? 'Elaborate on the context, what you have tried, or what specific perspective you need...'
                : postType === 'Idea'
                ? 'Describe the hypothesis, mechanics, inspiration, or how this could be explored...'
                : 'Share your perspective, research discovery, project insight, or spark for conversation...'
            }
            required
            className="w-full bg-[#121216] border border-[#25252D] focus:border-[#D4FF3F] p-3.5 text-sm text-[#E0E0DB] placeholder-[#555] font-sans-clean leading-relaxed outline-none transition-colors resize-y"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-[11px] font-mono-code text-[#666]">
            Editorial, intentional discourse. Keep it substantive.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-mono-code text-[#888] hover:text-[#CCC] hover:bg-[#1A1A20] transition-colors"
            >
              Cancel
            </button>
            <button
              id="discussion-post-submit-btn"
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-5 py-2 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-all disabled:opacity-40 inline-flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Publish {postType}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
