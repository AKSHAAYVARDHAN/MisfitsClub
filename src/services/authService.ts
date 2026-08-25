import { UserProfile, ConnectionIntent, MeetArchetype } from '../types';
import { SAMPLE_PROFILES, INITIAL_USER } from '../data/mockData';

const CURRENT_USER_KEY = 'misfits_current_user';
const USERS_DB_KEY = 'misfits_users_db';
const DRAFT_PREFIX = 'misfits_onboarding_draft_';

// Initial pre-loaded seed users for testing and demo
const SEED_USERS: Record<string, { password: string; profile: UserProfile }> = {
  'alex@misfits.club': {
    password: 'password123',
    profile: {
      ...INITIAL_USER,
      email: 'alex@misfits.club',
      onboardingCompleted: true,
    },
  },
  'maya@misfits.club': {
    password: 'password123',
    profile: {
      ...SAMPLE_PROFILES[0],
      email: 'maya@misfits.club',
      onboardingCompleted: true,
    },
  },
  'kenji@misfits.club': {
    password: 'password123',
    profile: {
      ...SAMPLE_PROFILES[1],
      email: 'kenji@misfits.club',
      onboardingCompleted: true,
    },
  },
};

function getUsersDB(): Record<string, { password: string; profile: UserProfile }> {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (!raw) {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return { ...SEED_USERS, ...JSON.parse(raw) };
  } catch {
    return SEED_USERS;
  }
}

function saveUsersDB(db: Record<string, { password: string; profile: UserProfile }>) {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to persist users database', e);
  }
}

export const authService = {
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  async signIn(email: string, password?: string): Promise<UserProfile> {
    // Artificial latency for authentic feeling
    await new Promise((r) => setTimeout(r, 450));

    const cleanEmail = email.trim().toLowerCase();
    const db = getUsersDB();

    // Check by email
    const existing = db[cleanEmail];
    if (existing) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existing.profile));
      return existing.profile;
    }

    // Check by handle if user entered a handle like @maya or alex
    const cleanHandle = cleanEmail.replace('@', '');
    const foundByHandle = Object.values(db).find(
      (item) => item.profile.handle.toLowerCase().replace('@', '') === cleanHandle
    );
    if (foundByHandle) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundByHandle.profile));
      return foundByHandle.profile;
    }

    // If new credentials provided on sign in, allow creating or signing in gracefully
    const generatedUser: UserProfile = {
      id: `user-${Date.now()}`,
      uid: `uid-${Date.now()}`,
      name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@misfits.club`,
      handle: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail,
      location: 'Berlin, Germany',
      city: 'Berlin',
      country: 'Germany',
      role: 'Curious Explorer',
      roleEmoji: '✨',
      tagline: 'Here to find people worth talking to',
      bio: 'Exploring new ideas and connecting with unconventional thinkers across the globe.',
      curiousAbout: ['Artificial Intelligence', 'Philosophy of Technology', 'Digital Craft'],
      interests: ['AI', 'Philosophy', 'Design', 'Technology'],
      intents: ['Exchange Ideas', 'Just Talk'],
      archetypesToMeet: ['Builders', 'Creatives', 'Anyone interesting'],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      isOnline: true,
      joinedDate: 'August 2026',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db[generatedUser.email!] = {
      password: password || 'password123',
      profile: generatedUser,
    };
    saveUsersDB(db);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(generatedUser));
    return generatedUser;
  },

  async signUp(name: string, email: string, password: string, avatarUrl?: string): Promise<UserProfile> {
    await new Promise((r) => setTimeout(r, 450));

    const cleanEmail = email.trim().toLowerCase();
    const db = getUsersDB();

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      uid: `uid-${Date.now()}`,
      name: name.trim() || 'New Misfit',
      email: cleanEmail,
      handle: name.trim().toLowerCase().replace(/\s+/g, '') || `misfit_${Date.now().toString().slice(-4)}`,
      location: 'Earth',
      city: 'Earth',
      country: 'Worldwide',
      role: 'Explorer',
      roleEmoji: '✨',
      tagline: 'New member at Misfits Club',
      bio: '',
      curiousAbout: [],
      interests: [],
      intents: ['Exchange Ideas'],
      archetypesToMeet: ['Anyone worldwide'],
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      isOnline: true,
      joinedDate: 'August 2026',
      onboardingCompleted: false, // Must go through onboarding
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db[cleanEmail] = {
      password,
      profile: newUser,
    };
    saveUsersDB(db);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async signInWithGoogle(): Promise<UserProfile> {
    await new Promise((r) => setTimeout(r, 550));

    const googleUser: UserProfile = {
      id: `google-user-${Date.now()}`,
      uid: `google-uid-${Date.now()}`,
      name: 'Taylor Vance',
      email: 'taylor.vance@gmail.com',
      handle: 'taylorvance',
      location: 'Kyoto, Japan',
      city: 'Kyoto',
      country: 'Japan',
      role: 'Experimental Maker',
      roleEmoji: '🌿',
      tagline: 'Researching spatial aesthetics & analog synthesis',
      bio: 'I build experimental interfaces and research how spatial acoustics influence creative flow state.',
      curiousAbout: ['Spatial Computing', 'Analog Audio', 'Japanese Woodcraft'],
      interests: ['Design', 'Music', 'Philosophy', 'AI', 'Technology'],
      intents: ['Build Together', 'Exchange Ideas'],
      archetypesToMeet: ['Builders', 'Creatives', 'Anyone interesting'],
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      isOnline: true,
      joinedDate: 'August 2026',
      onboardingCompleted: false, // New google account triggers onboarding
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = getUsersDB();
    db[googleUser.email!] = {
      password: 'oauth_google_verified',
      profile: googleUser,
    };
    saveUsersDB(db);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(googleUser));
    return googleUser;
  },

  async forgotPassword(email: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 400));
    return true;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  async saveOnboarding(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise((r) => setTimeout(r, 400));

    const current = this.getCurrentUser();
    const updated: UserProfile = {
      ...(current || ({} as UserProfile)),
      ...data,
      id: userId || current?.id || `user-${Date.now()}`,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    const db = getUsersDB();
    if (updated.email && db[updated.email]) {
      db[updated.email].profile = updated;
      saveUsersDB(db);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    this.clearOnboardingDraft(userId);
    return updated;
  },

  saveOnboardingDraft(userId: string, data: Partial<UserProfile>): void {
    try {
      localStorage.setItem(`${DRAFT_PREFIX}${userId}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save draft onboarding', e);
    }
  },

  getOnboardingDraft(userId: string): Partial<UserProfile> | null {
    try {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getAllProfiles(): UserProfile[] {
    const db = getUsersDB();
    const profilesFromDB = Object.values(db).map((item) => item.profile);
    const existingIds = new Set(profilesFromDB.map((p) => p.id));
    const merged = [...profilesFromDB];
    for (const p of SAMPLE_PROFILES) {
      if (!existingIds.has(p.id)) {
        merged.push(p);
      }
    }
    return merged;
  },

  clearOnboardingDraft(userId: string): void {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${userId}`);
    } catch (e) {
      console.warn('Failed to clear draft', e);
    }
  },
};
