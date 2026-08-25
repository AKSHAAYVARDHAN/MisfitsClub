import React, { useState, useMemo } from 'react';
import { Connection, ConnectionIntent, MeetArchetype, PublicProfile, UserProfile } from '../types';
import { MemberProfileModal } from './MemberProfileModal';
import { discoveryService } from '../services/discoveryService';
import { 
  Search, 
  Sparkles, 
  MapPin, 
  MessageSquare, 
  Bookmark, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  CreditCard,
  GraduationCap,
  BookOpen,
  Calendar,
  Code2,
  X,
  User,
  Filter,
  Check,
  UserCheck,
  Clock
} from 'lucide-react';

interface DiscoverViewProps {
  profiles: (PublicProfile | UserProfile)[];
  currentUser: UserProfile | null;
  connections?: Connection[];
  isLoading?: boolean;
  error?: string | null;
  onConnect: (profile: any) => void;
  onOpenChat?: (connectionId: string) => void;
  onAcceptRequest?: (connectionId: string) => Promise<void> | void;
  onDeclineRequest?: (connectionId: string) => Promise<void> | void;
  onCancelRequest?: (connectionId: string) => Promise<void> | void;
  onRemoveConnection?: (connectionId: string) => Promise<void> | void;
  onOpenOnboarding: () => void;
  bookmarkedIds: string[];
  onToggleBookmark: (profileId: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  profiles = [],
  currentUser,
  connections = [],
  isLoading = false,
  error = null,
  onConnect,
  onOpenChat,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveConnection,
  onOpenOnboarding,
  bookmarkedIds = [],
  onToggleBookmark,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<ConnectionIntent | 'All'>('All');
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<MeetArchetype | 'All'>('All');
  const [selectedCollege, setSelectedCollege] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');
  const [currentDeckIndex, setCurrentDeckIndex] = useState<number>(0);
  const [activeModalProfile, setActiveModalProfile] = useState<PublicProfile | null>(null);

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

  // Convert raw profiles to public sanitized profiles
  const publicProfiles: PublicProfile[] = useMemo(() => {
    return (profiles || []).map((p) => {
      const { email, ...rest } = p as any; // Strip private email
      return {
        ...rest,
        id: p.uid || p.id,
        uid: p.uid || p.id,
        skills: p.skills || [],
        interests: p.interests || [],
        intents: p.intents || [],
      } as PublicProfile;
    });
  }, [profiles]);

  // Extract unique options for filter dropdowns
  const availableColleges = useMemo(() => {
    const set = new Set<string>();
    publicProfiles.forEach((p) => {
      if (p.college && p.college.trim()) set.add(p.college.trim());
    });
    return Array.from(set).sort();
  }, [publicProfiles]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    publicProfiles.forEach((p) => {
      if (p.department && p.department.trim()) set.add(p.department.trim());
    });
    return Array.from(set).sort();
  }, [publicProfiles]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    publicProfiles.forEach((p) => {
      if (p.year && p.year.trim()) set.add(p.year.trim());
    });
    return Array.from(set).sort();
  }, [publicProfiles]);

  const availableSkills = useMemo(() => {
    const set = new Set<string>();
    publicProfiles.forEach((p) => {
      (p.skills || []).forEach((s) => set.add(s.toUpperCase().trim()));
    });
    return Array.from(set).sort();
  }, [publicProfiles]);

  const availableInterests = useMemo(() => {
    const set = new Set<string>();
    publicProfiles.forEach((p) => {
      (p.interests || []).forEach((i) => set.add(i.toUpperCase().trim()));
    });
    return Array.from(set).sort();
  }, [publicProfiles]);

  // Filter profiles based on current search & combinable filters
  const filteredProfiles = useMemo(() => {
    return discoveryService.filterProfiles(
      publicProfiles,
      {
        searchQuery,
        college: selectedCollege,
        department: selectedDepartment,
        year: selectedYear,
        skill: selectedSkill,
        interest: selectedInterest,
        intent: selectedIntentFilter,
        archetype: selectedArchetypeFilter,
      },
      currentUser?.id
    );
  }, [
    publicProfiles,
    searchQuery,
    selectedCollege,
    selectedDepartment,
    selectedYear,
    selectedSkill,
    selectedInterest,
    selectedIntentFilter,
    selectedArchetypeFilter,
    currentUser?.id,
  ]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedIntentFilter !== 'All') count++;
    if (selectedArchetypeFilter !== 'All') count++;
    if (selectedCollege !== 'All') count++;
    if (selectedDepartment !== 'All') count++;
    if (selectedYear !== 'All') count++;
    if (selectedSkill !== 'All') count++;
    if (selectedInterest !== 'All') count++;
    if (searchQuery.trim().length > 0) count++;
    return count;
  }, [
    selectedIntentFilter,
    selectedArchetypeFilter,
    selectedCollege,
    selectedDepartment,
    selectedYear,
    selectedSkill,
    selectedInterest,
    searchQuery,
  ]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedIntentFilter('All');
    setSelectedArchetypeFilter('All');
    setSelectedCollege('All');
    setSelectedDepartment('All');
    setSelectedYear('All');
    setSelectedSkill('All');
    setSelectedInterest('All');
    setCurrentDeckIndex(0);
  };

  // Active profile in deck mode
  const currentProfile = filteredProfiles[currentDeckIndex % Math.max(1, filteredProfiles.length)];

  const handleNextInDeck = () => {
    setCurrentDeckIndex((prev) => (prev + 1) % Math.max(1, filteredProfiles.length));
  };

  const handlePrevInDeck = () => {
    setCurrentDeckIndex((prev) => (prev - 1 + filteredProfiles.length) % Math.max(1, filteredProfiles.length));
  };

  // Helper matching explanation
  const getMutualReasons = (profile: PublicProfile) => {
    if (!currentUser) {
      return [
        'Curious global mindset',
        'Looking for genuine conversation',
        profile.whyMatch || 'Thoughtful builder & explorer',
      ];
    }

    const mutualInterests = (profile.interests || []).filter((i) =>
      (currentUser.interests || []).some((ci) => ci.toLowerCase() === i.toLowerCase())
    );
    const mutualIntents = (profile.intents || []).filter((i) =>
      (currentUser.intents || []).includes(i)
    );

    const reasons: string[] = [];
    if (currentUser.college && profile.college && currentUser.college.toLowerCase() === profile.college.toLowerCase()) {
      reasons.push(`Both from ${profile.college}`);
    }
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
    <div className="min-h-screen bg-[#080808] text-[#F2F2ED] py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-24 selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 pb-6 border-b border-[#242424]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#D4FF3F] text-[#080808] text-[10px] font-mono-code font-bold uppercase tracking-widest px-2 py-0.5">
              Discovery Engine
            </span>
            <span className="text-xs font-mono-code text-[#8A8A8A]">
              · {filteredProfiles.length} verified public members
            </span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F2F2ED] font-light">
            People worth meeting.
          </h1>
          <p className="font-sans-clean text-xs sm:text-sm text-[#8A8A8A] mt-2 max-w-xl">
            Discover fellow builders, researchers, and creators across colleges and departments. Browse public member profiles or launch focus deck mode.
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#151516] p-1 border border-[#242424]">
            <button
              id="view-deck-btn"
              onClick={() => setViewMode('deck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider font-mono-code font-bold transition-colors ${
                viewMode === 'deck'
                  ? 'bg-[#D4FF3F] text-[#080808]'
                  : 'text-[#8A8A8A] hover:text-[#F2F2ED]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Focus Deck</span>
            </button>
            <button
              id="view-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider font-mono-code font-bold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#D4FF3F] text-[#080808]'
                  : 'text-[#8A8A8A] hover:text-[#F2F2ED]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Browse Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state if any */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-mono-code flex items-center justify-between">
          <span>Failed to synchronize some profiles. Showing latest local cached directory.</span>
          <button
            onClick={handleResetAllFilters}
            className="text-white underline hover:text-red-200 uppercase"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Search & Quick Controls Bar */}
      <div className="space-y-4 mb-8">
        
        {/* Search row with filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <input
              id="discover-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentDeckIndex(0);
              }}
              placeholder="Search by name, college (e.g. Saveetha, MIT), department, skill (e.g. React, AI), or interests..."
              className="w-full border border-[#242424] bg-[#151516] pl-10 pr-16 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/50 focus:border-[#D4FF3F] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] hover:text-[#D4FF3F]"
              >
                Clear
              </button>
            )}
          </div>

          <button
            id="toggle-advanced-filters-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-3 border text-xs font-mono-code uppercase tracking-wider font-bold transition-colors ${
              showAdvancedFilters || activeFilterCount > 0
                ? 'border-[#D4FF3F] bg-[#D4FF3F]/10 text-[#D4FF3F]'
                : 'border-[#242424] bg-[#151516] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#D4FF3F] text-[#080808] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Advanced Filters (College, Department, Year, Skill, Interest) */}
        {showAdvancedFilters && (
          <div className="bg-[#101010] border border-[#242424] p-4 sm:p-5 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] font-bold flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-[#D4FF3F]" />
                <span>Multi-Dimensional Filters</span>
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetAllFilters}
                  className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All ({activeFilterCount})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* College Filter */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  College / Campus
                </label>
                <select
                  id="filter-college-select"
                  value={selectedCollege}
                  onChange={(e) => {
                    setSelectedCollege(e.target.value);
                    setCurrentDeckIndex(0);
                  }}
                  className="w-full bg-[#151516] border border-[#242424] px-3 py-2 text-xs text-[#F2F2ED] focus:border-[#D4FF3F] focus:outline-none"
                >
                  <option value="All">All Colleges</option>
                  {availableColleges.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Department
                </label>
                <select
                  id="filter-department-select"
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setCurrentDeckIndex(0);
                  }}
                  className="w-full bg-[#151516] border border-[#242424] px-3 py-2 text-xs text-[#F2F2ED] focus:border-[#D4FF3F] focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  {availableDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Cohort / Year
                </label>
                <select
                  id="filter-year-select"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentDeckIndex(0);
                  }}
                  className="w-full bg-[#151516] border border-[#242424] px-3 py-2 text-xs text-[#F2F2ED] focus:border-[#D4FF3F] focus:outline-none"
                >
                  <option value="All">All Years</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skill Filter */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Skill / Superpower
                </label>
                <select
                  id="filter-skill-select"
                  value={selectedSkill}
                  onChange={(e) => {
                    setSelectedSkill(e.target.value);
                    setCurrentDeckIndex(0);
                  }}
                  className="w-full bg-[#151516] border border-[#242424] px-3 py-2 text-xs text-[#F2F2ED] focus:border-[#D4FF3F] focus:outline-none"
                >
                  <option value="All">All Skills</option>
                  {availableSkills.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interest Filter */}
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Interest / Focus
                </label>
                <select
                  id="filter-interest-select"
                  value={selectedInterest}
                  onChange={(e) => {
                    setSelectedInterest(e.target.value);
                    setCurrentDeckIndex(0);
                  }}
                  className="w-full bg-[#151516] border border-[#242424] px-3 py-2 text-xs text-[#F2F2ED] focus:border-[#D4FF3F] focus:outline-none"
                >
                  <option value="All">All Interests</option>
                  {availableInterests.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter badges row */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[9px] font-mono-code text-[#8A8A8A] uppercase mr-1">Active:</span>
                {selectedCollege !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-[#151516] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                    College: {selectedCollege}
                    <button onClick={() => setSelectedCollege('All')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedDepartment !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-[#151516] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                    Dept: {selectedDepartment}
                    <button onClick={() => setSelectedDepartment('All')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedYear !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-[#151516] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                    Year: {selectedYear}
                    <button onClick={() => setSelectedYear('All')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedSkill !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-[#151516] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                    Skill: {selectedSkill}
                    <button onClick={() => setSelectedSkill('All')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedInterest !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-[#151516] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                    Interest: {selectedInterest}
                    <button onClick={() => setSelectedInterest('All')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedIntentFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-[#151516] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                    Intent: {selectedIntentFilter}
                    <button onClick={() => setSelectedIntentFilter('All')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Intent Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-mono-code text-[#8A8A8A] uppercase tracking-widest pr-2 whitespace-nowrap font-bold">
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
                className={`whitespace-nowrap px-3 py-1 text-xs font-mono-code uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'bg-[#D4FF3F] text-[#080808] font-bold'
                    : 'bg-[#151516] text-[#8A8A8A] border border-[#242424] hover:border-[#D4FF3F] hover:text-[#F2F2ED]'
                }`}
              >
                {intent}
              </button>
            );
          })}
        </div>

      </div>

      {/* Loading Skeleton Experience */}
      {isLoading && (
        <div className="py-20 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4FF3F] animate-ping" />
            <span className="text-xs font-mono-code uppercase tracking-widest text-[#8A8A8A]">
              FETCHING PUBLIC MISFIT PROFILES...
            </span>
          </div>
        </div>
      )}

      {/* No Results Fallback */}
      {!isLoading && filteredProfiles.length === 0 && (
        <div className="text-center py-20 border border-[#242424] bg-[#101010] p-8">
          <Sparkles className="w-8 h-8 text-[#D4FF3F] mx-auto mb-3 opacity-80" />
          <h3 className="font-editorial text-2xl text-[#F2F2ED]">No members found matching these criteria</h3>
          <p className="text-xs sm:text-sm text-[#8A8A8A] mt-2 max-w-md mx-auto">
            Try loosening your filters or searching for other colleges, skills, or departments.
          </p>
          <button
            onClick={handleResetAllFilters}
            className="mt-6 inline-flex items-center gap-2 border border-[#242424] bg-[#151516] px-5 py-2.5 text-xs font-mono-code font-bold uppercase tracking-widest text-[#F2F2ED] hover:border-[#D4FF3F] hover:text-[#D4FF3F]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* FOCUS DECK VIEW */}
      {!isLoading && viewMode === 'deck' && currentProfile && (
        <div className="max-w-3xl mx-auto">
          
          <div className="relative border border-[#242424] bg-[#101010] p-6 sm:p-10 shadow-2xl transition-all">
            
            {/* Top Bar: Profile Index, Online status, Bookmark & View Profile */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#242424]">
              <div className="flex items-center gap-2.5">
                <span className="bg-[#D4FF3F] text-[#080808] text-[10px] font-mono-code font-bold uppercase tracking-widest px-2.5 py-1">
                  Misfit {currentDeckIndex + 1} of {filteredProfiles.length}
                </span>
                {currentProfile.isOnline && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono-code uppercase tracking-wider text-[#8A8A8A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF3F]"></span>
                    Active in {currentProfile.location?.split(',')[0] || 'Worldwide'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="deck-open-full-profile-btn"
                  onClick={() => setActiveModalProfile(currentProfile)}
                  className="px-3 py-1.5 border border-[#242424] text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#D4FF3F] transition-colors flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>View Full Profile</span>
                </button>

                <button
                  id="bookmark-profile-btn"
                  onClick={() => onToggleBookmark(currentProfile.id)}
                  className={`p-2 border transition-colors ${
                    bookmarkedIds.includes(currentProfile.id)
                      ? 'border-[#D4FF3F] bg-[#D4FF3F]/10 text-[#D4FF3F]'
                      : 'border-[#242424] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838]'
                  }`}
                  title="Bookmark for later"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Main Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
              <div 
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => setActiveModalProfile(currentProfile)}
              >
                <img
                  src={currentProfile.avatarUrl || currentProfile.profilePhoto}
                  alt={currentProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-[#242424] group-hover:border-[#D4FF3F] transition-colors"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-editorial text-3xl sm:text-4xl font-light text-[#F2F2ED] group-hover:text-[#D4FF3F] transition-colors">
                      {currentProfile.name}
                    </h2>
                  </div>
                  <p className="text-xs text-[#D4FF3F] font-mono-code mt-0.5 uppercase tracking-wider">
                    {currentProfile.roleEmoji} {currentProfile.role}
                  </p>
                  <p className="text-[10px] text-[#8A8A8A] font-mono-code uppercase tracking-widest mt-0.5">
                    {currentProfile.location}
                  </p>
                </div>
              </div>

              {/* Intent badges */}
              <div className="flex flex-wrap sm:flex-col gap-1.5 sm:items-end">
                {currentProfile.intents?.map((intent) => (
                  <span
                    key={intent}
                    className="text-[10px] text-[#D4FF3F] border border-[#D4FF3F]/30 bg-[#D4FF3F]/5 px-3 py-1 font-mono-code font-bold uppercase tracking-wider"
                  >
                    {intent}
                  </span>
                ))}
              </div>
            </div>

            {/* Academic Affiliation if provided */}
            {(currentProfile.college || currentProfile.department || currentProfile.year) && (
              <div className="bg-[#151516] border border-[#242424] p-3.5 mb-6 flex flex-wrap items-center gap-4 text-xs font-mono-code">
                {currentProfile.college && (
                  <div className="flex items-center gap-1.5 text-[#F2F2ED]">
                    <GraduationCap className="w-3.5 h-3.5 text-[#D4FF3F]" />
                    <span>{currentProfile.college}</span>
                  </div>
                )}
                {currentProfile.department && (
                  <div className="flex items-center gap-1.5 text-[#8A8A8A]">
                    <BookOpen className="w-3.5 h-3.5 text-[#D4FF3F]" />
                    <span>{currentProfile.department}</span>
                  </div>
                )}
                {currentProfile.year && (
                  <div className="flex items-center gap-1.5 text-[#8A8A8A]">
                    <Calendar className="w-3.5 h-3.5 text-[#D4FF3F]" />
                    <span>{currentProfile.year}</span>
                  </div>
                )}
              </div>
            )}

            {/* Why you might get along */}
            <div className="border border-[#D4FF3F]/30 bg-[#D4FF3F]/[0.03] p-4 mb-6">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold">
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
              {currentProfile.tagline && (
                <p className="font-editorial text-xl sm:text-2xl italic text-[#F2F2ED] leading-relaxed mb-3">
                  “{currentProfile.tagline}”
                </p>
              )}
              <p className="font-sans-clean text-xs sm:text-sm text-[#8A8A8A] leading-relaxed line-clamp-4">
                {currentProfile.bio}
              </p>
            </div>

            {/* Skills & Superpowers */}
            {currentProfile.skills && Array.isArray(currentProfile.skills) && currentProfile.skills.length > 0 && (
              <div className="mb-6">
                <span className="text-[10px] font-mono-code text-[#8A8A8A] uppercase tracking-widest font-bold block mb-2">
                  Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(currentProfile.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] text-[#D4FF3F] bg-[#151516] px-2.5 py-1 border border-[#D4FF3F]/20 font-mono-code uppercase"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests Chips */}
            {currentProfile.interests && Array.isArray(currentProfile.interests) && currentProfile.interests.length > 0 && (
              <div className="mb-8">
                <span className="text-[10px] font-mono-code text-[#8A8A8A] uppercase tracking-widest font-bold block mb-2">
                  Interested in:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(currentProfile.interests || []).map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] text-[#8A8A8A] bg-[#151516] px-3 py-1 border border-[#242424] uppercase font-mono-code"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-6 border-t border-[#242424] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  id="deck-prev-btn"
                  onClick={handlePrevInDeck}
                  className="p-3 border border-[#242424] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838] transition-colors"
                  title="Previous person"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  id="deck-pass-btn"
                  onClick={handleNextInDeck}
                  className="px-5 py-3 border border-[#242424] text-xs font-mono-code font-bold uppercase tracking-widest text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838] transition-all"
                >
                  Pass / Next
                </button>
              </div>

              {(() => {
                const currentUserId = currentUser?.uid || currentUser?.id;
                const conn = connections.find(
                  (c) =>
                    c.profileId === currentProfile.id ||
                    c.profileId === currentProfile.uid ||
                    (c.requesterId === currentUserId && (c.targetId === currentProfile.id || c.targetId === currentProfile.uid)) ||
                    (c.targetId === currentUserId && (c.requesterId === currentProfile.id || c.requesterId === currentProfile.uid))
                );

                if (conn?.status === 'connected') {
                  return (
                    <button
                      id="deck-connected-chat-btn"
                      onClick={() => onOpenChat && onOpenChat(conn.id)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D4FF3F] text-[#080808] px-8 py-3.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Connected · Open Chat</span>
                    </button>
                  );
                }

                if (conn?.status === 'pending') {
                  const isSent = conn.requesterId === currentUserId;
                  if (isSent) {
                    return (
                      <button
                        id="deck-pending-sent-btn"
                        onClick={() => setActiveModalProfile(currentProfile)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 border border-blue-500/40 bg-blue-500/10 text-blue-400 px-8 py-3.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Request Sent · Pending</span>
                      </button>
                    );
                  } else {
                    return (
                      <button
                        id="deck-respond-req-btn"
                        onClick={() => setActiveModalProfile(currentProfile)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D4FF3F] text-[#080808] px-8 py-3.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Respond to Request</span>
                      </button>
                    );
                  }
                }

                return (
                  <button
                    id="deck-connect-btn"
                    onClick={() => onConnect(currentProfile)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D4FF3F] text-[#080808] px-8 py-3.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Connect with {currentProfile.name.split(' ')[0]}</span>
                  </button>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* GRID VIEW (Browse all public members) */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((person) => {
            const currentUserId = currentUser?.uid || currentUser?.id;
            const conn = connections.find(
              (c) =>
                c.profileId === person.id ||
                c.profileId === person.uid ||
                (c.requesterId === currentUserId && (c.targetId === person.id || c.targetId === person.uid)) ||
                (c.targetId === currentUserId && (c.requesterId === person.id || c.requesterId === person.uid))
            );

            return (
              <div
                key={person.id}
                className="border border-[#242424] bg-[#101010] p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#D4FF3F]/40 group"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setActiveModalProfile(person)}
                    >
                      <img
                        src={person.avatarUrl || person.profilePhoto}
                        alt={person.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 object-cover border border-[#242424] group-hover:border-[#D4FF3F] transition-colors"
                      />
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#F2F2ED] group-hover:text-[#D4FF3F] transition-colors">
                          {person.name}
                        </h3>
                        <p className="text-[10px] text-[#8A8A8A] font-mono-code uppercase tracking-widest">
                          {person.roleEmoji} {person.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleBookmark(person.id)}
                      className={`p-1.5 transition-colors ${
                        bookmarkedIds.includes(person.id)
                          ? 'text-[#D4FF3F]'
                          : 'text-[#8A8A8A] hover:text-[#F2F2ED]'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Academic Tag */}
                  {(person.college || person.department) && (
                    <div className="mb-3 text-[10px] font-mono-code text-[#D4FF3F] bg-[#151516] border border-[#242424] px-2.5 py-1 inline-flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3" />
                      <span>
                        {person.college || ''} {person.department ? `· ${person.department}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Tagline */}
                  {person.tagline && (
                    <p 
                      className="font-editorial text-sm italic text-[#8A8A8A] hover:text-[#F2F2ED] leading-snug mb-3 cursor-pointer"
                      onClick={() => setActiveModalProfile(person)}
                    >
                      “{person.tagline}”
                    </p>
                  )}

                  {/* Bio snippet */}
                  <p className="font-sans-clean text-xs text-[#8A8A8A] line-clamp-3 mb-4 leading-relaxed">
                    {person.bio}
                  </p>

                  {/* Skills tags */}
                  {person.skills && person.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(person.skills || []).slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[9px] font-mono-code text-[#D4FF3F] bg-[#151516] px-2 py-0.5 border border-[#D4FF3F]/20 uppercase"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer & Actions */}
                <div className="pt-4 border-t border-[#242424] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveModalProfile(person)}
                    className="text-[10px] font-mono-code text-[#8A8A8A] uppercase tracking-wider hover:text-[#F2F2ED]"
                  >
                    View Profile
                  </button>

                  {conn?.status === 'connected' ? (
                    <button
                      id={`grid-chat-${person.id}`}
                      onClick={() => onOpenChat && onOpenChat(conn.id)}
                      className="bg-[#D4FF3F] text-[#080808] px-3.5 py-1.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-colors"
                    >
                      Chat
                    </button>
                  ) : conn?.status === 'pending' ? (
                    <button
                      id={`grid-pending-${person.id}`}
                      onClick={() => setActiveModalProfile(person)}
                      className="border border-[#383838] text-[#8A8A8A] px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider hover:text-[#F2F2ED]"
                    >
                      {conn.requesterId === currentUserId ? 'Pending' : 'Respond'}
                    </button>
                  ) : (
                    <button
                      id={`grid-connect-${person.id}`}
                      onClick={() => onConnect(person)}
                      className="bg-[#D4FF3F] text-[#080808] px-4 py-1.5 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-white transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Member Profile Modal */}
      <MemberProfileModal
        isOpen={!!activeModalProfile}
        profile={activeModalProfile}
        currentUser={currentUser}
        connections={connections}
        isBookmarked={activeModalProfile ? bookmarkedIds.includes(activeModalProfile.id) : false}
        onClose={() => setActiveModalProfile(null)}
        onConnect={(target) => {
          setActiveModalProfile(null);
          onConnect(target);
        }}
        onOpenChat={(connId) => {
          setActiveModalProfile(null);
          if (onOpenChat) onOpenChat(connId);
        }}
        onAcceptRequest={onAcceptRequest}
        onDeclineRequest={onDeclineRequest}
        onCancelRequest={onCancelRequest}
        onRemoveConnection={onRemoveConnection}
        onToggleBookmark={onToggleBookmark}
      />

    </div>
  );
};
