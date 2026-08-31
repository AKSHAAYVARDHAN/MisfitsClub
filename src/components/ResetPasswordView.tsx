import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ArrowLeft,
  Mail,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { authService, getFriendlyAuthErrorMessage } from '../services/authService';

interface ResetPasswordViewProps {
  onNavigateToSignIn: () => void;
  onClose?: () => void;
}

type ResetState = 'verifying' | 'form' | 'success' | 'invalid_code' | 'request_link';

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onNavigateToSignIn,
  onClose,
}) => {
  const [resetState, setResetState] = useState<ResetState>('verifying');
  const [oobCode, setOobCode] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');
  
  // Form fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Direct request fields
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract query parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('oobCode') || '';
    const mode = searchParams.get('mode') || 'resetPassword';

    if (mode === 'resetPassword' && code) {
      setOobCode(code);
      setResetState('verifying');
      
      // Authoritatively verify the reset code with Firebase Auth
      authService.verifyResetCode(code)
        .then((email) => {
          setAccountEmail(email);
          setResetState('form');
          setErrorMessage(null);
        })
        .catch((err) => {
          setResetState('invalid_code');
          setErrorMessage(err?.message || 'This password reset link is invalid or has already been used.');
        });
    } else if (code && (mode === 'verifyEmail' || mode === 'recoverEmail')) {
      // Handle alternative Firebase email action codes gracefully
      setOobCode(code);
      setResetState('verifying');
      authService.applyAction(code)
        .then(() => {
          setResetState('success');
          setErrorMessage(null);
        })
        .catch((err) => {
          setResetState('invalid_code');
          setErrorMessage(err?.message || 'This verification link is invalid or has expired.');
        });
    } else {
      // No code provided in URL: show standard reset request view
      setResetState('request_link');
    }
  }, []);

  // Handle password change submission
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Choose a stronger password (minimum 6 characters).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmReset(oobCode, newPassword);
      setResetState('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle requesting a new reset link
  const handleRequestResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail || !requestEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authService.forgotPassword(requestEmail.trim());
      setRequestSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send reset email. Please verify your address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#080808]">
      <div className="w-full max-w-md bg-[#0A0A0B] border border-[#242424] p-6 sm:p-8 relative shadow-2xl">
        
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f10_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f10_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Header Branding */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 text-[#D4FF3F] text-[10px] font-mono-code uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>SECURITY PORTAL</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-[#8A8A8A] hover:text-[#F2F2ED] text-xs font-mono-code transition-colors"
              >
                [ESC]
              </button>
            )}
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold font-mono-code uppercase tracking-wider text-[#F2F2ED]">
            {resetState === 'success' ? 'Password Updated' : 'Reset Password'}
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-1 font-sans-clean">
            {resetState === 'form' && 'Set a new secure password for your Misfits Club account.'}
            {resetState === 'verifying' && 'Verifying secure one-time authorization code...'}
            {resetState === 'success' && 'Your account security credentials have been updated.'}
            {resetState === 'invalid_code' && 'The password reset link cannot be used.'}
            {resetState === 'request_link' && 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="relative mb-6 p-3 bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-sans-clean leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* 1. VERIFYING CODE STATE */}
        {resetState === 'verifying' && (
          <div className="relative py-12 flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#D4FF3F] animate-spin" />
            <div>
              <p className="text-xs font-mono-code text-[#F2F2ED] uppercase tracking-widest">
                VERIFYING RESET LINK
              </p>
              <p className="text-[11px] text-[#8A8A8A] mt-1 font-sans-clean">
                Connecting to Firebase security authority...
              </p>
            </div>
          </div>
        )}

        {/* 2. PASSWORD FORM STATE */}
        {resetState === 'form' && (
          <form onSubmit={handleConfirmReset} className="relative space-y-5">
            {/* Account Email Badge */}
            {accountEmail && (
              <div className="p-3 bg-[#121214] border border-[#242424] flex items-center justify-between">
                <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#8A8A8A]">
                  Account:
                </span>
                <span className="text-xs font-mono-code text-[#D4FF3F] truncate max-w-[220px]">
                  {accountEmail}
                </span>
              </div>
            )}

            {/* New Password Input */}
            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#8A8A8A] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#0B0B0C] border border-[#242424] focus:border-[#D4FF3F] text-[#F2F2ED] px-4 py-3 text-xs tracking-wide focus:outline-none transition-colors font-sans-clean pr-10"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#F2F2ED] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#8A8A8A] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#0B0B0C] border border-[#242424] focus:border-[#D4FF3F] text-[#F2F2ED] px-4 py-3 text-xs tracking-wide focus:outline-none transition-colors font-sans-clean pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#F2F2ED] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="confirm-password-reset-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D4FF3F] text-[#080808] py-3 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {isLoading ? (
                <span>UPDATING CREDENTIALS...</span>
              ) : (
                <>
                  <span>CONFIRM & SAVE PASSWORD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. SUCCESS STATE */}
        {resetState === 'success' && (
          <div className="relative space-y-6 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 flex items-center justify-center mx-auto text-[#D4FF3F]">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-mono-code uppercase tracking-wider text-[#F2F2ED]">
                PASSWORD CHANGED
              </h2>
              <p className="text-xs text-[#8A8A8A] font-sans-clean max-w-sm mx-auto leading-relaxed">
                Your Misfits Club password has been securely updated. You can now sign in using your new password.
              </p>
            </div>

            <button
              id="return-to-signin-btn"
              type="button"
              onClick={onNavigateToSignIn}
              className="w-full bg-[#D4FF3F] text-[#080808] py-3 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <span>PROCEED TO SIGN IN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4. INVALID / EXPIRED CODE STATE */}
        {resetState === 'invalid_code' && (
          <div className="relative space-y-6">
            <div className="p-4 bg-[#121214] border border-[#242424] space-y-2">
              <p className="text-xs font-mono-code uppercase tracking-wider text-amber-400">
                Action Link Expired or Used
              </p>
              <p className="text-xs text-[#8A8A8A] font-sans-clean leading-relaxed">
                For security reasons, password reset links can only be used once and expire shortly after delivery.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setResetState('request_link');
                  setErrorMessage(null);
                }}
                className="w-full bg-[#D4FF3F] text-[#080808] py-3 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>REQUEST NEW RESET LINK</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToSignIn}
                className="w-full bg-[#121214] border border-[#242424] text-[#F2F2ED] py-2.5 text-xs font-mono-code uppercase tracking-wider hover:border-[#D4FF3F]/50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>RETURN TO SIGN IN</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. REQUEST NEW RESET LINK STATE */}
        {resetState === 'request_link' && (
          <div className="relative space-y-5">
            {requestSuccess ? (
              <div className="space-y-5 text-center py-3">
                <div className="w-10 h-10 rounded-full bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 flex items-center justify-center mx-auto text-[#D4FF3F]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-mono-code uppercase tracking-wider text-[#F2F2ED]">
                    RESET EMAIL DISPATCHED
                  </p>
                  <p className="text-xs text-[#8A8A8A] font-sans-clean leading-relaxed">
                    If an account exists for <span className="text-[#D4FF3F] font-mono-code">{requestEmail}</span>, instructions have been sent. Please check your inbox.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="w-full bg-[#121214] border border-[#242424] text-[#F2F2ED] py-2.5 text-xs font-mono-code uppercase tracking-wider hover:border-[#D4FF3F]/50 transition-colors"
                >
                  RETURN TO SIGN IN
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestResetLink} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[#8A8A8A] mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => {
                      setRequestEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="you@domain.com"
                    className="w-full bg-[#0B0B0C] border border-[#242424] focus:border-[#D4FF3F] text-[#F2F2ED] px-4 py-3 text-xs tracking-wide focus:outline-none transition-colors font-sans-clean"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#D4FF3F] text-[#080808] py-3 text-xs font-mono-code font-bold uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>SENDING...</span>
                  ) : (
                    <>
                      <span>SEND PASSWORD RESET LINK</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onNavigateToSignIn}
                    className="text-xs text-[#8A8A8A] hover:text-[#D4FF3F] font-mono-code transition-colors"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
