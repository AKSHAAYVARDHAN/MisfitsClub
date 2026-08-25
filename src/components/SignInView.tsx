import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { ArrowRight, Sparkles, Check, AlertCircle, KeyRound, Globe } from 'lucide-react';

interface SignInViewProps {
  onSuccess: (user: UserProfile) => void;
  onNavigateToSignUp: () => void;
  onClose?: () => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onClose,
}) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email or member handle');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const user = await signIn(email, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
    } catch (err: any) {
      if (err?.message !== 'Sign-in cancelled.') {
        setError(err?.message || 'Google Sign-In could not be completed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    await authService.forgotPassword(forgotEmail);
    setForgotSent(true);
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsLoading(true);
    try {
      const user = await signIn(demoEmail, 'password123');
      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 py-12 bg-[#080808] text-[#F2F2ED] selection:bg-[#D4FF3F] selection:text-[#080808]">
      <div className="w-full max-w-md bg-[#0B0B0B] border border-[#242424] p-6 sm:p-10 shadow-2xl relative">
        
        {/* Top subtle badge */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#242424]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A]">
              MEMBER ACCESS
            </span>
          </div>
          <span className="text-[10px] font-mono-code text-[#8A8A8A] uppercase tracking-wider">
            MISFITS CLUB
          </span>
        </div>

        {/* Headline & Supporting Text */}
        <div className="mb-8 text-left">
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#F2F2ED] font-light tracking-tight mb-2">
            WELCOME BACK, MISFIT.
          </h1>
          <p className="text-xs sm:text-sm text-[#8A8A8A] font-sans-clean leading-relaxed">
            “Your people are out there.”
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
              Email or Member Handle
            </label>
            <input
              id="signin-email-input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@misfits.club or @alex"
              className="w-full bg-[#121212] border border-[#242424] px-4 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none transition-colors font-sans-clean"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[10px] font-mono-code uppercase tracking-wider text-[#8A8A8A] hover:text-[#D4FF3F] transition-colors"
              >
                FORGOT PASSWORD?
              </button>
            </div>
            <input
              id="signin-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#121212] border border-[#242424] px-4 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none transition-colors font-sans-clean"
            />
          </div>

          {/* Primary Action Button */}
          <button
            id="signin-submit-btn"
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-[#D4FF3F] text-[#080808] py-3.5 px-4 text-xs font-bold font-mono-code uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6 shadow-md"
          >
            {isLoading ? (
              <span>ENTERING THE CLUB...</span>
            ) : (
              <>
                <span>SIGN IN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[#242424]" />
          <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A]">
            OR
          </span>
          <div className="flex-1 h-[1px] bg-[#242424]" />
        </div>

        {/* Google Sign In */}
        <button
          id="signin-google-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-[#141414] hover:bg-[#1C1C1C] border border-[#242424] hover:border-[#383838] py-3 px-4 text-xs text-[#F2F2ED] font-mono-code uppercase tracking-wider transition-colors flex items-center justify-center gap-2.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>{isGoogleLoading ? 'Connecting...' : 'CONTINUE WITH GOOGLE'}</span>
        </button>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-[#1C1C1C]">
          <span className="block text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-2.5">
            Instant Demo Profiles:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('maya@misfits.club')}
              className="px-2.5 py-1.5 bg-[#101010] border border-[#242424] text-[10px] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#D4FF3F]/50 transition-colors text-left truncate font-mono-code"
            >
              Maya · Storyteller
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('alex@misfits.club')}
              className="px-2.5 py-1.5 bg-[#101010] border border-[#242424] text-[10px] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#D4FF3F]/50 transition-colors text-left truncate font-mono-code"
            >
              Alex · AI Hacker
            </button>
          </div>
        </div>

        {/* Bottom Switch to Sign Up */}
        <div className="mt-8 pt-4 border-t border-[#242424] text-center">
          <p className="text-xs text-[#8A8A8A] font-sans-clean">
            New here?{' '}
            <button
              id="switch-to-signup-btn"
              type="button"
              onClick={onNavigateToSignUp}
              className="text-[#D4FF3F] font-mono-code font-bold uppercase tracking-wider hover:underline ml-1"
            >
              JOIN MISFITS CLUB →
            </button>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0B] border border-[#242424] max-w-sm w-full p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F]">
                PASSWORD RESET
              </span>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSent(false);
                }}
                className="text-xs text-[#8A8A8A] hover:text-[#F2F2ED]"
              >
                ✕
              </button>
            </div>

            {forgotSent ? (
              <div className="py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#141414] border border-[#D4FF3F]/40 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-4 h-4 text-[#D4FF3F]" />
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#F2F2ED] mb-1">
                  RESET LINK SENT
                </h4>
                <p className="text-xs text-[#8A8A8A] font-sans-clean leading-relaxed">
                  We sent instructions to <strong className="text-[#F2F2ED]">{forgotEmail}</strong>.
                </p>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="mt-5 w-full bg-[#F2F2ED] text-[#080808] py-2 text-xs font-mono-code font-bold uppercase tracking-wider hover:bg-[#D4FF3F]"
                >
                  CLOSE
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-[#8A8A8A] font-sans-clean leading-relaxed">
                  Enter your email address to receive password recovery instructions.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-[#121212] border border-[#242424] px-3.5 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 border border-[#242424] py-2 text-xs font-mono-code uppercase tracking-wider text-[#8A8A8A] hover:text-[#F2F2ED]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#D4FF3F] text-[#080808] py-2 text-xs font-mono-code font-bold uppercase tracking-wider hover:bg-[#F2F2ED]"
                  >
                    SEND LINK
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
