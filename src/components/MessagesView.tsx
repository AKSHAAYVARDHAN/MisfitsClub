import React, { useState, useEffect, useRef } from 'react';
import { Connection, ChatMessage, UserProfile } from '../types';
import { 
  Send, 
  Sparkles, 
  User, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  Info, 
  ExternalLink,
  ChevronRight,
  Lightbulb
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto py-16 selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
        <div className="p-4 bg-[#151516] border border-[#F5F5F0]/10 mb-4">
          <Sparkles className="w-8 h-8 text-[#D4FF3F]" />
        </div>
        <h2 className="font-editorial text-3xl text-[#F5F5F0] font-light mb-2">
          No conversations yet
        </h2>
        <p className="text-sm text-[#969696] mb-6 leading-relaxed">
          Misfits Club is about finding people worth talking to. Discover members with aligned curiosities and start an authentic dialogue.
        </p>
        <button
          id="empty-messages-discover-btn"
          onClick={onExplore}
          className="bg-[#F5F5F0] text-[#0B0B0C] px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#D4FF3F] transition-colors"
        >
          Discover People Worth Meeting
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-4 flex flex-col selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      <div className="flex-1 flex border border-[#F5F5F0]/10 bg-[#0B0B0C] overflow-hidden shadow-2xl">
        
        {/* Left Sidebar: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-[#F5F5F0]/10 bg-[#151516] flex flex-col ${
          activeConnectionId && 'hidden md:flex'
        }`}>
          
          {/* Header */}
          <div className="p-4 border-b border-[#F5F5F0]/10 flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-xl text-[#F5F5F0]">
                Conversations
              </h2>
              <p className="text-[10px] text-[#969696] uppercase tracking-widest font-bold">
                {connections.length} active dialogues
              </p>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F0]/5">
            {connections.map((conn) => {
              const isSelected = activeConnection?.id === conn.id;
              const lastMsg = messages
                .filter((m) => m.connectionId === conn.id)
                .slice(-1)[0]?.text || conn.introNote || 'Connected on Misfits Club';

              return (
                <button
                  key={conn.id}
                  id={`convo-item-${conn.id}`}
                  onClick={() => onSelectConnection(conn.id)}
                  className={`w-full text-left p-4 flex items-start gap-3.5 transition-colors ${
                    isSelected
                      ? 'bg-[#0B0B0C] border-l-2 border-[#D4FF3F]'
                      : 'hover:bg-[#0B0B0C]/50'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conn.profile.avatarUrl}
                      alt={conn.profile.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover border border-[#F5F5F0]/10"
                    />
                    {conn.profile.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-[#D4FF3F] border border-[#0B0B0C]"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0] truncate">
                        {conn.profile.name}
                      </h4>
                      <span className="text-[9px] text-[#969696] uppercase tracking-widest whitespace-nowrap">
                        {conn.lastMessageTime || 'Just now'}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#969696] uppercase tracking-wider mb-1 truncate">
                      {conn.profile.roleEmoji} {conn.profile.role} · {conn.profile.location.split(',')[0]}
                    </p>

                    <p className="text-xs text-[#969696] truncate leading-tight font-sans-clean">
                      {lastMsg}
                    </p>

                    {/* Intent Tag */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {conn.sharedIntents.slice(0, 1).map((intent) => (
                        <span
                          key={intent}
                          className="text-[9px] text-[#D4FF3F] uppercase tracking-widest font-bold"
                        >
                          {intent}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Area: Active Conversation */}
        {activeConnection ? (
          <div className="flex-1 flex flex-col bg-[#0B0B0C] relative">
            
            {/* Top Chat Header */}
            <div className="h-16 px-4 sm:px-6 border-b border-[#F5F5F0]/10 bg-[#151516] flex items-center justify-between">
              <div className="flex items-center gap-3">
                
                {/* Mobile Back Button */}
                <button
                  onClick={() => onSelectConnection('')}
                  className="md:hidden p-1.5 text-[#969696] hover:text-[#F5F5F0]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <img
                  src={activeConnection.profile.avatarUrl}
                  alt={activeConnection.profile.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 object-cover border border-[#F5F5F0]/10"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0]">
                      {activeConnection.profile.name}
                    </h3>
                    <span className="text-[10px] text-[#969696] uppercase tracking-widest">
                      {activeConnection.profile.location}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#969696] uppercase tracking-wider">
                    {activeConnection.profile.role}
                  </p>
                </div>
              </div>

              {/* Toggle Profile Drawer Button */}
              <button
                id="toggle-profile-drawer-btn"
                onClick={() => setIsProfileDrawerOpen(!isProfileDrawerOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs uppercase tracking-widest font-bold transition-colors ${
                  isProfileDrawerOpen
                    ? 'border-[#D4FF3F] bg-[#D4FF3F]/10 text-[#D4FF3F]'
                    : 'border-[#F5F5F0]/10 bg-[#0B0B0C] text-[#969696] hover:text-[#F5F5F0]'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile Context</span>
              </button>
            </div>

            {/* Context Banner: Shared Intents & Interests */}
            <div className="bg-[#151516] border-b border-[#F5F5F0]/10 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-[#D4FF3F]"></span>
                <span className="text-[#969696]">
                  You both selected{' '}
                  <strong className="text-[#F5F5F0] font-bold">
                    {activeConnection.sharedIntents.join(' & ') || 'Exchange Ideas'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold">Shared curiosities:</span>
                {activeConnection.sharedInterests.slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="text-[9px] text-[#D4FF3F] bg-[#0B0B0C] px-2 py-0.5 border border-[#D4FF3F]/20 uppercase tracking-wider"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {/* Connection established header */}
              <div className="text-center my-4">
                <div className="inline-flex items-center gap-2 bg-[#151516] border border-[#F5F5F0]/10 px-4 py-1 text-xs text-[#969696] uppercase tracking-widest font-bold">
                  <Sparkles className="w-3 h-3 text-[#D4FF3F]" />
                  <span>Dialogue started · Calm & unhurried</span>
                </div>
              </div>

              {/* Render Chat Messages */}
              {activeMessages.map((msg) => {
                const isMe = msg.senderId === 'currentUser';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md sm:max-w-lg p-4 text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-[#D4FF3F] text-[#0B0B0C] font-medium'
                          : 'bg-[#151516] text-[#F5F5F0] border border-[#F5F5F0]/10'
                      }`}
                    >
                      {msg.isStarterPrompt && (
                        <span className="text-[10px] font-bold opacity-80 block mb-1 uppercase tracking-widest">
                          Conversation Opener
                        </span>
                      )}
                      <p className="font-sans-clean whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-[#969696] uppercase tracking-widest mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Conversation Starter Shortcut Bar (if few messages) */}
            {activeMessages.length <= 2 && (
              <div className="px-4 py-2 border-t border-[#F5F5F0]/10 bg-[#151516]">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold whitespace-nowrap flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-[#D4FF3F]" /> Quick prompts:
                  </span>
                  {CONVERSATION_STARTERS.slice(0, 3).map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendStarter(starter)}
                      className="whitespace-nowrap border border-[#F5F5F0]/10 bg-[#0B0B0C] px-2.5 py-1 text-[11px] text-[#969696] hover:text-[#F5F5F0] hover:border-[#D4FF3F]/40 transition-colors"
                    >
                      “{starter.slice(0, 32)}...”
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input Bar */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-[#F5F5F0]/10 bg-[#151516]">
              <div className="flex items-center gap-2">
                <input
                  id="message-text-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write a thoughtful message to ${activeConnection.profile.name.split(' ')[0]}...`}
                  className="flex-1 border border-[#F5F5F0]/10 bg-[#0B0B0C] px-4 py-3 text-xs sm:text-sm text-[#F5F5F0] placeholder-[#969696]/60 focus:border-[#D4FF3F] focus:outline-none"
                />
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 bg-[#F5F5F0] text-[#0B0B0C] hover:bg-[#D4FF3F] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Slide-out Profile Context Drawer */}
            {isProfileDrawerOpen && (
              <div className="absolute top-16 right-0 bottom-0 w-80 bg-[#151516] border-l border-[#F5F5F0]/10 p-5 overflow-y-auto z-20 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F5F5F0]/10">
                  <span className="font-editorial text-lg text-[#F5F5F0]">
                    Profile Context
                  </span>
                  <button
                    onClick={() => setIsProfileDrawerOpen(false)}
                    className="text-xs uppercase tracking-widest text-[#969696] hover:text-[#F5F5F0]"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeConnection.profile.avatarUrl}
                      alt={activeConnection.profile.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover border border-[#F5F5F0]/10"
                    />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0]">
                        {activeConnection.profile.name}
                      </h4>
                      <p className="text-[10px] text-[#969696] uppercase tracking-widest">
                        {activeConnection.profile.location}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#969696] leading-relaxed italic font-editorial text-sm">
                    “{activeConnection.profile.tagline}”
                  </p>

                  <p className="text-xs text-[#969696] leading-relaxed">
                    {activeConnection.profile.bio}
                  </p>

                  {activeConnection.profile.building && (
                    <div className="bg-[#0B0B0C] p-3 border border-[#F5F5F0]/5">
                      <span className="text-[9px] text-[#D4FF3F] uppercase tracking-widest font-bold block mb-1">
                        🔨 What they're building
                      </span>
                      <p className="text-xs text-[#F5F5F0]/90 leading-relaxed">
                        {activeConnection.profile.building}
                      </p>
                    </div>
                  )}

                  {activeConnection.profile.openQuestion && (
                    <div className="bg-[#0B0B0C] p-3 border border-[#F5F5F0]/5">
                      <span className="text-[9px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                        ❓ Open Question
                      </span>
                      <p className="text-xs text-[#F5F5F0] italic leading-relaxed">
                        “{activeConnection.profile.openQuestion}”
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1.5">
                      Interests
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeConnection.profile.interests.map((i) => (
                        <span
                          key={i}
                          className="text-[9px] text-[#969696] bg-[#0B0B0C] px-2 py-0.5 border border-[#F5F5F0]/5 uppercase"
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
          <div className="flex-1 hidden md:flex items-center justify-center text-center p-8 text-[#969696] uppercase tracking-widest text-xs">
            Select a conversation to start reading
          </div>
        )}

      </div>
    </div>
  );
};
