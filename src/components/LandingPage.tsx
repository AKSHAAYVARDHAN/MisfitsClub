import React, { useState } from 'react';
import { ConnectionIntent, UserProfile } from '../types';
import { 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Hammer, 
  Lightbulb, 
  Users2, 
  GraduationCap, 
  HeartHandshake, 
  MessageCircle,
  Globe2,
  ExternalLink
} from 'lucide-react';
import { HERO_THOUGHT_SNIPPETS, SAMPLE_PROFILES } from '../data/mockData';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onExplore: () => void;
  onSelectProfile: (profile: UserProfile) => void;
  onSelectIntent: (intent: ConnectionIntent) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onExplore,
  onSelectProfile,
  onSelectIntent,
}) => {
  const [activeIntentTab, setActiveIntentTab] = useState<ConnectionIntent>('Exchange Ideas');

  const intentDetails: Record<ConnectionIntent, { icon: React.ReactNode; desc: string; samplePrompt: string; vibe: string }> = {
    'Exchange Ideas': {
      icon: <Lightbulb className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Test your wildest hypotheses, dissect strange essays, and explore rabbit holes with minds that appreciate nuance.',
      samplePrompt: '“What is an idea you believe deeply that almost everyone in your field ignores?”',
      vibe: 'High-signal discourse, zero fluff',
    },
    'Build Together': {
      icon: <Hammer className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Hackathons of two, experimental side-projects, open-source tools, physical hardware prototypes, and creative software.',
      samplePrompt: '“Looking to build a local-first voice journal that generates ambient chord progressions.”',
      vibe: 'Shipping prototypes over talking',
    },
    'Collaborate': {
      icon: <Users2 className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Merge interdisciplinary superpowers—e.g., combining biomaterials with computer vision or generative sound with typography.',
      samplePrompt: '“Need a sound designer to score an interactive 3D essay on brutalist architecture.”',
      vibe: 'Cross-pollinating rare skills',
    },
    'Learn Together': {
      icon: <GraduationCap className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Deep-dive reading groups of two, learning Rust together, studying neuroscience papers, or mastering a foreign language.',
      samplePrompt: '“Reading Hofstadter’s Gödel, Escher, Bach over the next 10 weeks.”',
      vibe: 'Curiosity-fueled mutual accountability',
    },
    'Find a Co-founder': {
      icon: <Sparkles className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Meet someone with aligned obsession and values before writing pitch decks or incorporating. Build real trust first.',
      samplePrompt: '“Looking for a technical hardware hacker to build autonomous precision farming rovers.”',
      vibe: 'Organic serendipity & shared obsession',
    },
    'Find a Mentor': {
      icon: <HeartHandshake className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Connect with craftspeople who have walked the winding path and actually enjoy nurturing quiet, dedicated talent.',
      samplePrompt: '“How did you transition from academic neuroscience to building independent creative tools?”',
      vibe: 'Generous guidance without corporate hierarchy',
    },
    'Just Talk': {
      icon: <MessageCircle className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'No agenda, no networking pitch, no elevator speech. Just a warm, human, wandering conversation at any hour.',
      samplePrompt: '“Why do we feel more alive when walking through a quiet city late at night?”',
      vibe: 'Calm, unhurried human connection',
    },
  };

  const allIntents: ConnectionIntent[] = [
    'Build Together',
    'Exchange Ideas',
    'Collaborate',
    'Learn Together',
    'Find a Co-founder',
    'Find a Mentor',
    'Just Talk',
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0B0C] text-[#F5F5F0] overflow-hidden selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      
      {/* SECTION 1: HERO */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-6 sm:px-10 lg:px-12 max-w-7xl mx-auto">
        
        {/* Editorial Top Eyebrow Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="bg-[#D4FF3F] text-[#0B0B0C] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
              Global Connection Platform
            </span>
            <span className="hidden sm:inline text-[10px] text-[#969696] font-mono-code uppercase tracking-widest">
              Curiosity over credentials
            </span>
          </div>
        </div>

        {/* Hero Main Headline & Copy */}
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <h1 className="font-editorial text-6xl sm:text-7xl lg:text-8xl font-light tracking-tight text-[#F5F5F0] leading-[0.95] mb-8">
            Find someone <br />
            <span className="italic font-normal text-[#F5F5F0]">worth talking</span> to.
          </h1>

          <p className="font-sans-clean text-lg sm:text-xl text-[#969696] max-w-xl mx-auto leading-relaxed font-normal mb-10">
            Meet curious people from around the world. Exchange ideas. Learn together. 
            Build together. Or just talk.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              id="hero-find-someone-btn"
              onClick={onStartOnboarding}
              className="w-full sm:w-auto bg-[#F5F5F0] text-[#0B0B0C] px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors"
            >
              <span>Find Someone</span>
            </button>

            <button
              id="hero-explore-misfits-btn"
              onClick={onExplore}
              className="w-full sm:w-auto border border-[#F5F5F0]/20 px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#D4FF3F]" />
              <span>Explore Misfits</span>
            </button>
          </div>

          {/* Minimal Meta Indicator Bar */}
          <div className="mt-14 pt-8 border-t border-[#F5F5F0]/10 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto text-left">
            <div>
              <p className="text-[10px] text-[#969696] uppercase tracking-widest mb-1.5 font-bold">
                Core Intents
              </p>
              <p className="text-xs text-[#F5F5F0]/80">
                Build Together · Exchange Ideas · Find a Mentor
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#969696] uppercase tracking-widest mb-1.5 font-bold">
                Who is here
              </p>
              <p className="text-xs text-[#F5F5F0]/80">
                Builders · Creatives · Researchers · Misfits
              </p>
            </div>
          </div>
        </div>

        {/* Live Thought Glimpse Mosaic with Contrast Card */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {HERO_THOUGHT_SNIPPETS.map((snippet, idx) => {
            const isLightCard = idx === 1; // Contrast light card matching design theme
            return (
              <div
                key={snippet.id}
                onClick={() => onSelectIntent(snippet.intent)}
                className={`group cursor-pointer p-6 border transition-all duration-300 ${
                  isLightCard
                    ? 'bg-[#F5F5F0] text-[#0B0B0C] border-[#F5F5F0]/10 shadow-2xl transform lg:rotate-1 hover:rotate-0'
                    : 'bg-[#151516] text-[#F5F5F0] border-[#F5F5F0]/5 hover:border-[#F5F5F0]/20 transform lg:-rotate-1 hover:rotate-0'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isLightCard ? 'bg-[#0B0B0C] text-[#F5F5F0]' : 'bg-[#D4FF3F]/10 text-[#D4FF3F]'
                    }`}>
                      {snippet.authorName[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">{snippet.authorName}</h4>
                      <p className={`text-[10px] uppercase tracking-widest ${isLightCard ? 'text-[#0B0B0C]/70' : 'text-[#969696]'}`}>
                        {snippet.authorLocation} · {snippet.authorRole}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                    isLightCard 
                      ? 'border-[#0B0B0C]/20 text-[#0B0B0C]' 
                      : 'border-[#D4FF3F]/30 text-[#D4FF3F]'
                  }`}>
                    {snippet.intent}
                  </span>
                </div>

                <p className={`font-editorial text-lg italic leading-snug mb-4 ${
                  isLightCard ? 'text-[#0B0B0C]/90' : 'text-[#969696] group-hover:text-[#F5F5F0]'
                }`}>
                  “{snippet.text}”
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-current/10">
                  <span className={`text-[9px] px-2 py-0.5 rounded ${
                    isLightCard ? 'bg-[#0B0B0C]/5 text-[#0B0B0C]' : 'bg-[#F5F5F0]/5 text-[#969696]'
                  }`}>
                    #{snippet.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: THE PHILOSOPHY */}
      <section className="py-20 sm:py-28 border-t border-[#F5F5F0]/10 bg-[#0B0B0C] relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 text-center">
          
          <div className="flex flex-col gap-2 mb-8">
            <p className="text-xs sm:text-sm text-[#969696] uppercase tracking-widest">
              Not Networking.
            </p>
            <p className="text-xs sm:text-sm text-[#969696] uppercase tracking-widest">
              Not Dating.
            </p>
            <p className="text-xs sm:text-sm text-[#F5F5F0] uppercase tracking-widest font-bold">
              Just Humans.
            </p>
          </div>

          <div className="pt-8 border-t border-[#F5F5F0]/10 max-w-2xl mx-auto">
            <h2 className="font-editorial text-3xl sm:text-5xl text-[#F5F5F0] font-light leading-snug">
              “Just people who are curious about the same things you are.”
            </h2>
            <p className="mt-6 text-[#969696] text-base leading-relaxed font-sans-clean">
              Most of the internet was designed to turn humans into metrics—followers, likes, impressions, and job titles. 
              Misfits Club exists for the conversations that happen when all of that noise is stripped away.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE SEVEN CONNECTION INTENTS */}
      <section className="py-20 sm:py-28 border-t border-[#F5F5F0]/10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="bg-[#D4FF3F] text-[#0B0B0C] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 inline-block mb-3">
            Core Intentions
          </span>
          <h2 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
            You don't need an excuse to reach out.
          </h2>
          <p className="mt-3 text-[#969696] text-sm sm:text-base">
            Every member chooses up to 3 core intentions. These define how you want to relate to the world.
          </p>
        </div>

        {/* Intent Tabs Selection */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-4xl mx-auto">
          {allIntents.map((intent) => {
            const isSelected = activeIntentTab === intent;
            return (
              <button
                key={intent}
                id={`intent-tab-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveIntentTab(intent)}
                className={`px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
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

        {/* Active Intent Feature Card */}
        <div className="max-w-3xl mx-auto border border-[#F5F5F0]/10 bg-[#151516] p-6 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#0B0B0C] border border-[#F5F5F0]/10">
              {intentDetails[activeIntentTab].icon}
            </div>
            <div>
              <span className="text-[10px] text-[#969696] uppercase tracking-widest block font-bold">
                Intent Detail
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium">
                {activeIntentTab}
              </h3>
            </div>
          </div>

          <p className="text-base text-[#D0D0D4] font-sans-clean leading-relaxed mb-6">
            {intentDetails[activeIntentTab].desc}
          </p>

          <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-4 sm:p-5 mb-6">
            <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
              Sample conversation opener:
            </span>
            <p className="font-editorial text-lg italic text-[#F5F5F0]">
              {intentDetails[activeIntentTab].samplePrompt}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#F5F5F0]/10">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF3F]"></span>
              <span className="text-[11px] text-[#969696] uppercase tracking-wider">
                {intentDetails[activeIntentTab].vibe}
              </span>
            </div>

            <button
              id="filter-intent-cta"
              onClick={() => onSelectIntent(activeIntentTab)}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4FF3F] hover:underline"
            >
              <span>Explore people seeking to {activeIntentTab}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: REAL HUMANS */}
      <section className="py-20 sm:py-28 border-t border-[#F5F5F0]/10 bg-[#0B0B0C]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="bg-[#D4FF3F] text-[#0B0B0C] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 inline-block mb-3">
                Curious Members
              </span>
              <h2 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
                People are more interesting than profiles.
              </h2>
              <p className="mt-2 text-[#969696] text-sm sm:text-base max-w-xl">
                No corporate bullet points. Just what someone is reading, making, questioning, and dreaming about.
              </p>
            </div>

            <button
              id="view-all-misfits-btn"
              onClick={onExplore}
              className="border border-[#F5F5F0]/20 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-all self-start md:self-auto"
            >
              <span>View All Misfits</span>
            </button>
          </div>

          {/* Real Human Cards Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SAMPLE_PROFILES.slice(0, 4).map((person) => (
              <div
                key={person.id}
                onClick={() => onSelectProfile(person)}
                className="group cursor-pointer border border-[#F5F5F0]/10 bg-[#151516] p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#D4FF3F]/40"
              >
                <div>
                  {/* Avatar & Location */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={person.avatarUrl}
                      alt={person.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover border border-[#F5F5F0]/10"
                    />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#D4FF3F] transition-colors">
                        {person.name}
                      </h3>
                      <p className="text-[10px] text-[#969696] uppercase tracking-widest">
                        {person.location} · {person.role}
                      </p>
                    </div>
                  </div>

                  {/* Tagline / Obsession */}
                  <p className="font-editorial text-base text-[#969696] group-hover:text-[#F5F5F0] italic leading-snug mb-4">
                    “{person.tagline}”
                  </p>

                  {/* Interests */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {person.interests.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="text-[9px] text-[#969696] bg-[#F5F5F0]/5 px-2 py-0.5 border border-[#F5F5F0]/5"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Looking for */}
                <div className="pt-3 border-t border-[#F5F5F0]/10">
                  <div className="flex flex-wrap gap-1.5">
                    {person.intents.slice(0, 2).map((intent) => (
                      <span
                        key={intent}
                        className="text-[10px] text-[#D4FF3F] border border-[#D4FF3F]/30 px-2 py-0.5"
                      >
                        {intent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: GLOBAL CONNECTION */}
      <section className="py-20 sm:py-28 border-t border-[#F5F5F0]/10 bg-[#0B0B0C]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 text-center">
          
          <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-3">
            Worldwide Network
          </span>

          <h2 className="font-editorial text-4xl sm:text-6xl text-[#F5F5F0] font-light mb-6">
            Your people aren’t always nearby.
          </h2>

          <p className="font-sans-clean text-base sm:text-lg text-[#969696] max-w-xl mx-auto leading-relaxed mb-14">
            The person who shares your specific, obscure obsession might live in Kyoto, Berlin, Chennai, or Buenos Aires. 
            Geography is accidental; curiosity is chosen.
          </p>

          {/* Typographic World Presence Map */}
          <div className="border border-[#F5F5F0]/10 bg-[#151516] p-8 sm:p-12 relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 text-left">
              {[
                { city: 'Kyoto', country: 'Japan', time: 'JST', count: '184 members' },
                { city: 'Berlin', country: 'Germany', time: 'CET', count: '290 members' },
                { city: 'Chennai', country: 'India', time: 'IST', count: '142 members' },
                { city: 'London', country: 'UK', time: 'GMT', count: '315 members' },
                { city: 'Buenos Aires', country: 'Argentina', time: 'ART', count: '98 members' },
                { city: 'Accra', country: 'Ghana', time: 'GMT', count: '74 members' },
                { city: 'Montreal', country: 'Canada', time: 'EST', count: '128 members' },
                { city: 'Copenhagen', country: 'Denmark', time: 'CET', count: '112 members' },
                { city: 'Tokyo', country: 'Japan', time: 'JST', count: '260 members' },
                { city: 'San Francisco', country: 'USA', time: 'PST', count: '340 members' },
                { city: 'Stockholm', country: 'Sweden', time: 'CET', count: '95 members' },
                { city: 'Seoul', country: 'S. Korea', time: 'KST', count: '150 members' },
              ].map((loc) => (
                <div key={loc.city} className="border-l border-[#F5F5F0]/10 pl-3 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF3F]"></span>
                    <span className="font-editorial text-lg text-white font-medium">{loc.city}</span>
                  </div>
                  <p className="text-[10px] text-[#969696] uppercase tracking-widest">{loc.country}</p>
                  <p className="text-[10px] text-[#F5F5F0]/60 font-mono-code mt-0.5">{loc.count}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-[#F5F5F0]/10 flex flex-wrap items-center justify-between text-xs text-[#969696] gap-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#D4FF3F]" />
                <span>64 active cities across 38 countries</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest">Async & Realtime · Zero algorithmic ranking</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL MANIFESTO & CTA */}
      <section className="py-24 sm:py-32 border-t border-[#F5F5F0]/10 bg-[#0B0B0C] relative text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12">
          
          <h2 className="font-editorial text-4xl sm:text-6xl font-light text-[#F5F5F0] leading-tight mb-8">
            You don't need more followers. <br />
            <span className="italic font-normal text-[#F5F5F0]">You need a few people worth talking to.</span>
          </h2>

          <p className="font-sans-clean text-base sm:text-lg text-[#969696] max-w-lg mx-auto mb-10 leading-relaxed">
            Free from infinite feeds, notification traps, and performance anxiety. 
            Join the quiet corner of the internet for genuine minds.
          </p>

          <button
            id="footer-join-misfits-btn"
            onClick={onStartOnboarding}
            className="bg-[#F5F5F0] text-[#0B0B0C] px-10 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors"
          >
            <span>Join Misfits Club</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#F5F5F0]/10 bg-[#0B0B0C] py-12 px-6 sm:px-10 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-left">
            <p className="text-[10px] text-[#969696] uppercase tracking-tighter">Not Networking.</p>
            <p className="text-[10px] text-[#969696] uppercase tracking-tighter">Not Dating.</p>
            <p className="text-[10px] text-[#F5F5F0] uppercase tracking-tighter font-bold">Just Humans.</p>
          </div>

          <div className="flex items-center gap-6 text-xs uppercase tracking-widest text-[#969696]">
            <button onClick={onExplore} className="hover:text-[#D4FF3F] transition-colors">
              Discover
            </button>
            <button onClick={() => onSelectIntent('Exchange Ideas')} className="hover:text-[#D4FF3F] transition-colors">
              Intentions
            </button>
            <button onClick={onStartOnboarding} className="hover:text-[#D4FF3F] transition-colors">
              Onboarding
            </button>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-[#969696] uppercase tracking-widest mb-2">Curiosity over credentials</p>
            <div className="flex gap-2 justify-end opacity-40">
              <div className="w-1 h-1 bg-[#F5F5F0] rounded-full"></div>
              <div className="w-1 h-1 bg-[#F5F5F0] rounded-full"></div>
              <div className="w-1 h-1 bg-[#F5F5F0] rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
