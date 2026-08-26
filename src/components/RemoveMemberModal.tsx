import React from 'react';
import { Space, PublicProfile } from '../types';
import { UserMinus, AlertTriangle, X, Loader2 } from 'lucide-react';

interface RemoveMemberModalProps {
  isOpen: boolean;
  space: Space;
  member: PublicProfile | null;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  isOpen,
  space,
  member,
  isProcessing,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !member) return null;

  return (
    <div
      id="remove-member-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        id="remove-member-modal"
        className="relative w-full max-w-md bg-[#0D0D10] border border-red-900/50 shadow-2xl p-6 text-left animate-fade-in"
      >
        {/* Header Icon & Close */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-10 h-10 bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
            <UserMinus className="w-5 h-5" />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 text-[#777] hover:text-[#F5F5F0] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold font-mono-code text-[#F5F5F0] mb-2">
          Remove Member from Hub?
        </h3>

        {/* Description */}
        <p className="text-xs text-[#A0A09A] leading-relaxed mb-4">
          Are you sure you want to remove{' '}
          <span className="text-[#F5F5F0] font-bold">{member.name}</span> from{' '}
          <span className="text-[#D4FF3F] font-bold">{space.name}</span>? They will no longer be a participant in this Hub.
        </p>

        {/* Target Member Card Preview */}
        <div className="flex items-center gap-3 p-3 bg-[#141418] border border-[#24242C] mb-6">
          <img
            src={member.avatarUrl || member.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={member.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-none object-cover border border-[#333]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#F5F5F0] truncate font-mono-code">
              {member.name}
            </p>
            <p className="text-xs text-[#8A8A8A] truncate font-mono-code">
              {member.role || 'Member'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202026]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-[#16161A] hover:bg-[#202026] border border-[#333] text-xs font-mono-code text-[#AAA] hover:text-[#FFF] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono-code font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                Remove Member
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
