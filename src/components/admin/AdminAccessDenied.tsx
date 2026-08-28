import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut, ArrowLeft, Key, Lock, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminAccessDeniedProps {
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onReturnToApp: () => void;
  onRoleGranted: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  user,
  onSignIn,
  onSignOut,
  onReturnToApp,
  onRoleGranted,
}) => {
  const [isClaiming, setIsClaiming] = React.useState(false);
  const [claimSuccess, setClaimSuccess] = React.useState(false);

  const handleBootstrapOwner = async () => {
    if (!user) {
      onSignIn();
      return;
    }
    setIsClaiming(true);
    try {
      await adminService.bootstrapOwner(user);
      setClaimSuccess(true);
      setTimeout(() => {
        onRoleGranted();
      }, 700);
    } catch (e) {
      console.error(e);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-[#F5F5F0] flex flex-col justify-between p-6 sm:p-10 font-sans-clean selection:bg-[#D4FF3F] selection:text-[#08080A]">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-[#F5F5F0]/10">
        <div className="flex items-center gap-3">
          <span className="font-mono-code text-xs uppercase tracking-widest text-[#D4FF3F] font-bold">
            MISFITS CLUB
          </span>
          <span className="text-xs text-[#64646E] font-mono-code">/</span>
          <span className="text-xs text-[#969696] font-mono-code uppercase">
            SECURITY GATEWAY
          </span>
        </div>
        <button
          onClick={onReturnToApp}
          className="inline-flex items-center gap-2 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#D4FF3F] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Sanctuary</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0E0E12] border border-[#F5F5F0]/15 p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Top Status Banner */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-red-400 font-bold block">
                RESTRICTED AREA (403)
              </span>
              <h1 className="text-2xl font-editorial text-[#F5F5F0] font-light">
                Access Denied
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#969696] leading-relaxed mb-6">
            The Misfits Club Admin area is strictly isolated and restricted to authorized team members, moderators, and support personnel.
          </p>

          {/* User Session Info Card */}
          <div className="bg-[#121217] border border-[#22222A] p-4 mb-6 text-xs font-mono-code space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-[#64646E] mb-2 font-bold">
              Current Session Context
            </div>
            {user ? (
              <>
                <div className="flex justify-between">
                  <span className="text-[#969696]">Authenticated Account:</span>
                  <span className="text-[#F5F5F0] font-medium truncate max-w-[200px]">{user.email || user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#969696]">Identifier:</span>
                  <span className="text-[#64646E]">{user.uid?.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#969696]">Access Level:</span>
                  <span className="text-amber-400 font-bold uppercase">STANDARD MEMBER</span>
                </div>
              </>
            ) : (
              <div className="text-amber-400">
                No active staff session. Please authenticate with your authorized team credentials.
              </div>
            )}
          </div>

          {claimSuccess && (
            <div className="mb-6 p-4 bg-[#D4FF3F]/15 border border-[#D4FF3F]/40 text-[#D4FF3F] text-xs font-mono-code flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Owner privileges provisioned. Redirecting to Terminal...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!user ? (
              <button
                onClick={onSignIn}
                className="w-full py-3 px-4 bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] text-xs font-mono-code font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Sign In as Staff</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={onReturnToApp}
                  className="py-3 px-4 bg-[#14141A] hover:bg-[#1A1A24] border border-[#262630] text-xs font-mono-code uppercase tracking-wider text-[#F5F5F0] transition-colors"
                >
                  Return to App
                </button>
                <button
                  onClick={onSignOut}
                  className="py-3 px-4 bg-[#14141A] hover:bg-red-500/10 border border-[#262630] hover:border-red-500/30 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-red-400 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account</span>
                </button>
              </div>
            )}

            {/* Development / Provisioning Fallback for Developer / First Turn Owner */}
            {user && (
              <div className="pt-4 border-t border-[#F5F5F0]/10 text-center">
                <button
                  onClick={handleBootstrapOwner}
                  disabled={isClaiming}
                  className="text-[11px] font-mono-code text-[#64646E] hover:text-[#D4FF3F] underline tracking-wider transition-colors"
                >
                  {isClaiming ? 'Initializing privileges...' : 'Claim / Initialize Owner Privileges for this account'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs font-mono-code text-[#64646E] py-4">
        <span>© 2026 Misfits Club · Authoritative RBAC Enforcement Engine</span>
      </footer>
    </div>
  );
};
