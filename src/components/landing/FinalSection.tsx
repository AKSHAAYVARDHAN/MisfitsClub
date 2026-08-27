import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Globe, ArrowRight, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';

interface FinalSectionProps {
  onStartOnboarding: () => void;
  onEnterOrb: () => void;
  currentUser?: UserProfile | null;
}

export const FinalSection: React.FC<FinalSectionProps> = ({
  onStartOnboarding,
  onEnterOrb,
  currentUser,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section 
      id="final-section"
      className="py-24 sm:py-32 lg:py-40 bg-[#08080A] relative text-center border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      {/* Background ambient subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[radial-gradient(circle,rgba(212,255,63,0.08)_0%,rgba(8,8,10,0)_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-center mb-6 sm:mb-8">
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-3 py-1">
              07 / MANIFESTO
            </span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light text-[#F5F5F0] leading-[1.08] tracking-tight mb-7 sm:mb-9">
            You don't need more followers. <br />
            <span className="italic font-normal text-[#D4FF3F]">You need a few people worth talking to.</span>
          </h2>

          <p className="font-sans-clean text-base sm:text-lg lg:text-xl text-[#969696] max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed">
            Free from infinite algorithmic feeds, notification traps, and performance anxiety. 
            Welcome to the quiet corner of the internet for genuine, unconventional minds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="final-enter-club-btn"
              onClick={onStartOnboarding}
              className="w-full sm:w-auto bg-[#F5F5F0] text-[#080808] px-10 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-all shadow-2xl active:scale-[0.99] focus:outline-none"
            >
              <span>{currentUser ? 'ENTER THE CLUB' : 'ENTER THE CLUB'}</span>
            </button>

            <button
              id="final-enter-orb-btn"
              onClick={onEnterOrb}
              className="w-full sm:w-auto bg-[#09090B] border border-[#F5F5F0]/20 text-[#F5F5F0] px-8 py-4 text-xs sm:text-sm font-mono-code uppercase tracking-widest hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-all flex items-center justify-center gap-2 active:scale-[0.99] focus:outline-none"
            >
              <Globe className="w-4 h-4 text-[#D4FF3F]" />
              <span>LAUNCH THE ORB</span>
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
