import React, { useState, useEffect } from 'react';
import { AppRoute } from '../context/RouterContext';
import { UserProfile, AppNotification } from '../types';
import { PlatformSidebar } from './PlatformSidebar';
import { NotificationPanel } from './NotificationPanel';
import { Bell, Menu, X, Globe, Compass, Sparkles, Layers, Users, MessageSquare, User } from 'lucide-react';

interface PlatformShellProps {
  currentPath: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentUser: UserProfile | null;
  connectionsCount?: number;
  unreadMessagesCount?: number;
  notifications?: AppNotification[];
  unreadNotificationsCount?: number;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
  isLoadingNotifications?: boolean;
  onSignOut?: () => void;
  children: React.ReactNode;
}

const STORAGE_KEY = 'misfits_sidebar_collapsed';

export const PlatformShell: React.FC<PlatformShellProps> = ({
  currentPath,
  onNavigate,
  currentUser,
  connectionsCount = 0,
  unreadMessagesCount = 0,
  notifications = [],
  unreadNotificationsCount = 0,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onNotificationClick,
  isLoadingNotifications = false,
  onSignOut,
  children,
}) => {
  // Sidebar collapsed state initialized from localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Toggle collapse and persist to localStorage
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const handleNotificationItemClick = (notif: AppNotification) => {
    if (onNotificationClick) {
      onNotificationClick(notif);
    }
    setIsNotificationsOpen(false);
  };

  const getSectionTitle = (path: AppRoute): string => {
    switch (path) {
      case '/orb': return 'ORB GLOBE';
      case '/discover': return 'DISCOVER MEMBERS';
      case '/board': return 'SPARK CURIOSITY';
      case '/spaces': return 'HUB';
      case '/connections': return 'CONNECTIONS CIRCLE';
      case '/messages': return 'CONVERSATIONS';
      case '/my-space': return 'MY SPACE';
      case '/profile': return 'MY PROFILE';
      default: return 'PLATFORM';
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2F2ED] flex flex-col font-sans-clean selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* 1. Collapsable Left Sidebar */}
      <PlatformSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        currentUser={currentUser}
        connectionsCount={connectionsCount}
        unreadMessagesCount={unreadMessagesCount}
        onSignOut={onSignOut}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-35 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* 2. Platform Main Content Area (Offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Platform Header Bar - Always above scrolling page content */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#1E1E24] bg-[#09090B]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Toggle & Context Breadcrumb */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Hamburger Toggle */}
            <button
              id="platform-mobile-menu-toggle-btn"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 border border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] bg-[#121216] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Platform Brand / Section Breadcrumb */}
            <div className="flex items-center gap-2 font-mono-code text-xs">
              <button
                id="platform-header-logo-btn"
                onClick={() => onNavigate('/orb')}
                className="font-bold text-[#F5F5F0] hover:text-[#D4FF3F] transition-colors focus:outline-none hidden sm:inline-block"
                title="Go to Orb"
              >
                MISFITS CLUB
              </button>
              <span className="text-[#444450] hidden sm:inline-block">/</span>
              <span className="text-[#D4FF3F] font-bold tracking-wider uppercase text-[11px] sm:text-xs">
                {getSectionTitle(currentPath)}
              </span>
            </div>
          </div>

          {/* Right: Live online status, Notifications & Profile Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Online Members Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#121216] border border-[#222228]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF3F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF3F]"></span>
              </span>
              <span className="font-mono-code text-[10px] text-[#8E8E93] uppercase tracking-wider whitespace-nowrap">
                1,420 online
              </span>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="platform-notification-bell-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-none border transition-all focus:outline-none ${
                  isNotificationsOpen
                    ? 'border-[#D4FF3F]/60 text-[#D4FF3F] bg-[#D4FF3F]/10'
                    : unreadNotificationsCount > 0
                    ? 'border-[#383844] text-[#F5F5F0] hover:border-[#D4FF3F]/50 bg-[#141418]'
                    : 'border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] bg-[#101014]'
                }`}
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span
                    id="platform-unread-notifications-badge"
                    className="absolute -top-1.5 -right-1.5 bg-lime-grained text-[#080808] text-[9px] font-mono-code font-bold px-1 py-0.2 rounded-none min-w-[15px] h-[15px] flex items-center justify-center shadow-md"
                  >
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              <NotificationPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                unreadCount={unreadNotificationsCount}
                onMarkAsRead={(id) => onMarkNotificationAsRead && onMarkNotificationAsRead(id)}
                onMarkAllAsRead={() => onMarkAllNotificationsAsRead && onMarkAllNotificationsAsRead()}
                onNotificationClick={handleNotificationItemClick}
                isLoading={isLoadingNotifications}
              />
            </div>

            {/* User Avatar header shortcut */}
            {currentUser && (
              <button
                id="platform-header-avatar-btn"
                onClick={() => onNavigate('/profile')}
                className={`flex items-center gap-2 p-1 border transition-all focus:outline-none ${
                  currentPath === '/profile'
                    ? 'border-[#D4FF3F]/60 bg-[#D4FF3F]/10'
                    : 'border-[#24242C] hover:border-[#383844] bg-[#121216]'
                }`}
                title={`Logged in as ${currentUser.name}`}
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-none object-cover border border-[#282832]"
                />
                <span className="hidden sm:inline-block text-xs font-mono-code text-[#E5E5E0] pr-1.5 font-medium">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Main View Content */}
        <main className="flex-1 pb-20 md:pb-10 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (< md screens) */}
      <nav
        id="platform-mobile-bottom-nav"
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[#1E1E24] bg-[#09090B]/95 backdrop-blur-xl px-3 py-2 safe-bottom"
      >
        <div className="grid grid-cols-6 gap-1 items-center max-w-md mx-auto">
          {/* 1. ORB */}
          <button
            id="mobile-nav-orb"
            onClick={() => onNavigate('/orb')}
            aria-label="Orb"
            title="Orb"
            className={`relative flex items-center justify-center h-11 w-full transition-colors duration-150 focus:outline-none ${
              currentPath === '/orb'
                ? 'text-white'
                : 'text-[#7A7A82] hover:text-[#F5F5F0]'
            }`}
          >
            <Globe className="h-5 w-5" />
          </button>

          {/* 2. DISCOVER */}
          <button
            id="mobile-nav-discover"
            onClick={() => onNavigate('/discover')}
            aria-label="Discover"
            title="Discover"
            className={`relative flex items-center justify-center h-11 w-full transition-colors duration-150 focus:outline-none ${
              currentPath === '/discover'
                ? 'text-white'
                : 'text-[#7A7A82] hover:text-[#F5F5F0]'
            }`}
          >
            <Compass className="h-5 w-5" />
          </button>

          {/* 3. SPARK */}
          <button
            id="mobile-nav-spark"
            onClick={() => onNavigate('/board')}
            aria-label="Spark"
            title="Spark"
            className={`relative flex items-center justify-center h-11 w-full transition-colors duration-150 focus:outline-none ${
              currentPath === '/board'
                ? 'text-white'
                : 'text-[#7A7A82] hover:text-[#F5F5F0]'
            }`}
          >
            <Sparkles className="h-5 w-5" />
          </button>

          {/* 4. HUB */}
          <button
            id="mobile-nav-spaces"
            onClick={() => onNavigate('/spaces')}
            aria-label="Hub"
            title="Hub"
            className={`relative flex items-center justify-center h-11 w-full transition-colors duration-150 focus:outline-none ${
              currentPath === '/spaces'
                ? 'text-white'
                : 'text-[#7A7A82] hover:text-[#F5F5F0]'
            }`}
          >
            <Layers className="h-5 w-5" />
          </button>

          {/* 5. MESSAGES */}
          <button
            id="mobile-nav-messages"
            onClick={() => onNavigate('/messages')}
            aria-label="Messages"
            title="Messages"
            className={`relative flex items-center justify-center h-11 w-full transition-colors duration-150 focus:outline-none ${
              currentPath === '/messages'
                ? 'text-white'
                : 'text-[#7A7A82] hover:text-[#F5F5F0]'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            {unreadMessagesCount > 0 && (
              <span
                id="mobile-unread-messages-badge"
                className="absolute top-1.5 right-2 bg-lime-grained text-[#080808] text-[8px] font-mono-code font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-none shadow"
              >
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </button>

          {/* 6. MY SPACE */}
          <button
            id="mobile-nav-my-space"
            onClick={() => onNavigate('/my-space')}
            aria-label="My Space"
            title="My Space"
            className={`relative flex items-center justify-center h-11 w-full transition-colors duration-150 focus:outline-none ${
              currentPath === '/my-space'
                ? 'text-white'
                : 'text-[#7A7A82] hover:text-[#F5F5F0]'
            }`}
          >
            <Users className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </div>
  );
};
