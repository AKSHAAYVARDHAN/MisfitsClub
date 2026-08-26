import React, { useState } from 'react';
import { Space, SpaceCategory, UserProfile } from '../types';
import { spaceService, CreateSpaceInput } from '../services/spaceService';
import { X, Layers, Plus, Sparkles, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSpaceCreated: (space: Space) => void;
}

const CATEGORIES: SpaceCategory[] = [
  'Building',
  'Technology',
  'Design',
  'Art',
  'Science',
  'Business',
  'Learning',
  'Writing',
  'Gaming',
  'Other',
];

const SUGGESTED_TAGS = [
  'Hardware',
  'Local AI',
  'Audio DSP',
  'Philosophy',
  'Typography',
  'Robotics',
  'Cognitive Science',
  'Spatial Computing',
  'Indie Hacking',
];

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSpaceCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SpaceCategory>('Building');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean) && tags.length < 10) {
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
    setError(null);

    if (!name.trim()) {
      setError('Please provide a name for your Hub.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description explaining what this Hub is about.');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateSpaceInput = {
        name: name.trim(),
        description: description.trim(),
        category,
        tags,
        visibility: 'public',
      };

      const newSpace = await spaceService.createSpace(input, currentUser);
      
      // Reset form
      setName('');
      setDescription('');
      setCategory('Building');
      setTags([]);
      setTagInput('');
      
      onSpaceCreated(newSpace);
      onClose();
    } catch (err: any) {
      console.error('Failed to create space:', err);
      setError(err?.message || 'Failed to create Hub. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-space-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="create-space-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0F0F11] border border-[#F5F5F0]/15 rounded-none shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5F5F0]/10 bg-[#141417]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[#D4FF3F]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wider text-[#F5F5F0] font-mono-code uppercase">
                CREATE A HUB
              </h2>
              <p className="text-xs text-[#8A8A8A]">
                Gather misfits around a shared obsession, project, or inquiry.
              </p>
            </div>
          </div>
          <button
            id="create-space-close-btn"
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#F5F5F0] hover:bg-[#202024] transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-red-300 text-xs font-mono-code">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Hub Name */}
          <div>
            <label className="block text-xs font-mono-code text-[#A0A09A] uppercase tracking-wider mb-1.5">
              Hub Name <span className="text-[#D4FF3F]">*</span>
            </label>
            <input
              id="create-space-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Modular Synth & Hardware Hackers"
              className="w-full px-3.5 py-2.5 bg-[#080808] border border-[#2A2A2E] focus:border-[#D4FF3F] text-[#F5F5F0] placeholder-[#555] text-sm focus:outline-none transition-colors"
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] font-mono-code text-[#666]">{name.length}/100</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-mono-code text-[#A0A09A] uppercase tracking-wider mb-1.5">
              Category <span className="text-[#D4FF3F]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-2 text-xs font-mono-code transition-all text-center border ${
                      isSelected
                        ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                        : 'bg-[#141416] text-[#A0A09A] border-[#252528] hover:border-[#444] hover:text-[#F5F5F0]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono-code text-[#A0A09A] uppercase tracking-wider mb-1.5">
              Description & Purpose <span className="text-[#D4FF3F]">*</span>
            </label>
            <textarea
              id="create-space-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What is this hub about? Who is it for? What projects, questions, or ideas will members explore together?"
              className="w-full px-3.5 py-2.5 bg-[#080808] border border-[#2A2A2E] focus:border-[#D4FF3F] text-[#F5F5F0] placeholder-[#555] text-sm focus:outline-none transition-colors resize-none"
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] font-mono-code text-[#666]">{description.length}/2000</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono-code text-[#A0A09A] uppercase tracking-wider mb-1.5">
              Tags (Up to 10)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="create-space-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-3 py-1.5 bg-[#080808] border border-[#2A2A2E] focus:border-[#D4FF3F] text-[#F5F5F0] placeholder-[#555] text-xs focus:outline-none"
                disabled={isSubmitting || tags.length >= 10}
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim() || tags.length >= 10 || isSubmitting}
                className="px-3 py-1.5 bg-[#202024] hover:bg-[#2A2A30] text-[#F5F5F0] text-xs font-mono-code border border-[#333] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1A1A1E] text-[#D4FF3F] border border-[#D4FF3F]/30 text-xs font-mono-code"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#888] hover:text-[#FF5555] ml-0.5 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono-code text-[#666]">Suggestions:</span>
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 5).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => handleAddTag(sugg)}
                  className="text-[10px] font-mono-code text-[#8A8A8A] hover:text-[#F5F5F0] bg-[#121214] px-1.5 py-0.5 border border-[#222] hover:border-[#444] transition-colors"
                >
                  +{sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Banner */}
          <div className="p-3 bg-[#121214] border border-[#222] flex items-center justify-between text-xs font-mono-code text-[#8A8A8A]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D4FF3F]" />
              <span>Public Hub (Open for all verified Misfits to join)</span>
            </div>
            <span className="text-[10px] text-[#D4FF3F] bg-[#D4FF3F]/10 px-2 py-0.5 border border-[#D4FF3F]/20">
              PHASE 1
            </span>
          </div>

          {/* Creator Attribution */}
          <div className="p-3 bg-[#0A0A0C] border border-[#1E1E22] flex items-center gap-3">
            <img
              src={currentUser.avatarUrl || currentUser.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-none border border-[#333] object-cover"
            />
            <div>
              <p className="text-xs font-mono-code text-[#F5F5F0] font-bold">
                {currentUser.name} <span className="text-[10px] text-[#D4FF3F] font-normal">(Host & Creator)</span>
              </p>
              <p className="text-[11px] text-[#888]">{currentUser.role || 'Misfits Member'}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5F5F0]/10">
            <button
              id="create-space-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono-code text-[#8A8A8A] hover:text-[#F5F5F0] transition-colors focus:outline-none"
            >
              Cancel
            </button>
            <button
              id="create-space-submit-btn"
              type="submit"
              disabled={isSubmitting || !name.trim() || !description.trim()}
              className="px-5 py-2 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Hub...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Hub
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
