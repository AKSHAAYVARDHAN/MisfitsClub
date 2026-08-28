import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  Mail, 
  Sparkles, 
  History, 
  ArrowLeft, 
  LogOut, 
  RefreshCw,
  Layers,
  Lock,
  ShieldAlert, 
  Zap,
  Settings,
  Menu,
  X,
  Radio,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { adminService } from '../../services/adminService';
import { AdminRole, StaffMember, PlatformMetric } from '../../types';
import { AdminAccessDenied } from './AdminAccessDenied';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminMembersTab } from './AdminMembersTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AdminSparksTab } from './AdminSparksTab';
import { AdminInboxTab } from './AdminInboxTab';
import { AdminAuditTab } from './AdminAuditTab';
import { AdminSystemTab } from './AdminSystemTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AuthModal } from '../AuthModal';

export type AdminTab = 
  | 'overview' 
  | 'members' 
  | 'reports' 
  | 'sparks' 
  | 'inbox' 
  | 'audit' 
  | 'system' 
  | 'settings';

export const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, signOut, isLoading: authLoading } = useAuth();
  const { navigate } = useRouter();

  const parseTabFromPath = (): AdminTab => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin/members') return 'members';
    if (path === '/admin/reports' || path === '/admin/moderation') return 'reports';
    if (path === '/admin/sparks') return 'sparks';
    if (path === '/admin/inbox') return 'inbox';
    if (path === '/admin/audit') return 'audit';
    if (path === '/admin/system' || path === '/admin/broadcasts') return 'system';
    if (path === '/admin/settings' || path === '/admin/team' || path === '/admin/roles') return 'settings';
    return 'overview';
  };

  const [staffRole, setStaffRole] = useState<StaffMember | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>(parseTabFromPath);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<PlatformMetric>({
    totalUsers: 0,
    totalSparks: 0,
    totalSpaces: 0,
    totalConnections: 0,
    pendingFeedbackCount: 0,
    pendingContactCount: 0,
    activeStaffCount: 0,
  });
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    const targetPath = tab === 'overview' ? '/admin' : `/admin/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(parseTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const uid = user?.uid || user?.id;

  const verifyPrivileges = async () => {
    if (!uid) {
      setStaffRole(null);
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    try {
      const roleDoc = await adminService.getStaffRole(uid);
      setStaffRole(roleDoc);

      if (roleDoc && roleDoc.status === 'active') {
        const [m, sl] = await Promise.all([
          adminService.getPlatformMetrics(),
          adminService.getAllStaff(),
        ]);
        setMetrics(m);
        setStaffList(sl);
      }
    } catch (err) {
      console.warn('Error validating staff role:', err);
      setStaffRole(null);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      verifyPrivileges();
    }
  }, [uid, authLoading]);

  const handleRefreshAll = async () => {
    if (staffRole) {
      const [m, sl] = await Promise.all([
        adminService.getPlatformMetrics(),
        adminService.getAllStaff(),
      ]);
      setMetrics(m);
      setStaffList(sl);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin');
  };

  const handleReturnToApp = () => {
    navigate('/orb');
  };

  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-[#08080A] text-[#F5F5F0] flex flex-col items-center justify-center font-mono-code text-xs space-y-4">
        <div className="w-8 h-8 border-2 border-[#D4FF3F] border-t-transparent animate-spin" />
        <div className="text-[#969696] uppercase tracking-widest">
          Verifying Admin Authorization...
        </div>
      </div>
    );
  }

  // Not authenticated or not an active staff member
  if (!isAuthenticated || !user || !staffRole || staffRole.status !== 'active') {
    return (
      <>
        <AdminAccessDenied
          user={user}
          onSignIn={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
          onReturnToApp={handleReturnToApp}
          onRoleGranted={verifyPrivileges}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signin"
        />
      </>
    );
  }

  const roleBadgeStyle = (r: AdminRole) => {
    switch (r) {
      case 'OWNER':
        return 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F]';
      case 'ADMIN':
        return 'bg-amber-400 text-[#080808] border-amber-400';
      case 'MODERATOR':
        return 'bg-sky-400 text-[#080808] border-sky-400';
      case 'SUPPORT':
        return 'bg-purple-400 text-[#080808] border-purple-400';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  const navGroups = [
    {
      group: 'GENERAL',
      items: [
        { id: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      group: 'COMMUNITY',
      items: [
        { id: 'members' as AdminTab, label: 'Members', icon: Users, badge: metrics.totalUsers },
        { id: 'sparks' as AdminTab, label: 'Sparks & Spaces', icon: Sparkles, badge: metrics.totalSparks },
      ],
    },
    {
      group: 'MODERATION',
      items: [
        { id: 'reports' as AdminTab, label: 'Reports Queue', icon: ShieldAlert },
        { id: 'inbox' as AdminTab, label: 'Triage Inbox', icon: Mail, badge: metrics.pendingFeedbackCount + metrics.pendingContactCount },
      ],
    },
    {
      group: 'SYSTEM & SECURITY',
      items: [
        { id: 'audit' as AdminTab, label: 'Audit Trail', icon: History },
        { id: 'system' as AdminTab, label: 'Broadcasts & Health', icon: Zap },
        { id: 'settings' as AdminTab, label: 'Staff & Policies', icon: Settings, badge: staffList.length },
      ],
    },
  ];

  const getBreadcrumbLabel = (tab: AdminTab) => {
    switch (tab) {
      case 'overview': return 'OVERVIEW';
      case 'members': return 'MEMBERS';
      case 'reports': return 'MODERATION REPORTS';
      case 'sparks': return 'SPARKS & CONTENT';
      case 'inbox': return 'TRIAGE INBOX';
      case 'audit': return 'SECURITY AUDIT LOG';
      case 'system': return 'SYSTEM & BROADCASTS';
      case 'settings': return 'SETTINGS & RBAC';
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-[#F5F5F0] font-sans-clean selection:bg-[#D4FF3F] selection:text-[#08080A] flex flex-col">
      {/* Admin Command Topbar */}
      <header className="sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-md border-b border-[#F5F5F0]/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left Branding & Dynamic Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#969696] hover:text-[#F5F5F0] bg-[#14141A] border border-[#262630]"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="w-2.5 h-2.5 bg-[#D4FF3F] rotate-45 shrink-0" />
          <span className="font-mono-code text-xs uppercase tracking-widest text-[#F5F5F0] font-bold">
            MISFITS CLUB
          </span>
          <span className="text-xs text-[#64646E] font-mono-code">/</span>
          <span className="text-xs text-[#969696] font-mono-code uppercase hidden sm:inline">
            ADMIN TERMINAL
          </span>
          <span className="text-xs text-[#64646E] font-mono-code hidden sm:inline">/</span>
          <span className="text-xs text-[#D4FF3F] font-mono-code uppercase font-bold tracking-wider">
            {getBreadcrumbLabel(activeTab)}
          </span>
          <span
            className={`text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 border ml-1 ${roleBadgeStyle(
              staffRole.role
            )}`}
          >
            {staffRole.role}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleRefreshAll}
            title="Refresh dashboard data"
            className="p-2 text-[#969696] hover:text-[#F5F5F0] bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReturnToApp}
            className="px-3 py-1.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exit to Community</span>
          </button>

          <button
            onClick={handleSignOut}
            title="Sign out of staff session"
            className="p-2 text-[#969696] hover:text-red-400 bg-[#14141A] hover:bg-red-500/10 border border-[#262630] hover:border-red-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Layout Container (Sidebar + Content) */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#F5F5F0]/10 bg-[#0A0A0E] p-4 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto">
          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <div className="text-[10px] font-mono-code uppercase tracking-widest text-[#64646E] px-3 mb-1.5 font-semibold">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-mono-code uppercase tracking-wider transition-all flex items-center justify-between group ${
                        isActive
                          ? 'bg-[#14141A] text-[#D4FF3F] font-bold border-l-2 border-[#D4FF3F]'
                          : 'text-[#969696] hover:text-[#F5F5F0] hover:bg-[#121217]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4FF3F]' : 'text-[#64646E] group-hover:text-[#F5F5F0]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 font-mono-code font-bold ${
                            isActive
                              ? 'bg-[#D4FF3F] text-[#080808]'
                              : 'bg-[#181822] text-[#969696]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer Identity */}
          <div className="pt-4 border-t border-[#F5F5F0]/10 text-xs font-mono-code space-y-1">
            <div className="text-[10px] text-[#64646E] uppercase">Authenticated Session</div>
            <div className="text-[#F5F5F0] truncate font-medium">{staffRole.name || 'Admin'}</div>
            <div className="text-[10px] text-[#64646E] truncate">{staffRole.email}</div>
          </div>
        </aside>

        {/* Mobile Flyout Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#08080A]/90 backdrop-blur-md p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#F5F5F0]/10 pb-3">
                <span className="font-mono-code text-xs uppercase text-[#D4FF3F] font-bold">
                  Navigation Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-[#969696] hover:text-[#F5F5F0]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {navGroups.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <div className="text-[10px] font-mono-code uppercase tracking-widest text-[#64646E] px-2 mb-1">
                      {group.group}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={`w-full text-left px-3 py-2.5 text-xs font-mono-code uppercase tracking-wider transition-all flex items-center justify-between ${
                            isActive
                              ? 'bg-[#14141A] text-[#D4FF3F] font-bold border-l-2 border-[#D4FF3F]'
                              : 'text-[#969696] hover:text-[#F5F5F0]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#181822] text-[#D4FF3F]">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#F5F5F0]/10 flex items-center justify-between">
              <span className="text-xs font-mono-code text-[#64646E]">{staffRole.email}</span>
              <button
                onClick={handleReturnToApp}
                className="px-3 py-1.5 bg-[#14141A] text-xs font-mono-code text-[#D4FF3F] uppercase"
              >
                Exit
              </button>
            </div>
          </div>
        )}

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-8 min-w-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminOverviewTab
                  metrics={metrics}
                  currentStaff={staffRole}
                  onNavigateTab={(t) => handleTabChange(t as AdminTab)}
                />
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminMembersTab
                  currentStaff={staffRole}
                  onRefreshMetrics={handleRefreshAll}
                />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminReportsTab
                  currentStaff={staffRole}
                  onRefreshMetrics={handleRefreshAll}
                />
              </motion.div>
            )}

            {activeTab === 'sparks' && (
              <motion.div
                key="sparks"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminSparksTab
                  currentStaff={staffRole}
                  onRefreshMetrics={handleRefreshAll}
                />
              </motion.div>
            )}

            {activeTab === 'inbox' && (
              <motion.div
                key="inbox"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminInboxTab
                  currentStaff={staffRole}
                  onRefreshMetrics={handleRefreshAll}
                />
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminAuditTab currentStaff={staffRole} />
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminSystemTab
                  currentStaff={staffRole}
                  onRefreshMetrics={handleRefreshAll}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AdminSettingsTab
                  staffList={staffList}
                  currentStaff={staffRole}
                  currentUser={user}
                  onRefresh={handleRefreshAll}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Admin Footer */}
      <footer className="border-t border-[#F5F5F0]/10 bg-[#0E0E12] py-3.5 px-4 sm:px-8 text-xs font-mono-code text-[#64646E] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>MISFITS CLUB CONTROL CENTER · AUTHORITATIVE FIRESTORE RULES ENGINE</span>
        <span className="text-[#969696]">SESSION: {staffRole.email} ({staffRole.role})</span>
      </footer>
    </div>
  );
};
