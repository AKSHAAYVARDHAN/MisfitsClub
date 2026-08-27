import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  GraduationCap,
  BookOpen,
  Calendar,
  X,
  User,
  Filter,
  Check,
  Clock,
  ChevronDown
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

  // Convert raw profiles to public sanitized profiles, strictly excluding current user
  const currentUserId = currentUser?.uid || currentUser?.id;
  const publicProfiles: PublicProfile[] = useMemo(() => {
    return (profiles || [])
      .filter((p) => {
        const pId = p.uid || p.id;
        return !currentUserId || pId !== currentUserId;
      })
      .map((p) => {
        const { email, ...rest } = p as any; // Strictly strip private email
        return {
          ...rest,
          id: p.uid || p.id,
          uid: p.uid || p.id,
          skills: p.skills || [],
          interests: p.interests || [],
          intents: p.intents || [],
        } as PublicProfile;
      });
  }, [profiles, currentUserId]);

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
      currentUserId
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
    currentUserId,
  ]);

  // Active filter count (including search query)
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

  // Non-search filter count (specifically for refine discovery controls)
  const nonSearchFilterCount = useMemo(() => {
    let count = 0;
    if (selectedIntentFilter !== 'All') count++;
    if (selectedArchetypeFilter !== 'All') count++;
    if (selectedCollege !== 'All') count++;
    if (selectedDepartment !== 'All') count++;
    if (selectedYear !== 'All') count++;
    if (selectedSkill !== 'All') count++;
    if (selectedInterest !== 'All') count++;
    return count;
  }, [
    selectedIntentFilter,
    selectedArchetypeFilter,
    selectedCollege,
    selectedDepartment,
    selectedYear,
    selectedSkill,
    selectedInterest,
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
  };

  const handleClearRefineFilters = () => {
    setSelectedIntentFilter('All');
    setSelectedArchetypeFilter('All');
    setSelectedCollege('All');
    setSelectedDepartment('All');
    setSelectedYear('All');
    setSelectedSkill('All');
    setSelectedInterest('All');
  };

  // Helper to determine relationship state with a member
  const getConnectionForProfile = (person: PublicProfile) => {
    const userId = currentUser?.uid || currentUser?.id;
    return connections.find(
      (c) =>
        c.profileId === person.id ||
        c.profileId === person.uid ||
        (c.requesterId === userId && (c.targetId === person.id || c.targetId === person.uid)) ||
        (c.targetId === userId && (c.requesterId === person.id || c.requesterId === person.uid)) ||
        (c.participants && c.participants.includes(person.id) && c.participants.includes(userId || ''))
    );
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F0] py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-24 selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* 1. Page Header */}
      <div className="mb-8 pb-6 border-b border-[#1E1E24]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2.5 py-0.5">
            DISCOVER
          </span>
          <span className="text-xs font-mono-code text-[#7A7A82]">
            · {filteredProfiles.length} {filteredProfiles.length === 1 ? 'curious mind' : 'curious minds'}
          </span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
          People worth meeting.
        </h1>
        <p className="font-sans-clean text-xs sm:text-sm text-[#8E8E93] mt-2 max-w-2xl leading-relaxed">
          Discover curious builders, researchers, creators, and thinkers across the Misfits community.
        </p>
      </div>

      {/* Synchronize Error Banner (if any) */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-mono-code flex items-center justify-between">
          <span>Failed to synchronize some profiles. Showing latest cached public directory.</span>
          <button
            onClick={handleResetAllFilters}
            className="text-white underline hover:text-red-200 uppercase"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="space-y-3 sm:space-y-4 mb-8">
        
        {/* =========================================================================
            2A. MOBILE & TABLET DISCOVERY CONTROLS (Unified Single Refine Control)
            ========================================================================= */}
        <div className="lg:hidden space-y-2.5">
          {/* Search Input (Full width, clear icon, comfortable height) */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7A82]" />
            <input
              id="discover-search-input-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, skills, interests..."
              className="w-full border border-[#1E1E24] bg-[#0E0E12] pl-10 pr-16 py-3 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#7A7A82]/50 focus:border-[#D4FF3F]/60 focus:outline-none transition-colors min-h-[44px]"
            />
            {searchQuery && (
              <button
                id="clear-search-query-btn-mobile"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] hover:text-[#D4FF3F] py-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Unified Refine Discovery Trigger Button */}
          <button
            id="mobile-refine-discovery-btn"
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            aria-expanded={showAdvancedFilters}
            aria-controls="mobile-refine-discovery-panel"
            className={`w-full flex items-center justify-between px-4 py-3 border text-xs font-mono-code uppercase tracking-wider font-bold transition-all min-h-[44px] ${
              showAdvancedFilters || nonSearchFilterCount > 0
                ? 'border-[#D4FF3F]/60 bg-[#121216] text-[#F5F5F0]'
                : 'border-[#1E1E24] bg-[#0E0E12] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#2E2E38]'
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4FF3F]" />
              <span>Refine Discovery</span>
              {nonSearchFilterCount > 0 && (
                <span className="bg-[#D4FF3F] text-[#080808] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ml-1">
                  {nonSearchFilterCount}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#8E8E93] transition-transform duration-200 ${
                showAdvancedFilters ? 'rotate-180 text-[#D4FF3F]' : ''
              }`}
            />
          </button>

          {/* Mobile & Tablet Unified Refine Discovery Panel */}
          {showAdvancedFilters && (
            <div
              id="mobile-refine-discovery-panel"
              className="bg-[#0E0E12] border border-[#1E1E24] p-4 sm:p-5 space-y-4 animate-fadeIn"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
                <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4FF3F]" />
                  <span>Refine Discovery</span>
                </span>
                {nonSearchFilterCount > 0 && (
                  <span className="text-[10px] font-mono-code text-[#D4FF3F]">
                    {nonSearchFilterCount} {nonSearchFilterCount === 1 ? 'filter active' : 'filters active'}
                  </span>
                )}
              </div>

              {/* 6 Filters Grid (Responsive: 1 col on mobile, 2 col on tablet) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* 1. Connection Intent */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold">
                    Connection Intent
                  </label>
                  <select
                    id="mobile-refine-intent-select"
                    value={selectedIntentFilter}
                    onChange={(e) => setSelectedIntentFilter(e.target.value as ConnectionIntent | 'All')}
                    className={`w-full bg-[#121216] border px-3 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none min-h-[42px] transition-colors ${
                      selectedIntentFilter !== 'All' ? 'border-[#D4FF3F]/60 text-[#D4FF3F] font-bold' : 'border-[#1E1E24]'
                    }`}
                  >
                    <option value="All">All Intents</option>
                    {allIntents.filter(i => i !== 'All').map((intent) => (
                      <option key={intent} value={intent}>
                        {intent}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. College / Campus */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold">
                    College / Campus
                  </label>
                  <select
                    id="mobile-refine-college-select"
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className={`w-full bg-[#121216] border px-3 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none min-h-[42px] transition-colors ${
                      selectedCollege !== 'All' ? 'border-[#D4FF3F]/60 text-[#D4FF3F] font-bold' : 'border-[#1E1E24]'
                    }`}
                  >
                    <option value="All">All Colleges</option>
                    {availableColleges.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Department */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold">
                    Department
                  </label>
                  <select
                    id="mobile-refine-department-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className={`w-full bg-[#121216] border px-3 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none min-h-[42px] transition-colors ${
                      selectedDepartment !== 'All' ? 'border-[#D4FF3F]/60 text-[#D4FF3F] font-bold' : 'border-[#1E1E24]'
                    }`}
                  >
                    <option value="All">All Departments</option>
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Cohort / Year */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold">
                    Cohort / Year
                  </label>
                  <select
                    id="mobile-refine-year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={`w-full bg-[#121216] border px-3 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none min-h-[42px] transition-colors ${
                      selectedYear !== 'All' ? 'border-[#D4FF3F]/60 text-[#D4FF3F] font-bold' : 'border-[#1E1E24]'
                    }`}
                  >
                    <option value="All">All Years</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Skill / Craft */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold">
                    Skill / Craft
                  </label>
                  <select
                    id="mobile-refine-skill-select"
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className={`w-full bg-[#121216] border px-3 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none min-h-[42px] transition-colors ${
                      selectedSkill !== 'All' ? 'border-[#D4FF3F]/60 text-[#D4FF3F] font-bold' : 'border-[#1E1E24]'
                    }`}
                  >
                    <option value="All">All Skills</option>
                    {availableSkills.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Interest / Focus */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5 font-bold">
                    Interest / Focus
                  </label>
                  <select
                    id="mobile-refine-interest-select"
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(e.target.value)}
                    className={`w-full bg-[#121216] border px-3 py-2.5 text-xs font-mono-code text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none min-h-[42px] transition-colors ${
                      selectedInterest !== 'All' ? 'border-[#D4FF3F]/60 text-[#D4FF3F] font-bold' : 'border-[#1E1E24]'
                    }`}
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

              {/* Active Badges */}
              {nonSearchFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1E1E24]">
                  <span className="text-[9px] font-mono-code text-[#7A7A82] uppercase mr-1">Active:</span>
                  {selectedIntentFilter !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Intent: {selectedIntentFilter}
                      <button onClick={() => setSelectedIntentFilter('All')} aria-label="Clear intent filter"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedCollege !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      College: {selectedCollege}
                      <button onClick={() => setSelectedCollege('All')} aria-label="Clear college filter"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedDepartment !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Dept: {selectedDepartment}
                      <button onClick={() => setSelectedDepartment('All')} aria-label="Clear department filter"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedYear !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Year: {selectedYear}
                      <button onClick={() => setSelectedYear('All')} aria-label="Clear year filter"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedSkill !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Skill: {selectedSkill}
                      <button onClick={() => setSelectedSkill('All')} aria-label="Clear skill filter"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedInterest !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Interest: {selectedInterest}
                      <button onClick={() => setSelectedInterest('All')} aria-label="Clear interest filter"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#1E1E24]">
                <button
                  id="mobile-refine-clear-btn"
                  type="button"
                  onClick={handleClearRefineFilters}
                  disabled={nonSearchFilterCount === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-[#1E1E24] bg-[#121216] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#2E2E38] disabled:opacity-40 disabled:pointer-events-none text-xs font-mono-code uppercase tracking-wider min-h-[42px] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>

                <button
                  id="mobile-refine-apply-btn"
                  type="button"
                  onClick={() => setShowAdvancedFilters(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-lime-grained text-[#080808] border border-[#D4FF3F] hover:brightness-110 text-xs font-mono-code uppercase tracking-wider font-bold min-h-[42px] transition-all shadow-[0_0_15px_rgba(212,255,63,0.15)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            2B. DESKTOP DISCOVERY CONTROLS (UNTOUCHED & UNCHANGED)
            ========================================================================= */}
        <div className="hidden lg:block space-y-4">
          {/* Search input with filter drawer trigger */}
          <div className="flex flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7A82]" />
              <input
                id="discover-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, skills, interests..."
                className="w-full border border-[#1E1E24] bg-[#0E0E12] pl-10 pr-16 py-3 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#7A7A82]/50 focus:border-[#D4FF3F]/60 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  id="clear-search-query-btn"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] hover:text-[#D4FF3F]"
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
                  ? 'border-[#D4FF3F]/60 bg-[#D4FF3F]/10 text-[#D4FF3F]'
                  : 'border-[#1E1E24] bg-[#0E0E12] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#2E2E38]'
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

          {/* Connection Intent Quick Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[10px] font-mono-code text-[#7A7A82] uppercase tracking-widest pr-2 whitespace-nowrap font-bold">
              Connection Intent:
            </span>
            {allIntents.map((intent) => {
              const isSelected = selectedIntentFilter === intent;
              return (
                <button
                  key={intent}
                  id={`filter-intent-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedIntentFilter(intent)}
                  className={`whitespace-nowrap px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-lime-grained text-[#080808] font-bold border border-[#D4FF3F]'
                      : 'bg-[#0E0E12] text-[#8E8E93] border border-[#1E1E24] hover:border-[#383844] hover:text-[#F5F5F0]'
                  }`}
                >
                  {intent}
                </button>
              );
            })}
          </div>

          {/* Collapsible Multi-dimensional Filters */}
          {showAdvancedFilters && (
            <div className="bg-[#0E0E12] border border-[#1E1E24] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] font-bold flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-[#D4FF3F]" />
                  <span>Multi-Dimensional Filters</span>
                </span>
                {activeFilterCount > 0 && (
                  <button
                    id="reset-all-filters-btn"
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
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5">
                    College / Campus
                  </label>
                  <select
                    id="filter-college-select"
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full bg-[#121216] border border-[#1E1E24] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none"
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
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5">
                    Department
                  </label>
                  <select
                    id="filter-department-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full bg-[#121216] border border-[#1E1E24] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none"
                  >
                    <option value="All">All Departments</option>
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cohort Filter */}
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5">
                    Cohort / Year
                  </label>
                  <select
                    id="filter-year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-[#121216] border border-[#1E1E24] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none"
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
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5">
                    Skill / Craft
                  </label>
                  <select
                    id="filter-skill-select"
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="w-full bg-[#121216] border border-[#1E1E24] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none"
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
                  <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] mb-1.5">
                    Interest / Focus
                  </label>
                  <select
                    id="filter-interest-select"
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(e.target.value)}
                    className="w-full bg-[#121216] border border-[#1E1E24] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F]/60 focus:outline-none"
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
                  <span className="text-[9px] font-mono-code text-[#7A7A82] uppercase mr-1">Active:</span>
                  {selectedCollege !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      College: {selectedCollege}
                      <button onClick={() => setSelectedCollege('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedDepartment !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Dept: {selectedDepartment}
                      <button onClick={() => setSelectedDepartment('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedYear !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Year: {selectedYear}
                      <button onClick={() => setSelectedYear('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedSkill !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Skill: {selectedSkill}
                      <button onClick={() => setSelectedSkill('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedInterest !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Interest: {selectedInterest}
                      <button onClick={() => setSelectedInterest('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedIntentFilter !== 'All' && (
                    <span className="inline-flex items-center gap-1 bg-[#121216] border border-[#D4FF3F]/30 text-[#D4FF3F] px-2 py-0.5 text-[10px] font-mono-code">
                      Intent: {selectedIntentFilter}
                      <button onClick={() => setSelectedIntentFilter('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 3. Skeleton Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="border border-[#1E1E24] bg-[#0E0E12] p-6 flex flex-col justify-between h-[360px]">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-[#181820] rounded-none border border-[#24242C]" />
                    <div className="space-y-2">
                      <div className="w-28 h-4 bg-[#1C1C24]" />
                      <div className="w-20 h-3 bg-[#16161C]" />
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-[#16161C]" />
                </div>
                <div className="w-full h-16 bg-[#121216] border border-[#1A1A22] mb-3" />
                <div className="flex gap-1.5 mb-3">
                  <div className="w-14 h-5 bg-[#16161C]" />
                  <div className="w-16 h-5 bg-[#16161C]" />
                </div>
              </div>
              <div className="pt-4 border-t border-[#1E1E24] flex items-center justify-between">
                <div className="w-24 h-8 bg-[#16161C]" />
                <div className="w-20 h-8 bg-[#1E1E26]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Empty States */}
      {!isLoading && filteredProfiles.length === 0 && (
        <div className="text-center py-20 border border-[#1E1E24] bg-[#0E0E12] p-8 max-w-2xl mx-auto">
          <Sparkles className="w-8 h-8 text-[#D4FF3F] mx-auto mb-3 opacity-80" />
          
          {searchQuery ? (
            <>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0]">
                No people found for this search.
              </h3>
              <p className="text-xs sm:text-sm text-[#8E8E93] mt-2 max-w-md mx-auto leading-relaxed">
                Try widening your search terms or clearing your search query.
              </p>
              <button
                id="empty-state-clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="btn-secondary mt-6 inline-flex items-center gap-2 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Search</span>
              </button>
            </>
          ) : activeFilterCount > 0 ? (
            <>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0]">
                No Misfits found.
              </h3>
              <p className="text-xs sm:text-sm text-[#8E8E93] mt-2 max-w-md mx-auto leading-relaxed">
                Try widening your search or clearing a filter.
              </p>
              <button
                id="empty-state-clear-filters-btn"
                onClick={handleResetAllFilters}
                className="btn-secondary mt-6 inline-flex items-center gap-2 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0]">
                No Misfits to discover yet.
              </h3>
              <p className="text-xs sm:text-sm text-[#8E8E93] mt-2 max-w-md mx-auto leading-relaxed">
                New people will appear here as they join.
              </p>
            </>
          )}
        </div>
      )}

      {/* 5. RESPONSIVE PEOPLE GRID (Desktop: 3 cols, Tablet: 2 cols, Mobile: 1 col) */}
      {!isLoading && filteredProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((person) => {
            const conn = getConnectionForProfile(person);
            const isBookmarked = bookmarkedIds.includes(person.id);

            // Exploration or building signal from real profile fields without fabricating
            const explorationSignal = 
              person.building 
                ? `Building ${person.building}` 
                : person.learning 
                  ? `Exploring ${person.learning}` 
                  : person.tagline 
                    ? `“${person.tagline}”` 
                    : person.bio || 'Exploring ideas across technology and creative disciplines.';

            // Pick 2-3 key interests/skills for clean, scannable display
            const displayTags = [
              ...(person.skills || []).slice(0, 2),
              ...(person.interests || []).slice(0, 2)
            ].slice(0, 3);

            return (
              <div
                key={person.id}
                id={`member-card-${person.id}`}
                className="border border-[#1E1E24] bg-[#0E0E12] hover:bg-[#111115] p-6 flex flex-col justify-between transition-all duration-200 hover:border-[#2E2E38] group"
              >
                <div>
                  {/* Card Header: Photo + Name + Role + Bookmark */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div 
                      className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => setActiveModalProfile(person)}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={person.avatarUrl || person.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={person.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-cover border border-[#24242C] group-hover:border-[#D4FF3F]/50 transition-colors"
                        />
                        {person.isOnline && (
                          <span 
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#D4FF3F] border-2 border-[#0E0E12] rounded-full" 
                            title="Active in community"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-editorial text-xl sm:text-2xl font-light text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors leading-snug truncate">
                          {person.name}
                        </h3>
                        <p className="text-[11px] text-[#A1A1AA] font-mono-code uppercase tracking-wider mt-0.5 truncate flex items-center gap-1.5">
                          {person.roleEmoji && <span>{person.roleEmoji}</span>}
                          <span>{person.role || 'Explorer & Builder'}</span>
                        </p>
                        {(person.location || person.college) && (
                          <p className="text-[10px] text-[#7A7A82] font-mono-code uppercase tracking-widest mt-0.5 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#7A7A82] shrink-0" />
                            <span>{person.college || person.location || 'Worldwide'}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bookmark Toggle */}
                    <button
                      id={`bookmark-btn-${person.id}`}
                      onClick={() => onToggleBookmark(person.id)}
                      className={`p-2 border transition-colors shrink-0 ${
                        isBookmarked
                          ? 'border-[#D4FF3F]/60 bg-[#D4FF3F]/10 text-[#D4FF3F]'
                          : 'border-[#1E1E24] text-[#7A7A82] hover:text-[#F5F5F0] hover:border-[#383844] bg-[#121216]'
                      }`}
                      title={isBookmarked ? 'Bookmarked' : 'Bookmark to revisit'}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Exploration / Building Signal */}
                  <div 
                    className="mb-4 p-3 bg-[#121216] border border-[#1E1E24] text-xs cursor-pointer group/signal"
                    onClick={() => setActiveModalProfile(person)}
                  >
                    <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#7A7A82] font-bold block mb-1">
                      {person.building ? 'Building' : person.learning ? 'Exploring' : 'Curiosity'}
                    </span>
                    <p className="text-[#E4E4E7] font-sans-clean line-clamp-2 leading-relaxed text-xs group-hover/signal:text-[#F5F5F0] transition-colors">
                      {explorationSignal}
                    </p>
                  </div>

                  {/* Key Interests & Skills (Small, scannable tags) */}
                  {displayTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {displayTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-[#A1A1AA] bg-[#141418] border border-[#222228] px-2 py-0.5 font-mono-code uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Connection Intent(s) */}
                  {person.intents && person.intents.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {person.intents.slice(0, 2).map((intent) => (
                        <span
                          key={intent}
                          className="text-[9px] font-mono-code uppercase tracking-wider text-[#D4FF3F] bg-[#D4FF3F]/8 border border-[#D4FF3F]/25 px-2 py-0.5 font-bold"
                        >
                          {intent}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions: Primary View Profile + Secondary/Connection Action */}
                <div className="pt-4 border-t border-[#1E1E24] flex items-center justify-between gap-2 mt-auto">
                  <button
                    id={`view-profile-btn-${person.id}`}
                    onClick={() => setActiveModalProfile(person)}
                    className="btn-secondary text-[11px] py-2 px-3.5 flex items-center gap-1.5 hover:text-[#F5F5F0]"
                  >
                    <User className="w-3 h-3 text-[#A1A1AA]" />
                    <span>View Profile</span>
                  </button>

                  {/* Connection state handler */}
                  {conn?.status === 'connected' ? (
                    <button
                      id={`grid-chat-btn-${person.id}`}
                      onClick={() => onOpenChat && onOpenChat(conn.id)}
                      className="btn-primary text-[11px] py-2 px-3.5 flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Open Chat</span>
                    </button>
                  ) : conn?.status === 'pending' ? (
                    conn.requesterId === currentUserId ? (
                      <button
                        id={`grid-pending-sent-btn-${person.id}`}
                        onClick={() => setActiveModalProfile(person)}
                        className="inline-flex items-center gap-1.5 border border-blue-500/30 bg-blue-500/10 text-blue-400 px-3 py-2 text-[11px] font-mono-code font-bold uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Request Sent</span>
                      </button>
                    ) : (
                      <button
                        id={`grid-respond-req-btn-${person.id}`}
                        onClick={() => setActiveModalProfile(person)}
                        className="btn-primary text-[11px] py-2 px-3.5 flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3" />
                        <span>Respond</span>
                      </button>
                    )
                  ) : (
                    <button
                      id={`grid-connect-btn-${person.id}`}
                      onClick={() => onConnect(person)}
                      className="btn-primary text-[11px] py-2 px-3.5 flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 6. Member Profile Modal (Deep Exploration & History) */}
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
