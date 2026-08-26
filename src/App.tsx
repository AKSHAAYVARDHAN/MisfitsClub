import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  PublicProfile,
  Connection, 
  ChatMessage, 
  CuriousBoardPost, 
  AppNotification
} from './types';
import { 
  INITIAL_USER, 
  SAMPLE_PROFILES, 
  SAMPLE_BOARD_POSTS 
} from './data/mockData';
import { firestoreService } from './services/firestoreService';
import { connectionService, getOtherParticipantId } from './services/connectionService';
import { notificationService } from './services/notificationService';
import { messageService } from './services/messageService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter, AppRoute } from './context/RouterContext';
import { Navbar } from './components/Navbar';
import { PlatformShell } from './components/PlatformShell';
import { LandingPage } from './components/LandingPage';
import { OrbView } from './components/OrbView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DiscoverView } from './components/DiscoverView';
import { ConnectModal } from './components/ConnectModal';
import { MemberProfileModal } from './components/MemberProfileModal';
import { MessagesView } from './components/MessagesView';
import { ConnectionsView } from './components/ConnectionsView';
import { ExploreBoardView } from './components/ExploreBoardView';
import { SpacesView } from './components/SpacesView';
import { MySpaceView } from './components/MySpaceView';
import { ProfileView } from './components/ProfileView';
import { SignInView } from './components/SignInView';
import { SignUpView } from './components/SignUpView';

const INITIAL_SAMPLE_CONNECTIONS: Connection[] = [
  {
    id: 'conn-maya',
    profileId: 'p-maya',
    profile: SAMPLE_PROFILES[0], // Maya
    connectedAt: 'Yesterday',
    status: 'connected',
    sharedIntents: ['Build Together', 'Exchange Ideas'],
    sharedInterests: ['Audio Synthesis', 'Creative Coding'],
    introNote: 'Loved your exploration of tactile audio interfaces.',
    lastMessage: 'Exactly. The acoustics of old tape degradation is something neural models still struggle to capture accurately.',
    lastMessageTime: '12:40 PM',
    unreadCount: 0,
  },
  {
    id: 'conn-elena',
    profileId: 'p-elena',
    profile: SAMPLE_PROFILES[1], // Elena
    connectedAt: '3 days ago',
    status: 'connected',
    sharedIntents: ['Find a Co-founder', 'Collaborate'],
    sharedInterests: ['Robotics', 'Physical Computing'],
    introNote: 'Building micro-satellites sounds incredible. Would love to swap notes on kinematics.',
    lastMessage: 'I am testing the new brushless gimbal motors this afternoon at the lab if you want to see the torque benchmarks.',
    lastMessageTime: 'Tuesday',
    unreadCount: 1,
  },
  {
    id: 'conn-tariq',
    profileId: 'p-tariq',
    profile: SAMPLE_PROFILES[3], // Tariq
    connectedAt: '5 days ago',
    status: 'connected',
    sharedIntents: ['Learn Together', 'Just Talk'],
    sharedInterests: ['Computational Biology', 'Systems Theory'],
    introNote: 'Your work on synthetic fungal networks blew my mind.',
    lastMessage: 'Let us hop on a sync when you have 15 minutes.',
    lastMessageTime: 'Oct 14',
    unreadCount: 0,
  },
];

const INITIAL_SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'sample-notif-1',
    recipientId: 'current-user',
    senderId: 'p-elena',
    senderName: 'Elena Rostova',
    senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    senderRole: 'Aerospace Engineer · Micro-satellites',
    type: 'CONNECTION_REQUEST',
    title: 'Connection Request',
    message: 'Elena Rostova sent you a connection request.',
    referenceId: 'conn-elena',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'sample-notif-2',
    recipientId: 'current-user',
    senderId: 'p-maya',
    senderName: 'Maya Lin',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    senderRole: 'Creative Technologist · Ambient Audio',
    type: 'CONNECTION_ACCEPTED',
    title: 'Connection Accepted',
    message: 'Maya Lin accepted your connection request.',
    referenceId: 'conn-maya',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

