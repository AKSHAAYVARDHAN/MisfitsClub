import React, { useState } from 'react';
import { Connection, ConnectionIntent } from '../types';
import { Users, MessageSquare, Sparkles, ArrowRight, ExternalLink, Calendar, MapPin } from 'lucide-react';

interface ConnectionsViewProps {
  connections: Connection[];
  onOpenChat: (connectionId: string) => void;
  onExplore: () => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({
  connections,
  onOpenChat,
  onExplore,
}) => {
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>('All');

  const filtered = connections.filter((c) => {
    if (selectedIntentFilter === 'All') return true;
    return c.sharedIntents.includes(selectedIntentFilter as ConnectionIntent);
  });

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F0] py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-24 selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#F5F5F0]/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-[#D4FF3F]" />
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-bold">
              Network of Curiosity
            </span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
            Your Connections
          </h1>
          <p className="font-sans-clean text-sm text-[#969696] mt-1.5">
            People you’ve connected with for honest ideas, joint building, and meaningful dialogue.
          </p>
        </div>

        <button
          id="connections-discover-more-btn"
          onClick={onExplore}
          className="inline-flex items-center gap-2 bg-[#151516] border border-[#F5F5F0]/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#F5F5F0] hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-colors"
        >
          <span>Discover More Misfits</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {['All', 'Build Together', 'Exchange Ideas', 'Collaborate', 'Learn Together', 'Just Talk'].map((intent) => (
          <button
            key={intent}
            onClick={() => setSelectedIntentFilter(intent)}
            className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
              selectedIntentFilter === intent
                ? 'bg-[#F5F5F0] text-[#0B0B0C]'
                : 'bg-[#151516] text-[#969696] border border-[#F5F5F0]/10 hover:border-[#D4FF3F] hover:text-[#F5F5F0]'
            }`}
          >
            {intent}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-[#F5F5F0]/10 bg-[#151516] p-8 max-w-lg mx-auto">
          <Sparkles className="w-8 h-8 text-[#D4FF3F] mx-auto mb-3" />
          <h3 className="font-editorial text-2xl text-[#F5F5F0] font-light">No connections in this category yet</h3>
          <p className="text-xs sm:text-sm text-[#969696] mt-2 mb-6">
            Head to the Discover tab to explore profiles and start genuine conversations.
          </p>
          <button
            onClick={onExplore}
            className="bg-[#F5F5F0] text-[#0B0B0C] px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors"
          >
            Discover People
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((conn) => (
            <div
              key={conn.id}
              className="border border-[#F5F5F0]/10 bg-[#151516] p-6 flex flex-col justify-between hover:border-[#D4FF3F]/50 transition-all"
            >
              <div>
                
                {/* Person Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={conn.profile.avatarUrl}
                      alt={conn.profile.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover border border-[#F5F5F0]/10"
                    />
                    <div>
                      <h3 className="font-editorial text-2xl text-[#F5F5F0] font-light">
                        {conn.profile.name}
                      </h3>
                      <p className="text-[10px] text-[#969696] uppercase tracking-widest">
                        {conn.profile.location} · {conn.profile.roleEmoji} {conn.profile.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tagline */}
                <p className="font-editorial text-lg italic text-[#F5F5F0] leading-snug mb-4 font-light">
                  “{conn.profile.tagline}”
                </p>

                {/* Mutual intents */}
                <div className="mb-4">
                  <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1.5">
                    Shared Intentions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {conn.sharedIntents.map((i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold text-[#D4FF3F] border border-[#D4FF3F]/30 px-2 py-0.5 uppercase tracking-wider"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Shared interests */}
                <div className="mb-4">
                  <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1.5">
                    Common Topics:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {conn.sharedInterests.map((interest) => (
                      <span
                        key={interest}
                        className="text-[10px] text-[#969696] bg-[#0B0B0C] px-2 py-0.5 border border-[#F5F5F0]/5 uppercase"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Intro note snippet if any */}
                {conn.introNote && (
                  <div className="bg-[#0B0B0C] p-3 border border-[#F5F5F0]/5 mb-4">
                    <span className="text-[9px] text-[#D4FF3F] uppercase tracking-widest font-bold block mb-1">
                      Starter Opener
                    </span>
                    <p className="text-xs text-[#969696] italic leading-relaxed">“{conn.introNote}”</p>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-[#F5F5F0]/10 flex items-center justify-between">
                <span className="text-[10px] text-[#969696] uppercase tracking-widest">
                  Connected {conn.connectedAt}
                </span>

                <button
                  id={`open-chat-btn-${conn.id}`}
                  onClick={() => onOpenChat(conn.id)}
                  className="flex items-center gap-1.5 bg-[#F5F5F0] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#D4FF3F] transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Chat</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
