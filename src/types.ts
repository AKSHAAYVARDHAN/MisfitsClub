export type ConnectionIntent = 
  | 'Build Together'
  | 'Exchange Ideas'
  | 'Collaborate'
  | 'Learn Together'
  | 'Find a Co-founder'
  | 'Find a Mentor'
  | 'Just Talk';

export type MeetArchetype = 
  | 'Anyone worldwide'
  | 'Students'
  | 'Builders'
  | 'Creatives'
  | 'Researchers'
  | 'Entrepreneurs'
  | 'Anyone interesting';

export interface UserProfile {
  id: string;
  uid?: string;
  email?: string;
  name: string;
  handle?: string;
  profilePhoto?: string;
  avatarUrl?: string;
  bio: string;
  college?: string;
  department?: string;
  year?: string;
  skills?: string[];
  interests: string[];
  role: string;
  location?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  roleEmoji?: string;
  tagline?: string;
  curiousAbout?: string[];
  building?: string;
  learning?: string;
  openQuestion?: string;
  intents?: ConnectionIntent[];
  archetypesToMeet?: MeetArchetype[];
  accentColor?: string;
  links?: {
    website?: string;
    github?: string;
    twitter?: string;
    substack?: string;
    readcv?: string;
  };
  whyMatch?: string;
  isOnline?: boolean;
  timeZone?: string;
  joinedDate?: string;
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Public profile data model stored in publicProfiles/{uid}
 * Strictly excludes private information such as email or account auth credentials
 */
export interface PublicProfile {
  id: string; // Firebase Auth UID
  uid: string; // Firebase Auth UID
  name: string;
  handle?: string;
  profilePhoto?: string;
  avatarUrl?: string;
  bio: string;
  college?: string;
  department?: string;
  year?: string;
  skills: string[];
  interests: string[];
  role: string;
  roleEmoji?: string;
  tagline?: string;
  curiousAbout?: string[];
  building?: string;
  learning?: string;
  openQuestion?: string;
  intents: ConnectionIntent[];
  archetypesToMeet?: MeetArchetype[];
  location?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  links?: {
    website?: string;
    github?: string;
    twitter?: string;
    substack?: string;
    readcv?: string;
  };
  whyMatch?: string;
  isOnline?: boolean;
  timeZone?: string;
  joinedDate?: string;
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscoveryFilters {
  searchQuery: string;
  college: string;
  department: string;
  year: string;
  skill: string;
  interest: string;
  intent: ConnectionIntent | 'All';
  archetype: MeetArchetype | 'All';
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileComplete: boolean;
  onboardingDraft?: Partial<UserProfile> | null;
}

export interface OrbLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  profile?: UserProfile;
  isUser?: boolean;
  intents?: ConnectionIntent[];
  connectionsCount?: number;
  lastActive?: string;
}

export type ConnectionStatus = 'pending' | 'connected' | 'declined' | 'archived';

export interface ProfileSummary {
  id: string;
  uid?: string;
  name: string;
  role: string;
  roleEmoji?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  location?: string;
  college?: string;
  department?: string;
  tagline?: string;
  skills?: string[];
  interests?: string[];
  intents?: ConnectionIntent[];
}

export interface Connection {
  id: string;
  requesterId?: string;
  targetId?: string;
  participants?: string[];
  profileId: string;
  profile: UserProfile | PublicProfile;
  requesterSummary?: ProfileSummary;
  targetSummary?: ProfileSummary;
  connectedAt?: string;
  status: ConnectionStatus;
  sharedIntents: ConnectionIntent[];
  sharedInterests: string[];
  introNote?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  connectionId?: string;
  senderId: 'currentUser' | string;
  senderName?: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  readBy?: string[];
  isStarterPrompt?: boolean;
}

export interface Conversation {
  id: string;
  connectionId?: string;
  participantIds: string[];
  participantsSummary?: {
    [uid: string]: {
      name: string;
      avatarUrl?: string;
      profilePhoto?: string;
      role?: string;
      location?: string;
      isOnline?: boolean;
    };
  };
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  unreadCounts?: {
    [uid: string]: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ThoughtSnippet {
  id: string;
  text: string;
  authorName: string;
  authorLocation: string;
  authorRole: string;
  tag: string;
  intent: ConnectionIntent;
}

export interface SparkThinker {
  id: string;
  name: string;
  role?: string;
  location?: string;
  avatarUrl?: string;
  profilePhoto?: string;
}

export interface SparkReply {
  id: string;
  sparkId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorLocation?: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  authorProfile?: PublicProfile | null;
}

export interface CuriousBoardPost {
  id: string;
  authorId: string;
  authorName: string;
  authorLocation: string;
  authorRole: string;
  authorAvatar?: string;
  title?: string;
  content: string;
  intents: ConnectionIntent[];
  tags: string[];
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  repliesCount: number;
  thinkerIds?: string[];
  thinkersSummary?: {
    [uid: string]: SparkThinker;
  };
}

export type ActiveTab = 'landing' | 'orb' | 'discover' | 'board' | 'explore' | 'spaces' | 'connections' | 'messages' | 'profile' | 'signin' | 'signup' | 'onboarding';

export type SpaceCategory = 
  | 'Building'
  | 'Technology'
  | 'Design'
  | 'Art'
  | 'Science'
  | 'Business'
  | 'Learning'
  | 'Writing'
  | 'Gaming'
  | 'Other';

export type SpaceVisibility = 'public' | 'private';

export interface Space {
  id: string;
  name: string;
  description: string;
  category: SpaceCategory;
  tags: string[];
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  ownerRole?: string;
  profilePhoto?: string;
  memberIds: string[];
  memberCount: number;
  visibility: SpaceVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSpaceInput {
  name: string;
  description: string;
  category: SpaceCategory;
  tags: string[];
  profilePhoto?: string;
}

export interface SpaceFilters {
  searchQuery: string;
  category: SpaceCategory | 'All';
  tag: string;
  membershipTab: 'all' | 'my-spaces';
}

export type DiscussionPostType = 'Discussion' | 'Question' | 'Idea';

export interface SpacePost {
  id: string;
  spaceId: string;
  authorId: string;
  type: DiscussionPostType;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  reactionCount: number;
  hasReacted?: boolean;
  authorProfile?: PublicProfile | null;
}

export interface SpaceComment {
  id: string;
  postId: string;
  spaceId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorProfile?: PublicProfile | null;
}

export interface SpaceReaction {
  uid: string;
  createdAt: string;
  type: 'appreciate';
}

export type NotificationType =
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'SPARK_INTERACTION'
  | 'MESSAGE'
  | 'CLUB_INVITE'
  | 'EVENT_INVITE';

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string | null;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}
