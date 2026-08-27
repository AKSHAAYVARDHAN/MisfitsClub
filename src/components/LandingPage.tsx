import React, { useRef } from 'react';
import { ConnectionIntent, UserProfile, PublicProfile, OrbLocation } from '../types';
import { SAMPLE_PROFILES } from '../data/mockData';
import { HeroSection } from './landing/HeroSection';
import { IdeaSection } from './landing/IdeaSection';
import { PeopleSection } from './landing/PeopleSection';
import { OrbSection } from './landing/OrbSection';
import { DiscoverSection } from './landing/DiscoverSection';
import { SparkSection } from './landing/SparkSection';
import { HubSection } from './landing/HubSection';
import { FinalSection } from './landing/FinalSection';
import { LandingFooter } from './landing/LandingFooter';

export interface LandingPageProps {
  onStartOnboarding: () => void;
  onEnterOrb: () => void;
  onExplore: () => void;
  onSelectProfile?: (profile: UserProfile | PublicProfile) => void;
  onSelectIntent?: (intent: ConnectionIntent) => void;
  onSignIn?: () => void;
  onOpenMemberProfile?: (profile: UserProfile | PublicProfile) => void;
  allProfiles?: (UserProfile | PublicProfile)[];
  currentUser?: UserProfile | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onEnterOrb,
  onExplore,
  onSelectProfile,
  onSelectIntent,
  onSignIn,
  onOpenMemberProfile,
  allProfiles = SAMPLE_PROFILES,
  currentUser,
}) => {
  const safeProfilesList = (allProfiles && allProfiles.length > 0) ? allProfiles : SAMPLE_PROFILES;

  // Derive real spatial node locations for 3D Orb illustrations
  const orbLocations: OrbLocation[] = safeProfilesList.map((p) => ({
    id: p.id,
    name: p.name || 'Member',
    city: (p.location || 'Worldwide').split(',')[0].trim(),
    country: p.country || 'Global',
    lat: p.lat ?? 52.52,
    lng: p.lng ?? 13.40,
    profile: p,
    intents: p.intents || [],
    lastActive: 'Active now',
  }));

  const handleScrollToIdea = () => {
    const el = document.getElementById('the-idea-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onExplore();
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileClick = (profile: UserProfile | PublicProfile) => {
    if (onOpenMemberProfile) {
      onOpenMemberProfile(profile);
    } else if (onSelectProfile) {
      onSelectProfile(profile);
    } else {
      onExplore();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#08080A] text-[#F5F5F0] overflow-x-hidden selection:bg-[#D4FF3F] selection:text-[#08080A]">
      
      {/* SECTION 1 — HERO */}
      <HeroSection
        onStartOnboarding={onStartOnboarding}
        onEnterOrb={onEnterOrb}
        onExplore={onExplore}
        onScrollToIdea={handleScrollToIdea}
        orbLocations={orbLocations}
        currentUser={currentUser}
      />

      {/* SECTION 2 — THE IDEA */}
      <IdeaSection 
        onExplore={onExplore}
      />

      {/* SECTION 3 — PEOPLE */}
      <PeopleSection
        onSelectProfile={handleProfileClick}
        onExplore={onExplore}
        profiles={safeProfilesList}
      />

      {/* SECTION 4 — ORB */}
      <OrbSection
        onEnterOrb={onEnterOrb}
        orbLocations={orbLocations}
      />

      {/* SECTION 5 — DISCOVER */}
      <DiscoverSection
        onSelectProfile={handleProfileClick}
        onSelectIntent={onSelectIntent}
        onExplore={onExplore}
        profiles={safeProfilesList}
      />

      {/* SECTION 6 — SPARK */}
      <SparkSection
        onExplore={onExplore}
      />

      {/* SECTION 7 — HUB */}
      <HubSection
        onExplore={onExplore}
      />

      {/* SECTION 8 — FINAL STATEMENT */}
      <FinalSection
        onStartOnboarding={onStartOnboarding}
        onEnterOrb={onEnterOrb}
        currentUser={currentUser}
      />

      {/* FOOTER */}
      <LandingFooter
        onStartOnboarding={onStartOnboarding}
        onEnterOrb={onEnterOrb}
        onExplore={onExplore}
        onSignIn={onSignIn}
        onScrollToTop={handleScrollToTop}
      />

    </div>
  );
};
