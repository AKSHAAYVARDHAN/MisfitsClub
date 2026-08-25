import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';
import { discoveryService } from './discoveryService';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Data validation for profile fields
export function validateUserProfile(data: Partial<UserProfile>): ValidationResult {
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      return { isValid: false, error: 'Name cannot be empty.' };
    }
    if (data.name.length > 100) {
      return { isValid: false, error: 'Name must be 100 characters or fewer.' };
    }
  }

  if (data.bio !== undefined && typeof data.bio === 'string' && data.bio.length > 1500) {
    return { isValid: false, error: 'Bio must be 1500 characters or fewer.' };
  }

  if (data.college !== undefined && typeof data.college === 'string' && data.college.length > 120) {
    return { isValid: false, error: 'College must be 120 characters or fewer.' };
  }

  if (data.department !== undefined && typeof data.department === 'string' && data.department.length > 120) {
    return { isValid: false, error: 'Department must be 120 characters or fewer.' };
  }

  if (data.year !== undefined && typeof data.year === 'string' && data.year.length > 50) {
    return { isValid: false, error: 'Year must be 50 characters or fewer.' };
  }

  if (data.skills !== undefined && Array.isArray(data.skills)) {
    if (data.skills.length > 30) {
      return { isValid: false, error: 'Maximum 30 skills allowed.' };
    }
    for (const s of data.skills) {
      if (typeof s !== 'string' || s.length > 50) {
        return { isValid: false, error: 'Each skill must be 50 characters or fewer.' };
      }
    }
  }

  if (data.interests !== undefined && Array.isArray(data.interests)) {
    if (data.interests.length > 40) {
      return { isValid: false, error: 'Maximum 40 interests allowed.' };
    }
    for (const i of data.interests) {
      if (typeof i !== 'string' || i.length > 50) {
        return { isValid: false, error: 'Each interest must be 50 characters or fewer.' };
      }
    }
  }

  return { isValid: true };
}

// Sanitize object removing undefined fields
function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

export const userService = {
  /**
   * Check if a user profile exists in users/{uid}
   */
  async profileExists(uid: string): Promise<boolean> {
    if (!uid) return false;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists();
    } catch {
      return false;
    }
  },

  /**
   * Fetch a user profile by Firebase UID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const raw = snap.data();
        return {
          ...raw,
          id: snap.id,
          uid: snap.id,
          avatarUrl: raw.profilePhoto || raw.avatarUrl,
          profilePhoto: raw.profilePhoto || raw.avatarUrl,
        } as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Create a new user profile at users/{uid}
   */
  async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    if (!uid) throw new Error('UID is required to create a user document');

    const validation = validateUserProfile(data);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid profile information');
    }

    const now = new Date().toISOString();
    const photo = data.profilePhoto || data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const newProfile: UserProfile = {
      id: uid,
      uid: uid,
      name: (data.name || 'New Misfit').trim(),
      email: data.email || '',
      profilePhoto: photo,
      avatarUrl: photo,
      bio: data.bio || '',
      college: data.college || '',
      department: data.department || '',
      year: data.year || '',
      skills: data.skills || [],
      interests: data.interests || ['AI', 'DESIGN', 'PHILOSOPHY'],
      role: data.role || 'Explorer & Builder',
      roleEmoji: data.roleEmoji || '✨',
      handle: data.handle || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '') : `misfit_${(uid || '').slice(-4)}`),
      location: data.location || 'Worldwide',
      city: data.city || 'Worldwide',
      country: data.country || 'Worldwide',
      tagline: data.tagline || 'Curious mind at Misfits Club',
      curiousAbout: data.curiousAbout || (Array.isArray(data.interests) ? data.interests.slice(0, 4) : []),
      intents: data.intents || ['Exchange Ideas', 'Just Talk'],
      archetypesToMeet: data.archetypesToMeet || ['Anyone worldwide'],
      building: data.building,
      learning: data.learning,
      openQuestion: data.openQuestion,
      links: data.links,
      isOnline: true,
      joinedDate: data.joinedDate || 'August 2026',
      onboardingCompleted: data.onboardingCompleted ?? false,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const path = `users/${uid}`;
    const sanitized = cleanPayload(newProfile);

    try {
      await setDoc(doc(db, 'users', uid), sanitized);
      // Synchronize public discovery profile (omits private email/data)
      try {
        await discoveryService.syncPublicProfile(sanitized as UserProfile);
      } catch (err) {
        console.warn('Non-blocking public profile sync issue:', err);
      }
      return sanitized as UserProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Update an existing user profile at users/{uid}
   */
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    if (!uid) throw new Error('UID is required to update a user document');

    const validation = validateUserProfile(data);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid profile information');
    }

    const path = `users/${uid}`;
    const now = new Date().toISOString();

    const photo = data.profilePhoto || data.avatarUrl;

    // Prevent changing the UID or ID
    const sanitized = cleanPayload({
      ...data,
      id: uid,
      uid: uid,
      profilePhoto: photo || undefined,
      avatarUrl: photo || undefined,
      updatedAt: now,
    });

    try {
      await setDoc(doc(db, 'users', uid), sanitized, { merge: true });
      // Fetch merged profile to sync complete public snapshot
      try {
        const fullDoc = await getDoc(doc(db, 'users', uid));
        if (fullDoc.exists()) {
          await discoveryService.syncPublicProfile(fullDoc.data() as UserProfile);
        } else {
          await discoveryService.syncPublicProfile(sanitized as UserProfile);
        }
      } catch (err) {
        console.warn('Non-blocking public profile sync issue:', err);
      }
      return sanitized as UserProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
};
