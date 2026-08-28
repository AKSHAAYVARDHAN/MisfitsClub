import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { contactService } from '../../services/contactService';
import { useAuth } from '../../context/AuthContext';

interface LandingContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LandingContactModal: React.FC<LandingContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
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
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await contactService.submitContactMessage({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        authorId: user?.uid || user?.id || undefined,
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Failed to submit contact message to Firestore:', err);
      setIsSubmitting(false);
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="landing-contact-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#08080A]/85 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
        >
          <motion.div
            id="landing-contact-modal-content"
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
                    Contact
                  </span>
                  <span className="text-xs text-[#969696] font-mono-code uppercase tracking-wider">
                    Direct Inquiry
                  </span>
                </div>
                <h2
                  id="contact-modal-title"
                  className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light"
                >
                  Contact Misfits Club
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#969696] font-sans-clean">
                  Direct communication with the team for partnerships, press, or platform questions.
                </p>
              </div>

              <button
                id="contact-modal-close-btn"
                onClick={onClose}
                aria-label="Close Contact modal"
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
                  Message Received
                </h3>
                <p className="text-sm text-[#969696] font-sans-clean max-w-md leading-relaxed mb-8">
                  The Misfits Club team has received your communication and will get back to you shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    id="contact-modal-send-another-btn"
                    onClick={handleReset}
                    className="flex-1 py-2.5 px-4 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] border border-[#262630] hover:border-[#383844] bg-[#14141A] transition-colors"
                  >
                    Send Another
                  </button>
                  <button
                    id="contact-modal-done-close-btn"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 text-xs font-mono-code font-bold uppercase tracking-wider bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-code">
                    {errorMessage}
                  </div>
                )}

                {/* Name & Email Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="contact-name-input"
                      className="block text-xs font-mono-code uppercase tracking-wider text-[#969696] mb-1.5"
                    >
                      Name <span className="text-[#D4FF3F]">*</span>
                    </label>
                    <input
                      id="contact-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-sm font-sans-clean text-[#F5F5F0] placeholder-[#555560] px-3.5 py-2.5 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label 
                      htmlFor="contact-email-input"
                      className="block text-xs font-mono-code uppercase tracking-wider text-[#969696] mb-1.5"
                    >
                      Email <span className="text-[#D4FF3F]">*</span>
                    </label>
                    <input
                      id="contact-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-sm font-sans-clean text-[#F5F5F0] placeholder-[#555560] px-3.5 py-2.5 outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="contact-message-input"
                      className="text-xs font-mono-code uppercase tracking-wider text-[#969696]"
                    >
                      Message <span className="text-[#D4FF3F]">*</span>
                    </label>
                    <span className="text-[11px] font-mono-code text-[#64646E]">
                      {message.length} chars
                    </span>
                  </div>
                  <textarea
                    id="contact-message-input"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist you?"
                    className="w-full bg-[#0A0A0E] border border-[#262630] focus:border-[#D4FF3F]/60 text-sm font-sans-clean text-[#F5F5F0] placeholder-[#555560] p-3.5 outline-none transition-colors resize-y min-h-[110px]"
                    required
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-[#F5F5F0]/10">
                  <button
                    type="button"
                    id="contact-cancel-btn"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="contact-submit-btn"
                    disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-mono-code font-bold uppercase tracking-widest bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
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
