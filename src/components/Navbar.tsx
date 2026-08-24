import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import { Compass, Sparkles, MessageSquare, Users, User, ArrowRight } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  onOpenOnboarding: () => void;
  unreadCount?: number;
  connectionsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenOnboarding,
  unreadCount = 1,
  connectionsCount = 2,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#F5F5F0]/10 bg-[#0B0B0C]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
        
        {/* Brand Logo & Live status */}
        <div className="flex items-center gap-6">
          <button 
            id="brand-logo-btn"
            onClick={() => setActiveTab('landing')} 
            className="group flex items-baseline gap-2 text-left focus:outline-none"
          >
            <span className="text-xl font-black tracking-tighter text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors">
              MISFITS CLUB
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#F5F5F0]/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF3F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF3F]"></span>
            </span>
            <span className="font-mono-code text-[11px] text-[#969696] uppercase tracking-wider">
              1,420 curious minds online
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-xs uppercase tracking-widest font-medium">
          <button
            id="nav-discover-btn"
            onClick={() => setActiveTab('discover')}
            className={`transition-colors flex items-center gap-1.5 ${
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
            onClick={() => setActiveTab('explore')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'explore'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            id="nav-connections-btn"
            onClick={() => setActiveTab('connections')}
            className={`relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'connections'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connections</span>
            {connectionsCount > 0 && (
              <span className="ml-1 text-[10px] bg-[#F5F5F0]/10 text-[#F5F5F0] px-1.5 py-0.5 rounded font-mono-code">
                {connectionsCount}
              </span>
            )}
          </button>

          <button
            id="nav-messages-btn"
            onClick={() => setActiveTab('messages')}
            className={`relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'messages'
                ? 'text-[#D4FF3F] font-bold'
                : 'text-[#969696] hover:text-[#F5F5F0]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages</span>
            {unreadCount > 0 && (
              <span className="ml-1 text-[10px] bg-[#D4FF3F] text-[#0B0B0C] px-1.5 py-0.5 font-bold font-mono-code">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        {/* User Account / CTA Action */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <button
              id="nav-profile-btn"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-3 py-1.5 border transition-colors ${
                activeTab === 'profile'
                  ? 'border-[#D4FF3F] text-[#D4FF3F] bg-[#D4FF3F]/5'
                  : 'border-[#F5F5F0]/10 text-[#969696] hover:text-[#F5F5F0] hover:border-[#F5F5F0]/30'
              }`}
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="h-5 w-5 object-cover"
              />
              <span className="text-xs uppercase tracking-wider font-medium hidden sm:inline">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              id="nav-find-someone-btn"
              onClick={onOpenOnboarding}
              className="bg-[#F5F5F0] text-[#0B0B0C] px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors"
            >
              <span>Find Someone</span>
            </button>
          )}

          {activeTab === 'landing' && currentUser && (
            <button
              id="nav-enter-club-btn"
              onClick={() => setActiveTab('discover')}
              className="border border-[#F5F5F0]/20 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-colors"
            >
              Enter Club
            </button>
          )}
        </div>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#F5F5F0]/10 bg-[#0B0B0C]/95 backdrop-blur-lg px-4 py-3">
        <div className="grid grid-cols-5 gap-2 text-center">
          <button
            id="mobile-nav-home"
            onClick={() => setActiveTab('landing')}
            className={`flex flex-col items-center justify-center text-[10px] uppercase tracking-wider ${
              activeTab === 'landing' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <span className="font-bold">MC</span>
            <span>Home</span>
          </button>

          <button
            id="mobile-nav-discover"
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center justify-center text-[10px] uppercase tracking-wider ${
              activeTab === 'discover' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <Compass className="h-4 w-4 mb-0.5" />
            <span>Discover</span>
          </button>

          <button
            id="mobile-nav-explore"
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center justify-center text-[10px] uppercase tracking-wider ${
              activeTab === 'explore' ? 'text-[#D4FF3F] font-bold' : 'text-[#969696]'
            }`}
          >
            <Sparkles className="h-4 w-4 mb-0.5" />
            <span>Board</span>
          </button>

          <button
            id="mobile-nav-messages"
            onClick={() => setActiveTab('messages')}
            className={`relative flex flex-col items-center justify-center text-[10px] uppercase tracking-wider ${
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
            className={`flex flex-col items-center justify-center text-[10px] uppercase tracking-wider ${
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
