import React, { useState, useMemo } from 'react';
import { ConnectionIntent, MeetArchetype, UserProfile } from '../types';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Check, 
  MapPin, 
  Globe2, 
  Compass, 
  MessageSquare, 
  Bookmark, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  CreditCard
} from 'lucide-react';

interface DiscoverViewProps {
  profiles: UserProfile[];
  currentUser: UserProfile | null;
  onConnect: (profile: UserProfile) => void;
  onOpenOnboarding: () => void;
  bookmarkedIds: string[];
  onToggleBookmark: (profileId: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  profiles,
  currentUser,
  onConnect,
  onOpenOnboarding,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>('All');
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');
  const [currentDeckIndex, setCurrentDeckIndex] = useState<number>(0);
  const [passedIds, setPassedIds] = useState<string[]>([]);

  const allIntents: (ConnectionIntent | 'All')[] = [
    'All',
    'Build Together',
    'Exchange Ideas',
    'Collaborate',
    'Learn Together',
    'Find a Co-founder',
    'Find a Mentor',
    'Just Talk',
  ];

  const allArchetypes: (MeetArchetype | 'All')[] = [
    'All',
    'Anyone worldwide',
    'Builders',
    'Creatives',
    'Researchers',
    'Entrepreneurs',
    'Students',
  ];

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Exclude self
      if (currentUser && p.id === currentUser.id) return false;

      // Filter by Intent
      if (selectedIntentFilter !== 'All' && !p.intents.includes(selectedIntentFilter as ConnectionIntent)) {
        return false;
      }

      // Filter by Archetype
      if (selectedArchetypeFilter !== 'All' && selectedArchetypeFilter !== 'Anyone worldwide') {
        const matchesRole = p.role.toLowerCase().includes(selectedArchetypeFilter.toLowerCase());
        const matchesArchetype = p.archetypesToMeet.includes(selectedArchetypeFilter as MeetArchetype);
        if (!matchesRole && !matchesArchetype) return false;
      }

      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesLocation = p.location.toLowerCase().includes(query);
        const matchesBio = p.bio.toLowerCase().includes(query);
        const matchesTagline = p.tagline.toLowerCase().includes(query);
        const matchesInterests = p.interests.some((i) => i.toLowerCase().includes(query));
        const matchesBuilding = p.building?.toLowerCase().includes(query);
        const matchesLearning = p.learning?.toLowerCase().includes(query);

        if (!matchesName && !matchesLocation && !matchesBio && !matchesTagline && !matchesInterests && !matchesBuilding && !matchesLearning) {
          return false;
        }
      }

