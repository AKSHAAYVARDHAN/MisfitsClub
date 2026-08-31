import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  checkActionCode,
  applyActionCode,
  ActionCodeSettings
} from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { userService } from './userService';
import { firestoreService } from './firestoreService';
import { discoveryService } from './discoveryService';
import { UserProfile } from '../types';

const CURRENT_USER_KEY = 'misfits_current_user';
const DRAFT_PREFIX = 'misfits_onboarding_draft_';

/**
 * Maps Firebase Auth error codes to user-friendly UI messages
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  if (
    code === 'auth/account-exists-with-different-credential' ||
    code === 'auth/credential-already-in-use' ||
    message.includes('auth/account-exists-with-different-credential') ||
    message.includes('auth/credential-already-in-use')
  ) {
    return 'An account already exists with this email using Google sign-in. Please continue with Google.';
  }

  if (code === 'auth/operation-not-allowed' || message.includes('auth/operation-not-allowed')) {
    return 'Email and password authentication is currently unavailable.';
  }

  if (code === 'auth/email-already-in-use' || message.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. If you previously registered with Google, please click "Continue with Google"; otherwise, sign in with your password.';
  }

  if (code === 'auth/user-not-found' || message.includes('auth/user-not-found')) {
    return 'No Misfits Club account was found with this email.';
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    message.includes('auth/invalid-credential') ||
    message.includes('auth/wrong-password')
  ) {
    return 'The email or password is incorrect.';
  }

  if (code === 'auth/weak-password' || message.includes('auth/weak-password')) {
    return 'Choose a stronger password.';
  }

  if (code === 'auth/invalid-email' || message.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }

  if (code === 'auth/expired-action-code' || message.includes('auth/expired-action-code')) {
    return 'This password reset link has expired. Please request a new one.';
  }

  if (code === 'auth/invalid-action-code' || message.includes('auth/invalid-action-code')) {
    return 'This password reset link is invalid or has already been used. Please request a new one.';
  }

  if (code === 'auth/user-disabled' || message.includes('auth/user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }

  if (code === 'auth/too-many-requests' || message.includes('auth/too-many-requests')) {
    return 'Access temporarily disabled due to too many failed attempts. Please try again later.';
  }

  if (code === 'auth/network-request-failed' || message.includes('auth/network-request-failed')) {
    return 'Unable to connect to Firebase. Check your connection and try again.';
  }

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('popup-closed-by-user') ||
    message.includes('cancelled-popup-request')
  ) {
    return 'Sign-in cancelled.';
  }

  // Clean raw Firebase string prefix if present
  const cleaned = message
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*\((auth\/[^)]+)\):?\s*/i, '')
    .trim();

  return cleaned || 'Authentication failed. Please verify credentials.';
}

/**
 * Resolves an email address from either a direct email or a member handle
 */
async function resolveEmailFromInput(input: string): Promise<string> {
  const trimmed = input.trim();
  if (trimmed.includes('@') && !trimmed.startsWith('@')) {
    return trimmed.toLowerCase();
  }

  const cleanHandle = trimmed.replace(/^@+/, '').toLowerCase();
  if (!cleanHandle) return input.trim().toLowerCase();

  try {
    const q = query(collection(db, 'users'), where('handle', '==', cleanHandle), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      if (data.email) {
        return data.email.toLowerCase().trim();
      }
    }
  } catch (err) {
    console.warn('Handle resolution query note:', err);
  }

  return input.trim().toLowerCase();
}

