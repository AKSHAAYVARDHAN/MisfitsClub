import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Heart, Sparkles, MessageSquare, AlertTriangle, Users, Compass } from 'lucide-react';

interface LandingGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnboarding?: () => void;
}

interface GuidelinePrinciple {
  number: string;
  title: string;
  desc: string;
  detail: string;
}

const PRINCIPLES: GuidelinePrinciple[] = [
  {
    number: '01',
    title: 'Be Respectful',
    desc: 'Treat fellow thinkers and builders with intellectual honesty and human empathy.',
    detail:
      'We welcome intense debate and opposing perspectives. Disagree with hypotheses, experiments, and arguments rigorously—never attack or demean the human behind them.',
  },
  {
    number: '02',
    title: 'Engage Thoughtfully',
    desc: 'Prioritize depth, nuance, and curiosity over reactionary soundbites.',
    detail:
      'Misfits Club is intentionally unhurried. Take time to read before responding, ask clarifying questions, and contribute high-signal observations rather than performative cynicism.',
  },
  {
    number: '03',
    title: 'No Harassment or Hostility',
    desc: 'Zero tolerance for bullying, discrimination, intimidation, or hate.',
    detail:
      'Any targeted harassment, hate speech, threats, unwanted sexual advances, or toxic behavior in public discussions or direct messages will result in immediate and permanent account termination.',
  },
  {
    number: '04',
    title: 'No Spam or Unsolicited Pitching',
    desc: 'Misfits Club is a sanctuary for craft, not an outbound sales channel.',
    detail:
      'Do not use Connections, Messages, or Hubs for unsolicited marketing campaigns, generic recruiter spam, crypto pump schemes, or bulk automated outreach.',
  },
  {
    number: '05',
    title: 'Respect Boundaries',
    desc: 'Honor other members’ time, privacy, and conversational rhythms.',
    detail:
      'Respect that members have different schedules and time zones. If someone is slow to respond or declines a connection, respect their decision with grace and no entitlement.',
  },
  {
    number: '06',
    title: 'Contribute Meaningfully',
    desc: 'Share real prototypes, raw curiosities, and honest works in progress.',
    detail:
      'You do not need polished credentials or corporate titles to participate. Bring what you are genuinely thinking about, building, or reading right now.',
  },
  {
    number: '07',
    title: 'Report Inappropriate Behavior',
    desc: 'Help preserve a high-signal, safe space for everyone.',
    detail:
      'If you encounter a violation of these guidelines or witness bad actors degrading the community, report it immediately to our moderation team.',
  },
];

export const LandingGuidelinesModal: React.FC<LandingGuidelinesModalProps> = ({
  isOpen,
  onClose,
  onStartOnboarding,
}) => {
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
          id="landing-guidelines-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#08080A]/85 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guidelines-modal-title"
        >
          <motion.div
            id="landing-guidelines-modal-content"
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
                    Community
                  </span>
                  <span className="text-xs text-[#969696] font-mono-code uppercase tracking-wider">
                    Our Code of Conduct
                  </span>
                </div>
                <h2
                  id="guidelines-modal-title"
                  className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light"
                >
                  Community Guidelines
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#969696] font-sans-clean">
                  How we protect signal, cultivate depth, and treat each other across Misfits Club.
                </p>
              </div>

              <button
                id="guidelines-modal-close-btn"
                onClick={onClose}
                aria-label="Close Community Guidelines modal"
                className="p-2 text-[#969696] hover:text-[#F5F5F0] hover:bg-[#1A1A22] border border-transparent hover:border-[#F5F5F0]/10 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Principles Content List */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
              <div className="p-4 bg-[#14141B] border border-[#22222C] text-xs sm:text-sm text-[#D0D0CA] font-sans-clean leading-relaxed">
                <span className="text-[#D4FF3F] font-mono-code font-bold uppercase tracking-wider mr-2">
                  Core Ethos:
                </span>
                Misfits Club is designed as a calm, high-signal sanctuary for curious minds. We value authentic dialogue over performative posturing, and mutual respect over algorithmic noise.
              </div>

              <div className="space-y-3 pt-2">
                {PRINCIPLES.map((principle) => (
                  <div
                    key={principle.number}
                    className="p-4 sm:p-5 border border-[#1E1E26] bg-[#0F0F14] hover:border-[#2E2E38] transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="text-xs font-mono-code font-bold text-[#D4FF3F] shrink-0 mt-0.5 border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-2 py-0.5">
                        {principle.number}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-sans-clean font-semibold text-sm sm:text-base text-[#F5F5F0]">
                          {principle.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#D4FF3F]/90 font-mono-code mt-0.5">
                          {principle.desc}
                        </p>
                        <p className="text-xs sm:text-sm text-[#969696] font-sans-clean mt-2 leading-relaxed">
                          {principle.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-[#F5F5F0]/10 bg-[#121217] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#969696] font-sans-clean text-center sm:text-left">
                By joining Misfits Club, you agree to uphold these principles.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  id="guidelines-modal-done-btn"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] border border-[#262630] hover:border-[#383844] bg-[#16161D] transition-colors"
                >
                  Close
                </button>
                {onStartOnboarding && (
                  <button
                    id="guidelines-modal-join-btn"
                    onClick={() => {
                      onClose();
                      onStartOnboarding();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] transition-colors"
                  >
                    I Agree & Join
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