      return true;
    });
  }, [profiles, currentUser, selectedIntentFilter, selectedArchetypeFilter, searchQuery]);

  // Active profile in deck mode
  const currentProfile = filteredProfiles[currentDeckIndex % Math.max(1, filteredProfiles.length)];

  const handleNextInDeck = () => {
    if (currentProfile) {
      setPassedIds((prev) => [...prev, currentProfile.id]);
    }
    setCurrentDeckIndex((prev) => (prev + 1) % Math.max(1, filteredProfiles.length));
  };

  const handlePrevInDeck = () => {
    setCurrentDeckIndex((prev) => (prev - 1 + filteredProfiles.length) % Math.max(1, filteredProfiles.length));
  };

  // Helper matching explanation
  const getMutualReasons = (profile: UserProfile) => {
    if (!currentUser) {
      return [
        'Curious global mindset',
        'Looking for genuine conversation',
        profile.whyMatch || 'Thoughtful builder & explorer',
      ];
    }

    const mutualInterests = profile.interests.filter((i) => currentUser.interests.includes(i));
    const mutualIntents = profile.intents.filter((i) => currentUser.intents.includes(i));

    const reasons: string[] = [];
    if (mutualInterests.length > 0) {
      reasons.push(`Both care about ${mutualInterests.slice(0, 2).join(' & ')}`);
    }
    if (mutualIntents.length > 0) {
      reasons.push(`Both looking to ${mutualIntents[0]}`);
    }
    if (reasons.length < 2 && profile.whyMatch) {
      reasons.push(profile.whyMatch);
    }
    if (reasons.length === 0) {
      reasons.push('Complementary creative obsessions');
    }

    return reasons;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F0] py-8 px-6 sm:px-10 lg:px-12 max-w-7xl mx-auto pb-24 selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-[#F5F5F0]/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#D4FF3F] text-[#0B0B0C] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
              Discovery Engine
            </span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
            People worth meeting.
          </h1>
          <p className="font-sans-clean text-sm sm:text-base text-[#969696] mt-2 max-w-xl">
            Thoughtful individuals looking to exchange ideas, build tools, learn deeply, or simply talk.
          </p>
        </div>

        {/* View Mode & Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#151516] p-1 border border-[#F5F5F0]/10">
            <button
              id="view-deck-btn"
              onClick={() => setViewMode('deck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider font-bold transition-colors ${
                viewMode === 'deck'
                  ? 'bg-[#D4FF3F] text-[#0B0B0C]'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Focus Deck</span>
            </button>
            <button
              id="view-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider font-bold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#D4FF3F] text-[#0B0B0C]'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Browse All</span>
            </button>
          </div>

          <span className="text-[10px] text-[#969696] uppercase tracking-widest bg-[#151516] px-3 py-2 border border-[#F5F5F0]/10">
            {filteredProfiles.length} Misfits
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4 mb-8">
        
        {/* Search & Archetype dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969696]" />
            <input
              id="discover-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by obsession, interest (e.g. AI, Film, Synthesis), city, or question..."
              className="w-full border border-[#F5F5F0]/10 bg-[#151516] pl-10 pr-4 py-3 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#969696]/60 focus:border-[#D4FF3F] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest text-[#969696] hover:text-[#D4FF3F]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Archetype Quick Pill Select */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Builders', 'Creatives', 'Researchers', 'Entrepreneurs'].map((arch) => (
              <button
                key={arch}
                onClick={() => setSelectedArchetypeFilter(arch)}
                className={`whitespace-nowrap px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedArchetypeFilter === arch
                    ? 'bg-[#F5F5F0] text-[#0B0B0C]'
                    : 'bg-[#151516] text-[#969696] border border-[#F5F5F0]/10 hover:border-[#D4FF3F] hover:text-[#F5F5F0]'
                }`}
              >
                {arch}
              </button>
            ))}
          </div>
        </div>

        {/* Intent Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] text-[#969696] uppercase tracking-widest pr-2 whitespace-nowrap font-bold">
            Intent:
          </span>
          {allIntents.map((intent) => {
            const isSelected = selectedIntentFilter === intent;
            return (
              <button
                key={intent}
                id={`filter-intent-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  setSelectedIntentFilter(intent);
                  setCurrentDeckIndex(0);
                }}
                className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  isSelected
                    ? 'bg-[#D4FF3F] text-[#0B0B0C]'
                    : 'bg-[#151516] text-[#969696] border border-[#F5F5F0]/10 hover:border-[#D4FF3F] hover:text-[#F5F5F0]'
                }`}
              >
                {intent}
              </button>
            );
          })}
        </div>

      </div>

      {/* No Results Fallback */}
      {filteredProfiles.length === 0 && (
        <div className="text-center py-20 border border-[#F5F5F0]/10 bg-[#151516] p-8">
          <Sparkles className="w-8 h-8 text-[#D4FF3F] mx-auto mb-3 opacity-80" />
          <h3 className="font-editorial text-2xl text-[#F5F5F0]">No Misfits match this query yet</h3>
          <p className="text-sm text-[#969696] mt-2 max-w-md mx-auto">
            Try loosening your filters or searching for broader topics like AI, Philosophy, Design, or Hardware.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedIntentFilter('All');
              setSelectedArchetypeFilter('All');
            }}
            className="mt-6 inline-flex items-center gap-2 border border-[#F5F5F0]/20 bg-[#0B0B0C] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#F5F5F0] hover:border-[#D4FF3F] hover:text-[#D4FF3F]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* FOCUS DECK VIEW (Thoughtful Single-Person Discovery) */}
      {viewMode === 'deck' && currentProfile && (
        <div className="max-w-3xl mx-auto">
          
          <div className="relative border border-[#F5F5F0]/10 bg-[#151516] p-6 sm:p-10 shadow-2xl transition-all">
            
            {/* Top Bar: Profile Index, Online status, Bookmark */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#F5F5F0]/10">
              <div className="flex items-center gap-2.5">
                <span className="bg-[#D4FF3F] text-[#0B0B0C] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                  Misfit {currentDeckIndex + 1} of {filteredProfiles.length}
                </span>
                {currentProfile.isOnline && (
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#969696]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF3F]"></span>
                    Active in {currentProfile.location.split(',')[0]}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="bookmark-profile-btn"
                  onClick={() => onToggleBookmark(currentProfile.id)}
                  className={`p-2 border transition-colors ${
                    bookmarkedIds.includes(currentProfile.id)
                      ? 'border-[#D4FF3F] bg-[#D4FF3F]/10 text-[#D4FF3F]'
                      : 'border-[#F5F5F0]/10 text-[#969696] hover:text-[#F5F5F0] hover:border-[#F5F5F0]/30'
                  }`}
                  title="Bookmark for later"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Main Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={currentProfile.avatarUrl}
                  alt={currentProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-[#F5F5F0]/10"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-editorial text-3xl sm:text-4xl font-light text-[#F5F5F0]">
                      {currentProfile.name}
                    </h2>
                  </div>
                  <p className="text-[11px] text-[#969696] uppercase tracking-wider mt-0.5">
                    {currentProfile.location} · {currentProfile.roleEmoji} {currentProfile.role}
                  </p>
                </div>
              </div>

              {/* Intent badges */}
              <div className="flex flex-wrap sm:flex-col gap-1.5 sm:items-end">
                {currentProfile.intents.map((intent) => (
                  <span
                    key={intent}
                    className="text-[10px] text-[#D4FF3F] border border-[#D4FF3F]/30 px-3 py-1 font-bold uppercase tracking-wider"
                  >
                    {intent}
                  </span>
                ))}
              </div>
            </div>

            {/* Why you might get along (Subtle insight) */}
            <div className="border border-[#D4FF3F]/30 bg-[#D4FF3F]/[0.03] p-4 mb-6">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span className="text-[10px] uppercase tracking-widest text-[#D4FF3F] font-bold">
                  Why you might get along
                </span>
              </div>
              <ul className="space-y-1">
                {getMutualReasons(currentProfile).map((reason, idx) => (
                  <li key={idx} className="text-xs text-[#D8D8DC] flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#D4FF3F]"></span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tagline & Bio */}
            <div className="mb-6">
              <p className="font-editorial text-xl sm:text-2xl italic text-[#F5F5F0] leading-relaxed mb-4">
                “{currentProfile.tagline}”
              </p>
              <p className="font-sans-clean text-sm sm:text-base text-[#969696] leading-relaxed">
                {currentProfile.bio}
              </p>
            </div>

            {/* Building / Learning / Open Question Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {currentProfile.building && (
                <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-4">
                  <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                    🔨 Currently Building
                  </span>
                  <p className="text-xs sm:text-sm text-[#F5F5F0]/90 leading-relaxed">
                    {currentProfile.building}
                  </p>
                </div>
              )}

              {currentProfile.learning && (
                <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-4">
                  <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                    🧠 Currently Learning
                  </span>
                  <p className="text-xs sm:text-sm text-[#F5F5F0]/90 leading-relaxed">
                    {currentProfile.learning}
                  </p>
                </div>
              )}
            </div>

            {/* Open Question */}
            {currentProfile.openQuestion && (
              <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-4 mb-6">
                <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                  ❓ A Question I'm Pondering
                </span>
                <p className="font-editorial text-base sm:text-lg italic text-[#F5F5F0] leading-snug">
                  “{currentProfile.openQuestion}”
                </p>
              </div>
            )}

            {/* Interests Chips */}
            <div className="mb-8">
              <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-2">
                Interested in:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-[10px] text-[#969696] bg-[#0B0B0C] px-3 py-1 border border-[#F5F5F0]/5 uppercase tracking-wider"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar (Thoughtful Connect & Next Person) */}
            <div className="pt-6 border-t border-[#F5F5F0]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-2">
                <button
                  id="deck-prev-btn"
                  onClick={handlePrevInDeck}
                  className="p-3 border border-[#F5F5F0]/10 text-[#969696] hover:text-[#F5F5F0] hover:border-[#F5F5F0]/30 transition-colors"
                  title="Previous person"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  id="deck-pass-btn"
                  onClick={handleNextInDeck}
                  className="px-5 py-3 border border-[#F5F5F0]/10 text-xs font-bold uppercase tracking-widest text-[#969696] hover:text-[#F5F5F0] hover:border-[#F5F5F0]/30 transition-all"
                >
                  Pass / Next Person
                </button>
              </div>

              <button
                id="deck-connect-btn"
                onClick={() => onConnect(currentProfile)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#F5F5F0] text-[#0B0B0C] px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Connect with {currentProfile.name.split(' ')[0]}</span>
              </button>

            </div>

          </div>

          {/* Quick hint */}
          <div className="mt-4 text-center">
            <span className="text-[10px] text-[#969696] uppercase tracking-widest">
              Click Connect to review shared topics and send a personal conversation opener.
            </span>
          </div>
        </div>
      )}

      {/* GRID VIEW (Browse all members) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((person) => (
            <div
              key={person.id}
              className="border border-[#F5F5F0]/10 bg-[#151516] p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#D4FF3F]/40"
            >
              <div>
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={person.avatarUrl}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover border border-[#F5F5F0]/10"
                    />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0]">
                        {person.name}
                      </h3>
                      <p className="text-[10px] text-[#969696] uppercase tracking-widest">
                        {person.location} · {person.roleEmoji} {person.role}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleBookmark(person.id)}
                    className={`p-1.5 transition-colors ${
                      bookmarkedIds.includes(person.id)
                        ? 'text-[#D4FF3F]'
                        : 'text-[#969696] hover:text-[#F5F5F0]'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                {/* Tagline */}
                <p className="font-editorial text-base italic text-[#969696] hover:text-[#F5F5F0] leading-snug mb-4">
                  “{person.tagline}”
                </p>

                {/* Bio snippet */}
                <p className="font-sans-clean text-xs text-[#969696] line-clamp-3 mb-4 leading-relaxed">
                  {person.bio}
                </p>

                {/* What I'm Building if exists */}
                {person.building && (
                  <div className="bg-[#0B0B0C] p-3 border border-[#F5F5F0]/5 mb-4">
                    <span className="text-[9px] text-[#D4FF3F] uppercase tracking-widest font-bold block">
                      Building
                    </span>
                    <p className="text-xs text-[#F5F5F0]/80 line-clamp-2 mt-0.5">{person.building}</p>
                  </div>
                )}

                {/* Interests */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {person.interests.slice(0, 4).map((interest) => (
                    <span
                      key={interest}
                      className="text-[9px] text-[#969696] bg-[#0B0B0C] px-2 py-0.5 border border-[#F5F5F0]/5 uppercase"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer & Connect Button */}
              <div className="pt-4 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {person.intents.slice(0, 1).map((i) => (
                    <span key={i} className="text-[10px] text-[#D4FF3F] uppercase tracking-wider font-bold">
                      {i}
                    </span>
                  ))}
                </div>

                <button
                  id={`grid-connect-${person.id}`}
                  onClick={() => onConnect(person)}
                  className="bg-[#F5F5F0] text-[#0B0B0C] px-4 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors"
                >
                  Connect
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
