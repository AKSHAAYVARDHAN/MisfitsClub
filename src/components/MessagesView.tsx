import React, { useState, useEffect, useRef } from 'react';
import { Connection, ChatMessage, UserProfile } from '../types';
import { 
  Send, 
  Sparkles, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  Info, 
  X,
  ChevronRight,
  Lightbulb,
  Check,
  CheckCheck
} from 'lucide-react';
import { CONVERSATION_STARTERS } from '../data/mockData';
import { getOtherParticipantId } from '../services/connectionService';
import { messageService } from '../services/messageService';

interface MessagesViewProps {
  connections: Connection[];
  activeConnectionId: string | null;
  onSelectConnection: (id: string) => void;
  messages: ChatMessage[];
  onSendMessage: (connectionId: string, text: string) => void;
  currentUser: UserProfile | null;
  onExplore: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  connections = [],
  activeConnectionId,
  onSelectConnection,
  messages = [],
  onSendMessage,
  currentUser,
  onExplore,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const safeConnections = connections || [];
  const safeMessages = messages || [];

  // Active connection
  const activeConnection = safeConnections.find((c) => c.id === activeConnectionId) || safeConnections[0];

  // Helper to match messages for a connection
  const getMessagesForConnection = (conn: Connection | undefined) => {
    if (!conn) return [];
    const currentUserId = currentUser?.uid || currentUser?.id || '';
    const otherId = getOtherParticipantId(conn, currentUserId);
    let convoId: string | null = null;
    if (currentUserId && otherId) {
      try {
        convoId = messageService.getDeterministicConversationId(currentUserId, otherId);
      } catch {
        // ignore
      }
    }

    return safeMessages.filter((m) => {
      if (m.connectionId === conn.id) return true;
      if (convoId && m.conversationId === convoId) return true;
      if (m.conversationId === conn.id) return true;
      return false;
    });
  };

