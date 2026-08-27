import React, { useState } from 'react';
import { CuriousBoardPost, UserProfile, ConnectionIntent } from '../types';
import { sparkService } from '../services/sparkService';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  Tag, 
  AlertCircle, 
  HelpCircle, 
  Compass, 
  Check 
} from 'lucide-react';

interface CreateSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSparkCreated: (spark: CuriousBoardPost) => void;
}

const PRESET_TOPIC_TAGS = [
  'Philosophy',
  'AI',
  'Hardware',
  'Design',
  'Architecture',
  'Cognitive Science',
  'Optics',
  'Robotics',
  'Books',
  'Acoustics',
  'Urbanism',
  'Economics',
];

export const CreateSparkModal: React.FC<CreateSparkModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSparkCreated,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Curiosity', 'Philosophy']);
  const [selectedIntent, setSelectedIntent] = useState<ConnectionIntent>('Exchange Ideas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUserId = currentUser.uid || currentUser.id;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    if (!currentUserId) {
      setError('You must be signed in to post a spark.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await sparkService.createSpark({
        authorId: currentUserId,
        authorName: currentUser.name || 'Anonymous Thinker',
        authorLocation: currentUser.location || currentUser.city || 'Worldwide',
        authorRole: currentUser.role || 'Explorer & Thinker',
        authorAvatar: currentUser.avatarUrl || currentUser.profilePhoto,
        title: title.trim() || undefined,
        content: content.trim(),
        tags: tags.length > 0 ? tags : ['Curiosity', 'Ideas'],
        intents: [selectedIntent],
      });

      setTitle('');
      setContent('');
      setTags(['Curiosity', 'Philosophy']);
      onSparkCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create spark:', err);
      setError(err?.message || 'Failed to post spark. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-spark-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="create-spark-modal"
        className="relative w-full max-w-xl bg-[#0D0D10] border border-[#26262B] shadow-2xl p-6 sm:p-8 text-left animate-fadeIn max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 border-b border-[#1E1E24] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#16161C] border border-[#D4FF3F]/40 flex items-center justify-center text-[#D4FF3F] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold block">
                CURIOSITY & INQUIRY
              </span>
              <h2 className="text-xl sm:text-2xl font-editorial text-[#F2F2ED] font-light">
                Post a Spark / Question
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-[#777] hover:text-[#F2F2ED] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono-code flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Optional Title */}
          <div>
            <label className="block text-xs font-mono-code uppercase tracking-wider text-[#A0A09A] mb-1.5">
              Topic or Question Title <span className="text-[#666] lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Why do analog interfaces feel more memorable?"
              maxLength={120}
              className="w-full bg-[#141418] border border-[#26262E] focus:border-[#D4FF3F] px-4 py-2.5 text-sm font-sans-clean text-[#F2F2ED] placeholder-[#555] outline-none transition-colors"
            />
          </div>

          {/* Main Thought / Inquiry Content */}
          <div>
            <label className="block text-xs font-mono-code uppercase tracking-wider text-[#A0A09A] mb-1.5 flex items-center justify-between">
              <span>Your Thought, Question, or Rabbit Hole <strong className="text-[#D4FF3F]">*</strong></span>
              <span className="text-[10px] text-[#666] font-normal">{content.length} chars</span>
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an open reflection, an unresolved question, or an unusual concept you've been pondering..."
              className="w-full bg-[#141418] border border-[#26262E] focus:border-[#D4FF3F] p-4 text-sm font-sans-clean text-[#F2F2ED] placeholder-[#555] outline-none transition-colors leading-relaxed"
            />
          </div>

          {/* Connection Intent */}
          <div>
            <label className="block text-xs font-mono-code uppercase tracking-wider text-[#A0A09A] mb-1.5">
              Primary Intent
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['Exchange Ideas', 'Build Together', 'Collaborate', 'Learn Together', 'Just Talk'] as ConnectionIntent[]).map((intent) => (
                <button
                  type="button"
                  key={intent}
                  onClick={() => setSelectedIntent(intent)}
                  className={`px-3 py-1.5 text-[11px] font-mono-code uppercase tracking-wider border transition-all text-left truncate ${
                    selectedIntent === intent
                      ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold'
                      : 'bg-[#141418] text-[#888] border-[#26262E] hover:border-[#444] hover:text-[#CCC]'
                  }`}
                >
                  {intent}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Tags */}
          <div>
            <label className="block text-xs font-mono-code uppercase tracking-wider text-[#A0A09A] mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#D4FF3F]" />
              <span>Topic Tags ({tags.length}/8)</span>
            </label>

            {/* Selected Tags Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-[#1A1A22] border border-[#D4FF3F]/40 text-[#D4FF3F] text-xs font-mono-code px-2.5 py-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-[#FFF] ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Input & Quick suggestions */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder="Type tag & press Enter..."
                className="flex-1 bg-[#141418] border border-[#26262E] focus:border-[#D4FF3F] px-3 py-1.5 text-xs font-mono-code text-[#F2F2ED] placeholder-[#555] outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim()}
                className="px-3 py-1.5 bg-[#202026] text-[#F2F2ED] hover:bg-[#303038] text-xs font-mono-code uppercase tracking-wider disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-mono-code uppercase text-[#666] mr-1 self-center">
                Suggestions:
              </span>
              {PRESET_TOPIC_TAGS.slice(0, 6).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handleAddTag(preset)}
                  disabled={tags.includes(preset)}
                  className={`text-[10px] font-mono-code px-2 py-0.5 border transition-colors ${
                    tags.includes(preset)
                      ? 'border-transparent text-[#555] cursor-default'
                      : 'border-[#222228] text-[#888] hover:border-[#D4FF3F]/40 hover:text-[#D4FF3F]'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#1E1E24] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono-code uppercase tracking-wider text-[#8A8A8A] hover:text-[#F2F2ED] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 bg-[#D4FF3F] hover:bg-[#c2ed2e] text-[#080808] font-mono-code text-xs uppercase font-bold tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Spark</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
