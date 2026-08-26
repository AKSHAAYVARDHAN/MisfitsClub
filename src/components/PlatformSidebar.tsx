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
      id: 'sidebar-nav-connections',
      label: 'Connections',
      route: '/connections',
      icon: Users,
      badge: connectionsCount > 0 ? connectionsCount : undefined,
    },
    {
      id: 'sidebar-nav-messages',
      label: 'Messages',
      route: '/messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
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
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0B0B0C] border-r border-[#F5F5F0]/10 transition-all duration-300 ease-in-out select-none
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      {/* 1. Header: Branding & Collapse Toggle */}
      <div className={`h-20 flex items-center border-b border-[#F5F5F0]/10 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
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

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            id="sidebar-toggle-collapse-btn"
            onClick={onToggleCollapse}
            className={`hidden md:flex items-center justify-center w-7 h-7 rounded-none border border-[#242424] text-[#8A8A8A] hover:text-[#F5F5F0] hover:border-[#D4FF3F]/50 bg-[#121214] transition-colors focus:outline-none ${
              isCollapsed ? 'absolute -right-3.5 top-6 z-50 bg-[#0B0B0C] shadow-lg' : ''
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
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.route;

          return (
            <button
              key={item.route}
              id={item.id}
              onClick={() => handleItemClick(item.route)}
              className={`w-full group flex items-center gap-3.5 px-3.5 py-3 text-xs uppercase tracking-widest font-mono-code transition-all focus:outline-none ${
                isActive
                  ? 'text-[#D4FF3F] font-bold bg-[#D4FF3F]/10 border-l-2 border-[#D4FF3F]'
                  : 'text-[#969696] hover:text-[#F5F5F0] hover:bg-[#141417] border-l-2 border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#D4FF3F]' : 'text-[#8A8A8A] group-hover:text-[#F5F5F0]'
                  }`}
                />
                {/* Badge for Collapsed Mode */}
                {isCollapsed && item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D4FF3F] text-[#0B0B0C] text-[8px] font-mono-code font-black px-1 rounded-none">
                    {item.badge}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold font-mono-code px-1.5 py-0.5 rounded-none ${
                        item.route === '/messages'
                          ? 'bg-[#D4FF3F] text-[#0B0B0C]'
                          : 'bg-[#F5F5F0]/10 text-[#F5F5F0]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Bottom Section: Profile & User Actions */}
      <div className="p-3 border-t border-[#F5F5F0]/10 bg-[#0E0E10]/40">
        {currentUser && (
          <div className="space-y-1">
            <button
              id="sidebar-profile-btn"
              onClick={() => handleItemClick('/profile')}
              className={`w-full group flex items-center gap-3 px-3 py-2.5 text-xs font-mono-code transition-all focus:outline-none ${
                isProfileActive
                  ? 'text-[#D4FF3F] font-bold bg-[#D4FF3F]/10 border border-[#D4FF3F]/40'
                  : 'text-[#F5F5F0] hover:bg-[#151518] border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? `${currentUser.name} (Profile)` : undefined}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className={`h-7 w-7 rounded-sm object-cover border ${
                    isProfileActive ? 'border-[#D4FF3F]' : 'border-[#333]'
                  }`}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4FF3F] border border-[#0B0B0C]" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-[#F5F5F0] truncate group-hover:text-[#D4FF3F] transition-colors">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-[#7A7A7A] truncate font-sans-clean">
                    {currentUser.role || 'Member'}
                  </p>
                </div>
              )}
            </button>

            {!isCollapsed && onSignOut && (
              <button
                id="sidebar-signout-btn"
                onClick={onSignOut}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono-code uppercase tracking-widest text-[#7A7A7A] hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/5 transition-colors"
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
