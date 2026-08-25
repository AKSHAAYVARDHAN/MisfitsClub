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
  connections,
  activeConnectionId,
  onSelectConnection,
  messages,
  onSendMessage,
  currentUser,
  onExplore,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Active connection
  const activeConnection = connections.find((c) => c.id === activeConnectionId) || connections[0];

  // Messages for active connection
  const activeMessages = messages.filter((m) => m.connectionId === activeConnection?.id);

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

  if (connections.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto py-20 bg-[#080808] text-[#F2F2ED] selection:bg-[#D4FF3F] selection:text-[#080808]">
        <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#242424] flex items-center justify-center mb-6">
          <Sparkles className="w-5 h-5 text-[#D4FF3F]" />
        </div>
        <h2 className="font-editorial text-3xl font-light tracking-tight text-[#F2F2ED] mb-3">
          No conversations yet
        </h2>
        <p className="text-xs text-[#8A8A8A] mb-8 leading-relaxed font-sans-clean">
          Misfits Club is built for unhurried, authentic dialogue between curious minds. Connect with members on the Orb or explore board to start talking.
        </p>
        <button
          id="empty-messages-discover-btn"
          onClick={onExplore}
          className="bg-[#F2F2ED] text-[#080808] px-7 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors"
        >
          Discover People
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col bg-[#080808] text-[#F2F2ED] selection:bg-[#D4FF3F] selection:text-[#080808]">
      <div className="flex-1 flex border border-[#242424] bg-[#0B0B0B] overflow-hidden relative shadow-2xl">
        
        {/* Left Sidebar: Conversations List */}
        <div className={`w-full md:w-80 lg:w-[340px] border-r border-[#242424] bg-[#101010] flex flex-col flex-shrink-0 ${
          activeConnectionId && 'hidden md:flex'
        }`}>
          
          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]"></span>
              <h2 className="text-xs font-mono-code uppercase tracking-widest text-[#F2F2ED] font-bold">
                Dialogues
              </h2>
            </div>
            <span className="text-[10px] font-mono-code text-[#8A8A8A] uppercase tracking-wider">
              {connections.length} ACTIVE
            </span>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A]/80">
            {connections.map((conn) => {
              const isSelected = activeConnection?.id === conn.id;
              const allConvoMsgs = messages.filter((m) => m.connectionId === conn.id);
              const lastMsg = allConvoMsgs.slice(-1)[0]?.text || conn.introNote || 'Connected on Misfits Club';
              const lastTime = allConvoMsgs.slice(-1)[0]?.timestamp || conn.lastMessageTime || 'Just now';

              return (
                <button
                  key={conn.id}
                  id={`convo-item-${conn.id}`}
                  onClick={() => onSelectConnection(conn.id)}
                  className={`w-full text-left px-4 sm:px-5 py-4 flex items-start gap-3.5 transition-all relative group ${
                    isSelected
                      ? 'bg-[#161616]'
                      : 'hover:bg-[#141414]'
                  }`}
                >
                  {/* Subtle active indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D4FF3F]" />
                  )}

                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <img
                      src={conn.profile.avatarUrl}
                      alt={conn.profile.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-sm border border-[#242424]"
                    />
                    {conn.profile.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#D4FF3F] ring-2 ring-[#101010]"></span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`text-xs uppercase tracking-wider truncate font-bold ${
                        isSelected ? 'text-[#F2F2ED]' : 'text-[#F2F2ED]/90 group-hover:text-[#F2F2ED]'
                      }`}>
                        {conn.profile.name}
                      </h4>
                      <span className="text-[9px] text-[#8A8A8A] font-mono-code uppercase tracking-wider whitespace-nowrap">
                        {lastTime}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#8A8A8A] truncate font-sans-clean mb-1">
                      {conn.profile.role} · {conn.profile.location.split(',')[0]}
                    </p>

                    <p className="text-[11px] text-[#8A8A8A] truncate font-sans-clean leading-relaxed">
                      {lastMsg}
                    </p>

                    {/* Shared Intent pill */}
                    {conn.sharedIntents.length > 0 && (
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
          <div className="flex-1 flex flex-col bg-[#0B0B0B] relative min-w-0">
            
            {/* Conversation Header */}
            <div className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#242424] bg-[#101010] flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                
                {/* Mobile Back to List Button */}
                <button
                  onClick={() => onSelectConnection('')}
                  className="md:hidden p-1.5 text-[#8A8A8A] hover:text-[#F2F2ED] transition-colors"
                  aria-label="Back to conversations list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <img
                  src={activeConnection.profile.avatarUrl}
                  alt={activeConnection.profile.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 object-cover rounded-sm border border-[#242424] flex-shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F2F2ED] truncate">
                      {activeConnection.profile.name}
                    </h3>
                    <span className="hidden sm:inline text-[10px] text-[#8A8A8A] uppercase tracking-widest font-mono-code">
                      · {activeConnection.profile.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#8A8A8A] uppercase tracking-wider truncate mt-0.5">
                    <span>{activeConnection.profile.role}</span>
                    <span className="text-[#242424]">|</span>
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
                    ? 'border-[#D4FF3F] text-[#D4FF3F] bg-[#141414]'
                    : 'border-[#242424] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#333333] bg-[#101010]'
                }`}
                title="View bio and background context"
              >
                <Info className="w-3.5 h-3.5 text-[#8A8A8A]" />
                <span className="hidden sm:inline">Profile Context</span>
              </button>
            </div>

            {/* Shared Intent & Curiosities Context Strip */}
            <div className="bg-[#0D0D0D] border-b border-[#202020] px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between text-[11px] gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-[#8A8A8A] font-sans-clean">
                <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A]">
                  YOU BOTH SELECTED
                </span>
                <span className="text-[#292929]">·</span>
                <span className="text-[#F2F2ED] font-medium tracking-wide uppercase text-[10px] font-mono-code">
                  {activeConnection.sharedIntents.join(' · ') || 'EXCHANGE IDEAS'}
                </span>
              </div>
              
              {activeConnection.sharedInterests.length > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A]">
                    SHARED CURIOSITIES
                  </span>
                  <span className="text-[#292929]">·</span>
                  <div className="flex items-center gap-1.5">
                    {activeConnection.sharedInterests.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="text-[9px] text-[#8A8A8A] border border-[#242424] px-2 py-0.5 uppercase tracking-wider font-mono-code bg-[#111111]"
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
                <div className="inline-flex items-center gap-2 border border-[#242424] bg-[#101010] px-3.5 py-1.5 text-[10px] text-[#8A8A8A] uppercase tracking-widest font-mono-code">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]"></span>
                  <span>Conversation opened · Calm & unhurried</span>
                </div>
              </div>

              {/* Render Chat Messages with Dynamic Left/Right Alignment & Visual Grouping */}
              {activeMessages.map((msg, index) => {
                // Determine dynamic ownership from authenticated user or fallback ID
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
                      <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[70%]">
                        {/* Avatar placed strategically beside the last message in a group */}
                        <div className="w-7 h-7 flex-shrink-0 mb-0.5">
                          {isLastInGroup ? (
                            <img
                              src={activeConnection.profile.avatarUrl}
                              alt={activeConnection.profile.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 object-cover rounded-sm border border-[#242424]"
                            />
                          ) : (
                            <div className="w-7 h-7" />
                          )}
                        </div>

                        {/* Message Content & Grouping Container */}
                        <div className="flex flex-col items-start min-w-0">
                          {/* Sender Label (on first message of group) */}
                          {isFirstInGroup && (
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[9px] font-mono-code uppercase tracking-wider text-[#8A8A8A] font-semibold">
                                {activeConnection.profile.name.split(' ')[0]}
                              </span>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`p-3.5 sm:p-4 text-xs sm:text-[13px] leading-relaxed transition-colors border rounded-lg bg-[#111111] text-[#F2F2ED] border-[#222222] ${
                              !isFirstInGroup ? 'rounded-tl-sm' : ''
                            } ${!isLastInGroup ? 'rounded-bl-sm' : ''}`}
                          >
                            {/* Highlighted Starter Header */}
                            {msg.isStarterPrompt && (
                              <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-[#242424]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                                <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold">
                                  CONVERSATION OPENER
                                </span>
                              </div>
                            )}

                            <p className="font-sans-clean whitespace-pre-wrap font-normal text-[#F2F2ED]">
                              {msg.text}
                            </p>
                          </div>

                          {/* Subtle Timestamp (after last message of group) */}
                          {isLastInGroup && (
                            <div className="flex items-center gap-1.5 mt-1 px-1">
                              <span className="text-[9px] text-[#7A7A7A] font-mono-code uppercase tracking-wider">
                                {msg.timestamp}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RIGHT SIDE: Current User's Message */}
                    {isMe && (
                      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                        {/* Sender Label (on first message of group) */}
                        {isFirstInGroup && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[9px] font-mono-code uppercase tracking-wider text-[#8A8A8A] font-semibold">
                              YOU
                            </span>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`p-3.5 sm:p-4 text-xs sm:text-[13px] leading-relaxed transition-colors border rounded-lg bg-[#181818] text-[#F2F2ED] border-[#2C2C2C] hover:border-[#383838] shadow-sm ${
                            !isFirstInGroup ? 'rounded-tr-sm' : ''
                          } ${!isLastInGroup ? 'rounded-br-sm' : ''}`}
                        >
                          {/* Highlighted Starter Header */}
                          {msg.isStarterPrompt && (
                            <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-[#2C2C2C]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                              <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#D4FF3F] font-bold">
                                CONVERSATION OPENER
                              </span>
                            </div>
                          )}

                          <p className="font-sans-clean whitespace-pre-wrap font-normal text-[#F2F2ED]">
                            {msg.text}
                          </p>
                        </div>

                        {/* Subtle Timestamp & Delivery Status */}
                        {isLastInGroup && (
                          <div className="flex items-center gap-1.5 mt-1 px-1">
                            <span className="text-[9px] text-[#7A7A7A] font-mono-code uppercase tracking-wider">
                              {msg.timestamp}
                            </span>
                            <CheckCheck className="w-3 h-3 text-[#8A8A8A]/70 inline" />
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
              <div className="px-4 sm:px-6 py-2.5 border-t border-[#202020] bg-[#0E0E0E]">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[9px] text-[#8A8A8A] uppercase tracking-widest font-mono-code whitespace-nowrap flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-[#D4FF3F]" /> Prompts:
                  </span>
                  {CONVERSATION_STARTERS.slice(0, 3).map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendStarter(starter)}
                      className="whitespace-nowrap border border-[#242424] bg-[#121212] px-3 py-1 text-[11px] text-[#8A8A8A] hover:text-[#F2F2ED] hover:border-[#383838] transition-colors font-sans-clean"
                    >
                      “{starter.slice(0, 34)}...”
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input Bar */}
            <form onSubmit={handleSend} className="p-3 sm:p-5 border-t border-[#242424] bg-[#101010] flex-shrink-0">
              <div className="flex items-center gap-3">
                <input
                  id="message-text-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write a thoughtful note to ${activeConnection.profile.name.split(' ')[0]}...`}
                  className="flex-1 border border-[#242424] bg-[#0B0B0B] px-4 py-3.5 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/50 focus:border-[#383838] focus:outline-none transition-colors"
                />
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-5 py-3.5 bg-[#D4FF3F] text-[#080808] hover:bg-[#F2F2ED] disabled:opacity-30 disabled:hover:bg-[#D4FF3F] disabled:cursor-not-allowed transition-all font-bold text-xs flex items-center justify-center gap-1.5"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-mono-code text-[11px] tracking-wider">SEND</span>
                </button>
              </div>
            </form>

            {/* Slide-out Profile Context Drawer */}
            {isProfileDrawerOpen && (
              <div className="absolute top-16 right-0 bottom-0 w-full sm:w-80 md:w-96 bg-[#101010] border-l border-[#242424] p-6 overflow-y-auto z-30 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#242424]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#F2F2ED] font-bold">
                      PROFILE CONTEXT
                    </span>
                  </div>
                  <button
                    onClick={() => setIsProfileDrawerOpen(false)}
                    className="p-1 text-[#8A8A8A] hover:text-[#F2F2ED] transition-colors"
                    aria-label="Close profile drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5 text-left">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={activeConnection.profile.avatarUrl}
                      alt={activeConnection.profile.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-sm border border-[#242424]"
                    />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#F2F2ED]">
                        {activeConnection.profile.name}
                      </h4>
                      <p className="text-[11px] text-[#8A8A8A] font-sans-clean mt-0.5">
                        {activeConnection.profile.role}
                      </p>
                      <p className="text-[10px] text-[#8A8A8A] font-mono-code uppercase tracking-wider">
                        {activeConnection.profile.location}
                      </p>
                    </div>
                  </div>

                  {activeConnection.profile.tagline && (
                    <div className="p-3.5 bg-[#141414] border border-[#202020]">
                      <p className="text-xs text-[#F2F2ED] italic font-editorial leading-relaxed">
                        “{activeConnection.profile.tagline}”
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-1.5">
                      ABOUT
                    </span>
                    <p className="text-xs text-[#8A8A8A] leading-relaxed font-sans-clean">
                      {activeConnection.profile.bio}
                    </p>
                  </div>

                  {activeConnection.profile.building && (
                    <div className="bg-[#141414] p-3.5 border border-[#202020]">
                      <span className="text-[9px] text-[#D4FF3F] uppercase tracking-widest font-mono-code block mb-1 font-bold">
                        CURRENTLY BUILDING
                      </span>
                      <p className="text-xs text-[#F2F2ED]/90 leading-relaxed font-sans-clean">
                        {activeConnection.profile.building}
                      </p>
                    </div>
                  )}

                  {activeConnection.profile.openQuestion && (
                    <div className="bg-[#141414] p-3.5 border border-[#202020]">
                      <span className="text-[9px] text-[#8A8A8A] uppercase tracking-widest font-mono-code block mb-1 font-bold">
                        OPEN QUESTION
                      </span>
                      <p className="text-xs text-[#F2F2ED] italic leading-relaxed font-editorial">
                        “{activeConnection.profile.openQuestion}”
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2">
                      INTERESTS & TOPICS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeConnection.profile.interests.map((i) => (
                        <span
                          key={i}
                          className="text-[9px] text-[#8A8A8A] bg-[#141414] px-2.5 py-1 border border-[#242424] uppercase font-mono-code"
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
          <div className="flex-1 hidden md:flex items-center justify-center text-center p-8 text-[#8A8A8A] uppercase tracking-widest text-xs font-mono-code">
            Select a dialogue to start reading
          </div>
        )}

      </div>
    </div>
  );
};

