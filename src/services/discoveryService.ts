import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  limit,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { PublicProfile, UserProfile, DiscoveryFilters } from '../types';
import { SAMPLE_PROFILES } from '../data/mockData';

// Helper to remove any undefined or null keys before writing to Firestore
function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

// Convert UserProfile to PublicProfile (strictly omitting private information like email)
export function sanitizeToPublicProfile(profile: Partial<UserProfile> & { id: string; name: string }): PublicProfile {
  const uid = profile.uid || profile.id;
  const photo = profile.profilePhoto || profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  return {
    id: uid,
    uid: uid,
    name: profile.name.trim(),
    handle: profile.handle || (profile.name ? profile.name.toLowerCase().replace(/[^a-z0-9]/g, '') : `misfit_${(uid || '').slice(-4)}`),
    profilePhoto: photo,
    avatarUrl: photo,
    bio: profile.bio || '',
    college: profile.college || '',
    department: profile.department || '',
    year: profile.year || '',
    skills: profile.skills || ['BUILDER', 'THINKER'],
    interests: profile.interests || ['AI', 'DESIGN', 'PHILOSOPHY'],
    role: profile.role || 'Explorer & Builder',
    roleEmoji: profile.roleEmoji || '✨',
    tagline: profile.tagline || 'Curious mind at Misfits Club',
    curiousAbout: profile.curiousAbout || profile.interests || [],
    building: profile.building || '',
    learning: profile.learning || '',
    openQuestion: profile.openQuestion || '',
    intents: profile.intents || ['Exchange Ideas', 'Just Talk'],
    archetypesToMeet: profile.archetypesToMeet || ['Anyone worldwide'],
    location: profile.location || 'Worldwide',
    city: profile.city || profile.location?.split(',')[0]?.trim() || 'Worldwide',
    country: profile.country || 'Worldwide',
    lat: profile.lat,
    lng: profile.lng,
    links: profile.links,
    joinedDate: profile.joinedDate || 'August 2026',
    onboardingCompleted: profile.onboardingCompleted ?? true,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
    isOnline: profile.isOnline ?? true,
    whyMatch: profile.whyMatch,
  };
}

// Sample fallback public profiles (guaranteed no emails)
const FALLBACK_PUBLIC_PROFILES: PublicProfile[] = SAMPLE_PROFILES.map((p) => sanitizeToPublicProfile(p));

