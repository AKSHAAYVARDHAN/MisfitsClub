import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

interface LandingFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnboarding?: () => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Features' | 'Community & Safety';
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-what-is',
    category: 'General',
    question: 'What is Misfits Club?',
    answer:
      'Misfits Club is a global platform designed for curious thinkers, independent builders, tinkerers, and researchers. Unlike traditional social media or corporate networking platforms, it is structured around shared obsessions, unhurried 1-on-1 dialogues, and collaborative experimentation rather than follower counts or algorithmic engagement traps.',
  },
  {
    id: 'faq-who-for',
    category: 'General',
    question: 'Who is Misfits Club for?',
    answer:
      'It is for anyone guided by genuine curiosity rather than status or self-promotion. Our members include hardware engineers, visual artists, philosophers, bio-computing researchers, open-source contributors, writers, and autodidacts who crave high-signal conversations and real collaboration.',
  },
  {
    id: 'faq-what-can-do',
    category: 'Features',
    question: 'What can I do on the platform?',
    answer:
      'You can explore global thinkers across the 3D Orb, discover members based on mutual intent (Building Together, Exchanging Ideas, Mentorship, Learning), spark philosophical and technical discussions on the Spark board, participate in thematic Hubs, and initiate direct, intentional 1-on-1 conversations.',
  },
  {
    id: 'faq-connections',
    category: 'Features',
    question: 'What are Connections?',
    answer:
      'Connections are mutual, intentional relationships between members. When you request a connection, you share a context note and your desired intent (e.g. Build Together, Exchange Ideas). There are no one-sided follower numbers or public popularity metrics—only high-trust peer connections.',
  },
  {
    id: 'faq-hubs',
    category: 'Features',
    question: 'What are Hubs?',
    answer:
      'Hubs are focused interest spaces built around specific disciplines—such as Autonomous AI, Tactile Computing & Hardware, Experimental Cinema, Philosophy of Technology, and Synthetic Biology. They provide spaces to share works in progress, exchange papers, and coordinate projects.',
  },
  {
    id: 'faq-spark',
    category: 'Features',
    question: 'What is Spark?',
    answer:
      'Spark is our curiosity feed. Members post open-ended questions, hypotheses, and intellectual puzzles that they are actively chewing on. It is designed to spark deep, reflective discourse without algorithmic outrage or clickbait.',
  },
  {
    id: 'faq-is-free',
    category: 'General',
    question: 'Is Misfits Club free?',
    answer:
      'Yes, Misfits Club is free to join. We are dedicated to maintaining a calm, independent sanctuary focused on community quality and authentic human connections.',
  },
  {
    id: 'faq-account',
    category: 'General',
    question: 'How do I create an account?',
    answer:
      'Click "Join" or "Enter the Club" anywhere on the landing page to begin the short onboarding journey. You will choose your connection intents, select your areas of curiosity, and set up your member profile.',
  },
  {
    id: 'faq-report-problem',
    category: 'Community & Safety',
    question: 'How do I report a problem?',
    answer:
      'You can use the Feedback or Contact options in the footer to report technical issues or general questions. Inappropriate behavior or harassment can be reported directly to our moderation team to ensure the community remains safe and respectful.',
  },
];

export const LandingFaqModal: React.FC<LandingFaqModalProps> = ({
  isOpen,
  onClose,
  onStartOnboarding,
}) => {
  const [openIds, setOpenIds] = useState<string[]>(['faq-what-is']);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
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

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredItems = activeCategory === 'All'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  const categories = ['All', 'General', 'Features', 'Community & Safety'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="landing-faq-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#08080A]/85 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
        >
          <motion.div
            id="landing-faq-modal-content"
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
                    FAQ
                  </span>
                  <span className="text-xs text-[#969696] font-mono-code uppercase tracking-wider">
                    Community & Platform
                  </span>
                </div>
                <h2 
                  id="faq-modal-title"
                  className="font-editorial text-2xl sm:text-3xl text-[#F5F5F0] font-light"
                >
                  Frequently Asked Questions
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#969696] font-sans-clean">
                  Practical answers about how Misfits Club works and what to expect.
                </p>
              </div>

              <button
                id="faq-modal-close-btn"
                onClick={onClose}
                aria-label="Close FAQ modal"
                className="p-2 text-[#969696] hover:text-[#F5F5F0] hover:bg-[#1A1A22] border border-transparent hover:border-[#F5F5F0]/10 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 px-6 sm:px-8 py-3 border-b border-[#F5F5F0]/10 bg-[#0E0E12] overflow-x-auto">
              <span className="text-[11px] text-[#969696] font-mono-code uppercase tracking-wider mr-1 hidden sm:inline">
                Category:
              </span>
              {categories.map((category) => (
                <button
                  key={category}
                  id={`faq-cat-btn-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setActiveCategory(category)}
                  className={`text-xs font-mono-code uppercase tracking-wider px-3 py-1 border transition-all whitespace-nowrap ${
                    activeCategory === category
                      ? 'bg-[#D4FF3F] text-[#080808] border-[#D4FF3F] font-bold'
                      : 'bg-[#14141A] text-[#969696] border-[#22222A] hover:text-[#F5F5F0] hover:border-[#383844]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Questions Accordion List */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-3">
              {filteredItems.map((item) => {
                const isOpenItem = openIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border transition-colors ${
                      isOpenItem
                        ? 'border-[#D4FF3F]/30 bg-[#121218]'
                        : 'border-[#1E1E26] bg-[#0F0F14] hover:border-[#2C2C38]'
                    }`}
                  >
                    <button
                      id={`faq-item-toggle-${item.id}`}
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left focus:outline-none"
                      aria-expanded={isOpenItem}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono-code text-[#D4FF3F]">
                          {isOpenItem ? '—' : '+'}
                        </span>
                        <span className="font-sans-clean font-medium text-sm sm:text-base text-[#F5F5F0]">
                          {item.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#969696] shrink-0 transition-transform duration-200 ${
                          isOpenItem ? 'rotate-180 text-[#D4FF3F]' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpenItem && (
                        <motion.div
                          id={`faq-item-content-${item.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 pl-10 text-xs sm:text-sm text-[#969696] font-sans-clean leading-relaxed border-t border-[#F5F5F0]/5">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 sm:p-6 border-t border-[#F5F5F0]/10 bg-[#121217] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#969696] font-sans-clean text-center sm:text-left">
                Have a different question not answered here?
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  id="faq-modal-done-btn"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono-code uppercase tracking-wider text-[#969696] hover:text-[#F5F5F0] border border-[#262630] hover:border-[#383844] bg-[#16161D] transition-colors"
                >
                  Close
                </button>
                {onStartOnboarding && (
                  <button
                    id="faq-modal-join-btn"
                    onClick={() => {
                      onClose();
                      onStartOnboarding();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider bg-[#D4FF3F] hover:bg-[#C2EB2E] text-[#080808] transition-colors"
                  >
                    Join Misfits Club
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
