import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Lightbulb, Wrench, Search, HelpCircle, Compass } from 'lucide-react';

interface IdeaSectionProps {
  onExplore?: () => void;
}

export const IdeaSection: React.FC<IdeaSectionProps> = ({ onExplore }) => {
  const shouldReduceMotion = useReducedMotion();

  const corePillars = [
    {
      id: 'think-differently',
      num: '01',
      title: 'Think Differently',
      icon: <Lightbulb className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Reject boilerplate orthodoxies, consensus thinking, and sanitized corporate speech. A space for idiosyncratic frameworks and intellectual non-conformists.',
      vibe: 'Independent models over herd mentality',
    },
    {
      id: 'build-unusual-things',
      num: '02',
      title: 'Build Unusual Things',
      icon: <Wrench className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'From low-power mesh radios and tactile audio tools to slime mold computers and synthetic wetware. Value shipping small, weird prototypes over talking.',
      vibe: 'Prototypes over pitch decks',
    },
    {
      id: 'explore-ideas',
      num: '03',
      title: 'Explore Deep Rabbit Holes',
      icon: <Search className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'Follow curiosities that traditional algorithms discard as "too niche." 16mm film archival, formal linguistics, spatial memory palaces, and esoteric compilers.',
      vibe: 'Wandering inquiry without commercial pressure',
    },
    {
      id: 'uncommon-interests',
      num: '04',
      title: 'Ask Uncomfortable Questions',
      icon: <HelpCircle className="w-5 h-5 text-[#D4FF3F]" />,
      desc: 'The best collaborations don’t start with credentials—they start with a question you can’t stop turning over in your head at 3am.',
      vibe: 'Shared obsession across continents',
    },
  ];

  return (
    <section 
      id="the-idea-section"
      className="py-20 sm:py-28 lg:py-32 bg-[#09090B] relative border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4FF3F]/[0.02] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 relative z-10">
        
        {/* Section Header with Editorial Statement */}
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-3 py-1">
              01 / THE IDEA
            </span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#F5F5F0] font-light leading-[1.14] tracking-tight">
            “Most of the internet was designed to turn <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#D4FF3F]">humans into metrics.”</span>
          </h2>

          <p className="mt-6 text-[#969696] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans-clean">
            Followers, likes, impressions, and corporate resumes get in the way of honest human thought. 
            Misfits Club is a sanctuary for the wandering conversations that happen when performance is stripped away.
          </p>
        </motion.div>

        {/* 4 Pillars Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {corePillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              className="p-7 sm:p-9 bg-[#111114] border border-[#F5F5F0]/10 hover:border-[#D4FF3F]/40 transition-colors flex flex-col justify-between group"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ 
                duration: 0.55, 
                delay: shouldReduceMotion ? 0 : index * 0.08,
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="p-2.5 bg-[#09090B] border border-[#F5F5F0]/10 group-hover:border-[#D4FF3F]/30 transition-colors">
                    {pillar.icon}
                  </div>
                  <span className="font-mono-code text-xs text-[#969696] font-semibold tracking-widest">
                    {pillar.num}
                  </span>
                </div>

                <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-medium mb-3 group-hover:text-[#D4FF3F] transition-colors">
                  {pillar.title}
                </h3>

                <p className="text-sm sm:text-base text-[#969696] font-sans-clean leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                <span className="text-[11px] font-mono-code uppercase text-[#969696] tracking-wider">
                  {pillar.vibe}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]/50 group-hover:bg-[#D4FF3F] group-hover:scale-125 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
