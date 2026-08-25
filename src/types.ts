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
  connectionId: string;
  senderId: 'currentUser' | string;
  text: string;
  timestamp: string;
  isStarterPrompt?: boolean;
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

export interface CuriousBoardPost {
  id: string;
  authorId: string;
  authorName: string;
  authorLocation: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  intents: ConnectionIntent[];
  tags: string[];
  timestamp: string;
  repliesCount: number;
}

export type ActiveTab = 'landing' | 'orb' | 'discover' | 'board' | 'explore' | 'connections' | 'messages' | 'profile' | 'signin' | 'signup' | 'onboarding';
