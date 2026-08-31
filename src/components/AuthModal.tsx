import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, ArrowRight, Check, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onOpenOnboarding: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenOnboarding,
}) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email or handle.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const user = await signIn(email, password);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      if (err?.message !== 'Sign-in cancelled.') {
        setErrorMessage(err?.message || 'Google Sign-In failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0C]/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#151516] border border-[#F5F5F0]/15 p-6 sm:p-8 text-[#F5F5F0] shadow-2xl">
        
        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#969696] hover:text-[#F5F5F0] transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]"></span>
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#D4FF3F]">
              MEMBER ACCESS
            </span>
          </div>
          <h2 className="font-editorial text-3xl font-light text-[#F5F5F0]">
            Sign in to Misfits Club
          </h2>
          <p className="text-xs text-[#969696] mt-1.5 leading-relaxed font-sans-clean">
            Return to your global circle of thinkers, ongoing dialogues, and live 3D coordinates.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-sans-clean">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-mono-code text-[#969696] tracking-wider mb-1.5">
              Email or Member Handle
            </label>
            <input
              id="auth-modal-email-input"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="you@domain.com or @handle"
              className="w-full bg-[#0B0B0C] border border-[#F5F5F0]/20 focus:border-[#D4FF3F] text-[#F5F5F0] px-3.5 py-2.5 text-xs tracking-wide focus:outline-none transition-colors font-sans-clean"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono-code text-[#969696] tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="auth-modal-password-input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="••••••••••••"
              className="w-full bg-[#0B0B0C] border border-[#F5F5F0]/20 focus:border-[#D4FF3F] text-[#F5F5F0] px-3.5 py-2.5 text-xs tracking-wide focus:outline-none transition-colors font-sans-clean"
            />
          </div>

          {/* Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-[#D4FF3F] text-[#0B0B0C] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#F5F5F0] transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 font-mono-code shadow-md"
          >
            {isLoading ? (
              <span className="font-mono-code text-[11px]">AUTHENTICATING...</span>
            ) : (
              <>
                <span>SIGN IN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[#F5F5F0]/10" />
          <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#969696]">
            OR
          </span>
          <div className="flex-1 h-[1px] bg-[#F5F5F0]/10" />
        </div>

        {/* Google Sign In */}
        <button
          id="auth-modal-google-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-[#0B0B0C] hover:bg-[#1A1A1B] border border-[#F5F5F0]/20 hover:border-[#F5F5F0]/40 py-2.5 px-4 text-xs text-[#F5F5F0] font-mono-code uppercase tracking-wider transition-colors flex items-center justify-center gap-2.5"
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

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-[#969696]">
          Don't have an account yet?{' '}
          <button
            id="auth-switch-to-onboarding"
            type="button"
            onClick={() => {
              onClose();
              onOpenOnboarding();
            }}
            className="text-[#D4FF3F] hover:underline font-mono-code font-bold uppercase tracking-wider transition-colors ml-1"
          >
            JOIN MISFITS CLUB →
          </button>
        </div>

      </div>
    </div>
  );
};

