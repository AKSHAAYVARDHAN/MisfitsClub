import React from 'react';
import { Globe, ArrowUp } from 'lucide-react';

interface LandingFooterProps {
  onStartOnboarding: () => void;
  onEnterOrb: () => void;
  onExplore: () => void;
  onSignIn?: () => void;
  onScrollToTop: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onStartOnboarding,
  onEnterOrb,
  onExplore,
  onSignIn,
  onScrollToTop,
}) => {
  return (
    <footer className="border-t border-[#F5F5F0]/10 bg-[#08080A] py-14 px-6 sm:px-10 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Brand Manifesto Hallmarks */}
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="text-lg font-black text-[#F5F5F0] tracking-tighter uppercase font-sans-clean mb-1">
            MISFITS CLUB
          </span>
          <div className="flex items-center justify-center md:justify-start gap-3 text-[11px] font-mono-code text-[#969696] uppercase tracking-wider">
            <span>Not Networking.</span>
            <span>·</span>
            <span>Not Dating.</span>
            <span>·</span>
            <span className="text-[#D4FF3F] font-bold">Just Humans.</span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono-code uppercase tracking-widest text-[#969696]">
          <button 
            id="footer-nav-orb-btn"
            onClick={onEnterOrb} 
            className="hover:text-[#D4FF3F] transition-colors focus:outline-none"
          >
            The Orb
          </button>
          <button 
            id="footer-nav-discover-btn"
            onClick={onExplore} 
            className="hover:text-[#D4FF3F] transition-colors focus:outline-none"
          >
            Discover
          </button>
          <button 
            id="footer-nav-signin-btn"
            onClick={onSignIn || onStartOnboarding} 
            className="hover:text-[#D4FF3F] transition-colors focus:outline-none"
          >
            Sign In
          </button>
          <button 
            id="footer-nav-join-btn"
            onClick={onStartOnboarding} 
            className="text-[#F5F5F0] hover:text-[#D4FF3F] transition-colors focus:outline-none"
          >
            Join
          </button>
        </div>

        {/* Right: Scroll to top & ethos */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <button
            id="footer-scroll-to-top-btn"
            onClick={onScrollToTop}
            className="flex items-center gap-1.5 text-xs font-mono-code uppercase tracking-widest text-[#969696] hover:text-[#D4FF3F] transition-colors focus:outline-none"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <p className="text-[10px] text-[#969696]/70 font-mono-code uppercase tracking-widest">
            Curiosity over credentials · Global
          </p>
        </div>

      </div>
    </footer>
  );
};
