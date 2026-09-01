import React, { useState } from 'react';
import { Space } from '../types';
import { spaceService } from '../services/spaceService';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteSpaceModalProps {
  space: Space;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (spaceId: string) => void;
}

export const DeleteSpaceModal: React.FC<DeleteSpaceModalProps> = ({
  space,
  currentUserId,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!currentUserId || isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      await spaceService.deleteSpace(space.id, currentUserId);
      onDeleted(space.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to delete Hub:', err);
      setError(err?.message || 'Unable to delete Hub. Please check your connection and try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-space-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-space-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-hub-title"
        className="relative w-full max-w-md bg-[#0D0D10] border border-[#2D1517] shadow-2xl p-6 sm:p-7 text-left animate-scale-up"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-[#888] hover:text-[#F5F5F0] transition-colors p-1 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="delete-hub-title"
              className="text-lg font-bold font-sans-clean text-[#F5F5F0] tracking-tight"
            >
              Delete this Hub?
            </h3>
            <p className="text-xs font-mono-code text-red-400/90 mt-0.5 font-medium">
              "{space.name}"
            </p>
          </div>
        </div>

        {/* Explanation / Warning Body */}
        <p className="text-xs sm:text-sm text-[#A0A09A] font-sans-clean leading-relaxed mb-6">
          This will permanently remove the Hub and its associated Hub content according to the platform's deletion policy.
        </p>

        {/* Error Notice if any */}
        {error && (
          <div className="mb-5 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono-code flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1C1C22]">
          <button
            id="cancel-delete-hub-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#141418] hover:bg-[#1C1C22] border border-[#2A2A32] text-xs font-mono-code text-[#B5B5AF] hover:text-[#F5F5F0] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            id="confirm-delete-hub-btn"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs font-mono-code font-bold uppercase tracking-wider transition-all disabled:opacity-60 inline-flex items-center gap-2 shadow-lg shadow-red-950/50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Hub</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
