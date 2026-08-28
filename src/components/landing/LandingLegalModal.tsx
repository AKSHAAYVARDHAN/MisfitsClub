import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Lock, Shield } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms';

interface LandingLegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LandingLegalModal: React.FC<LandingLegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="landing-legal-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#08080A]/85 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <motion.div
            id="landing-legal-modal-content"
            className="relative w-full max-w-3xl max-h-[90vh] bg-[#0E0E12] border border-[#F5F5F0]/15 shadow-2xl flex flex-col overflow-hidden text-[#F5F5F0]"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 sm:p-8 border-b border-[#F5F5F0]/10 bg-[#121217]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-2.5 py-0.5">
                    Legal & Trust
                  </span>
                  <span className="text-xs text-[#969696] font-mono-code uppercase tracking-wider">
                    Official Information
                  </span>
                </div>
                <h2
                  id="legal-modal-title"
                  className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light"
                >
                  {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#969696] font-sans-clean">
                  Clear, human-readable commitments regarding your data and platform participation.
                </p>
              </div>

              <button
                id="legal-modal-close-btn"
                onClick={onClose}
                aria-label="Close legal modal"
                className="p-2 text-[#969696] hover:text-[#F5F5F0] hover:bg-[#1A1A22] border border-transparent hover:border-[#F5F5F0]/10 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 px-6 sm:px-8 py-3 border-b border-[#F5F5F0]/10 bg-[#0E0E12]">
              <button
                id="legal-tab-privacy-btn"
                onClick={() => setActiveTab('privacy')}
                className={`text-xs font-mono-code uppercase tracking-wider px-4 py-1.5 border transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold'
                    : 'bg-[#14141A] text-[#969696] border-[#22222A] hover:text-[#F5F5F0] hover:border-[#383844]'
                }`}
              >
                Privacy Policy
              </button>
              <button
                id="legal-tab-terms-btn"
                onClick={() => setActiveTab('terms')}
                className={`text-xs font-mono-code uppercase tracking-wider px-4 py-1.5 border transition-all ${
                  activeTab === 'terms'
                    ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold'
                    : 'bg-[#14141A] text-[#969696] border-[#22222A] hover:text-[#F5F5F0] hover:border-[#383844]'
                }`}
              >
                Terms of Service
              </button>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-[#D0D0CA] font-sans-clean leading-relaxed">
              <div className="p-3.5 bg-[#14141B] border border-[#22222C] text-xs font-mono-code text-[#969696] flex items-center justify-between">
                <span>STATUS: PUBLIC PLACEHOLDER v1.0</span>
                <span>EFFECTIVE: 2026</span>
              </div>

              {activeTab === 'privacy' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      1. Our Privacy Philosophy
                    </h3>
                    <p className="text-[#969696] text-xs sm:text-sm leading-relaxed">
                      Misfits Club is designed around data minimization. We believe your digital presence should belong to you, not an advertising network or an algorithmic surveillance machine. We collect only what is essential to help you discover like-minded peers and facilitate authentic 1-on-1 connections.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      2. Information We Collect
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#969696]">
                      <li><strong className="text-[#F5F5F0]">Account & Profile Data:</strong> Name/handle, email, avatar, location, bio, reading list, current obsessions, and connection intents you choose to share.</li>
                      <li><strong className="text-[#F5F5F0]">Public Activity:</strong> Questions posted on Spark boards, comments in shared Hubs, and public profile details visible to fellow members.</li>
                      <li><strong className="text-[#F5F5F0]">Direct Communication:</strong> Messages exchanged in intentional 1-on-1 connections are private between conversation participants.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      3. How We Use Information
                    </h3>
                    <p className="text-[#969696] text-xs sm:text-sm leading-relaxed">
                      We use your information exclusively to power discovery on the Orb, recommend relevant Hubs, deliver messages, and maintain platform security. We do <strong className="text-[#F5F5F0]">not</strong> sell, rent, or monetize your personal data with third-party advertisers.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      4. Your Rights and Data Control
                    </h3>
                    <p className="text-[#969696] text-xs sm:text-sm leading-relaxed">
                      You retain full control over your profile and data. You can edit your profile details, update your connection intents, or request account deletion and data export at any time.
                    </p>
                  </div>

                  <div className="p-4 border border-[#1E1E28] bg-[#0A0A0E] text-xs text-[#8E8E93] font-mono-code">
                    Note: This document provides our foundational privacy commitments. Formal legal specifications will continue to be maintained and updated as regulatory requirements evolve.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      1. Acceptance of Terms
                    </h3>
                    <p className="text-[#969696] text-xs sm:text-sm leading-relaxed">
                      By accessing or using Misfits Club, you agree to comply with and be bound by these Terms of Service and our Community Guidelines. If you do not agree with these terms, please do not use the platform.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      2. Intellectual Property & Ownership
                    </h3>
                    <p className="text-[#969696] text-xs sm:text-sm leading-relaxed">
                      You retain 100% ownership of your original ideas, research notes, prototypes, writings, code snippets, and creative assets shared on Misfits Club. You grant Misfits Club only the limited license necessary to host and display your content to other members according to your privacy settings.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      3. Acceptable Use Policy
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#969696]">
                      <li>Do not harass, threaten, impersonate, or abuse other members.</li>
                      <li>Do not post malicious code, conduct unauthorized data scraping, or attempt to breach system security.</li>
                      <li>Do not engage in unsolicited mass commercial outreach, spam, or illicit activities.</li>
                      <li>Respect copyright and intellectual property rights of other creators and researchers.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F0] mb-2 font-editorial text-lg">
                      4. Account Suspension & Termination
                    </h3>
                    <p className="text-[#969696] text-xs sm:text-sm leading-relaxed">
                      We reserve the right to suspend or terminate accounts that violate our Community Guidelines or engage in malicious conduct, in order to preserve the safety and high signal of the community.
                    </p>
                  </div>

                  <div className="p-4 border border-[#1E1E28] bg-[#0A0A0E] text-xs text-[#8E8E93] font-mono-code">
                    Note: This document serves as our current Terms of Service placeholder and outlines core member expectations. It is subject to periodic updates.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-[#F5F5F0]/10 bg-[#121217] flex items-center justify-end">
              <button
                id="legal-modal-done-btn"
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] transition-colors"
              >
                Understood & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
