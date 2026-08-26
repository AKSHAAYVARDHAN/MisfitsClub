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
      className="group relative bg-[#0E0E12] hover:bg-[#131317] border border-[#1E1E24] hover:border-[#32323E] transition-all duration-200 cursor-pointer flex flex-col justify-between p-5 text-left"
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
                className="w-6 h-6 object-cover border border-[#282832]"
              />
            )}
            {/* Category Pill - Disciplined Neutral */}
            <span className="px-2 py-0.5 text-[10px] font-mono-code uppercase font-semibold tracking-wider bg-[#141418] text-[#B5B5AF] border border-[#26262E]">
              {space.category}
            </span>
          </div>

          {/* Member Count */}
          <div className="flex items-center gap-1.5 text-xs font-mono-code text-[#8E8E93]">
            <Users className="w-3.5 h-3.5 text-[#666670]" />
            <span>{space.memberCount || space.memberIds?.length || 1}</span>
          </div>
        </div>

        {/* Space Title */}
        <h3 className="text-base font-bold text-[#F5F5F0] transition-colors font-sans-clean line-clamp-1 mb-2">
          {space.name}
        </h3>

        {/* Space Description */}
        <p className="text-xs text-[#8E8E93] leading-relaxed line-clamp-3 mb-4 font-sans-clean">
          {space.description}
        </p>

        {/* Tags */}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {space.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="px-2 py-0.5 bg-[#121216] border border-[#202026] text-[#8E8E93] text-[10px] font-mono-code"
              >
                #{tag}
              </span>
            ))}
            {space.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono-code text-[#64646E]">
                +{space.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Host Info & Status Action */}
      <div className="pt-3 border-t border-[#1C1C22] flex items-center justify-between gap-3 mt-auto">
        {/* Creator Snippet */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={space.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={space.ownerName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-none object-cover border border-[#282832] shrink-0"
          />
          <span className="text-[11px] font-mono-code text-[#7A7A82] truncate">
            Host: <span className="text-[#C8C8C2]">{space.ownerName?.split(' ')[0]}</span>
          </span>
        </div>

        {/* Action Button / Status Badge */}
        <div>
          {isOwner ? (
            <span className="badge-host">
              <ShieldCheck className="w-3 h-3" />
              Host
            </span>
          ) : isMember ? (
            <button
              id={`space-leave-btn-${space.id}`}
              onClick={handleActionClick}
              disabled={isProcessing}
              title="Click to leave hub"
              className="group/btn inline-flex items-center gap-1 px-2.5 py-1 bg-[#141418] hover:bg-[#EF4444]/10 border border-[#282832] hover:border-[#EF4444]/40 text-[#B0B0A8] hover:text-[#EF4444] text-[10px] font-mono-code transition-all"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check className="w-3 h-3 text-[#D4FF3F] group-hover/btn:hidden" />
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
              className="btn-primary py-1 px-2.5 text-[10px]"
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
