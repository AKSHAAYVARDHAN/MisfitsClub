import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { LandingFaqModal } from './LandingFaqModal';
import { LandingFeedbackModal } from './LandingFeedbackModal';
import { LandingContactModal } from './LandingContactModal';
import { LandingGuidelinesModal } from './LandingGuidelinesModal';
import { LandingLegalModal, LegalTab } from './LandingLegalModal';

export interface LandingFooterProps {
  onStartOnboarding: () => void;
  onEnterOrb: () => void;
  onExplore: () => void;
  onSignIn?: () => void;
  onScrollToTop: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onStartOnboarding,
  onEnterOrb,
  onExplore,
  onSignIn,
  onScrollToTop,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Modal dialog states for landing information architecture
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');

  // Smooth scroll handler for landing page sections
  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onExplore();
    }
  };

  const handleOpenPrivacy = () => {
    setLegalTab('privacy');
    setIsLegalOpen(true);
  };

  const handleOpenTerms = () => {
    setLegalTab('terms');
    setIsLegalOpen(true);
  };

  return (
    <>
      <footer 
        id="landing-footer"
        className="border-t border-[#F5F5F0]/10 bg-[#08080A] text-[#F5F5F0] relative overflow-hidden"
      >
        <motion.div 
          className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-16 sm:pt-20 pb-12 sm:pb-16"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Main Footer Grid: 4 Distinct Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-8 pb-14 sm:pb-16 border-b border-[#F5F5F0]/10">
            
            {/* COLUMN 1: Brand & Manifesto (lg: span 5) */}
            <div className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-8">
              <span className="text-xl font-black text-[#F5F5F0] tracking-tighter uppercase font-sans-clean mb-3">
                MISFITS CLUB
              </span>
              
              <p className="text-sm text-[#969696] font-sans-clean leading-relaxed max-w-sm mb-5">
                For the curious, unconventional, and obsessed. A quiet global sanctuary for deep conversations, collaborative building, and exchange of ideas.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono-code text-[#969696] uppercase tracking-wider mb-6">
                <span>Not Networking.</span>
                <span className="text-[#64646E]">·</span>
                <span>Not Dating.</span>
                <span className="text-[#64646E]">·</span>
                <span className="text-[#D4FF3F] font-bold">Just Humans.</span>
              </div>

              <div className="inline-flex items-center gap-2 text-xs font-mono-code text-[#64646E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                <span>Curiosity over credentials · Global</span>
              </div>
            </div>

            {/* COLUMN 2: Explore Navigation (lg: span 2) */}
            <div className="lg:col-span-2 flex flex-col items-start">
              <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-[#D4FF3F] mb-4 sm:mb-5">
                EXPLORE
              </span>
              <ul className="space-y-3 font-mono-code text-xs text-[#969696] uppercase tracking-wider">
                <li>
                  <button
                    id="footer-link-discover"
                    onClick={() => handleScrollToSection('discover-section')}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Discover
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-spark"
                    onClick={() => handleScrollToSection('spark-section')}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Spark
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-hub"
                    onClick={() => handleScrollToSection('hub-section')}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Hub
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-connections"
                    onClick={() => handleScrollToSection('people-section')}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Connections
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: Community & Help (lg: span 3) */}
            <div className="lg:col-span-3 flex flex-col items-start">
              <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-[#D4FF3F] mb-4 sm:mb-5">
                COMMUNITY
              </span>
              <ul className="space-y-3 font-mono-code text-xs text-[#969696] uppercase tracking-wider">
                <li>
                  <button
                    id="footer-link-faq"
                    onClick={() => setIsFaqOpen(true)}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-feedback"
                    onClick={() => setIsFeedbackOpen(true)}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Feedback
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-contact"
                    onClick={() => setIsContactOpen(true)}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-guidelines"
                    onClick={() => setIsGuidelinesOpen(true)}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Community Guidelines
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: Legal & Policy (lg: span 2) */}
            <div className="lg:col-span-2 flex flex-col items-start">
              <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-[#D4FF3F] mb-4 sm:mb-5">
                LEGAL
              </span>
              <ul className="space-y-3 font-mono-code text-xs text-[#969696] uppercase tracking-wider">
                <li>
                  <button
                    id="footer-link-privacy"
                    onClick={handleOpenPrivacy}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-terms"
                    onClick={handleOpenTerms}
                    className="hover:text-[#D4FF3F] transition-colors py-1 inline-flex items-center min-h-[32px] sm:min-h-[28px] focus:outline-none focus:text-[#D4FF3F]"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar: Copyright & Back to Top */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-code text-[#969696]">
            <div className="flex items-center gap-2">
              <span>© 2026 Misfits Club</span>
              <span className="text-[#64646E] hidden sm:inline">·</span>
              <span className="text-[#64646E] hidden sm:inline">All rights reserved</span>
            </div>

            <button
              id="footer-scroll-to-top-btn"
              onClick={onScrollToTop}
              className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-[#969696] hover:text-[#D4FF3F] transition-colors focus:outline-none py-1.5 px-2 hover:bg-[#121217] border border-transparent hover:border-[#F5F5F0]/10"
              aria-label="Scroll to top of page"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#D4FF3F]" />
            </button>
          </div>
        </motion.div>
      </footer>

      {/* Landing Page Modals & Information Architecture Drawers */}
      <LandingFaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        onStartOnboarding={onStartOnboarding}
      />

      <LandingFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <LandingContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <LandingGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
        onStartOnboarding={onStartOnboarding}
      />

      <LandingLegalModal
        isOpen={isLegalOpen}
        initialTab={legalTab}
        onClose={() => setIsLegalOpen(false)}
      />
    </>
  );
};
