import React from 'react';
import { Globe } from 'lucide-react';

interface NavbarProps {
  onNavigateHome: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onEnterOrb?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onOpenSignIn,
  onOpenSignUp,
  onEnterOrb,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#F5F5F0]/10 bg-[#0B0B0C]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6 sm:px-10 lg:px-12">
        
        {/* Left: Brand Logo & Status */}
        <div className="flex items-center gap-6 lg:gap-8 flex-shrink-0">
          <button 
            id="public-brand-logo-btn"
            onClick={onNavigateHome} 
            className="group flex items-baseline gap-2 text-left focus:outline-none"
            title="Misfits Club Manifesto"
          >
            <span className="text-xl font-black tracking-tighter text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors whitespace-nowrap">
              MISFITS CLUB
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-2.5 pl-6 border-l border-[#F5F5F0]/15">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF3F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF3F]"></span>
            </span>
            <span className="font-mono-code text-[11px] text-[#969696] uppercase tracking-wider whitespace-nowrap">
              1,420 curious minds online
            </span>
          </div>
        </div>

        {/* Right: Public Actions (Sign In / Join) */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <button
            id="nav-sign-in-btn"
            onClick={onOpenSignIn}
            className="text-xs font-mono-code uppercase tracking-widest font-medium text-[#969696] hover:text-[#F5F5F0] transition-colors px-2 py-1.5 whitespace-nowrap focus:outline-none"
          >
            SIGN IN
          </button>

          <button
            id="nav-enter-orb-header-btn"
            onClick={onEnterOrb || onOpenSignIn}
            className="bg-[#D4FF3F] text-[#080808] px-4 py-2 text-xs font-bold font-mono-code uppercase tracking-widest hover:bg-[#F5F5F0] transition-colors flex items-center gap-2 whitespace-nowrap shadow-md focus:outline-none"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ENTER ORB</span>
          </button>
        </div>

      </div>
    </header>
  );
};
