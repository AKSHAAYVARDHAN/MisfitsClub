import React, { useState } from 'react';
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
import { authService } from './services/authService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter, AppRoute } from './context/RouterContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { OrbView } from './components/OrbView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DiscoverView } from './components/DiscoverView';
import { ConnectModal } from './components/ConnectModal';
import { MessagesView } from './components/MessagesView';
import { ConnectionsView } from './components/ConnectionsView';
import { ExploreBoardView } from './components/ExploreBoardView';
import { ProfileView } from './components/ProfileView';
import { SignInView } from './components/SignInView';
import { SignUpView } from './components/SignUpView';

function MainApp() {
  const { user, isAuthenticated, isLoading, signOut, completeOnboarding, updateUser } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [profiles] = useState<UserProfile[]>(() => authService.getAllProfiles());
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
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
  ]);

  const [activeConnectionId, setActiveConnectionId] = useState<string>('conn-maya');
  const [boardPosts, setBoardPosts] = useState<CuriousBoardPost[]>(SAMPLE_BOARD_POSTS);

  // Map route to activeTab
  const getActiveTabFromPath = (path: AppRoute): ActiveTab => {
    switch (path) {
      case '/': return 'landing';
      case '/signin': return 'signin';
      case '/signup': return 'signup';
      case '/orb': return 'orb';
      case '/discover': return 'discover';
      case '/board': return 'board';
      case '/connections': return 'connections';
      case '/messages': return 'messages';
      case '/profile': return 'profile';
      case '/onboarding': return 'onboarding';
      default: return 'landing';
    }
  };

  const activeTab = getActiveTabFromPath(currentPath);

  // Map tab clicks to route navigation
  const handleTabChange = (tab: ActiveTab) => {
    switch (tab) {
      case 'landing':
        navigate('/');
        break;
      case 'signin':
        navigate('/signin');
        break;
      case 'signup':
        navigate('/signup');
        break;
      case 'orb':
        navigate('/orb');
        break;
      case 'discover':
        navigate('/discover');
        break;
      case 'board':
      case 'explore':
        navigate('/board');
        break;
      case 'connections':
        navigate('/connections');
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'onboarding':
        navigate('/onboarding');
        break;
      default:
        navigate('/');
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    if (authenticatedUser.onboardingCompleted === false) {
      navigate('/onboarding');
    } else {
      navigate('/orb');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleCompleteOnboarding = async (updated: UserProfile) => {
    await completeOnboarding(updated);
    navigate('/orb');
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenConnectModal = (target: UserProfile) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    setConnectModalTarget(target);
  };

  // Start new conversation from connect modal
  const handleStartConversation = (target: UserProfile, introPrompt: string) => {
    const existingConn = connections.find((c) => c.profileId === target.id);
    if (existingConn) {
      setActiveConnectionId(existingConn.id);
      navigate('/messages');
      setConnectModalTarget(null);
      return;
    }

    const newConnId = `conn-${Date.now()}`;
    const newConnection: Connection = {
      id: newConnId,
      profileId: target.id,
      profile: target,
      connectedAt: 'Just now',
      status: 'connected',
      sharedIntents: target.intents.filter((i) => (user?.intents || []).includes(i)),
      sharedInterests: target.interests.filter((i) => (user?.interests || []).includes(i)),
      introNote: introPrompt,
      lastMessage: introPrompt,
      lastMessageTime: 'Just now',
      unreadCount: 0,
    };

    const starterMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      connectionId: newConnId,
      senderId: 'currentUser',
      text: introPrompt,
      timestamp: 'Just now',
      isStarterPrompt: true,
    };

    setConnections((prev) => [newConnection, ...prev]);
    setMessages((prev) => [...prev, starterMessage]);
    setActiveConnectionId(newConnId);
    setConnectModalTarget(null);
    navigate('/messages');
  };

  // Send message inside conversation
  const handleSendMessage = (connectionId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      connectionId,
      senderId: 'currentUser',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, lastMessage: text, lastMessageTime: 'Just now' }
          : c
      )
    );

    // Simulated reply from other user
    const conn = connections.find((c) => c.id === connectionId);
    if (conn) {
      setTimeout(() => {
        const replies = [
          `That perspective hits on something subtle. I've been noticing the exact same phenomenon lately.`,
          `Fascinating point. Have you considered how this changes once we move past current constraints?`,
          `I love this angle. It reminds me of a conversation I had about analog feedback loops.`,
          `This would make an incredible experiment. We should prototype a small version.`,
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          connectionId,
          senderId: conn.profileId,
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
      }, 2500);
    }
  };

  const handleConnectWithBoardAuthor = (authorId: string, contextPostText: string) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    const authorProfile = profiles.find((p) => p.id === authorId) || profiles[0];
    handleStartConversation(
      authorProfile,
      `Saw your note on the Curiosity Board: “${contextPostText.slice(0, 60)}...” — I would love to talk about this.`
    );
  };

  const handleAddBoardPost = (newPost: CuriousBoardPost) => {
    setBoardPosts((prev) => [newPost, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-[#F2F2ED]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-ping" />
          <span className="text-xs font-mono-code uppercase tracking-widest text-[#8A8A8A]">
            MISFITS CLUB · VERIFYING SESSION...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2F2ED] flex flex-col font-sans-clean selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* Top Persistent Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={user}
        onOpenOnboarding={() => {
          if (user) {
            navigate('/onboarding');
          } else {
            navigate('/signup');
          }
        }}
        onOpenSignIn={() => navigate('/signin')}
        onSignOut={handleSignOut}
        unreadCount={connections.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
        connectionsCount={connections.length}
      />

      {/* Main View Router */}
      <main className="flex-1">
        
        {/* Sign In View */}
        {currentPath === '/signin' && (
          <SignInView
            onSuccess={handleAuthSuccess}
            onNavigateToSignUp={() => navigate('/signup')}
            onClose={() => navigate('/')}
          />
        )}

        {/* Sign Up View */}
        {currentPath === '/signup' && (
          <SignUpView
            onSuccess={handleAuthSuccess}
            onNavigateToSignIn={() => navigate('/signin')}
            onClose={() => navigate('/')}
          />
        )}

        {/* Dedicated Onboarding Flow */}
        {currentPath === '/onboarding' && (
          <OnboardingFlow
            currentUser={user || INITIAL_USER}
            onComplete={handleCompleteOnboarding}
            onCancel={() => navigate(user?.onboardingCompleted ? '/orb' : '/')}
          />
        )}

        {/* Public / Landing Page */}
        {currentPath === '/' && (
          <LandingPage
            currentUser={user}
            onStartOnboarding={() => {
              if (user) {
                if (user.onboardingCompleted === false) {
                  navigate('/onboarding');
                } else {
                  navigate('/discover');
                }
              } else {
                navigate('/signup');
              }
            }}
            onEnterOrb={() => {
              if (user) {
                navigate('/orb');
              } else {
                navigate('/signin');
              }
            }}
            onExplore={() => {
              if (user) {
                navigate('/discover');
              } else {
                navigate('/signin');
              }
            }}
            onSelectProfile={(profile) => {
              handleOpenConnectModal(profile);
            }}
            onSelectIntent={(intent: ConnectionIntent) => {
              if (user) {
                navigate('/discover');
              } else {
                navigate('/signin');
              }
            }}
            allProfiles={profiles}
          />
        )}

        {/* 3D Orb View */}
        {currentPath === '/orb' && (
          <OrbView
            currentUser={user || INITIAL_USER}
            connections={connections}
            allProfiles={profiles}
            onExplore={() => navigate('/discover')}
            onOpenOnboarding={() => navigate('/onboarding')}
            onOpenChatWithProfile={(profileId) => {
              const existing = connections.find((c) => c.profileId === profileId);
              if (existing) {
                setActiveConnectionId(existing.id);
                navigate('/messages');
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

        {/* Discover View */}
        {currentPath === '/discover' && (
          <DiscoverView
            profiles={profiles}
            currentUser={user || INITIAL_USER}
            onConnect={handleOpenConnectModal}
            onOpenOnboarding={() => navigate('/onboarding')}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {/* Explore / Curiosity Board View */}
        {currentPath === '/board' && (
          <ExploreBoardView
            posts={boardPosts}
            onAddPost={handleAddBoardPost}
            currentUser={user || INITIAL_USER}
            onConnectWithAuthor={handleConnectWithBoardAuthor}
            onOpenOnboarding={() => navigate('/onboarding')}
          />
        )}

        {/* Connections / Circle View */}
        {currentPath === '/connections' && (
          <ConnectionsView
            connections={connections}
            onOpenChat={(connId) => {
              setActiveConnectionId(connId);
              navigate('/messages');
            }}
            onExplore={() => navigate('/discover')}
            onOpenOrb={() => navigate('/orb')}
          />
        )}

        {/* Intimate Messages View */}
        {currentPath === '/messages' && (
          <MessagesView
            connections={connections}
            activeConnectionId={activeConnectionId}
            onSelectConnection={(id) => setActiveConnectionId(id)}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={user || INITIAL_USER}
            onExplore={() => navigate('/discover')}
          />
        )}

        {/* Profile View */}
        {currentPath === '/profile' && (
          <ProfileView
            currentUser={user || INITIAL_USER}
            onUpdateProfile={async (updated) => {
              await updateUser(updated);
            }}
            onOpenOnboarding={() => navigate('/onboarding')}
            onExplore={() => navigate('/discover')}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {/* Connect & Conversation Starter Modal */}
      <ConnectModal
        isOpen={!!connectModalTarget}
        onClose={() => setConnectModalTarget(null)}
        targetProfile={connectModalTarget}
        currentUser={user || INITIAL_USER}
        onStartConversation={handleStartConversation}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <MainApp />
      </RouterProvider>
    </AuthProvider>
  );
}
