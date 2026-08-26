import React, { useState } from 'react';
import { UserProfile } from '../types';
import { CONVERSATION_STARTERS } from '../data/mockData';
import { Sparkles, X, ArrowRight, MessageSquare, Send } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: UserProfile | null;
  currentUser: UserProfile | null;
  onStartConversation: (targetProfile: UserProfile, starterMessage: string) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  currentUser,
  onStartConversation,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>(CONVERSATION_STARTERS[0]);
  const [customNote, setCustomNote] = useState<string>('');

  if (!isOpen || !targetProfile) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMessage = customNote.trim() || selectedPrompt;
    onStartConversation(targetProfile, finalMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto selection:bg-[#D4FF3F] selection:text-[#080808]">
      <div className="relative w-full max-w-xl border border-[#1E1E24] bg-[#0E0E12] p-6 sm:p-8 shadow-2xl text-[#F5F5F0] my-8">
        
        {/* Close button */}
        <button
          id="connect-modal-close-btn"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-[#7A7A82] hover:text-[#F5F5F0] transition-colors"
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
            src={targetProfile.avatarUrl}
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

        {/* Conversation Starter Prompts */}
        <div className="mb-6">
          <label className="text-[10px] text-[#7A7A82] uppercase tracking-widest block font-mono-code font-bold mb-2">
            Choose a conversation starter:
          </label>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {CONVERSATION_STARTERS.map((prompt) => {
              const isSelected = selectedPrompt === prompt && !customNote;
              return (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setCustomNote(prompt);
                  }}
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

        {/* Custom Note or starter review */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="text-[10px] text-[#7A7A82] uppercase tracking-widest block font-mono-code font-bold mb-1.5">
              Or write your own note:
            </label>
            <textarea
              id="connect-note-input"
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Add a thoughtful note, share what caught your attention in their profile, or send the selected starter..."
              className="input-editorial w-full resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1E1E24]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>

            <button
              id="start-conversation-btn"
              type="submit"
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Start Conversation</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
