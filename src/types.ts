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
  handle: string;
  location: string;
  city?: string;
  country: string;
  lat?: number;
  lng?: number;
  role: string;
  roleEmoji: string;
  tagline: string;
  bio: string;
  curiousAbout: string[];
  building?: string;
  learning?: string;
  openQuestion?: string;
  interests: string[];
  intents: ConnectionIntent[];
  archetypesToMeet: MeetArchetype[];
  avatarUrl?: string;
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

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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

export interface Connection {
  id: string;
  profileId: string;
  profile: UserProfile;
  connectedAt: string;
  status: 'connected' | 'pending' | 'archived';
  sharedIntents: ConnectionIntent[];
  sharedInterests: string[];
  introNote?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
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
