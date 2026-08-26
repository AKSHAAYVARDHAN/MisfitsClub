import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import { Space, SpaceCategory, SpaceVisibility, UserProfile, PublicProfile, UpdateSpaceInput } from '../types';
import { discoveryService } from './discoveryService';

export interface CreateSpaceInput {
  name: string;
  description: string;
  category: SpaceCategory;
  tags: string[];
  visibility?: SpaceVisibility;
  profilePhoto?: string;
}

function normalizeSpace(data: any, id: string): Space {
  return {
    id: data.id || id,
    name: data.name || 'Untitled Hub',
    description: data.description || '',
    category: (data.category as SpaceCategory) || 'Building',
    tags: Array.isArray(data.tags) ? data.tags : [],
    ownerId: data.ownerId || '',
    ownerName: data.ownerName || 'Anonymous Misfit',
    ownerAvatar: data.ownerAvatar || '',
    ownerRole: data.ownerRole || '',
    profilePhoto: data.profilePhoto || undefined,
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    memberCount: typeof data.memberCount === 'number' ? data.memberCount : (Array.isArray(data.memberIds) ? data.memberIds.length : 1),
    visibility: (data.visibility as SpaceVisibility) || 'public',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export const spaceService = {
  /**
   * Create a new Space document in spaces/{spaceId}
   */
  async createSpace(input: CreateSpaceInput, ownerProfile: UserProfile): Promise<Space> {
    const ownerId = ownerProfile.uid || ownerProfile.id;
    if (!ownerId) {
      throw new Error('You must be signed in to create a Space.');
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Space name is required.');
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Space description is required.');
    }

    const spaceId = `space-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const cleanTags = (input.tags || [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 15);

    const spaceData: Space = {
      id: spaceId,
      name: input.name.trim().slice(0, 100),
      description: input.description.trim().slice(0, 2000),
      category: input.category || 'Building',
      tags: cleanTags,
      ownerId,
      ownerName: ownerProfile.name || 'Misfit Creator',
      ownerAvatar: ownerProfile.avatarUrl || ownerProfile.profilePhoto || '',
      ownerRole: ownerProfile.role || 'Member',
      profilePhoto: input.profilePhoto || undefined,
      memberIds: [ownerId],
      memberCount: 1,
      visibility: input.visibility || 'public',
      createdAt: now,
      updatedAt: now,
    };

    const sanitized = sanitizeFirestoreData(spaceData);
    const spaceDocRef = doc(db, 'spaces', spaceId);

    try {
      await setDoc(spaceDocRef, sanitized);
      return spaceData;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `spaces/${spaceId}`);
      throw error;
    }
  },

  /**
   * Fetch all spaces (ordered by updatedAt desc) strictly from Firestore
   */
  async getSpaces(): Promise<Space[]> {
    try {
      const q = query(collection(db, 'spaces'), orderBy('updatedAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      const list: Space[] = [];
      snap.forEach((docSnap) => {
        list.push(normalizeSpace(docSnap.data(), docSnap.id));
      });
      return list;
    } catch (error: any) {
      console.warn('Failed to load spaces from Firestore:', error);
      return [];
    }
  },

  /**
   * Real-time subscription to all spaces strictly from Firestore
   */
  subscribeSpaces(onUpdate: (spaces: Space[]) => void): () => void {
    const q = query(collection(db, 'spaces'), orderBy('updatedAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Space[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeSpace(docSnap.data(), docSnap.id));
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Error subscribing to spaces from Firestore:', error);
        onUpdate([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Fetch a single space by ID from Firestore
   */
  async getSpace(spaceId: string): Promise<Space | null> {
    if (!spaceId) return null;
    try {
      const docRef = doc(db, 'spaces', spaceId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }
      return normalizeSpace(snap.data(), snap.id);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, `spaces/${spaceId}`);
      return null;
    }
  },

  /**
   * Real-time subscription to a single space
   */
  subscribeSpace(spaceId: string, onUpdate: (space: Space | null) => void): () => void {
    if (!spaceId) {
      onUpdate(null);
      return () => {};
    }
    const docRef = doc(db, 'spaces', spaceId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
        } else {
          onUpdate(normalizeSpace(snap.data(), snap.id));
        }
      },
      (error) => {
        console.warn(`Error subscribing to space ${spaceId}:`, error);
        onUpdate(null);
      }
    );

    return unsubscribe;
  },

  /**
   * Atomic join space with transaction
   */
  async joinSpace(spaceId: string, userId: string): Promise<Space> {
    if (!userId) {
      throw new Error('Must be signed in to join a space.');
    }
    if (!spaceId) {
      throw new Error('Invalid space ID.');
    }

    const docRef = doc(db, 'spaces', spaceId);

    try {
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('This Space is no longer available or does not exist.');
        }

        const data = snap.data();
        const currentMemberIds: string[] = Array.isArray(data.memberIds) ? data.memberIds : [];
        const currentCount: number = typeof data.memberCount === 'number' ? data.memberCount : currentMemberIds.length;

        // Idempotent: If already joined, return existing
        if (currentMemberIds.includes(userId)) {
          return normalizeSpace(data, snap.id);
        }

        const updatedMemberIds = [...currentMemberIds, userId];
        const newCount = currentCount + 1;
        const now = new Date().toISOString();

        transaction.update(docRef, {
          memberIds: updatedMemberIds,
          memberCount: newCount,
          updatedAt: now,
        });

        return normalizeSpace(
          {
            ...data,
            memberIds: updatedMemberIds,
            memberCount: newCount,
            updatedAt: now,
          },
          snap.id
        );
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}`);
      throw error;
    }
  },

  /**
   * Atomic leave space with transaction
   */
  async leaveSpace(spaceId: string, userId: string): Promise<Space> {
    if (!userId) {
      throw new Error('Must be signed in to leave a space.');
    }
    if (!spaceId) {
      throw new Error('Invalid space ID.');
    }

    const docRef = doc(db, 'spaces', spaceId);

    try {
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('This Space is no longer available or does not exist.');
        }

        const data = snap.data();
        if (data.ownerId === userId) {
          throw new Error('As the creator, you cannot leave your own Space.');
        }

        const currentMemberIds: string[] = Array.isArray(data.memberIds) ? data.memberIds : [];
        const currentCount: number = typeof data.memberCount === 'number' ? data.memberCount : currentMemberIds.length;

        // Idempotent: If not a member, return existing
        if (!currentMemberIds.includes(userId)) {
          return normalizeSpace(data, snap.id);
        }

        const updatedMemberIds = currentMemberIds.filter((id) => id !== userId);
        const newCount = Math.max(1, currentCount - 1);
        const now = new Date().toISOString();

        transaction.update(docRef, {
          memberIds: updatedMemberIds,
          memberCount: newCount,
          updatedAt: now,
        });

        return normalizeSpace(
          {
            ...data,
            memberIds: updatedMemberIds,
            memberCount: newCount,
            updatedAt: now,
          },
          snap.id
        );
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}`);
      throw error;
    }
  },

  /**
   * Fetch public profiles for a list of member IDs safely using publicProfiles/{uid}
   */
  async getSpaceMembers(memberIds: string[]): Promise<PublicProfile[]> {
    if (!memberIds || memberIds.length === 0) return [];
    
    // Fetch up to 50 member profiles to avoid large waterfalls
    const targetIds = memberIds.slice(0, 50);
    const profiles: PublicProfile[] = [];

    await Promise.all(
      targetIds.map(async (uid) => {
        try {
          const profile = await discoveryService.getPublicProfile(uid);
          if (profile) {
            profiles.push(profile);
          } else {
            // Fallback anonymous placeholder profile
            profiles.push({
              id: uid,
              uid: uid,
              name: 'Misfit Member',
              role: 'Space Member',
              skills: [],
              interests: [],
              intents: [],
              bio: '',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            });
          }
        } catch (e) {
          // Graceful fallback
          profiles.push({
            id: uid,
            uid: uid,
            name: 'Misfit Member',
            role: 'Space Member',
            skills: [],
            interests: [],
            intents: [],
            bio: '',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          });
        }
      })
    );

    return profiles;
  },

  /**
   * Update an existing Hub's metadata (Host only).
   * Strictly enforces that only the authoritative Host (ownerId === hostId) can edit the Hub.
   * Preserves ownerId, memberIds, memberCount, and creation timestamps.
   */
  async updateSpace(spaceId: string, hostId: string, input: UpdateSpaceInput): Promise<Space> {
    if (!hostId) {
      throw new Error('You must be signed in to edit this Hub.');
    }
    if (!spaceId) {
      throw new Error('Invalid Hub ID.');
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Hub name cannot be empty.');
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Hub description cannot be empty.');
    }

    const docRef = doc(db, 'spaces', spaceId);

    try {
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('This Hub was not found or no longer exists.');
        }

        const existingData = snap.data();
        if (existingData.ownerId !== hostId) {
          throw new Error('Unauthorized: Only the Hub Host can edit this Hub.');
        }

        const cleanTags = (input.tags || [])
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .slice(0, 20);

        const now = new Date().toISOString();

        const updatedFields: Partial<Space> = {
          name: input.name.trim().slice(0, 100),
          description: input.description.trim().slice(0, 2000),
          category: input.category || existingData.category || 'Building',
          tags: cleanTags,
          updatedAt: now,
        };

        if (input.profilePhoto !== undefined) {
          updatedFields.profilePhoto = input.profilePhoto;
        }

        const sanitized = sanitizeFirestoreData(updatedFields);
        transaction.update(docRef, sanitized);

        return normalizeSpace(
          {
            ...existingData,
            ...updatedFields,
          },
          snap.id
        );
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}`);
      throw error;
    }
  },

  /**
   * Remove a member from a Hub (Host only).
   * Runs as an atomic transaction.
   * Prevents removing the host or non-members.
   */
  async removeMember(spaceId: string, hostId: string, memberIdToRemove: string): Promise<Space> {
    if (!hostId) {
      throw new Error('You must be signed in as the Host to remove members.');
    }
    if (!spaceId) {
      throw new Error('Invalid Hub ID.');
    }
    if (!memberIdToRemove) {
      throw new Error('Invalid member ID to remove.');
    }

    const docRef = doc(db, 'spaces', spaceId);

    try {
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('This Hub was not found or no longer exists.');
        }

        const data = snap.data();
        if (data.ownerId !== hostId) {
          throw new Error('Unauthorized: Only the Hub Host can remove members.');
        }

        if (memberIdToRemove === data.ownerId || memberIdToRemove === hostId) {
          throw new Error('The Host cannot be removed from their own Hub.');
        }

        const currentMemberIds: string[] = Array.isArray(data.memberIds) ? data.memberIds : [];
        const currentCount: number = typeof data.memberCount === 'number' ? data.memberCount : currentMemberIds.length;

        // If user is not even in member list, return existing state
        if (!currentMemberIds.includes(memberIdToRemove)) {
          return normalizeSpace(data, snap.id);
        }

        const updatedMemberIds = currentMemberIds.filter((id) => id !== memberIdToRemove);
        const newCount = Math.max(1, currentCount - 1);
        const now = new Date().toISOString();

        transaction.update(docRef, {
          memberIds: updatedMemberIds,
          memberCount: newCount,
          updatedAt: now,
        });

        return normalizeSpace(
          {
            ...data,
            memberIds: updatedMemberIds,
            memberCount: newCount,
            updatedAt: now,
          },
          snap.id
        );
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}`);
      throw error;
    }
  },
};