export const discoveryService = {
  /**
   * Synchronize a user's public profile document at publicProfiles/{uid}
   */
  async syncPublicProfile(userProfile: UserProfile): Promise<PublicProfile> {
    const uid = userProfile.uid || userProfile.id;
    if (!uid) throw new Error('UID is required to sync public profile');

    const publicData = sanitizeToPublicProfile(userProfile);
    const sanitized = sanitizePayload(publicData);
    const path = `publicProfiles/${uid}`;

    try {
      await setDoc(doc(db, 'publicProfiles', uid), sanitized, { merge: true });
      return sanitized;
    } catch (error) {
      console.warn('Failed to sync public profile to Firestore', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      return publicData;
    }
  },

  /**
   * Fetch a single public profile by UID
   */
  async getPublicProfile(uid: string): Promise<PublicProfile | null> {
    if (!uid) return null;
    const path = `publicProfiles/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'publicProfiles', uid));
      if (snap.exists()) {
        const raw = snap.data();
        return sanitizeToPublicProfile({
          ...raw,
          id: snap.id,
          uid: snap.id,
        } as any);
      }
      // Check fallback sample profiles
      const fallback = FALLBACK_PUBLIC_PROFILES.find((p) => p.id === uid || p.uid === uid);
      return fallback || null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Fetch all public discovery profiles
   */
  async getPublicProfiles(currentUserId?: string, limitCount = 50): Promise<PublicProfile[]> {
    const path = 'publicProfiles';
    try {
      const q = query(collection(db, 'publicProfiles'), limit(limitCount));
      const snap = await getDocs(q);
      const list: PublicProfile[] = [];

      snap.forEach((d) => {
        const raw = d.data();
        list.push(
          sanitizeToPublicProfile({
            ...raw,
            id: d.id,
            uid: d.id,
          } as any)
        );
      });

      // Merge with sample profiles so directory is vibrant for new environments
      const existingIds = new Set(list.map((p) => p.id));
      const merged = [...list];
      for (const sample of FALLBACK_PUBLIC_PROFILES) {
        if (!existingIds.has(sample.id)) {
          merged.push(sample);
        }
      }

      // Exclude current logged in user
      if (currentUserId) {
        return merged.filter((p) => p.id !== currentUserId && p.uid !== currentUserId);
      }

      return merged;
    } catch (error) {
      console.warn('Failed to fetch publicProfiles from Firestore, using fallbacks', error);
      if (currentUserId) {
        return FALLBACK_PUBLIC_PROFILES.filter((p) => p.id !== currentUserId && p.uid !== currentUserId);
      }
      return FALLBACK_PUBLIC_PROFILES;
    }
  },

  /**
   * Subscribe to public profile updates for real-time discovery
   */
  subscribePublicProfiles(
    onUpdate: (profiles: PublicProfile[]) => void,
    currentUserId?: string
  ): () => void {
    const path = 'publicProfiles';
    return onSnapshot(
      collection(db, 'publicProfiles'),
      (snap) => {
        const list: PublicProfile[] = [];
        snap.forEach((d) => {
          const raw = d.data();
          list.push(
            sanitizeToPublicProfile({
              ...raw,
              id: d.id,
              uid: d.id,
            } as any)
          );
        });

        const existingIds = new Set(list.map((p) => p.id));
        const merged = [...list];
        for (const sample of FALLBACK_PUBLIC_PROFILES) {
          if (!existingIds.has(sample.id)) {
            merged.push(sample);
          }
        }

        const filtered = currentUserId
          ? merged.filter((p) => p.id !== currentUserId && p.uid !== currentUserId)
          : merged;

        onUpdate(filtered);
      },
      (error) => {
        console.warn('Real-time public profile subscription error', error);
        // Provide fallback on permission or connection error
        const filtered = currentUserId
          ? FALLBACK_PUBLIC_PROFILES.filter((p) => p.id !== currentUserId && p.uid !== currentUserId)
          : FALLBACK_PUBLIC_PROFILES;
        onUpdate(filtered);
      }
    );
  },

  /**
   * Multi-dimensional in-memory search and filter for public profiles
   */
  filterProfiles(
    profiles: PublicProfile[],
    filters: Partial<DiscoveryFilters>,
    currentUserId?: string
  ): PublicProfile[] {
    return profiles.filter((p) => {
      // Exclude self
      if (currentUserId && (p.id === currentUserId || p.uid === currentUserId)) {
        return false;
      }

      // College filter
      if (filters.college && filters.college !== 'All') {
        const pCollege = (p.college || '').toLowerCase();
        const fCollege = filters.college.toLowerCase();
        if (!pCollege.includes(fCollege)) return false;
      }

      // Department filter
      if (filters.department && filters.department !== 'All') {
        const pDept = (p.department || '').toLowerCase();
        const fDept = filters.department.toLowerCase();
        if (!pDept.includes(fDept)) return false;
      }

      // Year filter
      if (filters.year && filters.year !== 'All') {
        const pYear = (p.year || '').toLowerCase();
        const fYear = filters.year.toLowerCase();
        if (!pYear.includes(fYear)) return false;
      }

      // Skill filter
      if (filters.skill && filters.skill !== 'All') {
        const targetSkill = filters.skill.toLowerCase();
        const hasSkill = (p.skills || []).some((s) => s.toLowerCase().includes(targetSkill));
        if (!hasSkill) return false;
      }

      // Interest filter
      if (filters.interest && filters.interest !== 'All') {
        const targetInterest = filters.interest.toLowerCase();
        const hasInterest = (p.interests || []).some((i) => i.toLowerCase().includes(targetInterest));
        if (!hasInterest) return false;
      }

      // Intent filter
      if (filters.intent && filters.intent !== 'All') {
        const hasIntent = (p.intents || []).includes(filters.intent);
        if (!hasIntent) return false;
      }

      // Archetype filter
      if (filters.archetype && filters.archetype !== 'All' && filters.archetype !== 'Anyone worldwide') {
        const matchesRole = (p.role || '').toLowerCase().includes(filters.archetype.toLowerCase());
        const matchesArch = (p.archetypesToMeet || []).includes(filters.archetype);
        if (!matchesRole && !matchesArch) return false;
      }

      // General Search Query (Name, Skills, Interests, College, Department, Bio, Tagline, Location, Building, Learning)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesHandle = (p.handle || '').toLowerCase().includes(query);
        const matchesLocation = (p.location || '').toLowerCase().includes(query);
        const matchesBio = (p.bio || '').toLowerCase().includes(query);
        const matchesTagline = (p.tagline || '').toLowerCase().includes(query);
        const matchesCollege = (p.college || '').toLowerCase().includes(query);
        const matchesDept = (p.department || '').toLowerCase().includes(query);
        const matchesBuilding = (p.building || '').toLowerCase().includes(query);
        const matchesLearning = (p.learning || '').toLowerCase().includes(query);
        const matchesSkills = (p.skills || []).some((s) => s.toLowerCase().includes(query));
        const matchesInterests = (p.interests || []).some((i) => i.toLowerCase().includes(query));

        if (
          !matchesName &&
          !matchesHandle &&
          !matchesLocation &&
          !matchesBio &&
          !matchesTagline &&
          !matchesCollege &&
          !matchesDept &&
          !matchesBuilding &&
          !matchesLearning &&
          !matchesSkills &&
          !matchesInterests
        ) {
          return false;
        }
      }

      return true;
    });
  },
};
