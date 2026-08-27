import React, { useState } from 'react';
import { Connection, ConnectionIntent, PublicProfile, UserProfile } from '../types';
import { 
  Users, 
  MessageSquare, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Check, 
  X, 
  UserMinus, 
  Search, 
  Clock, 
  Send, 
  UserCheck, 
  UserPlus,
  ExternalLink,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface ConnectionsViewProps {
  connections: Connection[];
  currentUser: UserProfile | null;
  onOpenChat: (connectionId: string) => void;
  onExplore: () => void;
  onOpenOrb?: () => void;
  onAcceptRequest?: (connectionId: string) => Promise<void> | void;
  onDeclineRequest?: (connectionId: string) => Promise<void> | void;
  onCancelRequest?: (connectionId: string) => Promise<void> | void;
  onRemoveConnection?: (connectionId: string) => Promise<void> | void;
  onSelectProfile?: (profile: PublicProfile | UserProfile) => void;
  initialTab?: TabType;
}

type TabType = 'connected' | 'received' | 'sent';

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({
  connections = [],
  currentUser,
  onOpenChat,
  onExplore,
  onOpenOrb,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveConnection,
  onSelectProfile,
  initialTab = 'connected',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [isIntentOpen, setIsIntentOpen] = useState<boolean>(false);
  const intentDropdownRef = React.useRef<HTMLDivElement>(null);

  const INTENT_OPTIONS = [
    'All',
    'Build Together',
    'Exchange Ideas',
    'Collaborate',
    'Learn Together',
    'Just Talk'
  ];

  // Close intent dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        intentDropdownRef.current &&
        !intentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsIntentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentUserId = currentUser?.uid || currentUser?.id;
  const safeConns = connections || [];

  // Partition connections by status and direction
  const connectedList = safeConns.filter((c) => c.status === 'connected');
  
  const incomingPendingList = safeConns.filter(
    (c) => c.status === 'pending' && (c.targetId === currentUserId || (!c.requesterId && c.profileId !== currentUserId))
  );

  const outgoingPendingList = safeConns.filter(
    (c) => c.status === 'pending' && (c.requesterId === currentUserId || (c.participants && c.participants[0] === currentUserId))
  );

  // Active list based on tab
  const getActiveList = () => {
    switch (activeTab) {
      case 'connected': return connectedList;
      case 'received': return incomingPendingList;
      case 'sent': return outgoingPendingList;
      default: return connectedList;
    }
  };

  // Helper to resolve counterpart profile
  const getCounterpartProfile = (conn: Connection, tab: TabType) => {
    if (tab === 'received') {
      return conn.requesterSummary || (conn.profileId !== currentUserId ? conn.profile : conn.targetSummary) || conn.profile;
    }
    if (tab === 'sent') {
      return conn.targetSummary || (conn.profileId !== currentUserId ? conn.profile : conn.requesterSummary) || conn.profile;
    }
    if (currentUserId && conn.requesterId === currentUserId) {
      return conn.targetSummary || conn.profile;
    }
    return conn.requesterSummary || conn.profile;
  };

  // Apply intent and search filter
  const filteredList = getActiveList().filter((conn) => {
    // Intent filter
    if (selectedIntentFilter !== 'All') {
      const hasIntent = (conn.sharedIntents || []).includes(selectedIntentFilter as ConnectionIntent);
      if (!hasIntent) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const p = getCounterpartProfile(conn, activeTab);
      const name = (p?.name || '').toLowerCase();
      const role = (p?.role || '').toLowerCase();
      const location = (p?.location || '').toLowerCase();
      const college = (p?.college || '').toLowerCase();
      const intro = (conn.introNote || '').toLowerCase();
      const skills = (p?.skills || []).some((s) => s.toLowerCase().includes(q));
      const interests = (p?.interests || []).some((i) => i.toLowerCase().includes(q));

      if (
        !name.includes(q) &&
        !role.includes(q) &&
        !location.includes(q) &&
        !college.includes(q) &&
        !intro.includes(q) &&
        !skills &&
        !interests
      ) {
        return false;
      }
    }

    return true;
  });

  const handleAction = async (actionFn: ((id: string) => Promise<void> | void) | undefined, connId: string) => {
    if (!actionFn) return;
    setActionInProgress(connId);
    try {
      await actionFn(connId);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F0] py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-24 selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-[#1E1E24]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
            <span className="text-[11px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold">
              NETWORK & CIRCLE
            </span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
            Your Connections
          </h1>
          <p className="font-sans-clean text-sm text-[#8E8E93] mt-1.5 max-w-2xl">
            Curious builders, thinkers, and explorers in your orbit. Track active dialogues and respond to incoming requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenOrb && (
            <button
              id="connections-view-orb-btn"
              onClick={onOpenOrb}
              className="btn-primary"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Orb View</span>
            </button>
          )}

          <button
            id="connections-discover-more-btn"
            onClick={onExplore}
            className="btn-secondary"
          >
            <span>Discover Members</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Network Overview Stats (Primary Connection State Navigation) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <button
          id="overview-card-connected"
          type="button"
          onClick={() => setActiveTab('connected')}
          className={`p-4 border text-left transition-all ${
            activeTab === 'connected'
              ? 'border-[#D4FF3F]/60 bg-[#D4FF3F]/5'
              : 'border-[#1E1E24] bg-[#0E0E12] hover:border-[#32323E]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8E8E93]">
              Active Connections
            </span>
            <UserCheck className="w-4 h-4 text-[#D4FF3F]" />
          </div>
          <p className="font-editorial text-3xl text-[#F5F5F0] mt-2 font-light">
            {connectedList.length}
          </p>
          <span className="text-[11px] text-[#7A7A82] mt-1 block font-sans-clean">
            Mutual connections ready to chat
          </span>
        </button>

        <button
          id="overview-card-received"
          type="button"
          onClick={() => setActiveTab('received')}
          className={`p-4 border text-left transition-all relative ${
            activeTab === 'received'
              ? 'border-[#D4FF3F]/60 bg-[#D4FF3F]/5'
              : 'border-[#1E1E24] bg-[#0E0E12] hover:border-[#32323E]'
          }`}
        >
          {incomingPendingList.length > 0 && (
            <span className="absolute top-3 right-3 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF3F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF3F]"></span>
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8E8E93]">
              Requests Received
            </span>
            <UserPlus className="w-4 h-4 text-[#D4FF3F]" />
          </div>
          <p className="font-editorial text-3xl text-[#F5F5F0] mt-2 font-light">
            {incomingPendingList.length}
          </p>
          <span className="text-[11px] text-[#7A7A82] mt-1 block font-sans-clean">
            {incomingPendingList.length === 1 ? '1 invitation awaiting response' : `${incomingPendingList.length} invitations awaiting response`}
          </span>
        </button>

        <button
          id="overview-card-sent"
          type="button"
          onClick={() => setActiveTab('sent')}
          className={`p-4 border text-left transition-all ${
            activeTab === 'sent'
              ? 'border-[#D4FF3F]/60 bg-[#D4FF3F]/5'
              : 'border-[#1E1E24] bg-[#0E0E12] hover:border-[#32323E]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8E8E93]">
              Requests Sent
            </span>
            <Send className="w-4 h-4 text-[#7A7A82]" />
          </div>
          <p className="font-editorial text-3xl text-[#F5F5F0] mt-2 font-light">
            {outgoingPendingList.length}
          </p>
          <span className="text-[11px] text-[#7A7A82] mt-1 block font-sans-clean">
            Pending replies from members
          </span>
        </button>
      </div>

      {/* =========================================================================
          CONNECTIONS CONTROL TOOLBAR (ALL SCREEN SIZES)
          - Single clean horizontal search & filter row across desktop, tablet & mobile:
            [ Search connections... (Dominant Width) ] [ INTENT: ALL ▼ (Compact Secondary) ]
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        {/* Search Input (Dominant Width) */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A82]" />
          <input
            id="connections-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections..."
            className="w-full h-[42px] bg-[#0E0E12] border border-[#1E1E24] pl-9 pr-9 text-xs text-[#F5F5F0] placeholder-[#666670] focus:border-[#D4FF3F]/60 focus:outline-none font-mono-code transition-colors"
          />
          {searchQuery && (
            <button
              id="clear-connections-search"
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A82] hover:text-[#D4FF3F] p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Intent Filter Dropdown (Compact Secondary Control) */}
        <div ref={intentDropdownRef} className="relative shrink-0">
          <button
            id="connections-intent-dropdown-btn"
            type="button"
            onClick={() => setIsIntentOpen(!isIntentOpen)}
            aria-expanded={isIntentOpen}
            aria-haspopup="listbox"
            className={`w-full sm:w-auto h-[42px] px-4 border text-xs font-mono-code uppercase tracking-wider transition-colors inline-flex items-center justify-between sm:justify-start gap-2 shrink-0 ${
              selectedIntentFilter !== 'All'
                ? 'border-[#D4FF3F]/50 bg-[#121216] text-[#D4FF3F] font-bold shadow-[0_0_8px_rgba(212,255,63,0.1)]'
                : 'border-[#1E1E24] bg-[#0E0E12] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#2E2E38]'
            }`}
          >
            <span>INTENT: {selectedIntentFilter.toUpperCase()}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isIntentOpen ? 'rotate-180 text-[#D4FF3F]' : 'text-[#8E8E93]'
              }`}
            />
          </button>

          {isIntentOpen && (
            <div
              id="connections-intent-dropdown-menu"
              role="listbox"
              className="absolute top-full right-0 mt-1 z-30 w-full sm:min-w-[210px] bg-[#0E0E12] border border-[#1E1E24] shadow-2xl py-1 animate-fadeIn"
            >
              {INTENT_OPTIONS.map((intent) => {
                const isSelected = selectedIntentFilter === intent;
                return (
                  <button
                    key={intent}
                    id={`connections-intent-option-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedIntentFilter(intent);
                      setIsIntentOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-mono-code flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#D4FF3F]/15 text-[#D4FF3F] font-bold'
                        : 'text-[#8E8E93] hover:bg-[#15151A] hover:text-[#F5F5F0]'
                    }`}
                  >
                    <span>{intent}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#D4FF3F]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredList.length === 0 ? (
        <div className="text-center py-20 border border-[#1E1E24] bg-[#0E0E12] p-8 max-w-lg mx-auto">
          <Sparkles className="w-8 h-8 text-[#D4FF3F] mx-auto mb-3" />
          <h3 className="font-editorial text-2xl text-[#F5F5F0] font-light">
            {activeTab === 'connected' && 'No connections found'}
            {activeTab === 'received' && 'No pending incoming requests'}
            {activeTab === 'sent' && 'No pending sent requests'}
          </h3>
          <p className="text-xs sm:text-sm text-[#8E8E93] mt-2 mb-6 font-sans-clean">
            {activeTab === 'connected' && 'Explore the Discovery feed to find curious minds, joint builders, and kindred misfits.'}
            {activeTab === 'received' && 'When other members send you connection requests with starter questions, they will appear here.'}
            {activeTab === 'sent' && 'When you request to connect with members, you can track their status here.'}
          </p>
          <button
            onClick={onExplore}
            className="btn-primary"
          >
            Discover Members
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((conn) => {
            const p = conn.profile;
            const isIncoming = activeTab === 'received';
            const isOutgoing = activeTab === 'sent';
            const isConnected = activeTab === 'connected';

            return (
              <div
                key={conn.id}
                className="border border-[#1E1E24] bg-[#0E0E12] p-5 flex flex-col justify-between hover:border-[#32323E] transition-all relative group"
              >
                <div>
                  
                  {/* Card Header: Profile Info */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group/prof"
                      onClick={() => onSelectProfile && onSelectProfile(p)}
                    >
                      <img
                        src={p?.avatarUrl || p?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={p?.name || 'Member'}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover border border-[#24242C] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-editorial text-xl text-[#F5F5F0] font-light group-hover/prof:text-[#D4FF3F] transition-colors">
                            {p?.name || 'Curious Misfit'}
                          </h3>
                          {p?.roleEmoji && (
                            <span className="text-sm">{p.roleEmoji}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#D0D0CA] font-mono-code uppercase tracking-wider">
                          {p?.role || 'Explorer & Builder'}
                        </p>
                        <p className="text-[10px] text-[#7A7A82] font-mono-code uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{p?.location || p?.college || 'Worldwide'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isConnected && (
                      <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 bg-[#D4FF3F]/10 text-[#D4FF3F] border border-[#D4FF3F]/30 font-bold shrink-0">
                        Connected
                      </span>
                    )}
                    {isIncoming && (
                      <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold shrink-0">
                        Incoming
                      </span>
                    )}
                    {isOutgoing && (
                      <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold shrink-0">
                        Sent
                      </span>
                    )}
                  </div>

                  {/* Tagline / Question snippet */}
                  {p?.tagline && (
                    <p className="font-editorial text-base italic text-[#F5F5F0]/90 leading-snug mb-3.5 font-light">
                      “{p.tagline}”
                    </p>
                  )}

                  {/* Intro Note / Starter Prompt if included */}
                  {conn.introNote && (
                    <div className="bg-[#121216] p-3 border border-[#202026] mb-3.5">
                      <span className="text-[9px] text-[#D4FF3F] font-mono-code uppercase tracking-widest font-bold block mb-1">
                        {isIncoming ? 'Opening Message from them' : 'Your Starter Note'}
                      </span>
                      <p className="text-xs text-[#D8D8DC] italic leading-relaxed">
                        “{conn.introNote}”
                      </p>
                    </div>
                  )}

                  {/* Shared Intents */}
                  {conn.sharedIntents && conn.sharedIntents.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] text-[#7A7A82] uppercase font-mono-code tracking-widest block mb-1.5">
                        Shared Intentions:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {conn.sharedIntents.map((i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono-code text-[#B5B5AF] bg-[#141418] border border-[#24242C] px-2 py-0.5 uppercase tracking-wider"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Topics */}
                  {conn.sharedInterests && conn.sharedInterests.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] text-[#7A7A82] uppercase font-mono-code tracking-widest block mb-1">
                        Common Topics:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {conn.sharedInterests.map((interest) => (
                          <span
                            key={interest}
                            className="text-[10px] text-[#8E8E93] bg-[#121216] px-2 py-0.5 border border-[#202026] uppercase font-mono-code"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-4 border-t border-[#1C1C22] mt-3">
                  
                  {/* Connected Tab Actions */}
                  {isConnected && (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => onRemoveConnection && handleAction(onRemoveConnection, conn.id)}
                        disabled={actionInProgress === conn.id}
                        className="text-[11px] font-mono-code uppercase tracking-wider text-[#7A7A82] hover:text-[#EF4444] transition-colors"
                        title="Remove connection"
                      >
                        Remove
                      </button>

                      <div className="flex items-center gap-2">
                        {onSelectProfile && (
                          <button
                            onClick={() => onSelectProfile(p)}
                            className="p-2 border border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] transition-colors"
                            title="View Full Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          id={`open-chat-btn-${conn.id}`}
                          onClick={() => onOpenChat(conn.id)}
                          className="btn-primary py-1.5 px-3 text-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Chat</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Incoming Requests Tab Actions */}
                  {isIncoming && (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        id={`decline-request-btn-${conn.id}`}
                        onClick={() => onDeclineRequest && handleAction(onDeclineRequest, conn.id)}
                        disabled={actionInProgress === conn.id}
                        className="flex items-center gap-1 px-3 py-1.5 border border-[#24242C] text-xs font-mono-code uppercase tracking-wider text-[#8E8E93] hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {onSelectProfile && (
                          <button
                            onClick={() => onSelectProfile(p)}
                            className="p-2 border border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] transition-colors"
                            title="View Full Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          id={`accept-request-btn-${conn.id}`}
                          onClick={() => onAcceptRequest && handleAction(onAcceptRequest, conn.id)}
                          disabled={actionInProgress === conn.id}
                          className="btn-primary py-1.5 px-3.5 text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Outgoing Requests Tab Actions */}
                  {isOutgoing && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#7A7A82] font-mono-code uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Awaiting Response</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {onSelectProfile && (
                          <button
                            onClick={() => onSelectProfile(p)}
                            className="p-2 border border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] transition-colors"
                            title="View Full Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          id={`cancel-request-btn-${conn.id}`}
                          onClick={() => onCancelRequest && handleAction(onCancelRequest, conn.id)}
                          disabled={actionInProgress === conn.id}
                          className="flex items-center gap-1 px-3 py-1.5 border border-[#24242C] text-xs font-mono-code uppercase tracking-wider text-[#8E8E93] hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
