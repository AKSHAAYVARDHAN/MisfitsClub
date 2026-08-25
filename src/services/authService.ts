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
import { firestoreService } from './firestoreService';
import { UserProfile } from '../types';
import { SAMPLE_PROFILES, INITIAL_USER } from '../data/mockData';

const CURRENT_USER_KEY = 'misfits_current_user';
const DRAFT_PREFIX = 'misfits_onboarding_draft_';

// Seed profile mapping fallback
function buildDefaultProfileFromFirebase(user: FirebaseUser, isNew = false): UserProfile {
  const displayName = user.displayName || user.email?.split('@')[0] || 'Misfit Explorer';
  const handle = displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || `misfit_${user.uid.slice(-4)}`;
  
  return {
    id: user.uid,
    uid: user.uid,
    name: displayName,
    email: user.email || '',
    handle,
    location: 'Worldwide',
    city: 'San Francisco',
    country: 'United States',
    role: 'Explorer & Creator',
    roleEmoji: '✨',
    tagline: 'Here to find people worth talking to',
    bio: 'Exploring ideas at the edge of craft, systems, and creative thought.',
    curiousAbout: ['Artificial Intelligence', 'Philosophy of Technology', 'Digital Craft'],
    interests: ['AI', 'Philosophy', 'Design', 'Technology'],
    intents: ['Exchange Ideas', 'Just Talk'],
    archetypesToMeet: ['Builders', 'Creatives', 'Anyone interesting'],
    avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    joinedDate: 'August 2026',
    onboardingCompleted: !isNew,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
          // Fetch existing user document from Firestore
          let profile = await firestoreService.getUserProfile(fbUser.uid);
          if (!profile) {
            profile = buildDefaultProfileFromFirebase(fbUser, true);
            await firestoreService.saveUserProfile(profile);
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
        let profile = await firestoreService.getUserProfile(fbUser.uid);
        if (!profile) {
          profile = buildDefaultProfileFromFirebase(fbUser);
          await firestoreService.saveUserProfile(profile);
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
          const profile = buildDefaultProfileFromFirebase(fbUser, false);
          await firestoreService.saveUserProfile(profile);
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
      
      const newProfile: UserProfile = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: name.trim() || 'New Misfit',
        email: cleanEmail,
        handle: name.trim().toLowerCase().replace(/\s+/g, '') || `misfit_${fbUser.uid.slice(-4)}`,
        location: 'Worldwide',
        city: 'Worldwide',
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
        onboardingCompleted: false, // Triggers onboarding flow
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.saveUserProfile(newProfile);
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
      
      let profile = await firestoreService.getUserProfile(fbUser.uid);
      if (!profile) {
        profile = buildDefaultProfileFromFirebase(fbUser, true); // new Google user needs onboarding
        profile.onboardingCompleted = false;
        await firestoreService.saveUserProfile(profile);
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
    const updated: UserProfile = {
      ...(current || ({} as UserProfile)),
      ...data,
      id: userId || current?.id || auth.currentUser?.uid || `user-${Date.now()}`,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      await firestoreService.saveUserProfile(updated);
    } catch (e) {
      console.warn('Failed to save onboarding to Firestore, saved to local cache', e);
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
