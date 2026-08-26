import React, { useState, useRef } from 'react';
import { Space, SpaceCategory, UpdateSpaceInput } from '../types';
import { spaceService } from '../services/spaceService';
import { storageService } from '../services/storageService';
import { 
  X, 
  Sparkles, 
  Camera, 
  Upload, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Check, 
  Tag, 
  Layers, 
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface EditSpaceModalProps {
  space: Space;
  hostId: string;
  isOpen: boolean;
  onClose: () => void;
  onSpaceUpdated: (updated: Space) => void;
}

const HUB_CATEGORIES: SpaceCategory[] = [
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

const PRESET_HUB_PHOTOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
];

export const EditSpaceModal: React.FC<EditSpaceModalProps> = ({
  space,
  hostId,
  isOpen,
  onClose,
  onSpaceUpdated,
}) => {
  const [name, setName] = useState<string>(space.name || '');
  const [description, setDescription] = useState<string>(space.description || '');
  const [category, setCategory] = useState<SpaceCategory>(space.category || 'Building');
  const [tags, setTags] = useState<string[]>(space.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(space.profilePhoto || '');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(space.profilePhoto || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean) && tags.length < 20) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image is larger than 5MB. Please choose a smaller image.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSelectPreset = (url: string) => {
    setSelectedFile(null);
    setPreviewUrl(url);
    setPhotoUrl(url);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Hub name is required.');
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError('Hub description is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalPhotoUrl = photoUrl;

      // If a new file was chosen, upload it to storage
      if (selectedFile) {
        setIsUploadingPhoto(true);
        try {
          finalPhotoUrl = await storageService.uploadHubPhoto(space.id, selectedFile);
        } catch (uploadErr: any) {
          console.warn('Storage upload notice:', uploadErr);
          // If storage upload fails, use previewUrl data URI
          finalPhotoUrl = previewUrl;
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const input: UpdateSpaceInput = {
        name: trimmedName.slice(0, 100),
        description: trimmedDesc.slice(0, 2000),
        category,
        tags,
        profilePhoto: finalPhotoUrl || '',
      };

      const updated = await spaceService.updateSpace(space.id, hostId, input);
      setSuccessMsg('Hub updated successfully!');
      onSpaceUpdated(updated);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Failed to update Hub:', err);
      setError(err?.message || 'Failed to update Hub.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-space-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-space-modal"
        className="relative w-full max-w-2xl bg-[#0C0C0E] border border-[#2A2A32] shadow-2xl p-6 sm:p-8 my-8 text-left animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#202026]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D4FF3F]/15 border border-[#D4FF3F]/30 flex items-center justify-center text-[#D4FF3F]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono-code text-[#F5F5F0]">
                MANAGE HUB
              </h2>
              <p className="text-xs font-mono-code text-[#8A8A8A]">
                Host Settings & Moderation for <span className="text-[#CCC] font-bold">{space.name}</span>
              </p>
            </div>
          </div>

          <button
            id="edit-space-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#777] hover:text-[#F5F5F0] hover:bg-[#1A1A20] border border-transparent hover:border-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono-code flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 text-[#D4FF3F] text-xs font-mono-code flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hub Profile Photo / Avatar Section */}
          <div className="p-4 bg-[#121216] border border-[#222228]">
            <label className="block text-xs font-mono-code font-bold uppercase tracking-wider text-[#F5F5F0] mb-2">
              HUB PROFILE PHOTO / BANNER
            </label>
            <p className="text-xs text-[#8A8A8A] mb-4">
              Add a custom cover or avatar image to help misfits identify your Hub.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              {/* Photo Preview */}
              <div className="relative w-20 h-20 bg-[#1A1A20] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Hub Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#666]">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-[9px] font-mono-code uppercase">No Photo</span>
                  </div>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#D4FF3F]" />
                  </div>
                )}
              </div>

              {/* Upload & Action Controls */}
              <div className="space-y-2 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="hub-photo-file-input"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C22] hover:bg-[#25252D] border border-[#333] hover:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#D4FF3F]" />
                    Upload Image
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C22] hover:bg-red-950/30 border border-[#333] hover:border-red-800 text-xs font-mono-code text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-mono-code text-[#666]">
                  Supports PNG, JPG, WebP up to 5MB.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="block text-[11px] font-mono-code text-[#777] mb-2 uppercase">
                Or Choose an Aesthetic Preset:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_HUB_PHOTOS.map((preset, idx) => (
                  <button
                    key={`${preset}-${idx}`}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-10 h-10 border transition-all overflow-hidden ${
                      previewUrl === preset
                        ? 'border-[#D4FF3F] scale-105 shadow-md'
                        : 'border-[#333] hover:border-[#777] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset}
                      alt={`Preset ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hub Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-hub-name"
                className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#F5F5F0]"
              >
                HUB NAME <span className="text-[#D4FF3F]">*</span>
              </label>
              <span className="text-[11px] font-mono-code text-[#666]">
                {name.length}/100
              </span>
            </div>
            <input
              id="edit-hub-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Autonomous AI Agents Guild"
              className="w-full bg-[#121216] border border-[#2C2C34] focus:border-[#D4FF3F] px-4 py-2.5 text-sm text-[#F5F5F0] font-sans-clean outline-none transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="edit-hub-category"
              className="block text-xs font-mono-code font-bold uppercase tracking-wider text-[#F5F5F0] mb-2"
            >
              CATEGORY <span className="text-[#D4FF3F]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {HUB_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 text-xs font-mono-code uppercase text-center border transition-all ${
                    category === cat
                      ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                      : 'bg-[#121216] text-[#A0A09A] border-[#2A2A32] hover:border-[#444] hover:text-[#F5F5F0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-hub-description"
                className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#F5F5F0]"
              >
                DESCRIPTION / MISSION <span className="text-[#D4FF3F]">*</span>
              </label>
              <span className="text-[11px] font-mono-code text-[#666]">
                {description.length}/2000
              </span>
            </div>
            <textarea
              id="edit-hub-description"
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this Hub explores, who it is for, and the collaborative focus..."
              className="w-full bg-[#121216] border border-[#2C2C34] focus:border-[#D4FF3F] p-3 text-sm text-[#F5F5F0] font-sans-clean leading-relaxed outline-none transition-colors resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-hub-tags-input"
                className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#F5F5F0]"
              >
                TAGS & INTERESTS ({tags.length}/20)
              </label>
              <span className="text-[11px] font-mono-code text-[#666]">
                Press Enter or Comma to add
              </span>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                id="edit-hub-tags-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g. multi-agent, compilers, zero-shot"
                className="flex-1 bg-[#121216] border border-[#2C2C34] focus:border-[#D4FF3F] px-3 py-2 text-xs font-mono-code text-[#F5F5F0] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-[#1A1A20] hover:bg-[#25252D] border border-[#333] text-xs font-mono-code text-[#F5F5F0] transition-colors"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-[#121216] border border-[#222228]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#18181F] border border-[#2C2C38] text-[#D4FF3F] text-xs font-mono-code"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-[#202026] flex items-center justify-end gap-3">
            <button
              id="edit-space-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#141418] hover:bg-[#1C1C22] border border-[#2E2E36] text-xs font-mono-code text-[#A0A09A] hover:text-[#F5F5F0] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              id="edit-space-save-btn"
              type="submit"
              disabled={isSubmitting || !name.trim() || !description.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D4FF3F] hover:bg-[#bce62f] text-[#080808] font-mono-code text-xs font-bold uppercase tracking-wider shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Hub Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
