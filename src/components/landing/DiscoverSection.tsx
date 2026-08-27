import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ConnectionIntent, UserProfile, PublicProfile } from '../../types';
import { SAMPLE_PROFILES } from '../../data/mockData';
import { 
  Lightbulb, 
  Hammer, 
  Users2, 
  GraduationCap, 
  Sparkles, 
  HeartHandshake, 
  MessageCircle,
  ArrowRight,
  MapPin
} from 'lucide-react';

interface DiscoverSectionProps {
  onSelectProfile?: (profile: UserProfile | PublicProfile) => void;
  onSelectIntent?: (intent: ConnectionIntent) => void;
  onExplore: () => void;
  profiles?: (UserProfile | PublicProfile)[];
}

export const DiscoverSection: React.FC<DiscoverSectionProps> = ({
  onSelectProfile,
  onSelectIntent,
  onExplore,
  profiles = SAMPLE_PROFILES,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [activeIntent, setActiveIntent] = useState<ConnectionIntent>('Exchange Ideas');

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
    'Exchange Ideas',
    'Build Together',
    'Collaborate',
    'Learn Together',
    'Find a Co-founder',
    'Find a Mentor',
    'Just Talk',
  ];

  return (
    <section 
      id="discover-section"
      className="py-20 sm:py-28 lg:py-32 bg-[#0A0A0C] relative border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Section Header */}
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-3 py-1 inline-block mb-3">
            04 / DISCOVER
          </span>
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#F5F5F0] font-light leading-[1.12]">
            Find people you wouldn't <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#D4FF3F]">normally meet.</span>
          </h2>
          <p className="mt-4 text-[#969696] text-sm sm:text-base max-w-xl mx-auto font-sans-clean leading-relaxed">
            Every member selects up to 3 core intentions. Filter not by corporate resumes, but by how you actually want to relate to another human mind.
          </p>
        </motion.div>

        {/* Intent Pills Selection Tabs */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mb-10 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {allIntents.map((intent) => {
            const isSelected = activeIntent === intent;
            return (
              <button
                key={intent}
                id={`discover-intent-tab-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveIntent(intent)}
                className={`px-4 sm:px-5 py-2.5 text-xs font-mono-code uppercase tracking-wider font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#D4FF3F] text-[#080808] shadow-md'
                    : 'bg-[#141418] text-[#969696] border border-[#F5F5F0]/10 hover:border-[#D4FF3F]/40 hover:text-[#F5F5F0]'
                }`}
              >
                {intent}
              </button>
            );
          })}
        </motion.div>

        {/* Intent Detail Card with Sample Conversation Opener */}
        <motion.div 
          className="max-w-3xl mx-auto border border-[#F5F5F0]/10 bg-[#121216] p-6 sm:p-10 shadow-2xl relative"
          key={activeIntent}
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 bg-[#08080A] border border-[#F5F5F0]/10">
              {intentDetails[activeIntent].icon}
            </div>
            <div>
              <span className="text-[10px] text-[#969696] uppercase tracking-widest font-mono-code font-bold block">
                INTENTION VIBE
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium">
                {activeIntent}
              </h3>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#D0D0D4] font-sans-clean leading-relaxed mb-6">
            {intentDetails[activeIntent].desc}
          </p>

          <div className="border border-[#F5F5F0]/10 bg-[#08080A] p-4 sm:p-5 mb-6">
            <span className="text-[10px] text-[#D4FF3F] font-mono-code font-bold uppercase tracking-widest block mb-1.5">
              SAMPLE CONVERSATION OPENER:
            </span>
            <p className="font-editorial text-base sm:text-lg italic text-[#F5F5F0]">
              {intentDetails[activeIntent].samplePrompt}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#F5F5F0]/10">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
              <span className="text-xs text-[#969696] font-mono-code uppercase tracking-wider">
                {intentDetails[activeIntent].vibe}
              </span>
            </div>

            <button
              id="discover-intent-explore-btn"
              onClick={() => onSelectIntent ? onSelectIntent(activeIntent) : onExplore()}
              className="inline-flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-[#D4FF3F] hover:underline font-bold"
            >
              <span>EXPLORE THINKERS SEEKING THIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
