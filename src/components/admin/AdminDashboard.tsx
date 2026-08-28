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
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { adminService } from '../../services/adminService';
import { AdminRole, StaffMember, PlatformMetric } from '../../types';
import { AdminAccessDenied } from './AdminAccessDenied';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminRolesTab } from './AdminRolesTab';
import { AdminInboxTab } from './AdminInboxTab';
import { AdminModerationTab } from './AdminModerationTab';
import { AdminAuditTab } from './AdminAuditTab';
import { AuthModal } from '../AuthModal';

export const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, signOut, isLoading: authLoading } = useAuth();
  const { navigate } = useRouter();

  const [staffRole, setStaffRole] = useState<StaffMember | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'inbox' | 'moderation' | 'audit'>('overview');
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
          Authenticating RBAC Privileges...
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

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: 'Triage Inbox', icon: Mail, badge: metrics.pendingFeedbackCount + metrics.pendingContactCount },
    { id: 'moderation', label: 'Moderation', icon: Sparkles },
    { id: 'roles', label: 'Team & RBAC', icon: Users, badge: staffList.length },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#08080A] text-[#F5F5F0] font-sans-clean selection:bg-[#D4FF3F] selection:text-[#08080A] flex flex-col">
      {/* Admin Command Topbar */}
      <header className="sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-md border-b border-[#F5F5F0]/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#D4FF3F] rotate-45" />
          <span className="font-mono-code text-xs uppercase tracking-widest text-[#F5F5F0] font-bold">
            MISFITS CLUB
          </span>
          <span className="text-xs text-[#64646E] font-mono-code">/</span>
          <span className="text-xs text-[#969696] font-mono-code uppercase">
            ADMIN TERMINAL
          </span>
          <span
            className={`text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 border ${roleBadgeStyle(
              staffRole.role
            )}`}
          >
            {staffRole.role}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            title="Refresh dashboard data"
            className="p-2 text-[#969696] hover:text-[#F5F5F0] bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReturnToApp}
            className="px-3.5 py-1.5 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit to Sanctuary</span>
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

      {/* Navigation Subheader */}
      <div className="border-b border-[#F5F5F0]/10 bg-[#0E0E12] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-4 py-2.5 text-xs font-mono-code uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                  isActive
                    ? 'border-[#D4FF3F] text-[#D4FF3F] font-bold bg-[#14141A]'
                    : 'border-transparent text-[#969696] hover:text-[#F5F5F0] hover:bg-[#121217]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-none font-bold ${
                      isActive
                        ? 'bg-[#D4FF3F] text-[#080808]'
                        : 'bg-[#22222A] text-[#969696]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminOverviewTab
                metrics={metrics}
                currentStaff={staffRole}
                onNavigateTab={(t) => setActiveTab(t as any)}
              />
            </motion.div>
          )}

          {activeTab === 'inbox' && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminInboxTab
                currentStaff={staffRole}
                onRefreshMetrics={handleRefreshAll}
              />
            </motion.div>
          )}

          {activeTab === 'moderation' && (
            <motion.div
              key="moderation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminModerationTab
                currentStaff={staffRole}
                onRefreshMetrics={handleRefreshAll}
              />
            </motion.div>
          )}

          {activeTab === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminRolesTab
                staffList={staffList}
                currentStaff={staffRole}
                currentUser={user}
                onRefresh={handleRefreshAll}
              />
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminAuditTab currentStaff={staffRole} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-[#F5F5F0]/10 bg-[#0E0E12] py-4 px-4 sm:px-8 text-center text-xs font-mono-code text-[#64646E] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>MISFITS CLUB RBAC TERMINAL · AUTHORITATIVE FIRESTORE RULES ENGINE</span>
        <span className="text-[#969696]">LOGGED IN AS: {staffRole.email}</span>
      </footer>
    </div>
  );
};
