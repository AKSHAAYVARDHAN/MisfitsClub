import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle, Sparkles, Camera, Check } from 'lucide-react';

interface SignUpViewProps {
  onSuccess: (user: UserProfile) => void;
  onNavigateToSignIn: () => void;
  onClose?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
];

export const SignUpView: React.FC<SignUpViewProps> = ({
  onSuccess,
  onNavigateToSignIn,
  onClose,
}) => {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isCustomAvatarOpen, setIsCustomAvatarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Choose a stronger password.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const user = await signUp(name, email, password, avatarUrl);
      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Unable to create profile. Please try again.');
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
        setError(err?.message || 'Google account connection could not be completed.');
      }
    } finally {
      setIsGoogleLoading(false);
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
              INVITATION & ACCESS
            </span>
          </div>
          <span className="text-[10px] font-mono-code text-[#8A8A8A] uppercase tracking-wider">
            STEP 0 / 4
          </span>
        </div>

        {/* Headline & Supporting Text */}
        <div className="mb-8 text-left">
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#F2F2ED] font-light tracking-tight mb-2">
            WELCOME TO THE CLUB.
          </h1>
          <p className="text-xs sm:text-sm text-[#8A8A8A] font-sans-clean leading-relaxed">
            “Let's find people worth talking to.”
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
              Full Name or Moniker
            </label>
            <input
              id="signup-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maya Lindqvist"
              className="w-full bg-[#121212] border border-[#242424] px-4 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none transition-colors font-sans-clean"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
              Email Address
            </label>
            <input
              id="signup-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maya@example.com"
              className="w-full bg-[#121212] border border-[#242424] px-4 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none transition-colors font-sans-clean"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
              Password
            </label>
            <input
              id="signup-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-[#121212] border border-[#242424] px-4 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none transition-colors font-sans-clean"
            />
          </div>

          {/* Optional Profile Photo Selector */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A]">
                Profile Image (Optional)
              </label>
              <button
                type="button"
                onClick={() => setIsCustomAvatarOpen(!isCustomAvatarOpen)}
                className="text-[10px] font-mono-code text-[#8A8A8A] hover:text-[#D4FF3F] uppercase tracking-wider"
              >
                {isCustomAvatarOpen ? 'USE PRESET' : 'CUSTOM URL'}
              </button>
            </div>

            {isCustomAvatarOpen ? (
              <input
                type="url"
                value={customAvatarInput}
                onChange={(e) => {
                  setCustomAvatarInput(e.target.value);
                  if (e.target.value.startsWith('http')) {
                    setAvatarUrl(e.target.value);
                  }
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#121212] border border-[#242424] px-3 py-2 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-9 h-9 rounded-sm overflow-hidden border transition-all relative ${
                      avatarUrl === url
                        ? 'border-[#D4FF3F] ring-1 ring-[#D4FF3F]'
                        : 'border-[#242424] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            id="signup-submit-btn"
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-[#D4FF3F] text-[#080808] py-3.5 px-4 text-xs font-bold font-mono-code uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6 shadow-md"
          >
            {isLoading ? (
              <span>CREATING ACCOUNT...</span>
            ) : (
              <>
                <span>CREATE MY PROFILE →</span>
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

        {/* Google Sign Up */}
        <button
          id="signup-google-btn"
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

        {/* Bottom Switch to Sign In */}
        <div className="mt-8 pt-4 border-t border-[#242424] text-center">
          <p className="text-xs text-[#8A8A8A] font-sans-clean">
            Already have an account?{' '}
            <button
              id="switch-to-signin-btn"
              type="button"
              onClick={onNavigateToSignIn}
              className="text-[#D4FF3F] font-mono-code font-bold uppercase tracking-wider hover:underline ml-1"
            >
              SIGN IN →
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
