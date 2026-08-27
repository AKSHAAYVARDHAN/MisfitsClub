import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { UserProfile, PublicProfile } from '../../types';
import { SAMPLE_PROFILES } from '../../data/mockData';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

interface PeopleSectionProps {
  onSelectProfile?: (profile: UserProfile | PublicProfile) => void;
  onExplore: () => void;
  profiles?: (UserProfile | PublicProfile)[];
}

interface ArchetypeCard {
  id: string;
  archetype: string;
  badgeEmoji: string;
  name: string;
  location: string;
  avatarUrl: string;
  headline: string;
  currentObsession: string;
  reading: string;
  building: string;
  intents: string[];
  sampleProfile: UserProfile;
}

export const PeopleSection: React.FC<PeopleSectionProps> = ({
  onSelectProfile,
  onExplore,
  profiles = SAMPLE_PROFILES,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Curated archetype representations
  const archetypes: ArchetypeCard[] = [
    {
      id: 'builder-arjun',
      archetype: 'The Builder',
      badgeEmoji: '🛠️',
      name: 'Arjun Swaminathan',
      location: 'Singapore',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      headline: 'Low-power microcontrollers & decentralized communication mesh.',
      currentObsession: 'Hardware-level cognitive biofeedback monitors & LoRa mesh radios.',
      reading: 'Embedded Rust in Production',
      building: 'AI-assisted mechanical keyboard tracking cognitive stress',
      intents: ['Build Together', 'Collaborate'],
      sampleProfile: profiles.find((p) => p.id === 'p-arjun') as UserProfile || SAMPLE_PROFILES[1],
    },
    {
      id: 'creator-maya',
      archetype: 'The Creator',
      badgeEmoji: '🎞️',
      name: 'Maya Lindqvist',
      location: 'Berlin, Germany',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      headline: 'Experimental short cinema & neural tape archives.',
      currentObsession: 'Visual storytelling without linear narrative arcs; analog color physics.',
      reading: 'Karkoschka’s Notation of New Music',
      building: 'Interactive generative documentary on forgotten European radio frequencies',
      intents: ['Exchange Ideas', 'Just Talk'],
      sampleProfile: profiles.find((p) => p.id === 'p-maya') as UserProfile || SAMPLE_PROFILES[0],
    },
    {
      id: 'thinker-noah',
      archetype: 'The Thinker',
      badgeEmoji: '📜',
      name: 'Noah Sterling',
      location: 'London, UK',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      headline: 'Epistemic hygiene, slow media primitives, and long-term memory.',
      currentObsession: 'Epistolary friendships as prototypes for thoughtful internet tools.',
      reading: 'Hofstadter’s Gödel, Escher, Bach',
      building: 'A quiet long-form essay guild publishing once per month',
      intents: ['Exchange Ideas', 'Learn Together'],
      sampleProfile: profiles.find((p) => p.id === 'p-noah') as UserProfile || SAMPLE_PROFILES[2],
    },
    {
      id: 'designer-sofia',
      archetype: 'The Designer',
      badgeEmoji: '📐',
      name: 'Sofia Chen',
      location: 'New York, USA',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      headline: 'Tactile spatial computing & interactive typography canvases.',
      currentObsession: 'Psychology of spatial memory palaces in virtual rooms.',
      reading: 'The Poetics of Space by Gaston Bachelard',
      building: 'Infinite 3D canvas for associative idea mapping',
      intents: ['Collaborate', 'Build Together'],
      sampleProfile: profiles.find((p) => p.id === 'p-sofia') as UserProfile || SAMPLE_PROFILES[3],
    },
    {
      id: 'researcher-soren',
      archetype: 'The Researcher',
      badgeEmoji: '🔬',
      name: 'Dr. Søren Kierk',
      location: 'Copenhagen, Denmark',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      headline: 'Cognitive neuroscience & non-equilibrium biological computation.',
      currentObsession: 'Why human brains hallucinate meaning in random acoustic white noise.',
      reading: 'Thermodynamics of Living Systems',
      building: 'Public dataset of tactile synesthesia descriptions across 14 languages',
      intents: ['Learn Together', 'Just Talk'],
      sampleProfile: profiles.find((p) => p.id === 'p-soren') as UserProfile || SAMPLE_PROFILES[5],
    },
    {
      id: 'engineer-kenji',
      archetype: 'The Engineer',
      badgeEmoji: '🤖',
      name: 'Kenji Takahashi',
      location: 'Tokyo, Japan',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      headline: 'Biomimetic soft actuators & polyphonic hardware synthesizers.',
      currentObsession: 'Microtonal tuning systems in traditional Japanese gagaku music.',
      reading: 'Fluidic Elastomer Dynamics',
      building: 'Robotic hand playing acoustic piano with expressive micro-timing',
      intents: ['Build Together', 'Exchange Ideas'],
      sampleProfile: profiles.find((p) => p.id === 'p-kenji') as UserProfile || SAMPLE_PROFILES[4],
    },
  ];

  return (
    <section 
      id="people-section"
      className="py-20 sm:py-28 lg:py-32 bg-[#0B0B0D] relative border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 sm:mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-3 py-1 inline-block mb-3">
              02 / THE PEOPLE
            </span>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#F5F5F0] font-light tracking-tight">
              The thinkers, builders & creators.
            </h2>
            <p className="mt-3 text-[#969696] text-sm sm:text-base max-w-xl font-sans-clean leading-relaxed">
              No corporate bullet points or prestige posturing. Just what someone is actively questioning, prototyping, and reading right now.
            </p>
          </motion.div>

          <motion.button
            id="view-all-thinkers-btn"
            onClick={onExplore}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border border-[#F5F5F0]/20 px-6 py-3 text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-all self-start md:self-auto flex items-center gap-2"
          >
            <span>EXPLORE ALL THINKERS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* 6 Archetype Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archetypes.map((card, idx) => (
            <motion.div
              key={card.id}
              onClick={() => onSelectProfile ? onSelectProfile(card.sampleProfile) : onExplore()}
              className="group cursor-pointer bg-[#121215] border border-[#F5F5F0]/10 hover:border-[#D4FF3F]/40 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: shouldReduceMotion ? 0 : (idx % 3) * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div>
                {/* Header with Archetype pill & location */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#09090B] border border-[#F5F5F0]/10 text-[#F5F5F0] text-[11px] font-mono-code font-medium">
                    <span>{card.badgeEmoji}</span>
                    <span>{card.archetype}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#969696] font-mono-code">
                    <MapPin className="w-3 h-3 text-[#D4FF3F]" />
                    <span>{card.location}</span>
                  </div>
                </div>

                {/* Profile Identity */}
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={card.avatarUrl}
                    alt={card.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 object-cover border border-[#F5F5F0]/10 flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white group-hover:text-[#D4FF3F] transition-colors">
                      {card.name}
                    </h3>
                    <p className="text-[11px] text-[#969696] font-sans-clean line-clamp-1">
                      {card.headline}
                    </p>
                  </div>
                </div>

                {/* Current Obsession / Quote */}
                <div className="p-3.5 bg-[#09090B] border border-[#F5F5F0]/5 mb-4">
                  <span className="text-[9px] uppercase font-mono-code tracking-widest text-[#D4FF3F] block mb-1">
                    CURRENT INQUIRY
                  </span>
                  <p className="font-editorial text-sm sm:text-base italic text-[#D4D4D0] leading-snug">
                    “{card.currentObsession}”
                  </p>
                </div>

                {/* Building / Reading info snippet */}
                <div className="space-y-1.5 text-xs text-[#969696] mb-5">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-mono-code uppercase text-[#969696]/60 flex-shrink-0">Building:</span>
                    <span className="text-[#F5F5F0]/80 line-clamp-1 font-sans-clean">{card.building}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Intentions */}
              <div className="pt-3.5 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {card.intents.map((intent) => (
                    <span
                      key={intent}
                      className="text-[10px] text-[#D4FF3F] border border-[#D4FF3F]/30 bg-[#D4FF3F]/5 px-2 py-0.5 font-mono-code"
                    >
                      {intent}
                    </span>
                  ))}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#969696] group-hover:text-[#D4FF3F] group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
