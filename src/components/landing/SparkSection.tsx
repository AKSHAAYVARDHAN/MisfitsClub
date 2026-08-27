import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MessageSquare, Sparkles, Flame, ArrowRight } from 'lucide-react';

interface SparkSectionProps {
  onExplore: () => void;
}

export const SparkSection: React.FC<SparkSectionProps> = ({ onExplore }) => {
  const shouldReduceMotion = useReducedMotion();

  const sparks = [
    {
      id: 'sp-1',
      question: 'What if intelligence isn’t something you build, but something you cultivate?',
      author: 'Aarav Mehta',
      location: 'Bangalore',
      role: 'Bio-Computing Researcher',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
      repliesCount: 7,
      tag: 'Bio-Intelligence',
      sampleReply: '“Treating cognition as an ecology of microbial interactions rather than rigid matrix weights changes everything.”',
    },
    {
      id: 'sp-2',
      question: 'Why do we stop experimenting when we grow older?',
      author: 'Maya Lindqvist',
      location: 'Berlin',
      role: 'Visual Storyteller',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      repliesCount: 12,
      tag: 'Psychology of Play',
      sampleReply: '“Failure gets expensive in corporate systems. We optimize for risk mitigation rather than playful discovery.”',
    },
    {
      id: 'sp-3',
      question: 'What happens when we design software for contemplation instead of retention?',
      author: 'Noah Sterling',
      location: 'London',
      role: 'Philosopher of Technology',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      repliesCount: 9,
      tag: 'Calm Tools',
      sampleReply: '“Interfaces that respect your silence instead of ringing a notification bell whenever you look away.”',
    },
    {
      id: 'sp-4',
      question: 'Can digital space feel as grounded and intimate as a wooden library room with natural morning light?',
      author: 'Sofia Chen',
      location: 'New York',
      role: 'Spatial Architect',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      repliesCount: 6,
      tag: 'Spatial Computing',
      sampleReply: '“Acoustic reverberation, warm materials, and typography that breathes with ambient room light.”',
    },
  ];

  return (
    <section 
      id="spark-section"
      className="py-20 sm:py-28 lg:py-32 bg-[#09090B] relative border-b border-[#F5F5F0]/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Section Header */}
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-14 sm:mb-16"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold border border-[#D4FF3F]/30 bg-[#D4FF3F]/10 px-3 py-1 inline-block mb-3">
            05 / SPARK
          </span>
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#F5F5F0] font-light leading-[1.12]">
            Ideas begin with <br />
            <span className="italic font-normal text-[#D4FF3F]">questions.</span>
          </h2>
          <p className="mt-4 text-[#969696] text-sm sm:text-base max-w-xl mx-auto font-sans-clean leading-relaxed">
            Before companies, before code, before collaborations—there is a question that refuses to leave your mind.
          </p>
        </motion.div>

        {/* Staggered Question Sparks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {sparks.map((spark, idx) => (
            <motion.div
              key={spark.id}
              onClick={onExplore}
              className="group cursor-pointer bg-[#121215] border border-[#F5F5F0]/10 hover:border-[#D4FF3F]/40 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: shouldReduceMotion ? 0 : (idx % 2) * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div>
                {/* Meta header */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={spark.avatar}
                      alt={spark.author}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 object-cover border border-[#F5F5F0]/10"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#F5F5F0] uppercase tracking-wider block font-sans-clean">
                        {spark.author}
                      </span>
                      <span className="text-[10px] text-[#969696] uppercase tracking-widest font-mono-code">
                        {spark.location} · {spark.role}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono-code text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/20 px-2 py-0.5">
                    #{spark.tag}
                  </span>
                </div>

                {/* Big Question */}
                <h3 className="font-editorial text-xl sm:text-2xl text-[#F5F5F0] group-hover:text-[#D4FF3F] transition-colors leading-snug my-4">
                  “{spark.question}”
                </h3>

                {/* Sample Response Snippet */}
                <div className="p-3.5 bg-[#08080A] border-l-2 border-[#D4FF3F]/60 text-xs text-[#969696] italic font-sans-clean leading-relaxed">
                  {spark.sampleReply}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-3.5 border-t border-[#F5F5F0]/10 flex items-center justify-between text-xs text-[#969696]">
                <div className="flex items-center gap-1.5 font-mono-code text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#D4FF3F]" />
                  <span>{spark.repliesCount} thinkers exploring</span>
                </div>
                <span className="text-[11px] font-mono-code text-[#D4FF3F] group-hover:underline flex items-center gap-1">
                  <span>Explore Spark</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