export const authService = {
  /**
   * Synchronously retrieve current cached user profile (or null if none)
   */
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  /**
   * Listen to authoritative Firebase Auth state changes
   */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Fetch existing user document from Firestore users/{uid}
          let profile = await userService.getUserProfile(fbUser.uid);
          if (!profile) {
            // Profile does not exist yet: create initial skeleton for profile setup
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
          
          if (profile && profile.uid) {
            discoveryService.syncPublicProfile(profile).catch((syncErr) => {
              console.warn('Background public profile sync on auth state change:', syncErr);
            });
          }
          callback(profile);
        } catch (e) {
          console.warn('Failed to load profile from Firestore on auth change:', e);
          const cached = authService.getCurrentUser();
          if (cached && cached.uid === fbUser.uid) {
            callback(cached);
          } else {
            callback(null);
          }
        }
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
        callback(null);
      }
    });
  },

  /**
   * Real Firebase Email/Password Sign-In
   */
  async signIn(emailOrHandle: string, password?: string): Promise<UserProfile> {
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const cleanEmail = await resolveEmailFromInput(emailOrHandle);
    if (!cleanEmail) {
      throw new Error('Please enter a valid email or member handle.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      
      // Load real Firestore profile
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
      if (profile && profile.uid) {
        discoveryService.syncPublicProfile(profile).catch((syncErr) => {
          console.warn('Background public profile sync on signIn:', syncErr);
        });
      }
      return profile;
    } catch (firebaseErr: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(firebaseErr);
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Real Firebase Email/Password Account Registration
   */
  async signUp(name: string, email: string, password: string, avatarUrl?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      
      const newProfile = await userService.createUserProfile(fbUser.uid, {
        uid: fbUser.uid,
        name: name.trim() || 'New Misfit',
        email: cleanEmail,
        handle: name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || (fbUser.uid ? `misfit_${fbUser.uid.slice(-4)}` : 'misfit_user'),
        profilePhoto: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: '',
        college: '',
        department: '',
        year: '',
        skills: [],
        interests: ['AI', 'DESIGN', 'PHILOSOPHY'],
        role: 'Explorer & Builder',
        onboardingCompleted: false, // Guides user to real profile completion
      });

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
      return newProfile;
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Real Firebase Google Sign-In with Popup
   */
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
      if (profile && profile.uid) {
        discoveryService.syncPublicProfile(profile).catch((syncErr) => {
          console.warn('Background public profile sync on signInWithGoogle:', syncErr);
        });
      }
      return profile;
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Password Reset Email with ActionCodeSettings configured for misfitsclub.xyz
   */
  async forgotPassword(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    // Configure production ActionCodeSettings pointing to https://misfitsclub.xyz/reset-password
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );
    const continueUrl = isLocal
      ? `${window.location.origin}/reset-password`
      : 'https://misfitsclub.xyz/reset-password';

    const actionCodeSettings: ActionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };

    try {
      // First attempt with custom ActionCodeSettings
      await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
      return true;
    } catch (err: any) {
      // If error indicates unauthorized domain or setting issue, fallback to standard reset email
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return true;
      } catch (fallbackErr: any) {
        const friendlyMessage = getFriendlyAuthErrorMessage(fallbackErr || err);
        throw new Error(friendlyMessage);
      }
    }
  },

  /**
   * Verify password reset out-of-band code and retrieve associated email
   */
  async verifyResetCode(oobCode: string): Promise<string> {
    if (!oobCode || !oobCode.trim()) {
      throw new Error('This password reset link is invalid or has already been used. Please request a new one.');
    }
    try {
      const email = await verifyPasswordResetCode(auth, oobCode.trim());
      return email;
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Confirm password reset with new password
   */
  async confirmReset(oobCode: string, newPassword: string): Promise<void> {
    if (!oobCode || !oobCode.trim()) {
      throw new Error('This password reset link is invalid or has already been used. Please request a new one.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Choose a stronger password.');
    }
    try {
      await confirmPasswordReset(auth, oobCode.trim(), newPassword);
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Verify and apply generic Firebase action code (e.g. verify email)
   */
  async applyAction(oobCode: string): Promise<void> {
    try {
      await applyActionCode(auth, oobCode.trim());
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Check action code info
   */
  async checkAction(oobCode: string): Promise<any> {
    try {
      return await checkActionCode(auth, oobCode.trim());
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Authoritative Sign Out
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } finally {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  /**
   * Save and persist onboarding updates to Firestore
   */
  async saveOnboarding(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.getCurrentUser();
    const uid = userId || current?.uid || current?.id || auth.currentUser?.uid;
    if (!uid) {
      throw new Error('Authentication required to save profile.');
    }
    
    const updated: UserProfile = {
      ...(current || ({} as UserProfile)),
      ...data,
      id: uid,
      uid: uid,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    await userService.updateUserProfile(uid, updated);
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


