import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Users2, ArrowRight, Cpu, Film, Sparkles, BookOpen, Radio, Dna } from 'lucide-react';

interface HubSectionProps {
  onExplore: () => void;
}

export const HubSection: React.FC<HubSectionProps> = ({ onExplore }) => {
  const shouldReduceMotion = useReducedMotion();

  const hubs = [
    {
      id: 'hub-ai',
      icon: <Cpu className="w-5 h-5 text-[#D4FF3F]" />,
      title: 'AI & Autonomous Systems',
      membersCount: '142 thinkers',
      tagline: 'Quantized edge models, robotics, neuromorphic computing, and biological agency.',
      sampleTopic: '“Can edge models run locally on 3W solar microcontrollers?”',
      tag: 'Autonomous AI',
    },
    {
      id: 'hub-cinema',
      icon: <Film className="w-5 h-5 text-[#D4FF3F]" />,
      title: 'Experimental Cinema',
      membersCount: '98 creators',
      tagline: '16mm optical film archival, generative latent interpolation, and ambient soundtracks.',
      sampleTopic: '“Simulating physical halogen bulb heat-glow on Kodachrome grain.”',
      tag: 'Generative Media',
    },
    {
      id: 'hub-interfaces',
      icon: <Sparkles className="w-5 h-5 text-[#D4FF3F]" />,
      title: 'Future Interfaces',
      membersCount: '210 builders',
      tagline: 'Tactile computing, dynamic typography, calm software, and spatial canvases.',
      sampleTopic: '“Why are code editors still flat text files instead of dynamic notations?”',
      tag: 'Spatial UI',
    },
    {
      id: 'hub-philosophy',
      icon: <BookOpen className="w-5 h-5 text-[#D4FF3F]" />,
      title: 'Philosophy of Technology',
      membersCount: '175 minds',
      tagline: 'Epistemic hygiene, slow media primitives, civilizational memory, and attention ethics.',
      sampleTopic: '“Building digital archives designed to survive 500 years offline.”',
      tag: 'Slow Technology',
    },
    {
      id: 'hub-hardware',
      icon: <Radio className="w-5 h-5 text-[#D4FF3F]" />,
      title: 'Tactile Computing & Hardware',
      membersCount: '130 engineers',
      tagline: 'LoRa mesh radios, analog synths, biofeedback monitors, and rugged embedded tools.',
      sampleTopic: '“Building resilient 8km radio mesh networks for disaster zones.”',
      tag: 'Physical Mesh',
    },
    {
      id: 'hub-synbio',
      icon: <Dna className="w-5 h-5 text-[#D4FF3F]" />,
      title: 'Synthetic Biology & Wetware',
      membersCount: '88 researchers',
      tagline: 'Slime mold computing substrates, living mycelium pavilions, and bio-sensors.',
      sampleTopic: '“Can biological slime mold compute shortest-path graphs with zero electricity?”',
      tag: 'Living Systems',
    },
  ];

  return (
    <section 
      id="hub-section"
      className="py-20 sm:py-28 lg:py-32 bg-[#0A0A0D] relative border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Section Header */}
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-14 sm:mb-16"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-3 py-1 inline-block mb-3">
            06 / HUBS
          </span>
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#F5F5F0] font-light leading-[1.12]">
            Find your people around <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#D4FF3F]">a shared obsession.</span>
          </h2>
          <p className="mt-4 text-[#969696] text-sm sm:text-base max-w-xl mx-auto font-sans-clean leading-relaxed">
            Micro-communities formed not around demographic categories or resume prestige, but around singular, intense curiosities.
          </p>
        </motion.div>

        {/* 6 Hub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubs.map((hub, idx) => (
            <motion.div
              key={hub.id}
              onClick={onExplore}
              className="group cursor-pointer bg-[#121216] border border-[#F5F5F0]/10 hover:border-[#D4FF3F]/40 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: shouldReduceMotion ? 0 : (idx % 3) * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div>
                {/* Header with icon and count */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="p-2.5 bg-[#09090B] border border-[#F5F5F0]/10 group-hover:border-[#D4FF3F]/30 transition-colors">
                    {hub.icon}
                  </div>
                  <span className="text-[10px] font-mono-code uppercase text-[#969696] tracking-wider">
                    {hub.membersCount}
                  </span>
                </div>

                <h3 className="font-editorial text-xl sm:text-2xl text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors mb-2">
                  {hub.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#969696] font-sans-clean leading-relaxed mb-4">
                  {hub.tagline}
                </p>

                <div className="p-3 bg-[#09090B] border border-[#F5F5F0]/5 text-xs text-[#D4D4D0] italic font-editorial">
                  {hub.sampleTopic}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-3.5 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                <span className="text-[10px] font-mono-code text-[#D4FF3F] bg-[#D4FF3F]/10 px-2 py-0.5">
                  #{hub.tag}
                </span>
                <span className="text-xs font-mono-code text-[#969696] group-hover:text-[#D4FF3F] flex items-center gap-1">
                  <span>Explore Hub</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
