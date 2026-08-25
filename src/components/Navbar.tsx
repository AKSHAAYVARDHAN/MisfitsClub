import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import { Compass, Sparkles, MessageSquare, Users, User, ArrowRight, Globe } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  onOpenOnboarding: () => void;
  onOpenSignIn: () => void;
  onSignOut?: () => void;
  unreadCount?: number;
  connectionsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenOnboarding,
  onOpenSignIn,
  onSignOut,
  unreadCount = 1,
  connectionsCount = 2,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#F5F5F0]/10 bg-[#0B0B0C]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6 sm:px-10 lg:px-12">
        
        {/* Left: Brand Logo & Status */}
        <div className="flex items-center gap-6 lg:gap-8 flex-shrink-0">
          <button 
            id="brand-logo-btn"
            onClick={() => setActiveTab('landing')} 
            className="group flex items-baseline gap-2 text-left focus:outline-none"
            title="Return to Misfits Club Manifesto"
          >
            <span className="text-xl font-black tracking-tighter text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors whitespace-nowrap">
              MISFITS CLUB
            </span>
          </button>

          <div className="hidden xl:flex items-center gap-2.5 pl-6 border-l border-[#F5F5F0]/15">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF3F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF3F]"></span>
            </span>
            <span className="font-mono-code text-[11px] text-[#969696] uppercase tracking-wider whitespace-nowrap">
              1,420 curious minds online
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-9 text-xs uppercase tracking-widest font-medium">
          <button
            id="nav-orb-btn"
            onClick={() => setActiveTab('orb')}
            className={`transition-colors flex items-center gap-2 py-2 ${
              activeTab === 'orb'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Orb</span>
          </button>

          <button
            id="nav-discover-btn"
            onClick={() => setActiveTab('discover')}
            className={`transition-colors flex items-center gap-2 py-2 ${
              activeTab === 'discover'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>

          <button
            id="nav-explore-btn"
            onClick={() => setActiveTab('board')}
            className={`transition-colors flex items-center gap-2 py-2 ${
              activeTab === 'board' || activeTab === 'explore'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spark</span>
          </button>

          <button
            id="nav-connections-btn"
            onClick={() => setActiveTab('connections')}
            className={`relative transition-colors flex items-center gap-2 py-2 ${
              activeTab === 'connections'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connections</span>
            {connectionsCount > 0 && (
              <span className="ml-0.5 text-[10px] bg-[#F5F5F0]/10 text-[#F5F5F0] px-1.5 py-0.5 rounded font-mono-code font-bold">
                {connectionsCount}
              </span>
            )}
          </button>

          <button
            id="nav-messages-btn"
            onClick={() => setActiveTab('messages')}
            className={`relative transition-colors flex items-center gap-2 py-2 ${
              activeTab === 'messages'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages</span>
            {unreadCount > 0 && (
              <span className="ml-0.5 text-[10px] bg-[#D4FF3F] text-[#0B0B0C] px-1.5 py-0.5 font-bold font-mono-code">
                {unreadCount}
              </span>
            )}
          </button>

          {currentUser && (
            <button
              id="nav-profile-btn"
              onClick={() => setActiveTab('profile')}
              className={`transition-colors flex items-center gap-2 py-2 ${
                activeTab === 'profile'
                  ? 'text-[#D4FF3F] font-bold'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          )}
        </nav>

        {/* Right: User Account / Action */}
        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <button
                id="nav-user-account-btn"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2.5 px-3 py-1.5 border transition-all ${
                  activeTab === 'profile'
                    ? 'border-[#D4FF3F] text-[#D4FF3F] bg-[#D4FF3F]/10'
                    : 'border-[#242424] text-[#F5F5F0] hover:border-[#D4FF3F]/60 bg-[#101010]'
                }`}
                title="View your Misfits Club profile"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="h-5 w-5 rounded-sm object-cover border border-[#333]"
                />
                <span className="text-xs uppercase tracking-wider font-mono-code font-medium">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                id="nav-sign-in-btn"
                onClick={onOpenSignIn}
                className="text-xs font-mono-code uppercase tracking-widest font-medium text-[#969696] hover:text-[#F5F5F0] transition-colors px-2 py-1.5 whitespace-nowrap focus:outline-none"
              >
                SIGN IN
              </button>

              <button
                id="nav-enter-orb-header-btn"
                onClick={() => setActiveTab('orb')}
                className="bg-[#D4FF3F] text-[#080808] px-4 py-2 text-xs font-bold font-mono-code uppercase tracking-widest hover:bg-[#F5F5F0] transition-colors flex items-center gap-2 whitespace-nowrap shadow-md"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>ENTER ORB</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#F5F5F0]/10 bg-[#0B0B0C]/95 backdrop-blur-lg px-2 py-2">
        <div className="grid grid-cols-6 gap-1 text-center">
          <button
            id="mobile-nav-orb"
            onClick={() => setActiveTab('orb')}
            className={`flex flex-col items-center justify-center text-[9px] uppercase tracking-wider py-1 ${
              activeTab === 'orb' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <Globe className="h-4 w-4 mb-0.5" />
            <span>Orb</span>
          </button>

          <button
            id="mobile-nav-discover"
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center justify-center text-[9px] uppercase tracking-wider py-1 ${
              activeTab === 'discover' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <Compass className="h-4 w-4 mb-0.5" />
            <span>Discover</span>
          </button>

          <button
            id="mobile-nav-explore"
            onClick={() => setActiveTab('board')}
            className={`flex flex-col items-center justify-center text-[9px] uppercase tracking-wider py-1 ${
              activeTab === 'board' || activeTab === 'explore' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <Sparkles className="h-4 w-4 mb-0.5" />
            <span>Spark</span>
          </button>

          <button
            id="mobile-nav-connections"
            onClick={() => setActiveTab('connections')}
            className={`relative flex flex-col items-center justify-center text-[9px] uppercase tracking-wider py-1 ${
              activeTab === 'connections' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <Users className="h-4 w-4 mb-0.5" />
            <span>Circle</span>
          </button>

          <button
            id="mobile-nav-messages"
            onClick={() => setActiveTab('messages')}
            className={`relative flex flex-col items-center justify-center text-[9px] uppercase tracking-wider py-1 ${
              activeTab === 'messages' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <MessageSquare className="h-4 w-4 mb-0.5" />
            <span>Chat</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-3 h-2 w-2 rounded-full bg-[#D4FF3F]"></span>
            )}
          </button>

          <button
            id="mobile-nav-profile"
            onClick={() => (currentUser ? setActiveTab('profile') : onOpenOnboarding())}
            className={`flex flex-col items-center justify-center text-[9px] uppercase tracking-wider py-1 ${
              activeTab === 'profile' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <User className="h-4 w-4 mb-0.5" />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};
