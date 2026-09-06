import React, { useState, useEffect } from 'react';
import { UserProfile, PublicProfile, Connection } from '../types';
import { CONVERSATION_STARTERS } from '../data/mockData';
import { Sparkles, X, UserPlus, Clock, Check, Loader2 } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: UserProfile | PublicProfile | null;
  currentUser: UserProfile | null;
  connections?: Connection[];
  onConnect?: (targetProfile: UserProfile | PublicProfile, introNote?: string) => Promise<void>;
  onStartConversation?: (targetProfile: UserProfile, starterMessage: string) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  currentUser,
  connections = [],
  onConnect,
  onStartConversation,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>(CONVERSATION_STARTERS[0]);
  const [customNote, setCustomNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState<boolean>(false);

  // Reset state when modal opens with a profile
  useEffect(() => {
    if (isOpen) {
      setSelectedPrompt(CONVERSATION_STARTERS[0]);
      setCustomNote('');
      setIsSubmitting(false);
      setError(null);
      setIsSent(false);
    }
  }, [isOpen, targetProfile?.id]);

  if (!isOpen || !targetProfile) return null;

  const currentUserId = currentUser?.uid || currentUser?.id;
  const targetUserId = targetProfile.uid || targetProfile.id;

  // Check relationship with this profile
  const existingConn = connections.find(
    (c) =>
      (currentUserId && targetUserId && c.id === `conn_${[currentUserId, targetUserId].sort().join('_')}`) ||
      (c.requesterId === currentUserId && (c.targetId === targetUserId || c.profileId === targetUserId)) ||
      (c.targetId === currentUserId && (c.requesterId === targetUserId || c.profileId === targetUserId)) ||
      (targetUserId && c.profileId === targetUserId) ||
      (c.participants && currentUserId && targetUserId && c.participants.includes(targetUserId) && c.participants.includes(currentUserId))
  );

  const isPending = isSent || (existingConn?.status === 'pending' && existingConn.requesterId === currentUserId);
  const isConnected = existingConn?.status === 'connected';

  // Compact Success / Already Pending State
  if (isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto selection:bg-[#D4FF3F] selection:text-[#080808]">
        <div className="relative w-full max-w-md border border-[#1E1E24] bg-[#0E0E12] p-6 sm:p-8 shadow-2xl text-[#F5F5F0] my-8 text-center animate-fadeIn">
          <button
            id="connect-modal-close-btn"
            onClick={onClose}
            className="absolute right-5 top-5 p-2 text-[#7A7A82] hover:text-[#F5F5F0] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-5">
            <Clock className="w-7 h-7" />
          </div>

          <span className="text-[10px] text-blue-400 font-mono-code font-bold uppercase tracking-widest block mb-1">
            Status
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light mb-2">
            Request Sent
          </h2>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-sans-clean max-w-xs mx-auto leading-relaxed">
            Your connection request has been sent to {targetProfile.name}.
          </p>

          <div className="mt-6 pt-5 border-t border-[#1E1E24] flex items-center justify-center">
            <button
              id="connect-modal-done-btn"
              type="button"
              onClick={onClose}
              className="btn-primary px-6 py-2.5 text-xs font-mono-code uppercase tracking-wider"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already Connected State
  if (isConnected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto selection:bg-[#D4FF3F] selection:text-[#080808]">
        <div className="relative w-full max-w-md border border-[#1E1E24] bg-[#0E0E12] p-6 sm:p-8 shadow-2xl text-[#F5F5F0] my-8 text-center animate-fadeIn">
          <button
            id="connect-modal-close-btn"
            onClick={onClose}
            className="absolute right-5 top-5 p-2 text-[#7A7A82] hover:text-[#F5F5F0] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-full border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 text-[#D4FF3F] mx-auto flex items-center justify-center mb-5">
            <Check className="w-7 h-7" />
          </div>

          <span className="text-[10px] text-[#D4FF3F] font-mono-code font-bold uppercase tracking-widest block mb-1">
            Connected
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light mb-2">
            Already in Circle
          </h2>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-sans-clean max-w-xs mx-auto leading-relaxed">
            You and {targetProfile.name} are already connected.
          </p>

          <div className="mt-6 pt-5 border-t border-[#1E1E24] flex items-center justify-center">
            <button
              id="connect-modal-close-connected-btn"
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2.5 text-xs font-mono-code uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const targetInterests = targetProfile.interests || [];
  const targetIntents = targetProfile.intents || [];
  const currentInterests = currentUser?.interests || [];
  const currentIntents = currentUser?.intents || [];

  // Calculate shared overlapping interests and intents
  const mutualInterests = currentUser
    ? targetInterests.filter((i) => currentInterests.includes(i))
    : targetInterests.slice(0, 2);

  const mutualIntents = currentUser
    ? targetIntents.filter((i) => currentIntents.includes(i))
    : targetIntents.slice(0, 1);

  const allMutualHighlights = Array.from(new Set([...mutualInterests, ...mutualIntents]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (onConnect) {
        // Send connection request only. Does NOT send message or create conversation.
        await onConnect(targetProfile, customNote.trim() || undefined);
      } else if (onStartConversation) {
        onStartConversation(targetProfile as UserProfile, customNote.trim() || '');
      }
      setIsSent(true);
    } catch (err: any) {
      console.error('Failed to send connection request:', err);
      setError(err?.message || 'Failed to send connection request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto selection:bg-[#D4FF3F] selection:text-[#080808]">
      <div className="relative w-full max-w-xl border border-[#1E1E24] bg-[#0E0E12] p-6 sm:p-8 shadow-2xl text-[#F5F5F0] my-8">
        
        {/* Close button */}
        <button
          id="connect-modal-close-btn"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-5 top-5 p-2 text-[#7A7A82] hover:text-[#F5F5F0] transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#121216] border border-[#1E1E24]">
            <Sparkles className="w-5 h-5 text-[#D4FF3F]" />
          </div>
          <div>
            <span className="text-[10px] text-[#D4FF3F] font-mono-code font-bold uppercase tracking-widest block">
              Serendipitous Match
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light">
              You found a Misfit.
            </h2>
          </div>
        </div>

        {/* Target person preview card */}
        <div className="flex items-center gap-3.5 p-3.5 bg-[#09090B] border border-[#1E1E24] mb-6">
          <img
            src={targetProfile.avatarUrl || (targetProfile as any).profilePhoto}
            alt={targetProfile.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 object-cover border border-[#24242C]"
          />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0]">
              {targetProfile.name}
            </h3>
            <p className="text-[10px] text-[#7A7A82] uppercase tracking-widest font-mono-code mt-0.5">
              {targetProfile.location} · {targetProfile.roleEmoji} {targetProfile.role}
            </p>
          </div>
        </div>

        {/* What you both care about */}
        <div className="border border-[#1E1E24] bg-[#09090B] p-4 mb-6">
          <span className="text-[10px] text-[#7A7A82] uppercase tracking-widest block font-mono-code font-bold mb-2">
            You both care about:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allMutualHighlights.length > 0 ? (
              allMutualHighlights.map((item) => (
                <span
                  key={item}
                  className="tag-pill-active"
                >
                  {item}
                </span>
              ))
            ) : (
              targetInterests.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="tag-pill"
                >
                  {item}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Conversation Starter Prompts (Kept as contextual prompts/inspiration) */}
        <div className="mb-6">
          <label className="text-[10px] text-[#7A7A82] uppercase tracking-widest block font-mono-code font-bold mb-2">
            Choose a conversation starter:
          </label>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {CONVERSATION_STARTERS.map((prompt) => {
              const isSelected = selectedPrompt === prompt;
              return (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`w-full text-left p-3 border text-xs sm:text-sm font-editorial transition-all ${
                    isSelected
                      ? 'border-[#D4FF3F]/60 bg-[#121216] text-[#F5F5F0]'
                      : 'border-[#1E1E24] bg-[#09090B] text-[#8E8E93] hover:border-[#383844] hover:text-[#F5F5F0]'
                  }`}
                >
                  “{prompt}”
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Note and Action Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono-code flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="mb-6">
            <label className="text-[10px] text-[#7A7A82] uppercase tracking-widest block font-mono-code font-bold mb-1.5">
              Or write your own note:
            </label>
            <textarea
              id="connect-note-input"
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Optional: Add a brief introduction note to your request..."
              className="input-editorial w-full resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#1E1E24]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary order-2 sm:order-1 text-center"
            >
              Cancel
            </button>

            <button
              id="connect-with-member-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Connect with {targetProfile.name}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
