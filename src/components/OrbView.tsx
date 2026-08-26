import React, { useState, useMemo } from 'react';
import { ConnectionIntent, OrbLocation, UserProfile, PublicProfile, Connection } from '../types';
import { SAMPLE_PROFILES, INITIAL_USER } from '../data/mockData';
import { OrbGlobe } from './OrbGlobe';
import { 
  Compass, 
  ArrowRight, 
  Sparkles, 
  RotateCw, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  User, 
  X, 
  Globe, 
  MapPin,
  Layers,
  HelpCircle,
  Users,
  Send
} from 'lucide-react';

interface OrbViewProps {
  currentUser?: UserProfile | null;
  connections?: Connection[];
  allProfiles?: (UserProfile | PublicProfile)[];
  profiles?: (UserProfile | PublicProfile)[];
  onExplore?: () => void;
  onOpenOnboarding?: () => void;
  onOpenChatWithProfile?: (profileId: string) => void;
  onSelectProfile?: (profile: UserProfile | PublicProfile) => void;
  onConnect?: (profile: UserProfile | PublicProfile) => void;
  onSelectIntentFilter?: (intent: ConnectionIntent) => void;
}

export const OrbView: React.FC<OrbViewProps> = ({
  currentUser = INITIAL_USER,
  connections = [],
  allProfiles,
  profiles,
  onExplore,
  onOpenOnboarding,
  onOpenChatWithProfile,
  onSelectProfile,
  onConnect,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<OrbLocation | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<OrbLocation | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | undefined>(undefined);
  const [activeIntentFilter, setActiveIntentFilter] = useState<ConnectionIntent | 'All'>('All');
  const [showArcs, setShowArcs] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [demoZeroState, setDemoZeroState] = useState(false);

  // Profile list resolution with safe fallback
  const rawProfilesList = allProfiles || profiles || SAMPLE_PROFILES;
  const safeProfilesList = (rawProfilesList && rawProfilesList.length > 0) ? rawProfilesList : SAMPLE_PROFILES;
  const safeUser = currentUser || INITIAL_USER;

  // User coordinate & city fallback
  const userGeo = useMemo(() => {
    return {
      lat: safeUser.lat ?? 13.0827,
      lng: safeUser.lng ?? 80.2707,
      name: safeUser.name || 'Akshaay Vardhan',
      city: safeUser.location?.split(',')[0] || 'Chennai',
    };
  }, [safeUser]);

  // Transform connections and profiles into OrbLocations
  const orbLocations: OrbLocation[] = useMemo(() => {
    if (demoZeroState) return [];

    const safeConns = connections || [];

    // Map existing active connections
    const mappedConns: OrbLocation[] = safeConns.map((conn) => {
      const p = conn.profile;
      return {
        id: p?.id || conn.id,
        name: p?.name || 'Member',
        city: (p?.location || 'Worldwide').split(',')[0].trim(),
        country: p?.country || 'Global',
        lat: p?.lat ?? 52.52,
        lng: p?.lng ?? 13.40,
        profile: p,
        intents: (conn.sharedIntents && conn.sharedIntents.length > 0) ? conn.sharedIntents : (p?.intents || []),
        lastActive: conn.lastMessageTime || 'Recently',
      };
    });

    // Add additional curated global network misfits so globe is richly populated across continents
    const existingIds = new Set(mappedConns.map((c) => c.id));
    safeProfilesList.forEach((p) => {
      if (p && !existingIds.has(p.id) && p.id !== safeUser.id && p.lat !== undefined && p.lng !== undefined) {
        mappedConns.push({
          id: p.id,
          name: p.name || 'Member',
          city: (p.location || 'Worldwide').split(',')[0].trim(),
          country: p.country || 'Global',
          lat: p.lat,
          lng: p.lng,
          profile: p as UserProfile,
          intents: p.intents || [],
          lastActive: 'Active today',
        });
      }
    });

    return mappedConns;
  }, [connections, safeProfilesList, safeUser.id, demoZeroState]);

  // Calculate unique countries and connection stats
  const stats = useMemo(() => {
    if (demoZeroState) {
      return { count: 0, countries: 0, sharedIntents: 0 };
    }
    const countriesSet = new Set(orbLocations.map((loc) => loc.country));
    const allIntents = new Set(orbLocations.flatMap((loc) => loc.intents || []));
    return {
      count: orbLocations.length,
      countries: Math.max(countriesSet.size, 1),
      sharedIntents: allIntents.size,
    };
  }, [orbLocations, demoZeroState]);

  const allIntentsList: (ConnectionIntent | 'All')[] = [
    'All',
    'Build Together',
    'Exchange Ideas',
    'Collaborate',
    'Learn Together',
    'Find a Co-founder',
    'Find a Mentor',
    'Just Talk',
  ];

  const handleHover = (loc: OrbLocation | null, screenPos?: { x: number; y: number }) => {
    setHoveredLocation(loc);
    setHoverPos(screenPos);
  };

  const handleOpenConversation = (profileId: string) => {
    if (onOpenChatWithProfile) {
      onOpenChatWithProfile(profileId);
    } else if (onExplore) {
      onExplore();
    }
  };

  const handleViewProfileModal = (profile: UserProfile | PublicProfile) => {
    if (onSelectProfile) {
      onSelectProfile(profile);
    } else if (onConnect) {
      onConnect(profile);
    } else if (onExplore) {
      onExplore();
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] bg-[#0B0B0C] text-[#F5F5F0] overflow-hidden flex flex-col justify-between">
      
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#F5F5F0_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* TOP BAR / OVERLAY HEADER */}
      <div className="relative z-10 pt-6 sm:pt-8 px-6 sm:px-10 lg:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Left Editorial Branding & Headline */}
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2.5 py-0.5 font-mono-code">
              THE ORB
            </span>
            <span className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-mono-code flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
              Living Globe of Connections
            </span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-light text-[#F5F5F0] tracking-tight leading-[1.05]">
            Your world is <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#F5F5F0]">getting bigger</span>.
          </h1>

          <p className="font-sans-clean text-xs sm:text-sm text-[#8E8E93] mt-2.5 leading-relaxed max-w-md font-normal">
            Look at the people you’ve met around the planet. Every node represents a real human conversation, shared inquiry, or collaborative spark.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-[#1E1E24]">
            <div>
              <span className="font-editorial text-2xl sm:text-3xl font-light text-[#F5F5F0] block leading-none">
                {demoZeroState ? '0' : stats.count}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A82] font-mono-code mt-1 block">
                Connections
              </span>
            </div>

            <div className="h-6 w-px bg-[#1E1E24]" />

            <div>
              <span className="font-editorial text-2xl sm:text-3xl font-light text-[#F5F5F0] block leading-none">
                {demoZeroState ? '0' : stats.countries}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A82] font-mono-code mt-1 block">
                Countries
              </span>
            </div>

            <div className="h-6 w-px bg-[#1E1E24]" />

            <div>
              <span className="font-editorial text-2xl sm:text-3xl font-light text-[#D4FF3F] block leading-none">
                {userGeo.city}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A82] font-mono-code mt-1 block">
                Home Base
              </span>
            </div>
          </div>
        </div>

        {/* Right Top Actions & Mode Toggles */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <button
              id="orb-explore-network-btn"
              onClick={onExplore}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Thinkers</span>
            </button>

            <button
              id="orb-toggle-empty-state-btn"
              onClick={() => setDemoZeroState(!demoZeroState)}
              title="Toggle between full world and zero connection starting state"
              className={`border px-3 py-2.5 text-[10px] font-mono-code font-bold uppercase tracking-widest transition-all ${
                demoZeroState
                  ? 'border-[#D4FF3F]/60 text-[#D4FF3F] bg-[#141418]'
                  : 'border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] bg-[#0E0E12]'
              }`}
            >
              {demoZeroState ? 'State: Zero (0 Conns)' : 'State: My World (27 Conns)'}
            </button>
          </div>

          {/* Interactive Display Controls */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title="Toggle Globe Auto-Rotation"
              className={`px-3 py-1 text-[9px] font-mono-code font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                autoRotate
                  ? 'border-[#24242C] text-[#F5F5F0] bg-[#121216]'
                  : 'border-[#1E1E24] text-[#7A7A82] bg-transparent'
              }`}
            >
              <RotateCw className={`w-3 h-3 ${autoRotate ? 'text-[#D4FF3F]' : 'text-[#7A7A82]'}`} />
              <span>{autoRotate ? 'Spin: On' : 'Spin: Off'}</span>
            </button>

            <button
              onClick={() => setShowArcs(!showArcs)}
              title="Toggle 3D Connection Arcs"
              className={`px-3 py-1 text-[9px] font-mono-code font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                showArcs
                  ? 'border-[#24242C] text-[#F5F5F0] bg-[#121216]'
                  : 'border-[#1E1E24] text-[#7A7A82] bg-transparent'
              }`}
            >
              {showArcs ? <Eye className="w-3 h-3 text-[#D4FF3F]" /> : <EyeOff className="w-3 h-3 text-[#7A7A82]" />}
              <span>{showArcs ? 'Arcs: On' : 'Arcs: Off'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D GLOBE VIEWPORT CANVAS */}
      <div className="relative w-full flex-1 min-h-[500px] sm:min-h-[580px] lg:min-h-[620px] my-2">
        <OrbGlobe
          userLocation={userGeo}
          connections={orbLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          activeIntentFilter={activeIntentFilter}
          showLines={showArcs}
          autoRotate={autoRotate}
          emptyState={demoZeroState}
          onHoverLocation={handleHover}
          className="w-full h-full absolute inset-0"
        />

        {/* Empty State Banner Overlay if in Zero Connections mode */}
        {demoZeroState && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-4">
            <div className="bg-[#0E0E12]/95 backdrop-blur-md border border-[#1E1E24] p-6 sm:p-8 max-w-md text-center pointer-events-auto shadow-2xl">
              <Sparkles className="w-6 h-6 text-[#D4FF3F] mx-auto mb-3" />
              <span className="text-[10px] text-[#D4FF3F] font-mono-code uppercase tracking-widest font-bold block mb-1">
                Zero Connections
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light">
                Your world starts here.
              </h2>
              <p className="text-xs text-[#8E8E93] mt-2 mb-5 leading-relaxed">
                You haven't made any connections yet. Discover curious minds around the globe and watch your personal Orb expand.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  id="zero-state-find-someone-btn"
                  onClick={onExplore}
                  className="btn-primary text-xs"
                >
                  Find Someone
                </button>
                <button
                  onClick={() => setDemoZeroState(false)}
                  className="btn-secondary text-xs"
                >
                  View Sample Globe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredLocation && hoverPos && !selectedLocation && (
          <div
            className="fixed z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
            style={{ left: hoverPos.x, top: hoverPos.y }}
          >
            <div className="bg-[#0E0E12]/95 border border-[#D4FF3F]/40 px-3 py-2 shadow-2xl backdrop-blur-sm text-center">
              <p className="text-xs font-bold text-white uppercase tracking-wider font-mono-code">
                {hoveredLocation.name}
              </p>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-mono-code">
                {hoveredLocation.city}, {hoveredLocation.country}
              </p>
              {hoveredLocation.profile?.role && (
                <p className="text-[9px] text-[#D4FF3F] mt-0.5 font-mono-code">
                  {hoveredLocation.profile.role}
                </p>
              )}
            </div>
            <div className="w-2 h-2 bg-[#D4FF3F] rotate-45 mx-auto -mt-1" />
          </div>
        )}

        {/* Selected Thinker Side / Floating Preview Card */}
        {selectedLocation && selectedLocation.profile && (
          <div className="absolute right-6 top-6 bottom-6 sm:bottom-auto sm:max-h-[500px] w-full max-w-sm z-10 bg-[#0E0E12]/95 border border-[#1E1E24] p-5 sm:p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between animate-fadeIn overflow-y-auto">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1E1E24]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4FF3F] font-mono-code">
                    Connected Thinker
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-[#7A7A82] hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar & Header Info */}
              <div className="flex items-start gap-3.5 mb-4">
                <img
                  src={selectedLocation.profile.avatarUrl}
                  alt={selectedLocation.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover border border-[#24242C]"
                />
                <div>
                  <h3 className="font-editorial text-xl text-white font-medium">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] uppercase tracking-widest font-mono-code flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#D4FF3F]" />
                    {selectedLocation.city}, {selectedLocation.country}
                  </p>
                  <p className="text-[10px] text-[#D4FF3F] font-mono-code mt-0.5">
                    {selectedLocation.profile.role}
                  </p>
                </div>
              </div>

              {/* Tagline / Inquiry */}
              <div className="bg-[#121216] border border-[#1E1E24] p-3.5 mb-4">
                <span className="text-[9px] uppercase tracking-widest text-[#7A7A82] font-mono-code block mb-1">
                  Active Rabbit Hole / Obsession
                </span>
                <p className="font-editorial text-sm italic text-[#F5F5F0] leading-snug">
                  “{selectedLocation.profile.tagline}”
                </p>
              </div>

              {/* Shared / Profile Intents */}
              <div className="mb-4">
                <span className="text-[9px] uppercase tracking-widest text-[#7A7A82] font-mono-code block mb-1.5">
                  Connection Intentions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLocation.intents?.map((it) => (
                    <span
                      key={it}
                      className="tag-pill-active"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>

              {/* Curious About Tags */}
              {selectedLocation.profile.curiousAbout && Array.isArray(selectedLocation.profile.curiousAbout) && selectedLocation.profile.curiousAbout.length > 0 && (
                <div className="mb-4">
                  <span className="text-[9px] uppercase tracking-widest text-[#7A7A82] font-mono-code block mb-1.5">
                    Currently Questioning
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(selectedLocation.profile.curiousAbout || []).slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="tag-pill"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#1E1E24] flex items-center gap-2">
              <button
                id="orb-card-message-btn"
                onClick={() => handleOpenConversation(selectedLocation.id)}
                className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>

              <button
                id="orb-card-view-profile-btn"
                onClick={() => handleViewProfileModal(selectedLocation.profile!)}
                className="btn-secondary px-3 py-2 text-xs flex items-center justify-center"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & INTENT FILTER BAR */}
      <div className="relative z-10 pb-6 px-6 sm:px-10 lg:px-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Intent Quick Filters */}
        <div className="w-full lg:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-[10px] uppercase tracking-widest text-[#7A7A82] font-mono-code whitespace-nowrap mr-1 hidden sm:inline">
            Highlight by Intent:
          </span>
          {allIntentsList.map((intent) => {
            const isSelected = activeIntentFilter === intent;
            return (
              <button
                key={intent}
                id={`orb-filter-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveIntentFilter(intent)}
                className={`px-3 py-1 text-[10px] font-mono-code font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-lime-grained text-[#080808] border-[#D4FF3F]'
                    : 'bg-[#121216] text-[#8E8E93] border-[#1E1E24] hover:border-[#383844] hover:text-[#F5F5F0]'
                }`}
              >
                {intent}
              </button>
            );
          })}
        </div>

        {/* Legend / Instructions */}
        <div className="flex items-center gap-4 text-[10px] text-[#7A7A82] font-mono-code uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
            <span>Home ({userGeo.city})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F5F5F0]" />
            <span>Thinker Node</span>
          </div>
          <span className="hidden sm:inline text-[#7A7A82]/60">· Drag to rotate · Scroll to zoom</span>
        </div>

      </div>

    </div>
  );
};