function MainApp() {
  const { user, isAuthenticated, isLoading, signOut, completeOnboarding, updateUser } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [profiles, setProfiles] = useState<(UserProfile | PublicProfile)[]>(SAMPLE_PROFILES);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [connectModalTarget, setConnectModalTarget] = useState<UserProfile | PublicProfile | null>(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<PublicProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(false);

  // Connections list synchronized from Firestore with local fallback
  const [connections, setConnections] = useState<Connection[]>(INITIAL_SAMPLE_CONNECTIONS);
  const [connectionsInitialTab, setConnectionsInitialTab] = useState<'connected' | 'received' | 'sent'>('connected');

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_SAMPLE_NOTIFICATIONS);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);

  // Active chat & messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      connectionId: 'conn-maya',
      senderId: 'p-maya',
      text: 'Loved your exploration of tactile audio interfaces.',
      timestamp: 'Yesterday 10:42 AM',
      isStarterPrompt: true,
    },
    {
      id: 'm-2b',
      connectionId: 'conn-maya',
      senderId: 'p-maya',
      text: 'What made you start exploring this?',
      timestamp: 'Yesterday 10:43 AM',
    },
    {
      id: 'm-3',
      connectionId: 'conn-maya',
      senderId: 'currentUser',
      text: 'I started exploring it after reading about how spatial memory and analog tactile interfaces shape human cognition.',
      timestamp: 'Yesterday 11:20 AM',
    },
    {
      id: 'm-3b',
      connectionId: 'conn-maya',
      senderId: 'currentUser',
      text: 'It feels like our tools are obsessing over visual resolution while ignoring emotional fidelity.',
      timestamp: 'Yesterday 11:21 AM',
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
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  // Keep ref for connections to avoid re-triggering effects on state updates
  const connectionsRef = useRef<Connection[]>(connections);
  connectionsRef.current = connections;

  // Synchronize live members directory from Firestore.
  // IMPORTANT: Only subscribe after Firebase Auth has fully resolved.
  useEffect(() => {
    if (isLoading) return;
    const currentUserId = user?.uid || user?.id;
    if (!currentUserId) {
      return;
    }
    const unsub = firestoreService.subscribeUsers((liveUsers) => {
      if (liveUsers && liveUsers.length > 0) {
        setProfiles(liveUsers);
      }
    }, currentUserId);
    return () => unsub();
  }, [user?.uid, user?.id, isLoading]);

  // Synchronize live community curiosity / Spark board from Firestore
  useEffect(() => {
    const unsub = firestoreService.subscribeBoardPosts((livePosts) => {
      if (livePosts && livePosts.length > 0) {
        setBoardPosts(livePosts);
      }
    });
    return () => unsub();
  }, []);

  // Synchronize real-time user connections from Firestore
  useEffect(() => {
    const currentUserId = user?.uid || user?.id;
    if (!currentUserId) return;

    const unsub = connectionService.subscribeUserConnections(currentUserId, (liveConns) => {
      if (liveConns && liveConns.length > 0) {
        const liveIds = new Set(liveConns.map((c) => c.id));
        const merged = [...liveConns];
        for (const sample of INITIAL_SAMPLE_CONNECTIONS) {
          if (!liveIds.has(sample.id)) {
            merged.push(sample);
          }
        }
        setConnections(merged);
      } else {
        setConnections(INITIAL_SAMPLE_CONNECTIONS);
      }
    });

    return () => unsub();
  }, [user?.uid, user?.id]);

  // Synchronize real-time conversations metadata & unread counts
  useEffect(() => {
    const currentUserId = user?.uid || user?.id;
    if (!currentUserId) return;

    const unsub = messageService.subscribeUserConversations(currentUserId, (liveConvos) => {
      if (liveConvos && liveConvos.length > 0) {
        setConnections((prev) => {
          let hasChange = false;
          const next = prev.map((conn) => {
            const otherId = getOtherParticipantId(conn, currentUserId);
            const convo = liveConvos.find(
              (c) =>
                (c.participantIds.includes(currentUserId) && otherId && c.participantIds.includes(otherId)) ||
                c.connectionId === conn.id
            );
            if (convo) {
              const newLastMsg = convo.lastMessage || conn.lastMessage;
              const newTime = convo.lastMessageAt ? 'Active' : conn.lastMessageTime;
              const newUnread = convo.unreadCounts?.[currentUserId] ?? conn.unreadCount;
              if (
                newLastMsg !== conn.lastMessage ||
                newTime !== conn.lastMessageTime ||
                newUnread !== conn.unreadCount
              ) {
                hasChange = true;
                return {
                  ...conn,
                  lastMessage: newLastMsg,
                  lastMessageTime: newTime,
                  unreadCount: newUnread,
                };
              }
            }
            return conn;
          });
          return hasChange ? next : prev;
        });
      }
    });

    return () => unsub();
  }, [user?.uid, user?.id]);

  // Synchronize real-time messages for active conversation
  useEffect(() => {
    const currentUserId = user?.uid || user?.id;
    if (!currentUserId) return;
    const activeConn = connectionsRef.current.find((c) => c.id === activeConnectionId);
    if (!activeConn) return;

    const targetUserId = getOtherParticipantId(activeConn, currentUserId);
    if (!targetUserId) return;

    if (targetUserId.startsWith('p-') || targetUserId === 'sample-target') return;

    let conversationId: string;
    try {
      conversationId = messageService.getDeterministicConversationId(currentUserId, targetUserId);
    } catch {
      return;
    }

    if (currentPath === '/messages') {
      messageService.markConversationAsRead(conversationId, currentUserId);
      setConnections((prev) => {
        const target = prev.find((c) => c.id === activeConnectionId);
        if (target && (target.unreadCount || 0) > 0) {
          return prev.map((c) => (c.id === activeConnectionId ? { ...c, unreadCount: 0 } : c));
        }
        return prev;
      });
    }

    const unsub = messageService.subscribeConversationMessages(conversationId, (liveMsgs) => {
      if (liveMsgs && liveMsgs.length > 0) {
        setMessages((prev) => {
          const otherMsgs = prev.filter(
            (m) => m.connectionId !== activeConnectionId && m.conversationId !== conversationId
          );
          return [...otherMsgs, ...liveMsgs];
        });
      }
    });

    return () => unsub();
  }, [activeConnectionId, currentPath, user?.uid, user?.id]);

  // Synchronize real-time user notifications from Firestore
  useEffect(() => {
    const currentUserId = user?.uid || user?.id;
    if (!currentUserId) {
      setNotifications(INITIAL_SAMPLE_NOTIFICATIONS);
      return;
    }

    setIsLoadingNotifications(true);
    const unsub = notificationService.subscribeUserNotifications(currentUserId, (liveNotifs) => {
      setIsLoadingNotifications(false);
      if (liveNotifs && liveNotifs.length > 0) {
        setNotifications(liveNotifs);
      } else {
        setNotifications(INITIAL_SAMPLE_NOTIFICATIONS);
      }
    });

    return () => unsub();
  }, [user?.uid, user?.id]);

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    const currentUserId = user?.uid || user?.id || 'current-user';
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    try {
      await notificationService.markNotificationAsRead(notificationId, currentUserId);
    } catch (e) {
      console.warn('Marked notification read locally', e);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    const currentUserId = user?.uid || user?.id || 'current-user';
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllNotificationsAsRead(currentUserId, notifications);
    } catch (e) {
      console.warn('Marked all notifications read locally', e);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    await handleMarkNotificationAsRead(notif.id);

    if (notif.type === 'CONNECTION_REQUEST') {
      setConnectionsInitialTab('received');
      navigate('/connections');
    } else if (notif.type === 'CONNECTION_ACCEPTED') {
      if (notif.referenceId) {
        setActiveConnectionId(notif.referenceId);
        navigate('/messages');
      } else {
        setConnectionsInitialTab('connected');
        navigate('/connections');
      }
    } else if (notif.type === 'SPARK_INTERACTION') {
      navigate('/board');
    } else if (notif.type === 'MESSAGE') {
      if (notif.referenceId) {
        const matched = connections.find(
          (c) =>
            c.id === notif.referenceId ||
            c.profileId === notif.senderId ||
            c.targetId === notif.senderId ||
            c.profileId === notif.referenceId
        );
        if (matched) {
          setActiveConnectionId(matched.id);
        } else {
          setActiveConnectionId(notif.referenceId);
        }
      }
      navigate('/messages');
    } else {
      navigate('/connections');
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

  const handleOpenConnectModal = (target: UserProfile | PublicProfile) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    setConnectModalTarget(target as UserProfile);
  };

  // Start new conversation / Send connection request
  const handleStartConversation = async (target: UserProfile | PublicProfile, introPrompt: string) => {
    const currentUserId = user?.uid || user?.id || 'current-user';
    const targetUserId = target.uid || target.id;

    const existingConn = connections.find(
      (c) =>
        c.profileId === targetUserId ||
        c.targetId === targetUserId ||
        c.requesterId === targetUserId ||
        (c.participants && c.participants.includes(targetUserId))
    );

    if (existingConn && existingConn.status === 'connected') {
      setActiveConnectionId(existingConn.id);
      navigate('/messages');
      setConnectModalTarget(null);
      return;
    }

    const currentUserObj = user || INITIAL_USER;
    
    try {
      const createdConn = await connectionService.sendConnectionRequest({
        requester: currentUserObj,
        target,
        introNote: introPrompt,
      });

      const starterMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        connectionId: createdConn.id,
        senderId: currentUserId,
        text: introPrompt,
        timestamp: 'Just now',
        isStarterPrompt: true,
      };

      setConnections((prev) => [
        createdConn,
        ...prev.filter((c) => c.id !== createdConn.id),
      ]);
      setMessages((prev) => [...prev, starterMessage]);
      setActiveConnectionId(createdConn.id);
      setConnectModalTarget(null);
      setSelectedMemberProfile(null);

      await firestoreService.sendMessage(starterMessage);
      navigate('/connections');
    } catch (e) {
      console.warn('Error starting connection, applied optimistically', e);
      setConnectModalTarget(null);
      setSelectedMemberProfile(null);
      navigate('/connections');
    }
  };

  // Accept Connection Request
  const handleAcceptConnection = async (connectionId: string) => {
    const currentUserId = user?.uid || user?.id || 'current-user';
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: 'connected', connectedAt: 'Just now' }
          : c
      )
    );
    try {
      await connectionService.acceptConnection(connectionId, currentUserId, user || INITIAL_USER);
    } catch (e) {
      console.warn('Failed to accept connection in Firestore', e);
    }
  };

  // Decline Connection Request
  const handleDeclineConnection = async (connectionId: string) => {
    const currentUserId = user?.uid || user?.id || 'current-user';
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: 'declined' } : c
      )
    );
    try {
      await connectionService.declineConnection(connectionId, currentUserId);
    } catch (e) {
      console.warn('Failed to decline connection in Firestore', e);
    }
  };

  // Cancel Pending Outgoing Request
  const handleCancelConnectionRequest = async (connectionId: string) => {
    const currentUserId = user?.uid || user?.id || 'current-user';
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    try {
      await connectionService.cancelConnectionRequest(connectionId, currentUserId);
    } catch (e) {
      console.warn('Failed to cancel connection request in Firestore', e);
    }
  };

  // Remove Connection
  const handleRemoveConnection = async (connectionId: string) => {
    const currentUserId = user?.uid || user?.id || 'current-user';
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    try {
      await connectionService.removeConnection(connectionId, currentUserId);
    } catch (e) {
      console.warn('Failed to remove connection in Firestore', e);
    }
  };

  // Send message inside conversation
  const handleSendMessage = async (connectionId: string, text: string) => {
    const currentUserId = user?.uid || user?.id || 'currentUser';
    const conn = connections.find((c) => c.id === connectionId);
    
    if (!conn) {
      console.warn('Cannot send message: conversation connection not found.');
      return;
    }

    const targetUserId = getOtherParticipantId(conn, currentUserId) || 'sample-target';

    let conversationId: string;
    try {
      conversationId = messageService.getDeterministicConversationId(currentUserId, targetUserId);
    } catch (idErr) {
      console.error('Failed to compute conversation ID:', idErr);
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      connectionId,
      senderId: currentUserId,
      senderName: user?.name || INITIAL_USER.name,
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, lastMessage: text, lastMessageTime: 'Just now', unreadCount: 0 }
          : c
      )
    );

    if (!targetUserId.startsWith('p-') && targetUserId !== 'sample-target') {
      try {
        await messageService.sendMessage({
          conversationId,
          senderId: currentUserId,
          senderProfile: user || INITIAL_USER,
          recipientId: targetUserId,
          recipientProfile: conn.profile,
          text,
          connectionId,
        });
      } catch (e: any) {
        console.error('Error sending message to Firestore:', e);
      }
    }

    if (conn.profileId && conn.profileId.startsWith('p-')) {
      setTimeout(async () => {
        const replies = [
          `That perspective hits on something subtle. I've been noticing the exact same phenomenon lately.`,
          `Fascinating point. Have you considered how this changes once we move past current constraints?`,
          `I love this angle. It reminds me of a conversation I had about analog feedback loops.`,
          `This would make an incredible experiment. We should prototype a small version together.`,
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          conversationId,
          connectionId,
          senderId: conn.profileId,
          senderName: conn.profile?.name || 'Member',
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
      }, 2000);
    }
  };

  const handleConnectWithBoardAuthor = (authorId: string, contextPostText?: string) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    const authorProfile = profiles.find((p) => p.id === authorId) || profiles[0];
    const previewText = (contextPostText || '').slice(0, 60);
    handleStartConversation(
      authorProfile,
      `Saw your note on Spark: “${previewText}...” — I would love to talk about this.`
    );
  };

  const handleAddBoardPost = async (newPost: CuriousBoardPost) => {
    setBoardPosts((prev) => [newPost, ...prev]);
    try {
      await firestoreService.addBoardPost(newPost);
    } catch (e) {
      console.warn('Persisted board post locally', e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-[#F2F2ED]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-ping" />
          <span className="text-xs font-mono-code uppercase tracking-widest text-[#8A8A8A]">
            MISFITS CLUB · SYNCHRONIZING CLOUD SESSION...
          </span>
        </div>
      </div>
    );
  }

  // Count unread notifications & messages
  const unreadMessagesCount = connections.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const activeConnectionsCount = connections.filter((c) => c.status === 'connected').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const isPublicView = currentPath === '/' || currentPath === '/signin' || currentPath === '/signup';
  const isOnboardingView = currentPath === '/onboarding';

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2F2ED] flex flex-col font-sans-clean selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* 1. PUBLIC MARKETING & AUTHENTICATION VIEWS (Signed Out) */}
      {isPublicView && (
        <div className="flex-1 flex flex-col">
          {/* Public Navbar shown ONLY for Landing Page */}
          {currentPath === '/' && (
            <Navbar
              onNavigateHome={() => navigate('/')}
              onOpenSignIn={() => navigate('/signin')}
              onOpenSignUp={() => navigate('/signup')}
              onEnterOrb={() => navigate('/signin')}
            />
          )}

          <main className="flex-1">
            {/* Public Landing Page */}
            {currentPath === '/' && (
              <LandingPage
                currentUser={null}
                allProfiles={profiles}
                onStartOnboarding={() => navigate('/signup')}
                onEnterOrb={() => navigate('/signin')}
                onExplore={() => navigate('/signin')}
                onSignIn={() => navigate('/signin')}
                onOpenMemberProfile={(profile) => setSelectedMemberProfile(profile as PublicProfile)}
                onSelectProfile={(profile) => setSelectedMemberProfile(profile as PublicProfile)}
                onSelectIntent={(_intent) => navigate('/signin')}
              />
            )}

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
          </main>
        </div>
      )}

      {/* 2. ONBOARDING FLOW */}
      {isOnboardingView && (
        <main className="flex-1">
          <OnboardingFlow
            currentUser={user || INITIAL_USER}
            onComplete={handleCompleteOnboarding}
            onCancel={() => navigate(user?.onboardingCompleted ? '/orb' : '/')}
          />
        </main>
      )}

      {/* 3. AUTHENTICATED PLATFORM SHELL (Signed In) */}
      {!isPublicView && !isOnboardingView && (
        <PlatformShell
          currentPath={currentPath}
          onNavigate={(route) => navigate(route)}
          currentUser={user}
          connectionsCount={activeConnectionsCount}
          unreadMessagesCount={unreadMessagesCount}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onNotificationClick={handleNotificationClick}
          isLoadingNotifications={isLoadingNotifications}
          onSignOut={handleSignOut}
        >
          {/* Interactive 3D Orbit View */}
          {currentPath === '/orb' && (
            <OrbView
              profiles={profiles}
              allProfiles={profiles}
              connections={connections}
              currentUser={user || INITIAL_USER}
              onConnect={handleOpenConnectModal}
              onExplore={() => navigate('/discover')}
              onOpenChatWithProfile={(profileId) => {
                const matchedConn = connections.find(
                  (c) => c.profileId === profileId || c.profile?.id === profileId || c.targetId === profileId
                );
                if (matchedConn) {
                  setActiveConnectionId(matchedConn.id);
                  navigate('/messages');
                } else {
                  const p = profiles.find((prof) => prof.id === profileId);
                  if (p) {
                    handleOpenConnectModal(p as PublicProfile);
                  } else {
                    navigate('/messages');
                  }
                }
              }}
              onSelectProfile={(profile) => setSelectedMemberProfile(profile as PublicProfile)}
              onOpenOnboarding={() => navigate('/onboarding')}
            />
          )}

          {/* Discovery & Member Directory View */}
          {currentPath === '/discover' && (
            <DiscoverView
              profiles={profiles}
              currentUser={user || INITIAL_USER}
              connections={connections}
              isLoading={isLoadingProfiles}
              onConnect={handleOpenConnectModal}
              onOpenChat={(connId) => {
                setActiveConnectionId(connId);
                navigate('/messages');
              }}
              onAcceptRequest={handleAcceptConnection}
              onDeclineRequest={handleDeclineConnection}
              onCancelRequest={handleCancelConnectionRequest}
              onRemoveConnection={handleRemoveConnection}
              onOpenOnboarding={() => navigate('/onboarding')}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {/* Spark Curiosity Board View */}
          {currentPath === '/board' && (
            <ExploreBoardView
              posts={boardPosts}
              onAddPost={handleAddBoardPost}
              currentUser={user || INITIAL_USER}
              onConnectWithAuthor={handleConnectWithBoardAuthor}
              onOpenOnboarding={() => navigate('/onboarding')}
            />
          )}

          {/* Spaces View */}
          {currentPath === '/spaces' && (
            <SpacesView
              currentUser={user || INITIAL_USER}
              selectedSpaceId={selectedSpaceId}
              onSelectSpaceId={(id) => setSelectedSpaceId(id)}
              onSelectMember={(member) => setSelectedMemberProfile(member)}
              onStartMessage={(targetUid) => {
                const matchedConn = connections.find(
                  (c) => c.profileId === targetUid || c.profile?.id === targetUid || c.targetId === targetUid
                );
                if (matchedConn) {
                  setActiveConnectionId(matchedConn.id);
                  navigate('/messages');
                } else {
                  const p = profiles.find((prof) => prof.id === targetUid);
                  if (p) {
                    handleOpenConnectModal(p as PublicProfile);
                  } else {
                    navigate('/messages');
                  }
                }
              }}
            />
          )}

          {/* My Space Personal Dashboard View */}
          {currentPath === '/my-space' && (
            <MySpaceView
              currentUser={user || INITIAL_USER}
              connections={connections}
              onOpenChat={(connId) => {
                setActiveConnectionId(connId);
                navigate('/messages');
              }}
              onSelectProfile={(profile) => setSelectedMemberProfile(profile as PublicProfile)}
              onOpenSpace={(spaceId) => {
                setSelectedSpaceId(spaceId);
                navigate('/spaces');
              }}
              onExploreMembers={() => navigate('/discover')}
              onExploreSpaces={() => {
                setSelectedSpaceId(null);
                navigate('/spaces');
              }}
              onOpenSpark={() => navigate('/board')}
              onAcceptRequest={handleAcceptConnection}
              onDeclineRequest={handleDeclineConnection}
              onCancelRequest={handleCancelConnectionRequest}
              onRemoveConnection={handleRemoveConnection}
            />
          )}

          {/* Connections / Circle View */}
          {currentPath === '/connections' && (
            <ConnectionsView
              connections={connections}
              currentUser={user || INITIAL_USER}
              initialTab={connectionsInitialTab}
              onOpenChat={(connId) => {
                setActiveConnectionId(connId);
                navigate('/messages');
              }}
              onExplore={() => navigate('/discover')}
              onOpenOrb={() => navigate('/orb')}
              onAcceptRequest={handleAcceptConnection}
              onDeclineRequest={handleDeclineConnection}
              onCancelRequest={handleCancelConnectionRequest}
              onRemoveConnection={handleRemoveConnection}
              onSelectProfile={(p) => setSelectedMemberProfile(p as PublicProfile)}
            />
          )}

          {/* Intimate Messages View */}
          {currentPath === '/messages' && (
            <MessagesView
              connections={connections.filter((c) => c.status === 'connected')}
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
        </PlatformShell>
      )}

      {/* Public Member Profile Dedicated View Modal */}
      <MemberProfileModal
        isOpen={!!selectedMemberProfile}
        profile={selectedMemberProfile}
        currentUser={user || INITIAL_USER}
        connections={connections}
        isBookmarked={selectedMemberProfile ? bookmarkedIds.includes(selectedMemberProfile.id) : false}
        onClose={() => setSelectedMemberProfile(null)}
        onConnect={(target) => {
          setSelectedMemberProfile(null);
          handleOpenConnectModal(target);
        }}
        onOpenChat={(connId) => {
          setSelectedMemberProfile(null);
          setActiveConnectionId(connId);
          navigate('/messages');
        }}
        onAcceptRequest={handleAcceptConnection}
        onDeclineRequest={handleDeclineConnection}
        onCancelRequest={handleCancelConnectionRequest}
        onRemoveConnection={handleRemoveConnection}
        onToggleBookmark={handleToggleBookmark}
      />

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