  // Messages for active connection
  const activeMessages = getMessagesForConnection(activeConnection);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConnection) return;
    onSendMessage(activeConnection.id, inputText.trim());
    setInputText('');
  };

  const handleSendStarter = (starterText: string) => {
    if (!activeConnection) return;
    onSendMessage(activeConnection.id, starterText);
  };

  if (safeConnections.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto py-20 bg-[#09090B] text-[#F5F5F0] selection:bg-[#D4FF3F] selection:text-[#080808]">
        <div className="w-12 h-12 bg-[#121216] border border-[#1E1E24] flex items-center justify-center mb-6">
          <Sparkles className="w-5 h-5 text-[#D4FF3F]" />
        </div>
        <h2 className="font-editorial text-3xl font-light tracking-tight text-[#F5F5F0] mb-3">
          No conversations yet
        </h2>
        <p className="text-xs text-[#8E8E93] mb-8 leading-relaxed font-sans-clean">
          Misfits Club is built for unhurried, authentic dialogue between curious minds. Connect with members on the Orb or explore board to start talking.
        </p>
        <button
          id="empty-messages-discover-btn"
          onClick={onExplore}
          className="btn-primary"
        >
          Discover People
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col bg-[#09090B] text-[#F5F5F0] selection:bg-[#D4FF3F] selection:text-[#080808]">
      <div className="flex-1 flex border border-[#1E1E24] bg-[#0E0E12] overflow-hidden relative shadow-2xl">
        
        {/* Left Sidebar: Conversations List */}
        <div className={`w-full md:w-80 lg:w-[340px] border-r border-[#1E1E24] bg-[#0E0E12] flex flex-col flex-shrink-0 ${
          activeConnectionId && 'hidden md:flex'
        }`}>
          
          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-[#1E1E24] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]"></span>
              <h2 className="text-xs font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
                Dialogues
              </h2>
            </div>
            <span className="text-[10px] font-mono-code text-[#7A7A82] uppercase tracking-wider">
              {safeConnections.length} ACTIVE
            </span>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#18181E]">
            {safeConnections.map((conn) => {
              const isSelected = activeConnection?.id === conn.id;
              const allConvoMsgs = getMessagesForConnection(conn);
              const lastMsg = allConvoMsgs.slice(-1)[0]?.text || conn.introNote || 'Connected on Misfits Club';
              const lastTime = allConvoMsgs.slice(-1)[0]?.timestamp || conn.lastMessageTime || 'Just now';

              return (
                <button
                  key={conn.id}
                  id={`convo-item-${conn.id}`}
                  onClick={() => onSelectConnection(conn.id)}
                  className={`w-full text-left px-4 sm:px-5 py-4 flex items-start gap-3.5 transition-all relative group ${
                    isSelected
                      ? 'bg-[#141418]'
                      : 'hover:bg-[#121216]'
                  }`}
                >
                  {/* Subtle active indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D4FF3F]" />
                  )}

                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <img
                      src={conn.profile?.avatarUrl || conn.profile?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={conn.profile?.name || 'Member'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover border border-[#24242C]"
                    />
                    {conn.profile?.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#D4FF3F] ring-2 ring-[#0E0E12]"></span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`text-xs uppercase tracking-wider truncate font-bold ${
                        isSelected ? 'text-[#F5F5F0]' : 'text-[#D0D0CA] group-hover:text-[#F5F5F0]'
                      }`}>
                        {conn.profile?.name || 'Member'}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {conn.unreadCount && conn.unreadCount > 0 ? (
                          <span
                            id={`convo-unread-${conn.id}`}
                            className="bg-lime-grained text-[#080808] text-[9px] font-mono-code font-bold px-1.5 py-0.2 min-w-[17px] h-[17px] flex items-center justify-center"
                          >
                            {conn.unreadCount > 9 ? '9+' : conn.unreadCount}
                          </span>
                        ) : null}
                        <span className="text-[9px] text-[#7A7A82] font-mono-code uppercase tracking-wider whitespace-nowrap">
                          {lastTime}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#7A7A82] truncate font-sans-clean mb-1">
                      {conn.profile?.role || 'Explorer'} · {(conn.profile?.location || 'Worldwide').split(',')[0]}
                    </p>

                    <p className="text-[11px] text-[#8E8E93] truncate font-sans-clean leading-relaxed">
                      {lastMsg}
                    </p>

                    {/* Shared Intent pill */}
                    {(conn.sharedIntents || []).length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[9px] font-mono-code text-[#D4FF3F] uppercase tracking-wider">
                          {conn.sharedIntents[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center/Right Area: Active Conversation */}
        {activeConnection ? (
          <div className="flex-1 flex flex-col bg-[#09090B] relative min-w-0">
            
            {/* Conversation Header */}
            <div className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#1E1E24] bg-[#0E0E12] flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                
                {/* Mobile Back to List Button */}
                <button
                  onClick={() => onSelectConnection('')}
                  className="md:hidden p-1.5 text-[#8E8E93] hover:text-[#F5F5F0] transition-colors"
                  aria-label="Back to conversations list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <img
                  src={activeConnection.profile?.avatarUrl || activeConnection.profile?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt={activeConnection.profile?.name || 'Member'}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 object-cover border border-[#24242C] flex-shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5F5F0] truncate">
                      {activeConnection.profile?.name || 'Member'}
                    </h3>
                    <span className="hidden sm:inline text-[10px] text-[#7A7A82] uppercase tracking-widest font-mono-code">
                      · {activeConnection.profile?.location || 'Worldwide'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#7A7A82] uppercase tracking-wider truncate mt-0.5">
                    <span>{activeConnection.profile?.role || 'Explorer'}</span>
                    <span className="text-[#1E1E24]">|</span>
                    <span className="text-[#D4FF3F] flex items-center gap-1 font-mono-code text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]"></span>
                      CONNECTED
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimalist Profile Context Action */}
              <button
                id="toggle-profile-drawer-btn"
                onClick={() => setIsProfileDrawerOpen(!isProfileDrawerOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-code uppercase tracking-wider transition-colors border ${
                  isProfileDrawerOpen
                    ? 'border-[#D4FF3F]/60 text-[#D4FF3F] bg-[#141418]'
                    : 'border-[#24242C] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] bg-[#0E0E12]'
                }`}
                title="View bio and background context"
              >
                <Info className="w-3.5 h-3.5 text-[#8E8E93]" />
                <span className="hidden sm:inline">Profile Context</span>
              </button>
            </div>

            {/* Shared Intent & Curiosities Context Strip */}
            <div className="bg-[#0B0B0E] border-b border-[#1A1A20] px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between text-[11px] gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-[#8E8E93] font-sans-clean">
                <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#7A7A82]">
                  YOU BOTH SELECTED
                </span>
                <span className="text-[#24242C]">·</span>
                <span className="text-[#F5F5F0] font-medium tracking-wide uppercase text-[10px] font-mono-code">
                  {(activeConnection.sharedIntents || []).join(' · ') || 'EXCHANGE IDEAS'}
                </span>
              </div>
              
              {(activeConnection.sharedInterests || []).length > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#7A7A82]">
                    SHARED CURIOSITIES
                  </span>
                  <span className="text-[#24242C]">·</span>
                  <div className="flex items-center gap-1.5">
                    {(activeConnection.sharedInterests || []).slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="text-[9px] text-[#8E8E93] border border-[#202026] px-2 py-0.5 uppercase tracking-wider font-mono-code bg-[#101014]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 space-y-1">
              
              {/* Dialogue Start Marker */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 border border-[#1E1E24] bg-[#0E0E12] px-3.5 py-1.5 text-[10px] text-[#7A7A82] uppercase tracking-widest font-mono-code">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]"></span>
                  <span>Conversation opened · Calm & unhurried</span>
                </div>
              </div>

              {/* Zero messages empty state prompt */}
              {activeMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-10 h-10 bg-[#121216] border border-[#1E1E24] flex items-center justify-center mb-3 text-[#D4FF3F]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F0] mb-1 font-mono-code">
                    Start the conversation
                  </h4>
                  <p className="text-xs text-[#8E8E93] max-w-xs leading-relaxed font-sans-clean">
                    Share a thoughtful thought or pick one of the conversation prompts below to get started.
                  </p>
                </div>
              )}

              {/* Render Chat Messages with Dynamic Left/Right Alignment & Visual Grouping */}
              {activeMessages.map((msg, index) => {
                const isMe = (() => {
                  if (currentUser) {
                    if (currentUser.id && msg.senderId === currentUser.id) return true;
                    if (currentUser.uid && msg.senderId === currentUser.uid) return true;
                  }
                  return msg.senderId === 'currentUser' || msg.senderId === 'me';
                })();

                const prevMsg = index > 0 ? activeMessages[index - 1] : null;
                const nextMsg = index < activeMessages.length - 1 ? activeMessages[index + 1] : null;

                const prevIsMe = prevMsg ? (() => {
                  if (currentUser) {
                    if (currentUser.id && prevMsg.senderId === currentUser.id) return true;
                    if (currentUser.uid && prevMsg.senderId === currentUser.uid) return true;
                  }
                  return prevMsg.senderId === 'currentUser' || prevMsg.senderId === 'me';
                })() : null;

                const nextIsMe = nextMsg ? (() => {
                  if (currentUser) {
                    if (currentUser.id && nextMsg.senderId === currentUser.id) return true;
                    if (currentUser.uid && nextMsg.senderId === currentUser.uid) return true;
                  }
                  return nextMsg.senderId === 'currentUser' || nextMsg.senderId === 'me';
                })() : null;

                const isFirstInGroup = prevIsMe === null || prevIsMe !== isMe;
                const isLastInGroup = nextIsMe === null || nextIsMe !== isMe;

                return (
                  <div
                    key={msg.id}
                    className={`w-full flex ${
                      isMe ? 'justify-end' : 'justify-start'
                    } ${isFirstInGroup ? 'mt-4 sm:mt-5' : 'mt-1'}`}
                  >
                    {/* LEFT SIDE: Other Person's Message */}
                    {!isMe && (
                      <div className="flex flex-col items-start max-w-[85%] sm:max-w-[70%]">
                        {/* Sender Label (on first message of group) */}
                        {isFirstInGroup && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#7A7A82] font-semibold">
                              {activeConnection.profile?.name ? activeConnection.profile.name.split(' ')[0] : 'Member'}
                            </span>
                          </div>
                        )}

                        {/* Message Container */}
                        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] leading-relaxed border bg-[#101014] text-[#F5F5F0] border-[#1E1E24]">
                          {/* Highlighted Starter Header */}
                          {msg.isStarterPrompt && (
                            <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-[#1E1E24]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                              <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold">
                                CONVERSATION OPENER
                              </span>
                            </div>
                          )}

                          <p className="font-sans-clean whitespace-pre-wrap font-normal text-[#F5F5F0]">
                            {msg.text}
                          </p>
                        </div>

                        {/* Subtle Timestamp (after last message of group) */}
                        {isLastInGroup && (
                          <div className="flex items-center gap-1.5 mt-1 px-1">
                            <span className="text-[9px] text-[#7A7A82] font-mono-code uppercase tracking-wider">
                              {msg.timestamp}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RIGHT SIDE: Current User's Message */}
                    {isMe && (
                      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                        {/* Sender Label (on first message of group) */}
                        {isFirstInGroup && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#7A7A82] font-semibold">
                              YOU
                            </span>
                          </div>
                        )}

                        {/* Message Container */}
                        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] leading-relaxed border bg-[#16161C] text-[#F5F5F0] border-[#242430]">
                          {/* Highlighted Starter Header */}
                          {msg.isStarterPrompt && (
                            <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-[#242430]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                              <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold">
                                CONVERSATION OPENER
                              </span>
                            </div>
                          )}

                          <p className="font-sans-clean whitespace-pre-wrap font-normal text-[#F5F5F0]">
                            {msg.text}
                          </p>
                        </div>

                        {/* Subtle Timestamp & Delivery Status */}
                        {isLastInGroup && (
                          <div className="flex items-center gap-1.5 mt-1 px-1">
                            <span className="text-[9px] text-[#7A7A82] font-mono-code uppercase tracking-wider">
                              {msg.timestamp}
                            </span>
                            <CheckCheck className="w-3 h-3 text-[#7A7A82]/70 inline" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Conversation Starter Shortcut Bar (if dialogue is fresh) */}
            {activeMessages.length <= 2 && (
              <div className="px-4 sm:px-6 py-2.5 border-t border-[#1E1E24] bg-[#0C0C10]">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[9px] text-[#7A7A82] uppercase tracking-widest font-mono-code whitespace-nowrap flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-[#D4FF3F]" /> Prompts:
                  </span>
                  {CONVERSATION_STARTERS.slice(0, 3).map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendStarter(starter)}
                      className="whitespace-nowrap border border-[#202026] bg-[#101014] px-3 py-1 text-[11px] text-[#8E8E93] hover:text-[#F5F5F0] hover:border-[#383844] transition-colors font-sans-clean"
                    >
                      “{starter.slice(0, 34)}...”
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input Bar */}
            <form onSubmit={handleSend} className="p-3 sm:p-5 border-t border-[#1E1E24] bg-[#0E0E12] flex-shrink-0">
              <div className="flex items-center gap-3">
                <input
                  id="message-text-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write a thoughtful note to ${(activeConnection.profile?.name || 'them').split(' ')[0]}...`}
                  className="flex-1 border border-[#24242C] bg-[#09090B] px-4 py-3 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#64646E] focus:border-[#D4FF3F]/60 focus:outline-none transition-colors"
                />
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn-primary py-3 px-5 text-xs"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-mono-code text-[11px] tracking-wider">SEND</span>
                </button>
              </div>
            </form>

            {/* Slide-out Profile Context Drawer */}
            {isProfileDrawerOpen && (
              <div className="absolute top-16 right-0 bottom-0 w-full sm:w-80 md:w-96 bg-[#0E0E12] border-l border-[#1E1E24] p-6 overflow-y-auto z-30 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E1E24]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#F5F5F0] font-bold">
                      PROFILE CONTEXT
                    </span>
                  </div>
                  <button
                    onClick={() => setIsProfileDrawerOpen(false)}
                    className="p-1 text-[#8E8E93] hover:text-[#F5F5F0] transition-colors"
                    aria-label="Close profile drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5 text-left">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={activeConnection.profile?.avatarUrl || activeConnection.profile?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={activeConnection.profile?.name || 'Member'}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover border border-[#24242C]"
                    />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0]">
                        {activeConnection.profile?.name || 'Member'}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] font-sans-clean mt-0.5">
                        {activeConnection.profile?.role || 'Explorer'}
                      </p>
                      <p className="text-[10px] text-[#7A7A82] font-mono-code uppercase tracking-wider">
                        {activeConnection.profile?.location || 'Worldwide'}
                      </p>
                    </div>
                  </div>

                  {activeConnection.profile?.tagline && (
                    <div className="p-3.5 bg-[#121216] border border-[#1E1E24]">
                      <p className="text-xs text-[#F5F5F0] italic font-editorial leading-relaxed">
                        “{activeConnection.profile.tagline}”
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#7A7A82] block mb-1.5">
                      ABOUT
                    </span>
                    <p className="text-xs text-[#8E8E93] leading-relaxed font-sans-clean">
                      {activeConnection.profile?.bio || 'Member of Misfits Club.'}
                    </p>
                  </div>

                  {activeConnection.profile?.building && (
                    <div className="bg-[#121216] p-3.5 border border-[#1E1E24]">
                      <span className="text-[9px] text-[#D4FF3F] uppercase tracking-widest font-mono-code block mb-1 font-bold">
                        CURRENTLY BUILDING
                      </span>
                      <p className="text-xs text-[#F5F5F0]/90 leading-relaxed font-sans-clean">
                        {activeConnection.profile.building}
                      </p>
                    </div>
                  )}

                  {activeConnection.profile?.openQuestion && (
                    <div className="bg-[#121216] p-3.5 border border-[#1E1E24]">
                      <span className="text-[9px] text-[#7A7A82] uppercase tracking-widest font-mono-code block mb-1 font-bold">
                        OPEN QUESTION
                      </span>
                      <p className="text-xs text-[#F5F5F0] italic leading-relaxed font-editorial">
                        “{activeConnection.profile.openQuestion}”
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#7A7A82] block mb-2">
                      INTERESTS & TOPICS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeConnection.profile?.interests || []).map((i) => (
                        <span
                          key={i}
                          className="text-[9px] text-[#8E8E93] bg-[#121216] px-2.5 py-1 border border-[#202026] uppercase font-mono-code"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-center p-8 text-[#7A7A82] uppercase tracking-widest text-xs font-mono-code">
            Select a dialogue to start reading
          </div>
        )}

      </div>
    </div>
  );
};

