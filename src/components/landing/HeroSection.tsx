import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Compass, ArrowRight, Sparkles, Globe } from 'lucide-react';
import { OrbGlobe } from '../OrbGlobe';
import { OrbLocation, UserProfile, PublicProfile } from '../../types';

interface HeroSectionProps {
  onStartOnboarding: () => void;
  onEnterOrb: () => void;
  onExplore: () => void;
  onScrollToIdea: () => void;
  orbLocations: OrbLocation[];
  currentUser?: UserProfile | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartOnboarding,
  onEnterOrb,
  onExplore,
  onScrollToIdea,
  orbLocations,
  currentUser,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const userGeo = {
    lat: 13.0827,
    lng: 80.2707,
    name: 'Akshaay Vardhan',
    city: 'Chennai',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section 
      id="hero-section"
      className="relative pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 px-6 sm:px-10 lg:px-12 max-w-7xl mx-auto border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      {/* Subtle architectural dot grid */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#F5F5F0_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-start">
        
        {/* Left Column: Brand Statement & Actions */}
        <motion.div 
          className="lg:col-span-7 flex flex-col items-start text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow badge line */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-5 sm:mb-7">
            <span className="bg-[#D4FF3F] text-[#080808] font-bold font-mono-code px-2.5 py-0.5 text-[10px] sm:text-[11px] uppercase tracking-wider">
              GLOBAL CONNECTION PLATFORM
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#969696] font-mono-code uppercase tracking-widest font-medium">
              CURIOSITY OVER CREDENTIALS
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            variants={itemVariants}
            className="font-editorial text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-light text-[#F5F5F0] leading-[1.06] tracking-tight"
          >
            To the ones who are <br />
            <span className="italic font-normal text-[#F5F5F0]">built different.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="mt-5 sm:mt-7 font-sans-clean text-base sm:text-lg lg:text-xl text-[#969696] max-w-xl leading-relaxed"
          >
            Meet curious people from around the world. Exchange ideas. <br className="hidden sm:inline" />
            Learn together. Build together. Or just talk.
          </motion.p>

          {/* Primary Action Group */}
          <motion.div 
            variants={itemVariants}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto"
          >
            <button
              id="hero-enter-club-btn"
              onClick={onStartOnboarding}
              className="bg-[#F5F5F0] text-[#080808] px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-all shadow-xl text-center active:scale-[0.99] focus:outline-none"
            >
              {currentUser ? 'ENTER THE CLUB' : 'ENTER THE CLUB'}
            </button>

            <button
              id="hero-explore-btn"
              onClick={onScrollToIdea}
              className="bg-[#080808] border border-[#F5F5F0]/20 text-[#F5F5F0] px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-widest hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] focus:outline-none"
            >
              <Compass className="w-4 h-4 text-[#D4FF3F]" />
              <span>EXPLORE</span>
            </button>
          </motion.div>

          {/* Bottom Metas */}
          <motion.div 
            variants={itemVariants}
            className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#F5F5F0]/10 w-full grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 text-left"
          >
            <div>
              <span className="text-[10px] text-[#969696] uppercase tracking-widest font-mono-code block mb-1">
                CORE INTENTS
              </span>
              <p className="text-xs sm:text-sm text-[#F5F5F0] tracking-wide font-sans-clean">
                Build Together · Exchange Ideas · Find a Mentor
              </p>
            </div>

            <div>
              <span className="text-[10px] text-[#969696] uppercase tracking-widest font-mono-code block mb-1">
                WHO IS HERE
              </span>
              <p className="text-xs sm:text-sm text-[#F5F5F0] tracking-wide font-sans-clean">
                Builders · Creatives · Researchers · Thinkers
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: 3D Orb Interactive Illustration */}
        <motion.div 
          className="lg:col-span-5 flex flex-col items-center justify-start lg:pt-2 relative w-full"
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] xl:max-w-[440px] aspect-square relative rounded-full p-2 border border-[#F5F5F0]/10 bg-[#0B0B0C]/80 backdrop-blur-sm shadow-2xl flex items-center justify-center">
            
            {/* Atmospheric soft lime ambient aura */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,255,63,0.12)_0%,rgba(11,11,12,0)_70%)] pointer-events-none" />
            
            {/* Live Globe Canvas */}
            <div className="w-full h-full rounded-full overflow-hidden relative cursor-grab active:cursor-grabbing">
              <OrbGlobe
                userLocation={userGeo}
                connections={orbLocations}
                selectedLocation={null}
                onSelectLocation={() => {}}
                activeIntentFilter="All"
                showLines={true}
                autoRotate={true}
                showRecenterButton={false}
                initialDistance={6.6}
                className="w-full h-full"
              />
            </div>

            {/* Quick interactive badge */}
            <button
              id="hero-orb-interactive-tag"
              onClick={onEnterOrb}
              className="absolute -bottom-2 right-4 sm:right-6 bg-[#141418] border border-[#F5F5F0]/20 hover:border-[#D4FF3F] text-[#F5F5F0] hover:text-[#D4FF3F] px-3.5 py-1.5 rounded-full text-[10px] font-mono-code uppercase tracking-wider flex items-center gap-1.5 shadow-xl transition-all"
              title="Launch full interactive 3D Orb workspace"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
              <span>THE ORB</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
