import React, { useState, useEffect } from 'react';
import { AppRoute } from '../context/RouterContext';
import { UserProfile } from '../types';
import { 
  Globe, 
  Compass, 
  Sparkles, 
  Layers,
  Users, 
  MessageSquare, 
  LayoutGrid,
  User, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Sparkle
} from 'lucide-react';

interface PlatformSidebarProps {
  currentPath: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentUser: UserProfile | null;
  connectionsCount?: number;
  unreadMessagesCount?: number;
  onSignOut?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const PlatformSidebar: React.FC<PlatformSidebarProps> = ({
  currentPath,
  onNavigate,
  currentUser,
  connectionsCount = 0,
  unreadMessagesCount = 0,
  onSignOut,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: { label: string; route: AppRoute; icon: React.ComponentType<{ className?: string }>; badge?: number; id: string }[] = [
    {
      id: 'sidebar-nav-orb',
      label: 'Orb',
      route: '/orb',
      icon: Globe,
    },
    {
      id: 'sidebar-nav-discover',
      label: 'Discover',
      route: '/discover',
      icon: Compass,
    },
    {
      id: 'sidebar-nav-spark',
      label: 'Spark',
      route: '/board',
      icon: Sparkles,
    },
    {
      id: 'sidebar-nav-spaces',
      label: 'Hub',
      route: '/spaces',
      icon: Layers,
    },
    {
      id: 'sidebar-nav-messages',
      label: 'Messages',
      route: '/messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      id: 'sidebar-nav-connections',
      label: 'Connections',
      route: '/connections',
      icon: Users,
      badge: connectionsCount > 0 ? connectionsCount : undefined,
    },
    {
      id: 'sidebar-nav-my-space',
      label: 'My Space',
      route: '/my-space',
      icon: LayoutGrid,
    },
  ];

  const handleItemClick = (route: AppRoute) => {
    onNavigate(route);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isProfileActive = currentPath === '/profile';

  return (
    <aside
      id="platform-sidebar"
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#09090B] border-r border-[#1E1E24] transition-all duration-300 ease-in-out select-none shadow-2xl md:shadow-none
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        w-72 sm:w-80 md:w-auto
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      {/* 1. Header: Branding, Close button (mobile), Collapse Toggle (desktop) */}
      <div className={`h-20 flex items-center border-b border-[#1E1E24] px-4 sm:px-5 ${isCollapsed ? 'md:justify-center justify-between' : 'justify-between'}`}>
        {!isCollapsed ? (
          <button
            id="sidebar-brand-logo-btn"
            onClick={() => handleItemClick('/orb')}
            className="group flex items-baseline gap-2 text-left focus:outline-none transition-transform active:scale-95"
            title="Misfits Club Platform Home (Orb)"
          >
            <span className="text-lg font-black tracking-tighter text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors whitespace-nowrap">
              MISFITS CLUB
            </span>
          </button>
        ) : (
          <button
            id="sidebar-brand-logo-collapsed-btn"
            onClick={() => handleItemClick('/orb')}
            className="group flex items-center justify-center p-2 text-center focus:outline-none transition-transform active:scale-95"
            title="Misfits Club Platform Home (Orb)"
          >
            <span className="text-base font-black tracking-tighter text-[#D4FF3F] group-hover:scale-110 transition-transform">
              M<span className="text-[#F5F5F0]">C</span>
            </span>
          </button>
        )}

        {/* Mobile Close (X) button */}
        <button
          id="sidebar-mobile-close-btn"
          onClick={onCloseMobile}
          className="md:hidden p-2 text-[#8E8E93] hover:text-[#F5F5F0] hover:bg-[#141418] border border-[#24242C] transition-colors focus:outline-none"
          aria-label="Close navigation drawer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            id="sidebar-toggle-collapse-btn"
            onClick={onToggleCollapse}
            className={`hidden md:flex items-center justify-center w-7 h-7 rounded-none border border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] bg-[#121216] transition-colors focus:outline-none ${
              isCollapsed ? 'absolute -right-3.5 top-6 z-50 bg-[#09090B] shadow-lg' : ''
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-[#D4FF3F]" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* 2. Main Navigation Items */}
      <nav className="flex-1 py-4 sm:py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.route;

          return (
            <button
              key={item.route}
              id={item.id}
              onClick={() => handleItemClick(item.route)}
              className={`w-full group flex items-center gap-3.5 px-3.5 py-3 text-xs uppercase tracking-widest font-mono-code transition-all focus:outline-none min-h-[44px] ${
                isActive
                  ? 'text-[#F5F5F0] font-bold bg-[#D4FF3F]/8 border-l-2 border-[#D4FF3F]'
                  : 'text-[#8E8E93] hover:text-[#F5F5F0] hover:bg-[#141418] border-l-2 border-transparent'
              } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#D4FF3F]' : 'text-[#777780] group-hover:text-[#F5F5F0]'
                  }`}
                />
                {/* Badge for Collapsed Mode on desktop */}
                {isCollapsed && item.badge && item.badge > 0 && (
                  <span className="hidden md:flex absolute -top-1.5 -right-2 bg-lime-grained text-[#080808] text-[8px] font-mono-code font-black px-1 rounded-none">
                    {item.badge}
                  </span>
                )}
              </div>

              <div className={`flex-1 flex items-center justify-between overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="truncate">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold font-mono-code px-1.5 py-0.5 rounded-none ${
                      item.route === '/messages'
                        ? 'bg-lime-grained text-[#080808]'
                        : 'bg-[#181820] text-[#D0D0CA] border border-[#282832]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* 3. Bottom Section: Profile & User Actions */}
      <div className="p-3 sm:p-4 border-t border-[#1E1E24] bg-[#0C0C0E]">
        {currentUser && (
          <div className="space-y-1">
            <button
              id="sidebar-profile-btn"
              onClick={() => handleItemClick('/profile')}
              className={`w-full group flex items-center gap-3 px-3 py-2.5 text-xs font-mono-code transition-all focus:outline-none min-h-[44px] ${
                isProfileActive
                  ? 'text-[#F5F5F0] font-bold bg-[#D4FF3F]/8 border border-[#D4FF3F]/30'
                  : 'text-[#E0E0DC] hover:bg-[#141418] border border-transparent'
              } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
              title={isCollapsed ? `${currentUser.name} (Profile)` : undefined}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className={`h-7 w-7 rounded-none object-cover border ${
                    isProfileActive ? 'border-[#D4FF3F]' : 'border-[#282830]'
                  }`}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4FF3F] border border-[#09090B]" />
              </div>

              <div className={`flex-1 min-w-0 text-left ${isCollapsed ? 'md:hidden' : ''}`}>
                <p className="text-xs font-medium text-[#F5F5F0] truncate group-hover:text-[#D4FF3F] transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[#7A7A82] truncate font-sans-clean">
                  {currentUser.role || 'Member'}
                </p>
              </div>
            </button>

            {onSignOut && (
              <button
                id="sidebar-signout-btn"
                onClick={onSignOut}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A82] hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors min-h-[36px] ${isCollapsed ? 'md:hidden' : ''}`}
                title="Sign out of platform"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
