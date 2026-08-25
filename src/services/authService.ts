import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { userService } from './userService';
import { firestoreService } from './firestoreService';
import { discoveryService } from './discoveryService';
import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/mockData';

const CURRENT_USER_KEY = 'misfits_current_user';
const DRAFT_PREFIX = 'misfits_onboarding_draft_';

// Seed profile mapping fallback
function buildDefaultProfileFromFirebase(user: FirebaseUser, isNew = false): UserProfile {
  const displayName = user.displayName || user.email?.split('@')[0] || 'Misfit Explorer';
  const uidShort = user.uid ? user.uid.slice(-4) : 'user';
  const handle = displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || `misfit_${uidShort}`;
  const photo = user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  const now = new Date().toISOString();

  return {
    id: user.uid,
    uid: user.uid,
    name: displayName,
    email: user.email || '',
    handle,
    profilePhoto: photo,
    avatarUrl: photo,
    bio: isNew ? '' : 'Exploring ideas at the edge of craft, systems, and creative thought.',
    college: '',
    department: '',
    year: '',
    skills: [],
    interests: ['AI', 'Philosophy', 'Design', 'Technology'],
    role: 'Explorer & Creator',
    roleEmoji: '✨',
    location: 'Worldwide',
    city: 'San Francisco',
    country: 'United States',
    tagline: 'Here to find people worth talking to',
    curiousAbout: ['Artificial Intelligence', 'Philosophy of Technology', 'Digital Craft'],
    intents: ['Exchange Ideas', 'Just Talk'],
    archetypesToMeet: ['Builders', 'Creatives', 'Anyone interesting'],
    isOnline: true,
    joinedDate: 'August 2026',
    onboardingCompleted: !isNew,
    createdAt: now,
    updatedAt: now,
  };
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

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Fetch existing user document from Firestore users/{uid}
          let profile = await userService.getUserProfile(fbUser.uid);
          if (!profile) {
            // Profile does not exist yet: create skeleton document for onboarding
            profile = await userService.createUserProfile(fbUser.uid, {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'New Misfit',
              email: fbUser.email || '',
              profilePhoto: fbUser.photoURL || undefined,
              avatarUrl: fbUser.photoURL || undefined,
              onboardingCompleted: false,
            });
          }
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
          callback(profile);
        } catch (e) {
          console.warn('Failed to load profile from Firestore on auth change', e);
          const cached = authService.getCurrentUser();
          callback(cached || buildDefaultProfileFromFirebase(fbUser));
        }
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
        callback(null);
      }
    });
  },

  async signIn(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      if (password) {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;
        let profile = await userService.getUserProfile(fbUser.uid);
        if (!profile) {
          profile = await userService.createUserProfile(fbUser.uid, {
            uid: fbUser.uid,
            name: fbUser.displayName || cleanEmail.split('@')[0],
            email: cleanEmail,
            onboardingCompleted: false,
          });
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
        return profile;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase Email sign-in failed, attempting fallback resolution', firebaseErr);
      
      // If user doesn't exist yet with email/password, try creating account automatically for seamless preview experience
      if (firebaseErr?.code === 'auth/user-not-found' || firebaseErr?.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password || 'password123');
          const fbUser = userCredential.user;
          const profile = await userService.createUserProfile(fbUser.uid, {
            uid: fbUser.uid,
            name: cleanEmail.split('@')[0],
            email: cleanEmail,
            onboardingCompleted: false,
          });
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
          return profile;
        } catch (createErr) {
          console.error(createErr);
        }
      }
      throw new Error(firebaseErr?.message || 'Authentication failed. Please verify credentials.');
    }

    // Demo email fallback
    const fallbackUser: UserProfile = {
      ...INITIAL_USER,
      id: `user-${Date.now()}`,
      uid: `user-${Date.now()}`,
      email: cleanEmail,
      onboardingCompleted: true,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
  },

  async signUp(name: string, email: string, password: string, avatarUrl?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      
      const newProfile = await userService.createUserProfile(fbUser.uid, {
        uid: fbUser.uid,
        name: name.trim() || 'New Misfit',
        email: cleanEmail,
        handle: name.trim().toLowerCase().replace(/\s+/g, '') || (fbUser.uid ? `misfit_${fbUser.uid.slice(-4)}` : 'misfit_user'),
        profilePhoto: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: '',
        college: '',
        department: '',
        year: '',
        skills: [],
        interests: ['AI', 'DESIGN', 'PHILOSOPHY'],
        role: 'Explorer & Builder',
        onboardingCompleted: false, // Explicitly false to trigger profile setup flow
      });

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
      return newProfile;
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        // If already registered, sign in
        return this.signIn(cleanEmail, password);
      }
      throw new Error(err?.message || 'Could not complete registration.');
    }
  },

  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      let profile = await userService.getUserProfile(fbUser.uid);
      if (!profile) {
        profile = await userService.createUserProfile(fbUser.uid, {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google Explorer',
          email: fbUser.email || '',
          profilePhoto: fbUser.photoURL || undefined,
          avatarUrl: fbUser.photoURL || undefined,
          onboardingCompleted: false,
        });
      }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('cancelled-popup-request') ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User voluntarily dismissed or cancelled the popup window
        throw new Error('Sign-in cancelled.');
      }
      console.error('Google Sign-in failed', err);
      throw new Error(err?.message || 'Google account sign-in could not be completed.');
    }
  },

  async forgotPassword(email: string): Promise<boolean> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch {
      return false;
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } finally {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  async saveOnboarding(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.getCurrentUser();
    const uid = userId || current?.uid || current?.id || auth.currentUser?.uid || `user-${Date.now()}`;
    
    const updated: UserProfile = {
      ...(current || ({} as UserProfile)),
      ...data,
      id: uid,
      uid: uid,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      await userService.updateUserProfile(uid, updated);
    } catch (e) {
      console.warn('Failed to save profile to Firestore, saved to local cache', e);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    this.clearOnboardingDraft(uid);
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

  clearOnboardingDraft(userId: string): void {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${userId}`);
    } catch (e) {
      console.warn('Failed to clear draft', e);
    }
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    return firestoreService.getAllUsers();
  },
};

