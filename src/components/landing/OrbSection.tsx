import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Globe, Radio, Sparkles, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { OrbGlobe } from '../OrbGlobe';
import { OrbLocation, UserProfile, PublicProfile } from '../../types';

interface OrbSectionProps {
  onEnterOrb: () => void;
  orbLocations: OrbLocation[];
}

export const OrbSection: React.FC<OrbSectionProps> = ({ onEnterOrb, orbLocations }) => {
  const shouldReduceMotion = useReducedMotion();

  const userGeo = {
    lat: 13.0827,
    lng: 80.2707,
    name: 'Akshaay Vardhan',
    city: 'Chennai',
  };

  const orbFeatures = [
    {
      title: 'A Spatial Constellation',
      desc: 'See where curious minds are awake right now. Real coordinates across Tokyo, Berlin, Chennai, New York, Singapore, and London.',
    },
    {
      title: 'Intent-Driven Glowing Arcs',
      desc: 'Arcs represent active mutual desires—collaborations, deep research rabbit holes, mentorships, and open dialogue.',
    },
    {
      title: 'Zero Algorithmic Ranking',
      desc: 'No viral manipulation, no follower follower dynamics. Pure organic serendipity and real human presence.',
    },
  ];

  return (
    <section 
      id="orb-section"
      className="py-20 sm:py-28 lg:py-36 bg-[#08080A] relative border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      {/* Subtle deep ambient glow behind the globe */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(212,255,63,0.06)_0%,rgba(8,8,10,0)_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-3 py-1 inline-block mb-3">
            03 / THE ORB
          </span>

          <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl text-[#F5F5F0] font-light leading-[1.08] tracking-tight">
            A world made from <br />
            <span className="italic font-normal text-[#D4FF3F]">your connections.</span>
          </h2>

          <p className="mt-5 text-[#969696] text-base sm:text-lg max-w-xl mx-auto font-sans-clean leading-relaxed">
            Traditional networks flatten humans into feeds and follower counts. 
            The Orb renders real human minds as a living, glowing spatial constellation across the globe.
          </p>
        </motion.div>

        {/* 3D Orb Interactive Stage with Orbital Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Globe Canvas Container */}
          <motion.div 
            className="lg:col-span-7 flex justify-center items-center relative"
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] aspect-square relative rounded-full p-3 border border-[#F5F5F0]/15 bg-[#0D0D10] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex items-center justify-center">
              
              {/* Radial atmospheric depth */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,255,63,0.12)_0%,rgba(13,13,16,0)_75%)] pointer-events-none" />

              {/* 3D WebGL Globe instance */}
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
                  initialDistance={6.8}
                  className="w-full h-full"
                />
              </div>

              {/* Live Orbital Telemetry Overlays */}
              <div className="absolute top-5 left-5 bg-[#09090B]/90 border border-[#F5F5F0]/10 px-3 py-1.5 rounded text-[10px] font-mono-code text-[#F5F5F0] flex items-center gap-2 backdrop-blur-sm shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
                <span>SPATIAL COGNITIVE MESH</span>
              </div>

              <div className="absolute bottom-5 right-5 bg-[#09090B]/90 border border-[#F5F5F0]/10 px-3 py-1.5 rounded text-[10px] font-mono-code text-[#969696] flex items-center gap-2 backdrop-blur-sm shadow-lg">
                <Radio className="w-3 h-3 text-[#D4FF3F]" />
                <span>38 COUNTRIES ACTIVE</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Narrative Callouts & Orb Entry */}
          <div className="lg:col-span-5 space-y-6">
            {orbFeatures.map((feat, idx) => (
              <motion.div
                key={feat.title}
                className="p-6 bg-[#111114] border border-[#F5F5F0]/10 hover:border-[#D4FF3F]/30 transition-colors"
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : idx * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-1.5 h-1.5 bg-[#D4FF3F] rounded-full" />
                  <h3 className="text-base sm:text-lg font-bold font-editorial text-[#F5F5F0]">
                    {feat.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#969696] font-sans-clean leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="pt-4"
            >
              <button
                id="orb-section-enter-btn"
                onClick={onEnterOrb}
                className="w-full bg-[#D4FF3F] text-[#080808] py-3.5 px-6 font-mono-code text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#F5F5F0] transition-colors flex items-center justify-center gap-2 shadow-xl focus:outline-none"
              >
                <Globe className="w-4 h-4" />
                <span>LAUNCH FULL ORB EXPERIENCE</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};
