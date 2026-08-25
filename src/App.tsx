import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  UserProfile, 
  Connection, 
  ChatMessage, 
  CuriousBoardPost, 
  ConnectionIntent 
} from './types';
import { 
  INITIAL_USER, 
  SAMPLE_PROFILES, 
  SAMPLE_BOARD_POSTS 
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { OrbView } from './components/OrbView';
import { OnboardingModal } from './components/OnboardingModal';
import { DiscoverView } from './components/DiscoverView';
import { ConnectModal } from './components/ConnectModal';
import { MessagesView } from './components/MessagesView';
import { ConnectionsView } from './components/ConnectionsView';
import { ExploreBoardView } from './components/ExploreBoardView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('misfits_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [profiles, setProfiles] = useState<UserProfile[]>(SAMPLE_PROFILES);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isSignInOpen, setIsSignInOpen] = useState<boolean>(false);
  const [connectModalTarget, setConnectModalTarget] = useState<UserProfile | null>(null);

  // Initial connections
  const [connections, setConnections] = useState<Connection[]>(() => [
    {
      id: 'conn-maya',
      profileId: 'p-maya',
      profile: SAMPLE_PROFILES[0], // Maya
      connectedAt: 'Yesterday',
      status: 'connected',
      sharedIntents: ['Exchange Ideas', 'Just Talk'],
      sharedInterests: ['Design', 'AI', 'Film'],
      introNote: '“What is an idea you believe deeply that almost everyone in your field ignores?”',
      lastMessage: 'The acoustics of old tape degradation is something neural models still struggle to capture accurately.',
      lastMessageTime: '12:40 PM',
      unreadCount: 1,
    },
    {
      id: 'conn-arjun',
      profileId: 'p-arjun',
      profile: SAMPLE_PROFILES[1], // Arjun
      connectedAt: '3 days ago',
      status: 'connected',
      sharedIntents: ['Build Together', 'Collaborate'],
      sharedInterests: ['AI', 'Startups', 'Technology'],
      introNote: '“What are you building right now that feels slightly irrational?”',
      lastMessage: 'Soldered the first PCB for the keystroke biometric monitor. Will upload schematics tonight.',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
    },
  ]);

  // Initial messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'm-1',
      connectionId: 'conn-maya',
      senderId: 'currentUser',
      text: 'What is an idea you believe deeply that almost everyone in your field ignores?',
      timestamp: 'Yesterday 10:15 AM',
      isStarterPrompt: true,
    },
    {
      id: 'm-2',
      connectionId: 'conn-maya',
      senderId: 'p-maya',
      text: 'That imperfection and mechanical decay are what give memories emotional weight. When we clean up 16mm film or generate pristine 4K video, we accidentally sterilize the nostalgic texture.',
      timestamp: 'Yesterday 10:42 AM',
    },
    {
      id: 'm-3',
      connectionId: 'conn-maya',
      senderId: 'currentUser',
      text: 'Totally agree. It feels like our tools are obsessing over visual resolution while ignoring emotional fidelity.',
      timestamp: 'Yesterday 11:20 AM',
    },
    {
      id: 'm-4',
      connectionId: 'conn-maya',
      senderId: 'p-maya',
      text: 'Exactly. The acoustics of old tape degradation is something neural models still struggle to capture accurately.',
      timestamp: '12:40 PM',
    },
    {
      id: 'm-5',
      connectionId: 'conn-arjun',
      senderId: 'currentUser',
      text: 'What are you building right now that feels slightly irrational?',
      timestamp: '3 days ago 2:10 PM',
      isStarterPrompt: true,
    },
    {
      id: 'm-6',
      connectionId: 'conn-arjun',
      senderId: 'p-arjun',
      text: 'Soldered the first PCB for the keystroke biometric monitor. Will upload schematics tonight.',
      timestamp: 'Yesterday 8:05 PM',
    },
  ]);

  const [activeConnectionId, setActiveConnectionId] = useState<string | null>('conn-maya');
  const [boardPosts, setBoardPosts] = useState<CuriousBoardPost[]>(SAMPLE_BOARD_POSTS);

  // Save current user to localStorage
  useEffect(() => {
    localStorage.setItem('misfits_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Handle Onboarding Completion
  const handleCompleteOnboarding = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    setIsOnboardingOpen(false);
    setActiveTab('discover');
  };

  // Toggle bookmarking profile
  const handleToggleBookmark = (profileId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  };

  // Trigger connect modal
  const handleOpenConnectModal = (profile: UserProfile) => {
    setConnectModalTarget(profile);
  };

  // Start conversation & create connection
  const handleStartConversation = (targetProfile: UserProfile, starterMessage: string) => {
    // Check if connection already exists
    let existingConn = connections.find((c) => c.profileId === targetProfile.id);

    if (!existingConn) {
      const newConnId = `conn-${Date.now()}`;
      const mutualIntents = currentUser
        ? targetProfile.intents.filter((i) => currentUser.intents.includes(i))
        : targetProfile.intents.slice(0, 2);
      const mutualInterests = currentUser
        ? targetProfile.interests.filter((i) => currentUser.interests.includes(i))
        : targetProfile.interests.slice(0, 2);

      const newConnection: Connection = {
        id: newConnId,
        profileId: targetProfile.id,
        profile: targetProfile,
        connectedAt: 'Just now',
        status: 'connected',
        sharedIntents: mutualIntents.length > 0 ? mutualIntents : targetProfile.intents.slice(0, 1),
        sharedInterests: mutualInterests.length > 0 ? mutualInterests : targetProfile.interests.slice(0, 2),
        introNote: starterMessage,
        lastMessage: starterMessage,
        lastMessageTime: 'Just now',
        unreadCount: 0,
      };

      setConnections((prev) => [newConnection, ...prev]);
      existingConn = newConnection;
    }

    // Add intro message
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      connectionId: existingConn.id,
      senderId: 'currentUser',
      text: starterMessage,
      timestamp: 'Just now',
      isStarterPrompt: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setConnectModalTarget(null);
    setActiveConnectionId(existingConn.id);
    setActiveTab('messages');

    // Simulate realistic thoughtful response after a brief unhurried interval
    setTimeout(() => {
      const responseReplies = [
        `Thanks for reaching out! I was just reading about this earlier. What pulled you into this space initially?`,
        `Fascinating question. I've been thinking about this for months—glad to find someone else exploring the exact same thread.`,
        `That resonated with me. I love that you noticed that in my profile. Are you currently building something around this?`,
      ];
      const randomReply = responseReplies[Math.floor(Math.random() * responseReplies.length)];

      const simulatedMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        connectionId: existingConn.id,
        senderId: targetProfile.id,
        text: randomReply,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, simulatedMsg]);
    }, 2500);
  };

  // Send message in existing chat
  const handleSendMessage = (connectionId: string, text: string) => {
    const conn = connections.find((c) => c.id === connectionId);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      connectionId,
      senderId: 'currentUser',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);

    // Update connection last message
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, lastMessage: text, lastMessageTime: 'Just now' }
          : c
      )
    );

    // Simulate thoughtful organic response
    if (conn) {
      setTimeout(() => {
        const replies = [
          `That makes so much sense. How do you think about the trade-offs when experimenting with that?`,
          `I hadn't looked at it from that angle before. Have you read anything that changed your mind on this recently?`,
          `Very true. Let's definitely keep this thread going—I want to test a similar idea this weekend.`,
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const replyMsg: ChatMessage = {
          id: `msg-${Date.now() + 2}`,
          connectionId,
          senderId: conn.profile.id,
          text: randomReply,
          timestamp: 'Just now',
        };

        setMessages((prev) => [...prev, replyMsg]);
        setConnections((prev) =>
          prev.map((c) =>
            c.id === connectionId
              ? { ...c, lastMessage: randomReply, lastMessageTime: 'Just now' }
              : c
          )
        );
      }, 3000);
    }
  };

  // Connect from thought board
  const handleConnectWithBoardAuthor = (authorId: string, contextPostText: string) => {
    const authorProfile = profiles.find((p) => p.id === authorId) || profiles[0];
    handleStartConversation(
      authorProfile,
      `Saw your note on the Curiosity Board: “${contextPostText.slice(0, 60)}...” — I would love to talk about this.`
    );
  };

  // Add post to curiosity board
  const handleAddBoardPost = (newPost: CuriousBoardPost) => {
    setBoardPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F0] flex flex-col font-sans-clean selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      
      {/* Top Persistent Minimal Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenSignIn={() => setIsSignInOpen(true)}
        unreadCount={connections.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
        connectionsCount={connections.length}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onStartOnboarding={() => setIsOnboardingOpen(true)}
            onEnterOrb={() => setActiveTab('orb')}
            onExplore={() => setActiveTab('discover')}
            onSelectProfile={(profile) => {
              handleOpenConnectModal(profile);
            }}
            onSelectIntent={(intent: ConnectionIntent) => {
              setActiveTab('discover');
            }}
            allProfiles={profiles}
          />
        )}

        {activeTab === 'orb' && (
          <OrbView
            currentUser={currentUser}
            connections={connections}
            allProfiles={profiles}
            onExplore={() => setActiveTab('discover')}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenChatWithProfile={(profileId) => {
              const existing = connections.find((c) => c.profileId === profileId);
              if (existing) {
                setActiveConnectionId(existing.id);
                setActiveTab('messages');
              } else {
                const targetProfile = profiles.find((p) => p.id === profileId);
                if (targetProfile) {
                  handleOpenConnectModal(targetProfile);
                }
              }
            }}
            onSelectProfile={(profile) => {
              handleOpenConnectModal(profile);
            }}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            profiles={profiles}
            currentUser={currentUser}
            onConnect={handleOpenConnectModal}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreBoardView
            posts={boardPosts}
            onAddPost={handleAddBoardPost}
            currentUser={currentUser}
            onConnectWithAuthor={handleConnectWithBoardAuthor}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsView
            connections={connections}
            onOpenChat={(connId) => {
              setActiveConnectionId(connId);
              setActiveTab('messages');
            }}
            onExplore={() => setActiveTab('discover')}
            onOpenOrb={() => setActiveTab('orb')}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesView
            connections={connections}
            activeConnectionId={activeConnectionId}
            onSelectConnection={(id) => setActiveConnectionId(id)}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={currentUser}
            onExplore={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onUpdateProfile={(updated) => setCurrentUser(updated)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onExplore={() => setActiveTab('discover')}
          />
        )}
      </main>

      {/* Onboarding Focused Modal (5 Steps) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleCompleteOnboarding}
        initialUser={currentUser}
      />

      {/* Connect & Conversation Starter Modal */}
      <ConnectModal
        isOpen={!!connectModalTarget}
        onClose={() => setConnectModalTarget(null)}
        targetProfile={connectModalTarget}
        currentUser={currentUser}
        onStartConversation={handleStartConversation}
      />

      {/* Member Sign In / Authentication Modal */}
      <AuthModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('misfits_current_user', JSON.stringify(user));
        }}
        onOpenOnboarding={() => {
          setIsSignInOpen(false);
          setIsOnboardingOpen(true);
        }}
      />

    </div>
  );
}
