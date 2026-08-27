import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ConnectionIntent, OrbLocation, UserProfile, PublicProfile, Connection } from '../types';
import { SAMPLE_PROFILES, INITIAL_USER } from '../data/mockData';
import { OrbGlobe, OrbGlobeRef } from './OrbGlobe';
import { 
  Compass, 
  Sparkles, 
  RotateCw, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  User, 
  X, 
  MapPin,
  HelpCircle,
  Users,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  UserPlus,
  Info
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
  const globeRef = useRef<OrbGlobeRef>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  const [selectedLocation, setSelectedLocation] = useState<OrbLocation | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<OrbLocation | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | undefined>(undefined);
  const [activeIntentFilter, setActiveIntentFilter] = useState<ConnectionIntent | 'All'>('All');
  const [showArcs, setShowArcs] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [demoZeroState, setDemoZeroState] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showMobileHelp, setShowMobileHelp] = useState(false);

  // Profile list resolution with safe fallback
  const rawProfilesList = allProfiles || profiles || SAMPLE_PROFILES;
  const safeProfilesList = (rawProfilesList && rawProfilesList.length > 0) ? rawProfilesList : SAMPLE_PROFILES;
  const safeUser = currentUser || INITIAL_USER;

  // User coordinate & city fallback (Chennai default, dynamic if set)
  const userGeo = useMemo(() => {
    return {
      lat: safeUser.lat ?? 13.0827,
      lng: safeUser.lng ?? 80.2707,
      name: safeUser.name || 'Akshaay Vardhan',
      city: safeUser.location?.split(',')[0]?.trim() || 'Chennai',
    };
  }, [safeUser]);

  // Set of connected profile IDs to accurately determine connection status
  const connectedProfileIds = useMemo(() => {
    const ids = new Set<string>();
    (connections || []).forEach((c) => {
      if (c.profileId) ids.add(c.profileId);
      if (c.targetId) ids.add(c.targetId);
      if (c.profile?.id) ids.add(c.profile.id);
      if (c.id) ids.add(c.id);
    });
    return ids;
  }, [connections]);

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

  // Calculate unique countries and connection stats dynamically
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

  // Close thinker card on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLocation(null);
        setShowMobileHelp(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleConnectAction = (profile: UserProfile | PublicProfile) => {
    if (onConnect) {
      onConnect(profile);
    } else if (onSelectProfile) {
      onSelectProfile(profile);
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

  const isSelectedConnected = useMemo(() => {
    if (!selectedLocation?.profile) return false;
    return connectedProfileIds.has(selectedLocation.id) || connectedProfileIds.has(selectedLocation.profile.id);
  }, [selectedLocation, connectedProfileIds]);

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] bg-[#0B0B0C] text-[#F5F5F0] overflow-hidden flex flex-col justify-between select-none">
      
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#F5F5F0_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* =========================================================================
          1. ORB HEADER (EDITORIAL INTRODUCTION & CONNECTION METRICS)
          ========================================================================= */}
      <header className="relative z-10 pt-5 sm:pt-7 lg:pt-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          
          {/* Left Column: Branding, Editorial Headline & Dynamic Stats */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 px-2.5 py-0.5 font-mono-code">
                THE ORB
              </span>
              <span className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-mono-code flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
                Living Globe of Connections
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-light text-[#F5F5F0] tracking-tight leading-tight whitespace-normal sm:whitespace-nowrap">
              Your world is <span className="italic font-normal text-[#F5F5F0]">getting bigger</span>.
            </h1>

            <p className="font-sans-clean text-xs sm:text-sm text-[#8E8E93] mt-2 leading-relaxed max-w-lg font-normal">
              Look at the people you’ve met around the planet. Every node represents a real human conversation, shared inquiry, or collaborative spark.
            </p>

            {/* Dynamic Metrics Hierarchy */}
            <div className="flex items-center gap-5 sm:gap-7 mt-3.5 pt-3 border-t border-[#1E1E24]">
              <div>
                <span className="font-editorial text-xl sm:text-2xl lg:text-3xl font-light text-[#F5F5F0] block leading-none">
                  {demoZeroState ? '0' : stats.count}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A82] font-mono-code mt-1 block">
                  Connections
                </span>
              </div>

              <div className="h-6 w-px bg-[#1E1E24]" />

              <div>
                <span className="font-editorial text-xl sm:text-2xl lg:text-3xl font-light text-[#F5F5F0] block leading-none">
                  {demoZeroState ? '0' : stats.countries}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A82] font-mono-code mt-1 block">
                  Countries
                </span>
              </div>

              <div className="h-6 w-px bg-[#1E1E24]" />

              <div>
                <span className="font-editorial text-xl sm:text-2xl lg:text-3xl font-light text-[#D4FF3F] block leading-none whitespace-nowrap">
                  {userGeo.city}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A82] font-mono-code mt-1 block whitespace-nowrap">
                  Home Base
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent Primary Action + Clean Secondary Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 self-start">
            
            {/* Primary Action: Explore Thinkers */}
            <button
              id="orb-explore-network-btn"
              onClick={onExplore}
              className="btn-primary flex items-center gap-2 text-xs w-full sm:w-auto justify-center shadow-lg hover:shadow-lime-glow transition-all"
            >
              <Compass className="w-4 h-4 text-[#080808]" />
              <span className="font-bold tracking-wide">Explore Thinkers</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#080808] opacity-70" />
            </button>

            {/* Secondary Controls Group (Visually Quieter & Structured) */}
            <div className="flex items-center flex-wrap gap-2 pt-1 w-full sm:w-auto justify-start lg:justify-end">
              
              {/* State View Selector */}
              <button
                id="orb-toggle-empty-state-btn"
                onClick={() => setDemoZeroState(!demoZeroState)}
                title="Toggle between populated world and zero connection starting state"
                aria-label="Toggle network view state"
                className={`border px-3 py-1.5 text-[10px] font-mono-code font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  demoZeroState
                    ? 'border-[#D4FF3F]/60 text-[#D4FF3F] bg-[#141418]'
                    : 'border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] bg-[#0E0E12]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${demoZeroState ? 'bg-[#D4FF3F]' : 'bg-[#7A7A82]'}`} />
                <span>{demoZeroState ? 'State: Zero (0)' : `State: My World (${orbLocations.length})`}</span>
              </button>

              {/* Spin Auto-Rotation Toggle */}
              <button
                id="orb-toggle-spin-btn"
                onClick={() => setAutoRotate(!autoRotate)}
                title={autoRotate ? "Pause automatic globe rotation" : "Enable automatic globe rotation"}
                aria-label={autoRotate ? "Pause rotation" : "Enable rotation"}
                className={`px-3 py-1.5 text-[10px] font-mono-code font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                  autoRotate
                    ? 'border-[#24242C] text-[#F5F5F0] bg-[#121216]'
                    : 'border-[#1E1E24] text-[#7A7A82] bg-[#0E0E12]'
                }`}
              >
                <RotateCw className={`w-3 h-3 ${autoRotate ? 'text-[#D4FF3F]' : 'text-[#7A7A82]'}`} />
                <span>Spin:</span>
                <span className={autoRotate ? 'text-[#D4FF3F]' : 'text-[#7A7A82]'}>{autoRotate ? 'ON' : 'OFF'}</span>
              </button>

              {/* Connection Arcs Toggle */}
              <button
                id="orb-toggle-arcs-btn"
                onClick={() => setShowArcs(!showArcs)}
                title={showArcs ? "Hide 3D connection arcs" : "Show 3D connection arcs"}
                aria-label={showArcs ? "Hide connection arcs" : "Show connection arcs"}
                className={`px-3 py-1.5 text-[10px] font-mono-code font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                  showArcs
                    ? 'border-[#24242C] text-[#F5F5F0] bg-[#121216]'
                    : 'border-[#1E1E24] text-[#7A7A82] bg-[#0E0E12]'
                }`}
              >
                {showArcs ? <Eye className="w-3 h-3 text-[#D4FF3F]" /> : <EyeOff className="w-3 h-3 text-[#7A7A82]" />}
                <span>Arcs:</span>
                <span className={showArcs ? 'text-[#D4FF3F]' : 'text-[#7A7A82]'}>{showArcs ? 'ON' : 'OFF'}</span>
              </button>

            </div>
          </div>

        </div>
      </header>

      {/* =========================================================================
          2. 3D GLOBE EXPERIENCE & INTERACTION AREA
          ========================================================================= */}
      <div className="relative w-full flex-1 min-h-[460px] sm:min-h-[540px] lg:min-h-[580px] my-1 sm:my-2">
        
        {/* Globe WebGL Canvas Component */}
        <OrbGlobe
          ref={globeRef}
          userLocation={userGeo}
          connections={orbLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setHasInteracted(true);
          }}
          activeIntentFilter={activeIntentFilter}
          showLines={showArcs}
          autoRotate={autoRotate}
          emptyState={demoZeroState}
          showRecenterButton={false}
          onHoverLocation={handleHover}
          onUserInteraction={() => setHasInteracted(true)}
          className="w-full h-full absolute inset-0"
        />

        {/* --- Globe Control Zone: Grouped Precision Navigation Cluster --- */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-10 flex items-center gap-2 pointer-events-auto">
          {/* Zoom In & Out Pair */}
          <div className="flex items-center border border-[#1E1E24] bg-[#0E0E12]/95 backdrop-blur-md shadow-2xl">
            <button
              id="orb-zoom-out-btn"
              onClick={() => {
                setHasInteracted(true);
                globeRef.current?.zoomOut();
              }}
              title="Zoom out (−)"
              aria-label="Zoom out"
              className="p-2 text-[#8E8E93] hover:text-[#D4FF3F] hover:bg-[#141418] transition-colors border-r border-[#1E1E24] active:bg-[#1E1E24]"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="orb-zoom-in-btn"
              onClick={() => {
                setHasInteracted(true);
                globeRef.current?.zoomIn();
              }}
              title="Zoom in (+)"
              aria-label="Zoom in"
              className="p-2 text-[#8E8E93] hover:text-[#D4FF3F] hover:bg-[#141418] transition-colors active:bg-[#1E1E24]"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recenter Button on User's Location */}
          <button
            id="orb-recenter-btn"
            onClick={() => {
              setHasInteracted(true);
              globeRef.current?.resetToHome();
            }}
            title={`Recenter on home: ${userGeo.city}`}
            aria-label={`Recenter on ${userGeo.city}`}
            className="bg-[#0E0E12]/95 backdrop-blur-md border border-[#1E1E24] hover:border-[#D4FF3F]/50 text-[#F5F5F0] hover:text-[#D4FF3F] px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl flex items-center gap-1.5 font-mono-code active:bg-[#141418]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
            <span>Recenter • {userGeo.city}</span>
          </button>
        </div>

        {/* --- Subtle Interaction Hints (Unobtrusive & Quiet) --- */}
        <div className={`absolute bottom-4 left-4 sm:bottom-6 sm:left-8 z-10 pointer-events-none transition-opacity duration-500 hidden sm:flex items-center gap-3 ${hasInteracted ? 'opacity-40 hover:opacity-100' : 'opacity-80'}`}>
          <div className="bg-[#0E0E12]/80 backdrop-blur-md border border-[#1E1E24]/60 px-3 py-1.5 text-[10px] text-[#8E8E93] font-mono-code uppercase tracking-wider flex items-center gap-2">
            <span>Drag to rotate</span>
            <span className="text-[#383844]">·</span>
            <span>Scroll / Pinch to zoom</span>
            <span className="text-[#383844]">·</span>
            <span className="text-[#D4FF3F]">Click node to inspect</span>
          </div>
        </div>

        {/* --- Zero State Overlay (Preserving Globe in Background) --- */}
        {demoZeroState && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-4">
            <div className="bg-[#0E0E12]/95 backdrop-blur-md border border-[#1E1E24] p-6 sm:p-8 max-w-md text-center pointer-events-auto shadow-2xl animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-[#D4FF3F]" />
              </div>
              <span className="text-[10px] text-[#D4FF3F] font-mono-code uppercase tracking-widest font-bold block mb-1">
                Zero Connections
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light">
                Your Orb is just beginning.
              </h2>
              <p className="text-xs text-[#8E8E93] mt-2 mb-6 leading-relaxed max-w-xs mx-auto">
                Connect with your first Misfit and watch your personal world expand across continents.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  id="zero-state-find-someone-btn"
                  onClick={onExplore}
                  className="btn-primary text-xs w-full sm:w-auto"
                >
                  <Compass className="w-3.5 h-3.5 mr-1" />
                  Discover Thinkers
                </button>
                <button
                  onClick={() => setDemoZeroState(false)}
                  className="btn-secondary text-xs w-full sm:w-auto"
                >
                  View Sample Globe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Hover Tooltip Overlay --- */}
        {hoveredLocation && hoverPos && !selectedLocation && (
          <div
            className="fixed z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 transition-transform"
            style={{ left: hoverPos.x, top: hoverPos.y }}
          >
            <div className="bg-[#0E0E12]/95 border border-[#D4FF3F]/50 px-3 py-2 shadow-2xl backdrop-blur-md text-center max-w-[200px]">
              <p className="text-xs font-bold text-white uppercase tracking-wider font-mono-code truncate">
                {hoveredLocation.name}
              </p>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-mono-code truncate">
                {hoveredLocation.city}, {hoveredLocation.country}
              </p>
              {hoveredLocation.profile?.role && (
                <p className="text-[9px] text-[#D4FF3F] mt-0.5 font-mono-code truncate">
                  {hoveredLocation.profile.role}
                </p>
              )}
            </div>
            <div className="w-2 h-2 bg-[#D4FF3F] rotate-45 mx-auto -mt-1" />
          </div>
        )}

        {/* --- Selected Thinker Context Popover / Drawer --- */}
        {selectedLocation && selectedLocation.profile && (
          <div className="absolute right-4 top-4 bottom-4 sm:top-6 sm:right-8 sm:bottom-auto sm:max-h-[520px] w-[calc(100%-2rem)] sm:w-80 md:w-96 z-20 bg-[#0E0E12]/98 border border-[#1E1E24] p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between animate-fadeIn overflow-y-auto">
            <div>
              {/* Header Status Bar */}
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1E1E24]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSelectedConnected ? 'bg-[#D4FF3F] animate-pulse' : 'bg-[#7A7A82]'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest font-mono-code ${isSelectedConnected ? 'text-[#D4FF3F]' : 'text-[#8E8E93]'}`}>
                    {isSelectedConnected ? 'Connected Thinker' : 'Exploring Thinker'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  title="Close card (Esc)"
                  aria-label="Close card"
                  className="text-[#7A7A82] hover:text-white p-1 hover:bg-[#141418] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar & Core Profile Information */}
              <div className="flex items-start gap-3.5 mb-4">
                <img
                  src={selectedLocation.profile.avatarUrl}
                  alt={selectedLocation.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover border border-[#24242C] flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-editorial text-xl text-white font-medium truncate">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] uppercase tracking-widest font-mono-code flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-[#D4FF3F] flex-shrink-0" />
                    {selectedLocation.city}, {selectedLocation.country}
                  </p>
                  <p className="text-[10px] text-[#D4FF3F] font-mono-code mt-0.5 truncate">
                    {selectedLocation.profile.role}
                  </p>
                </div>
              </div>

              {/* Tagline / Active Obsession */}
              {selectedLocation.profile.tagline && (
                <div className="bg-[#121216] border border-[#1E1E24] p-3 mb-3.5">
                  <span className="text-[9px] uppercase tracking-widest text-[#7A7A82] font-mono-code block mb-1">
                    Active Rabbit Hole / Obsession
                  </span>
                  <p className="font-editorial text-xs sm:text-sm italic text-[#F5F5F0] leading-snug line-clamp-3">
                    “{selectedLocation.profile.tagline}”
                  </p>
                </div>
              )}

              {/* Shared / Connection Intentions */}
              {selectedLocation.intents && selectedLocation.intents.length > 0 && (
                <div className="mb-3.5">
                  <span className="text-[9px] uppercase tracking-widest text-[#7A7A82] font-mono-code block mb-1.5">
                    Connection Intentions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLocation.intents.map((it) => (
                      <span
                        key={it}
                        className="text-[9px] font-mono-code px-2 py-0.5 bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[#D4FF3F]"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Currently Questioning / Topics */}
              {selectedLocation.profile.curiousAbout && Array.isArray(selectedLocation.profile.curiousAbout) && selectedLocation.profile.curiousAbout.length > 0 && (
                <div className="mb-4">
                  <span className="text-[9px] uppercase tracking-widest text-[#7A7A82] font-mono-code block mb-1.5">
                    Currently Questioning
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedLocation.profile.curiousAbout.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="text-[9px] font-mono-code px-2 py-0.5 bg-[#141418] border border-[#24242C] text-[#8E8E93]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contextual Action Buttons */}
            <div className="pt-3 border-t border-[#1E1E24] flex items-center gap-2">
              {isSelectedConnected ? (
                <button
                  id="orb-card-message-btn"
                  onClick={() => handleOpenConversation(selectedLocation.id)}
                  className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Chat</span>
                </button>
              ) : (
                <button
                  id="orb-card-connect-btn"
                  onClick={() => handleConnectAction(selectedLocation.profile!)}
                  className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </button>
              )}

              <button
                id="orb-card-view-profile-btn"
                onClick={() => handleViewProfileModal(selectedLocation.profile!)}
                title="View Full Profile"
                aria-label="View Full Profile"
                className="btn-secondary px-3.5 py-2 text-xs flex items-center justify-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          3. ORB FILTER BAR & 4. SEPARATED VISUAL LEGEND / HELP
          ========================================================================= */}
      <footer className="relative z-10 pb-5 sm:pb-6 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full flex flex-col gap-3">
        
        {/* Dedicated Intent Filter Rail (Clean Single Row with Horizontal Scroll) */}
        <div className="relative w-full border border-[#1E1E24] bg-[#0E0E12]/90 backdrop-blur-md p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          <div className="flex items-center gap-2 flex-shrink-0 px-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A82] font-mono-code whitespace-nowrap flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              Highlight by Intent:
            </span>
          </div>

          {/* Horizontally scrollable filter list */}
          <div
            ref={filterScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full sm:w-auto py-0.5"
          >
            {allIntentsList.map((intent) => {
              const isSelected = activeIntentFilter === intent;
              return (
                <button
                  key={intent}
                  id={`orb-filter-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setActiveIntentFilter(intent)}
                  className={`px-2.5 py-1 text-[10px] font-mono-code font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] shadow-sm'
                      : 'bg-[#121216] text-[#8E8E93] border-[#1E1E24] hover:border-[#383844] hover:text-[#F5F5F0]'
                  }`}
                >
                  {intent}
                </button>
              );
            })}
          </div>

          {/* Mobile Help Button */}
          <div className="sm:hidden flex items-center justify-end pt-1 border-t border-[#1E1E24]">
            <button
              onClick={() => setShowMobileHelp(!showMobileHelp)}
              className="text-[9px] font-mono-code uppercase tracking-widest text-[#8E8E93] hover:text-[#D4FF3F] flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span>How the Orb works</span>
            </button>
          </div>
        </div>

        {/* Separated Visual Legend & Interaction Guide */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] font-mono-code text-[#7A7A82] uppercase tracking-wider px-1">
          
          {/* Visual Legend */}
          <div className="flex items-center flex-wrap gap-4">
            <span className="text-[#8E8E93] font-bold">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
              <span>Home ({userGeo.city})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F5F5F0]" />
              <span>Thinker Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#D4FF3F]/70" />
              <span>Connection Path</span>
            </div>
          </div>

          {/* Desktop Interaction Help */}
          <div className="hidden sm:flex items-center gap-2 text-[#7A7A82]/80">
            <span>Drag = Rotate</span>
            <span>·</span>
            <span>Scroll = Zoom</span>
            <span>·</span>
            <span>Click Node = Details</span>
          </div>

        </div>

      </footer>

      {/* Mobile Help Modal / Popover */}
      {showMobileHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:hidden animate-fadeIn">
          <div className="bg-[#0E0E12] border border-[#1E1E24] p-6 max-w-xs w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1E1E24]">
              <span className="text-xs font-bold text-[#D4FF3F] uppercase tracking-widest font-mono-code">
                How the Orb Works
              </span>
              <button
                onClick={() => setShowMobileHelp(false)}
                className="text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-3 text-xs text-[#8E8E93] font-mono-code leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#D4FF3F] font-bold">1.</span>
                <span><strong className="text-white">1-finger Drag:</strong> Rotate the globe smoothly in 3D.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4FF3F] font-bold">2.</span>
                <span><strong className="text-white">2-finger Pinch:</strong> Zoom in and out.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4FF3F] font-bold">3.</span>
                <span><strong className="text-white">Tap Node:</strong> View thinker info, intentions, and start conversations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4FF3F] font-bold">4.</span>
                <span><strong className="text-white">Filter Rail:</strong> Highlight misfits by shared collaboration intent.</span>
              </li>
            </ul>
            <button
              onClick={() => setShowMobileHelp(false)}
              className="btn-primary w-full mt-5 text-xs py-2"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

