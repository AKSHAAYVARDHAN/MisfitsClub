import React, { useState } from 'react';
import { UserProfile } from '../types';
import { SAMPLE_PROFILES, INITIAL_USER } from '../data/mockData';
import { X, ArrowRight, KeyRound, Check, Sparkles, User, Mail, ShieldCheck } from 'lucide-react';

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
  const [authMethod, setAuthMethod] = useState<'handle' | 'email'>('handle');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setErrorMessage('Please enter your handle or email.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Look for a matching profile or default to a restored profile
      const cleanInput = inputValue.trim().toLowerCase().replace('@', '');
      const matched = SAMPLE_PROFILES.find(
        (p) =>
          p.handle.toLowerCase() === cleanInput ||
          p.name.toLowerCase().includes(cleanInput)
      );

      const userToLogin: UserProfile = matched || {
        ...INITIAL_USER,
        name: inputValue.includes('@') ? inputValue.split('@')[0] : inputValue,
        handle: cleanInput,
      };

      setSuccessMessage(`Welcome back, ${userToLogin.name.split(' ')[0]}.`);
      setTimeout(() => {
        onSuccess(userToLogin);
        onClose();
      }, 700);
    }, 600);
  };

  const handleQuickSelect = (profile: UserProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`Signed in as ${profile.name.split(' ')[0]}.`);
      setTimeout(() => {
        onSuccess(profile);
        onClose();
      }, 500);
    }, 400);
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

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="flex gap-2 border-b border-[#F5F5F0]/10 pb-2">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('handle');
                setErrorMessage(null);
              }}
              className={`text-[11px] uppercase tracking-wider pb-1 transition-colors ${
                authMethod === 'handle'
                  ? 'text-[#F5F5F0] border-b-2 border-[#D4FF3F] font-bold'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              Member Handle
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setErrorMessage(null);
              }}
              className={`text-[11px] uppercase tracking-wider pb-1 transition-colors ${
                authMethod === 'email'
                  ? 'text-[#F5F5F0] border-b-2 border-[#D4FF3F] font-bold'
                  : 'text-[#969696] hover:text-[#F5F5F0]'
              }`}
            >
              Magic Link / Email
            </button>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono-code text-[#969696] tracking-wider mb-2">
              {authMethod === 'handle' ? 'Handle or Username' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                id="auth-input-field"
                type={authMethod === 'email' ? 'email' : 'text'}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={authMethod === 'handle' ? '@alex, @maya, or your handle' : 'you@domain.com'}
                className="w-full bg-[#0B0B0C] border border-[#F5F5F0]/20 focus:border-[#D4FF3F] text-[#F5F5F0] px-3.5 py-3 text-xs tracking-wide focus:outline-none transition-colors"
                autoFocus
              />
            </div>
            {errorMessage && (
              <p className="text-[11px] text-red-400 mt-1.5 font-mono-code">{errorMessage}</p>
            )}
          </div>

          {/* Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F5F5F0] text-[#0B0B0C] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
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

          {successMessage && (
            <div className="flex items-center gap-2 text-[#D4FF3F] text-xs font-mono-code bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 p-2.5">
              <Check className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-[#F5F5F0]/10">
          <span className="block text-[10px] uppercase font-mono-code text-[#969696] tracking-wider mb-2.5">
            Quick demo profiles
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[INITIAL_USER, SAMPLE_PROFILES[0]].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleQuickSelect(p)}
                className="flex items-center gap-2 p-2 border border-[#F5F5F0]/10 bg-[#0B0B0C]/60 hover:border-[#D4FF3F]/50 text-left transition-colors group"
              >
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 object-cover"
                />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-medium text-[#F5F5F0] group-hover:text-[#D4FF3F] truncate">
                    {p.name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-[#969696] font-mono-code truncate">
                    @{p.handle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-[#969696]">
          Don't have a profile yet?{' '}
          <button
            id="auth-switch-to-onboarding"
            type="button"
            onClick={() => {
              onClose();
              onOpenOnboarding();
            }}
            className="text-[#F5F5F0] hover:text-[#D4FF3F] underline underline-offset-4 font-medium transition-colors"
          >
            Create your card
          </button>
        </div>

      </div>
    </div>
  );
};
