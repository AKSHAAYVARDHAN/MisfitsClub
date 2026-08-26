import React, { useState } from 'react';
import { Space, UserProfile } from '../types';
import { Users, Check, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

interface SpaceCardProps {
  space: Space;
  currentUser: UserProfile | null;
  onSelect: (space: Space) => void;
  onJoin?: (spaceId: string) => Promise<void>;
  onLeave?: (spaceId: string) => Promise<void>;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({
  space,
  currentUser,
  onSelect,
  onJoin,
  onLeave,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const currentUserId = currentUser?.uid || currentUser?.id;
  const isOwner = currentUserId && space.ownerId === currentUserId;
  const isMember = currentUserId && space.memberIds?.includes(currentUserId);

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isOwner || isProcessing) return;

    setIsProcessing(true);
    try {
      if (isMember) {
        if (onLeave) await onLeave(space.id);
      } else {
        if (onJoin) await onJoin(space.id);
      }
    } catch (err) {
      console.error('Failed to toggle membership:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id={`space-card-${space.id}`}
      onClick={() => onSelect(space)}
      className="group relative bg-[#0D0D0F] hover:bg-[#121215] border border-[#F5F5F0]/10 hover:border-[#D4FF3F]/50 transition-all duration-200 cursor-pointer flex flex-col justify-between p-5 text-left"
    >
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {space.profilePhoto && (
              <img
                src={space.profilePhoto}
                alt={space.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 object-cover border border-[#D4FF3F]/30"
              />
            )}
            {/* Category Pill */}
            <span className="px-2 py-0.5 text-[10px] font-mono-code uppercase font-bold tracking-wider bg-[#1A1A1E] text-[#D4FF3F] border border-[#D4FF3F]/20">
              {space.category}
            </span>
          </div>

          {/* Member Count */}
          <div className="flex items-center gap-1.5 text-xs font-mono-code text-[#8A8A8A]">
            <Users className="w-3.5 h-3.5 text-[#666] group-hover:text-[#D4FF3F] transition-colors" />
            <span>{space.memberCount || space.memberIds?.length || 1}</span>
          </div>
        </div>

        {/* Space Title */}
        <h3 className="text-base font-bold text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors font-sans-clean line-clamp-1 mb-2">
          {space.name}
        </h3>

        {/* Space Description */}
        <p className="text-xs text-[#A0A09A] leading-relaxed line-clamp-3 mb-4 font-sans-clean">
          {space.description}
        </p>

        {/* Tags */}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {space.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="px-2 py-0.5 bg-[#141417] border border-[#222] text-[#888] text-[10px] font-mono-code"
              >
                #{tag}
              </span>
            ))}
            {space.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono-code text-[#555]">
                +{space.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Host Info & Status Action */}
      <div className="pt-3 border-t border-[#1C1C20] flex items-center justify-between gap-3 mt-auto">
        {/* Creator Snippet */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={space.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={space.ownerName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-none object-cover border border-[#333] shrink-0"
          />
          <span className="text-[11px] font-mono-code text-[#777] truncate">
            Host: <span className="text-[#CCC]">{space.ownerName?.split(' ')[0]}</span>
          </span>
        </div>

        {/* Action Button / Status Badge */}
        <div>
          {isOwner ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[#D4FF3F] text-[10px] font-mono-code font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Host
            </span>
          ) : isMember ? (
            <button
              id={`space-leave-btn-${space.id}`}
              onClick={handleActionClick}
              disabled={isProcessing}
              title="Click to leave hub"
              className="group/btn inline-flex items-center gap-1 px-2.5 py-1 bg-[#1A1A1E] hover:bg-red-950/40 border border-[#333] hover:border-red-800 text-[#D4FF3F] hover:text-red-400 text-[10px] font-mono-code transition-all"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check className="w-3 h-3 group-hover/btn:hidden" />
                  <span className="group-hover/btn:hidden">Joined</span>
                  <span className="hidden group-hover/btn:inline">Leave</span>
                </>
              )}
            </button>
          ) : (
            <button
              id={`space-join-btn-${space.id}`}
              onClick={handleActionClick}
              disabled={isProcessing || !currentUserId}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#1A1A1E] hover:bg-[#D4FF3F] hover:text-[#080808] border border-[#333] hover:border-[#D4FF3F] text-[#F5F5F0] text-[10px] font-mono-code uppercase font-bold tracking-wider transition-all"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  Join
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
