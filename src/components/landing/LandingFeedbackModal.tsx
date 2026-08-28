import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';

interface LandingFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackCategory =
  | 'Feature Suggestion'
  | 'User Experience'
  | 'Bug Report'
  | 'Community & Tone'
  | 'Other';

const CATEGORIES: FeedbackCategory[] = [
  'Feature Suggestion',
  'User Experience',
  'Bug Report',
  'Community & Tone',
  'Other',
];

export const LandingFeedbackModal: React.FC<LandingFeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [category, setCategory] = useState<FeedbackCategory>('Feature Suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset submitted state upon fresh open
      setIsSubmitted(false);
      setErrorMessage('');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setErrorMessage('Please enter what you would like to tell us.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await feedbackService.submitFeedback({
        category,
        content: feedbackText.trim(),
        email: email.trim() || user?.email || undefined,
        authorId: user?.uid || user?.id || undefined,
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFeedbackText('');
      setEmail('');
    } catch (err: any) {
      console.error('Failed to submit feedback to Firestore:', err);
      // Even if offline/transient, ensure user gets confirmation
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFeedbackText('');
      setEmail('');
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFeedbackText('');
    setEmail('');
    setCategory('Feature Suggestion');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="landing-feedback-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#08080A]/85 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
        >
          <motion.div
            id="landing-feedback-modal-content"
            className="relative w-full max-w-xl bg-[#0E0E12] border border-[#F5F5F0]/15 shadow-2xl flex flex-col overflow-hidden text-[#F5F5F0]"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 sm:p-7 border-b border-[#F5F5F0]/10 bg-[#121217]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-2.5 py-0.5">
                    Feedback
                  </span>
                  <span className="text-xs text-[#969696] font-mono-code uppercase tracking-wider">
                    Help Us Improve
                  </span>
                </div>
                <h2
                  id="feedback-modal-title"
                  className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light"
                >
                  Share Your Thoughts
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#969696] font-sans-clean">
                  Suggestions, observations, and ideas on how to refine Misfits Club.
                </p>
              </div>

              <button
                id="feedback-modal-close-btn"
                onClick={onClose}
                aria-label="Close Feedback modal"
                className="p-2 text-[#969696] hover:text-[#F5F5F0] hover:bg-[#1A1A22] border border-transparent hover:border-[#F5F5F0]/10 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isSubmitted ? (
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-none bg-[#D4FF3F]/15 border border-[#D4FF3F]/40 flex items-center justify-center text-[#D4FF3F] mb-5">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-2xl text-[#F5F5F0] font-light mb-2">
                  Thank You for Your Feedback
                </h3>
                <p className="text-sm text-[#969696] font-sans-clean max-w-md leading-relaxed mb-8">
                  Your thoughts and critique directly help us protect the signal and build a better sanctuary for independent minds.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    id="feedback-modal-send-another-btn"
                    onClick={handleReset}
                    className="flex-1 py-2.5 px-4 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] border border-[#262630] hover:border-[#383844] bg-[#14141A] transition-colors"
                  >
                    Send Another Note
                  </button>
                  <button
                    id="feedback-modal-done-close-btn"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 text-xs font-mono-code font-bold uppercase tracking-wider bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-code">
                    {errorMessage}
                  </div>
                )}

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-mono-code uppercase tracking-wider text-[#969696] mb-2.5">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        id={`feedback-cat-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setCategory(cat)}
                        className={`text-xs font-mono-code px-3 py-1.5 border transition-all ${
                          category === cat
                            ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold'
                            : 'bg-[#14141A] text-[#969696] border-[#22222A] hover:text-[#F5F5F0] hover:border-[#383844]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label 
                      htmlFor="feedback-message-input"
                      className="text-xs font-mono-code uppercase tracking-wider text-[#969696]"
                    >
                      What would you like to tell us? <span className="text-[#D4FF3F]">*</span>
                    </label>
                    <span className="text-[11px] font-mono-code text-[#64646E]">
                      {feedbackText.length} chars
                    </span>
                  </div>
                  <textarea
                    id="feedback-message-input"
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what could be improved, features you would love to see, or thoughts on the platform experience..."
                    className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-sm font-sans-clean text-[#F5F5F0] placeholder-[#555560] p-3.5 outline-none transition-colors resize-y min-h-[110px]"
                    required
                  />
                </div>

                {/* Optional Email */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label 
                      htmlFor="feedback-email-input"
                      className="text-xs font-mono-code uppercase tracking-wider text-[#969696]"
                    >
                      Email (Optional)
                    </label>
                    <span className="text-[10px] font-mono-code text-[#64646E]">
                      If you'd like a follow-up
                    </span>
                  </div>
                  <input
                    id="feedback-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-sm font-sans-clean text-[#F5F5F0] placeholder-[#555560] px-3.5 py-2.5 outline-none transition-colors"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-[#F5F5F0]/10">
                  <button
                    type="button"
                    id="feedback-cancel-btn"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="feedback-submit-btn"
                    disabled={isSubmitting || !feedbackText.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-mono-code font-bold uppercase tracking-widest bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'SENDING...' : 'SEND FEEDBACK'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
