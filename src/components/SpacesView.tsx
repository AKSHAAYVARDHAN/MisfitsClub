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
  Compass,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw,
  Check
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
  const [showRefinePanel, setShowRefinePanel] = useState<boolean>(false);

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

  const activeRefineCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedTag) count++;
    return count;
  }, [selectedCategory, selectedTag]);

  const handleClearRefine = () => {
    setSelectedCategory('All');
    setSelectedTag(null);
  };

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
    <div id="spaces-view-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      
      {/* 1. Header & Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-[#1E1E24] mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 font-mono-code text-[11px] sm:text-xs text-[#8E8E93] uppercase tracking-wider mb-1.5 sm:mb-2">
            <Layers className="w-4 h-4 text-[#D4FF3F]" />
            <span>COMMUNITY GATHERINGS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-sans-clean text-[#F5F5F0] tracking-tight mb-1.5 sm:mb-2">
            HUB
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E93] max-w-2xl leading-relaxed">
            Find people who are into the same unusual things you are. Gather around a shared curiosity, toolmaking project, deep inquiry, or craft.
          </p>
        </div>

        {/* CTA: Create a Hub */}
        <button
          id="spaces-create-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary shrink-0 w-full sm:w-auto justify-center min-h-[44px] sm:min-h-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Hub</span>
        </button>
      </div>

      {/* 2. Filter & Controls Bar */}
      <div className="space-y-4 mb-6 sm:mb-8">
        
        {/* =========================================================================
            2A. MOBILE & TABLET DISCOVERY CONTROLS (lg:hidden)
            - Full-width comfortable search
            - Direct visible [ ALL HUBS ] [ MY HUBS ]
            - Unified [ REFINE HUBS ▼ ] collapsible filter panel (Category + Popular Tags)
            - No horizontal overflow, zero horizontal-scrolling chip rows
            ========================================================================= */}
        <div className="lg:hidden space-y-3">
          {/* Top Discovery Row: Search (Full Width) */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7A82]" />
            <input
              id="spaces-search-input-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hubs by name, topic, or tag..."
              className="w-full pl-9 pr-14 py-3 bg-[#0E0E12] border border-[#1E1E24] focus:border-[#D4FF3F]/60 text-xs sm:text-sm font-mono-code text-[#F5F5F0] placeholder-[#666670] focus:outline-none transition-colors min-h-[44px]"
            />
            {searchQuery && (
              <button
                id="clear-spaces-search-mobile"
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono-code uppercase tracking-wider text-[#7A7A82] hover:text-[#D4FF3F]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Primary View Switcher: ALL HUBS / MY HUBS */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#121216] border border-[#1E1E24]">
            <button
              id="spaces-mobile-tab-all"
              type="button"
              onClick={() => setMembershipTab('all')}
              className={`w-full py-2.5 px-3 text-xs font-mono-code uppercase tracking-wider transition-all text-center truncate min-h-[42px] flex items-center justify-center ${
                membershipTab === 'all'
                  ? 'bg-lime-grained text-[#080808] font-bold shadow-[0_0_12px_rgba(212,255,63,0.15)]'
                  : 'text-[#8E8E93] hover:text-[#F5F5F0]'
              }`}
            >
              <span>All Hubs ({spaces.length})</span>
            </button>
            <button
              id="spaces-mobile-tab-mine"
              type="button"
              onClick={() => setMembershipTab('my-spaces')}
              className={`w-full py-2.5 px-3 text-xs font-mono-code uppercase tracking-wider transition-all text-center truncate min-h-[42px] flex items-center justify-center ${
                membershipTab === 'my-spaces'
                  ? 'bg-lime-grained text-[#080808] font-bold shadow-[0_0_12px_rgba(212,255,63,0.15)]'
                  : 'text-[#8E8E93] hover:text-[#F5F5F0]'
              }`}
            >
              <span>My Hubs ({mySpacesCount})</span>
            </button>
          </div>

          {/* Refine Hubs Trigger Button */}
          <button
            id="mobile-refine-hubs-btn"
            type="button"
            onClick={() => setShowRefinePanel(!showRefinePanel)}
            aria-expanded={showRefinePanel}
            aria-controls="mobile-refine-hubs-panel"
            className={`w-full flex items-center justify-between px-4 py-3 border text-xs font-mono-code uppercase tracking-wider font-bold transition-all min-h-[44px] ${
              showRefinePanel || activeRefineCount > 0
                ? 'border-[#D4FF3F]/60 bg-[#121216] text-[#F5F5F0]'
                : 'border-[#1E1E24] bg-[#0E0E12] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#2E2E38]'
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4FF3F]" />
              <span>Refine Hubs</span>
              {activeRefineCount > 0 && (
                <span className="bg-[#D4FF3F] text-[#080808] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ml-1">
                  {activeRefineCount}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#8E8E93] transition-transform duration-200 ${
                showRefinePanel ? 'rotate-180 text-[#D4FF3F]' : ''
              }`}
            />
          </button>

          {/* Refine Hubs Panel */}
          {showRefinePanel && (
            <div
              id="mobile-refine-hubs-panel"
              className="bg-[#0E0E12] border border-[#1E1E24] p-4 sm:p-5 space-y-4 animate-fadeIn"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
                <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4FF3F]" />
                  <span>Refine Hubs</span>
                </span>
                {activeRefineCount > 0 && (
                  <span className="text-[10px] font-mono-code text-[#D4FF3F]">
                    {activeRefineCount} {activeRefineCount === 1 ? 'filter active' : 'filters active'}
                  </span>
                )}
              </div>

              {/* Responsive Filter Controls (1 col on mobile, 2 cols on tablet) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Category Dropdown */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold">
                    Category
                  </label>
                  <select
                    id="mobile-refine-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as SpaceCategory | 'All')}
                    className={`w-full bg-[#121216] border px-3 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none min-h-[42px] transition-colors ${
                      selectedCategory !== 'All' ? 'border-[#D4FF3F]/60 text-[#D4FF3F] font-bold' : 'border-[#1E1E24]'
                    }`}
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Popular Tags */}
                {allTags.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold flex items-center justify-between">
                      <span>Popular Tags</span>
                      {selectedTag && (
                        <span className="text-[#D4FF3F] text-[9px] font-normal">Active: #{selectedTag}</span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {allTags.map((tag) => {
                        const isSelected = selectedTag === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            id={`mobile-refine-tag-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            onClick={() => setSelectedTag(isSelected ? null : tag)}
                            className={`px-2.5 py-1.5 text-[11px] font-mono-code transition-colors border min-h-[34px] flex items-center gap-1 ${
                              isSelected
                                ? 'bg-[#D4FF3F]/20 text-[#D4FF3F] border-[#D4FF3F]/60 font-bold shadow-[0_0_10px_rgba(212,255,63,0.1)]'
                                : 'bg-[#121216] text-[#8E8E93] border-[#202026] hover:border-[#383844] hover:text-[#F5F5F0]'
                            }`}
                          >
                            <span>#{tag}</span>
                            {isSelected && <Check className="w-3 h-3 text-[#D4FF3F]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Badges */}
              {activeRefineCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1E1E24]">
                  <span className="text-[9px] font-mono-code text-[#7A7A82] uppercase mr-1">Active:</span>
                  {selectedCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Category: {selectedCategory}
                      <button onClick={() => setSelectedCategory('All')} aria-label="Clear category filter">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedTag && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Tag: #{selectedTag}
                      <button onClick={() => setSelectedTag(null)} aria-label="Clear tag filter">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#1E1E24]">
                <button
                  id="mobile-refine-clear-btn"
                  type="button"
                  onClick={handleClearRefine}
                  disabled={activeRefineCount === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-[#1E1E24] bg-[#121216] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#2E2E38] disabled:opacity-40 disabled:pointer-events-none text-xs font-mono-code uppercase tracking-wider min-h-[42px] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>

                <button
                  id="mobile-refine-apply-btn"
                  type="button"
                  onClick={() => setShowRefinePanel(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-lime-grained text-[#080808] border border-[#D4FF3F] hover:brightness-110 text-xs font-mono-code uppercase tracking-wider font-bold min-h-[42px] transition-all shadow-[0_0_15px_rgba(212,255,63,0.15)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            2B. DESKTOP DISCOVERY CONTROLS (hidden lg:block - UNCHANGED)
            ========================================================================= */}
        <div className="hidden lg:block space-y-4">
          {/* Top Control Row: Search + Tab Switcher */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666670]" />
              <input
                id="spaces-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hubs by name, topic, or tag..."
                className="w-full pl-9 pr-8 py-2 bg-[#0E0E12] border border-[#24242C] focus:border-[#D4FF3F]/60 text-xs font-mono-code text-[#F5F5F0] placeholder-[#555560] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666670] hover:text-[#CCC]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Membership Tabs */}
            <div className="flex items-center gap-1 bg-[#121216] border border-[#24242C] p-1 self-start md:self-auto">
              <button
                id="spaces-tab-all"
                onClick={() => setMembershipTab('all')}
                className={`px-3.5 py-1.5 text-xs font-mono-code transition-all ${
                  membershipTab === 'all'
                    ? 'bg-lime-grained text-[#080808] font-bold'
                    : 'text-[#8E8E93] hover:text-[#F5F5F0]'
                }`}
              >
                All Hubs ({spaces.length})
              </button>
              <button
                id="spaces-tab-mine"
                onClick={() => setMembershipTab('my-spaces')}
                className={`px-3.5 py-1.5 text-xs font-mono-code transition-all ${
                  membershipTab === 'my-spaces'
                    ? 'bg-lime-grained text-[#080808] font-bold'
                    : 'text-[#8E8E93] hover:text-[#F5F5F0]'
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
                      ? 'bg-lime-grained text-[#080808] font-bold border-[#D4FF3F]'
                      : 'bg-[#101014] text-[#8E8E93] border-[#222228] hover:border-[#383844] hover:text-[#F5F5F0]'
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
              <span className="text-[10px] font-mono-code text-[#666670] mr-1">Popular Tags:</span>
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`px-2 py-0.5 text-[10px] font-mono-code transition-colors border ${
                      isSelected
                        ? 'bg-[#D4FF3F]/15 text-[#D4FF3F] border-[#D4FF3F]/40 font-bold'
                        : 'bg-[#0E0E12] text-[#8E8E93] border-[#202026] hover:border-[#33333E] hover:text-[#D0D0CA]'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}

              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] font-mono-code text-[#EF4444] hover:underline ml-1"
                >
                  Clear tag filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Spaces Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4FF3F] mx-auto mb-3" />
          <p className="font-mono-code text-xs text-[#8E8E93] uppercase tracking-wider">
            Loading Misfits Hubs...
          </p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="bg-[#0E0E12] border border-[#1E1E24] p-12 text-center my-6">
          <Layers className="w-10 h-10 text-[#444450] mx-auto mb-4" />
          <h3 className="text-base font-bold font-mono-code text-[#F5F5F0] mb-2">
            No Hubs Found
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-md mx-auto mb-6">
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
                className="btn-secondary"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Hub
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
