import React, { useState, useEffect, useMemo } from 'react';
import { Space, SpaceCategory, UserProfile, PublicProfile } from '../types';
import { spaceService } from '../services/spaceService';
import { SpaceCard } from './SpaceCard';
import { SpaceDetailView } from './SpaceDetailView';
import { CreateSpaceModal } from './CreateSpaceModal';
import { 
  Layers, 
  Plus, 
  Search, 
  Sparkles, 
  Filter, 
  X, 
  Users, 
  ShieldCheck, 
  Loader2, 
  Compass
} from 'lucide-react';

interface SpacesViewProps {
  currentUser: UserProfile;
  onSelectMember: (member: PublicProfile) => void;
  onStartMessage?: (recipientUid: string) => void;
  selectedSpaceId?: string | null;
  onSelectSpaceId?: (spaceId: string | null) => void;
}

const CATEGORIES: (SpaceCategory | 'All')[] = [
  'All',
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

export const SpacesView: React.FC<SpacesViewProps> = ({
  currentUser,
  onSelectMember,
  onStartMessage,
  selectedSpaceId,
  onSelectSpaceId,
}) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SpaceCategory | 'All'>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [membershipTab, setMembershipTab] = useState<'all' | 'my-spaces'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);

  const currentUserId = currentUser.uid || currentUser.id;

  // Real-time Firestore subscription to spaces
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = spaceService.subscribeSpaces((updatedList) => {
      setSpaces(updatedList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle direct navigation via selectedSpaceId prop or sync
  useEffect(() => {
    if (selectedSpaceId) {
      const found = spaces.find((s) => s.id === selectedSpaceId);
      if (found) {
        setActiveSpace(found);
      } else {
        spaceService.getSpace(selectedSpaceId).then((s) => {
          if (s) setActiveSpace(s);
        });
      }
    } else {
      setActiveSpace(null);
    }
  }, [selectedSpaceId, spaces]);

  const handleSelectSpace = (space: Space) => {
    setActiveSpace(space);
    if (onSelectSpaceId) {
      onSelectSpaceId(space.id);
    }
  };

  const handleBackToSpaces = () => {
    setActiveSpace(null);
    if (onSelectSpaceId) {
      onSelectSpaceId(null);
    }
  };

  const handleJoinSpace = async (spaceId: string) => {
    if (!currentUserId) return;
    try {
      const updated = await spaceService.joinSpace(spaceId, currentUserId);
      setSpaces((prev) => prev.map((s) => (s.id === spaceId ? updated : s)));
      if (activeSpace && activeSpace.id === spaceId) {
        setActiveSpace(updated);
      }
    } catch (err) {
      console.error('Failed to join space:', err);
    }
  };

  const handleLeaveSpace = async (spaceId: string) => {
    if (!currentUserId) return;
    try {
      const updated = await spaceService.leaveSpace(spaceId, currentUserId);
      setSpaces((prev) => prev.map((s) => (s.id === spaceId ? updated : s)));
      if (activeSpace && activeSpace.id === spaceId) {
        setActiveSpace(updated);
      }
    } catch (err) {
      console.error('Failed to leave space:', err);
    }
  };

  const handleSpaceCreated = (newSpace: Space) => {
    setSpaces((prev) => [newSpace, ...prev.filter((s) => s.id !== newSpace.id)]);
    setActiveSpace(newSpace);
    if (onSelectSpaceId) {
      onSelectSpaceId(newSpace.id);
    }
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    spaces.forEach((s) => {
      if (Array.isArray(s.tags)) {
        s.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set).slice(0, 15);
  }, [spaces]);

  // Filter spaces
  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      // 1. Membership Tab Filter
      if (membershipTab === 'my-spaces') {
        const isMember = currentUserId && space.memberIds?.includes(currentUserId);
        const isOwner = currentUserId && space.ownerId === currentUserId;
        if (!isMember && !isOwner) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'All' && space.category !== selectedCategory) {
        return false;
      }

      // 3. Tag Filter
      if (selectedTag && !space.tags?.includes(selectedTag)) {
        return false;
      }

      // 4. Search Query Filter (name, description, tags, category, ownerName)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = space.name.toLowerCase().includes(q);
        const descMatch = space.description.toLowerCase().includes(q);
        const catMatch = space.category.toLowerCase().includes(q);
        const ownerMatch = space.ownerName?.toLowerCase().includes(q);
        const tagMatch = space.tags?.some((t) => t.toLowerCase().includes(q));

        if (!nameMatch && !descMatch && !catMatch && !ownerMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }, [spaces, membershipTab, selectedCategory, selectedTag, searchQuery, currentUserId]);

  const mySpacesCount = useMemo(() => {
    if (!currentUserId) return 0;
    return spaces.filter(
      (s) => s.memberIds?.includes(currentUserId) || s.ownerId === currentUserId
    ).length;
  }, [spaces, currentUserId]);

  // If a space is actively viewed in detail, render SpaceDetailView
  if (activeSpace) {
    return (
      <SpaceDetailView
        spaceId={activeSpace.id}
        initialSpace={activeSpace}
        currentUser={currentUser}
        onBack={handleBackToSpaces}
        onSelectMember={onSelectMember}
        onStartMessage={onStartMessage}
      />
    );
  }

  return (
    <div id="spaces-view-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* 1. Header & Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#F5F5F0]/10 mb-8">
        <div>
          <div className="flex items-center gap-2 font-mono-code text-xs text-[#D4FF3F] uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>COMMUNITY GATHERINGS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-sans-clean text-[#F5F5F0] tracking-tight mb-2">
            HUB
          </h1>
          <p className="text-sm text-[#A0A09A] max-w-2xl leading-relaxed">
            Find people who are into the same unusual things you are. Gather around a shared curiosity, toolmaking project, deep inquiry, or craft.
          </p>
        </div>

        {/* CTA: Create a Hub */}
        <button
          id="spaces-create-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4FF3F] hover:bg-[#b8e62f] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider transition-all shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create a Hub
        </button>
      </div>

      {/* 2. Filter & Controls Bar */}
      <div className="space-y-4 mb-8">
        {/* Top Control Row: Search + Tab Switcher */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <input
              id="spaces-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hubs by name, topic, or tag..."
              className="w-full pl-9 pr-8 py-2 bg-[#0E0E11] border border-[#26262B] focus:border-[#D4FF3F] text-xs font-mono-code text-[#F5F5F0] placeholder-[#555] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#CCC]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Membership Tabs */}
          <div className="flex items-center gap-1 bg-[#121215] border border-[#26262B] p-1 self-start md:self-auto">
            <button
              id="spaces-tab-all"
              onClick={() => setMembershipTab('all')}
              className={`px-3.5 py-1.5 text-xs font-mono-code transition-all ${
                membershipTab === 'all'
                  ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                  : 'text-[#8A8A8A] hover:text-[#F5F5F0]'
              }`}
            >
              All Hubs ({spaces.length})
            </button>
            <button
              id="spaces-tab-mine"
              onClick={() => setMembershipTab('my-spaces')}
              className={`px-3.5 py-1.5 text-xs font-mono-code transition-all ${
                membershipTab === 'my-spaces'
                  ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                  : 'text-[#8A8A8A] hover:text-[#F5F5F0]'
              }`}
            >
              My Hubs ({mySpacesCount})
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`spaces-filter-cat-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-mono-code whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold border-[#D4FF3F]'
                    : 'bg-[#101013] text-[#8A8A8A] border-[#222] hover:border-[#444] hover:text-[#F5F5F0]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Active Tag Filter / Suggestions */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono-code text-[#666] mr-1">Popular Tags:</span>
            {allTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`px-2 py-0.5 text-[10px] font-mono-code transition-colors border ${
                    isSelected
                      ? 'bg-[#D4FF3F]/20 text-[#D4FF3F] border-[#D4FF3F]'
                      : 'bg-[#0E0E10] text-[#777] border-[#1E1E22] hover:border-[#333] hover:text-[#AAA]'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}

            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] font-mono-code text-[#FF6B6B] hover:underline ml-1"
              >
                Clear tag filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Spaces Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4FF3F] mx-auto mb-3" />
          <p className="font-mono-code text-xs text-[#8A8A8A] uppercase tracking-wider">
            Loading Misfits Hubs...
          </p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="bg-[#0D0D10] border border-[#202026] p-12 text-center my-6">
          <Layers className="w-10 h-10 text-[#444] mx-auto mb-4" />
          <h3 className="text-base font-bold font-mono-code text-[#F5F5F0] mb-2">
            No Hubs Found
          </h3>
          <p className="text-xs text-[#888] max-w-md mx-auto mb-6">
            {membershipTab === 'my-spaces'
              ? "You haven't joined or created any Hubs yet. Explore public hubs or start your own gathering."
              : searchQuery || selectedCategory !== 'All' || selectedTag
              ? 'No hubs match your active filters. Try clearing your search or filters.'
              : 'There are no active Hubs yet. Be the first to create one!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(searchQuery || selectedCategory !== 'All' || selectedTag || membershipTab === 'my-spaces') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedTag(null);
                  setMembershipTab('all');
                }}
                className="px-4 py-2 bg-[#1A1A1E] border border-[#333] text-xs font-mono-code text-[#F5F5F0] hover:border-[#D4FF3F] transition-colors"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2 bg-[#D4FF3F] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-wider hover:bg-[#b8e62f] transition-all"
            >
              + Create a Hub
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              currentUser={currentUser}
              onSelect={handleSelectSpace}
              onJoin={handleJoinSpace}
              onLeave={handleLeaveSpace}
            />
          ))}
        </div>
      )}

      {/* Create Space Modal */}
      <CreateSpaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        onSpaceCreated={handleSpaceCreated}
      />
    </div>
  );
};
