import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import {
  CuriousBoardPost,
  SparkReply,
  SparkThinker,
  UserProfile,
  PublicProfile,
  ConnectionIntent,
} from '../types';
import { SAMPLE_BOARD_POSTS, SAMPLE_SPARK_REPLIES } from '../data/mockData';
import { discoveryService } from './discoveryService';
import { notificationService } from './notificationService';

export interface CreateSparkInput {
  authorId: string;
  authorName: string;
  authorLocation: string;
  authorRole: string;
  authorAvatar?: string;
  title?: string;
  content: string;
  intents?: ConnectionIntent[];
  tags: string[];
}

export interface UpdateSparkInput {
  sparkId: string;
  authorId: string;
  title?: string;
  content?: string;
  tags?: string[];
}

export interface CreateReplyInput {
  sparkId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorLocation?: string;
  authorAvatar?: string;
  content: string;
  sparkAuthorId?: string;
  sparkTitleOrSnippet?: string;
  currentUserProfile?: UserProfile | null;
}

// In-memory cache for public profiles to enrich reply authors
const profileCache: Map<string, PublicProfile> = new Map();

// Local fallback store for offline/ephemeral created replies
const localRepliesStore: Map<string, SparkReply[]> = new Map();
// Initialize localRepliesStore with sample replies
Object.entries(SAMPLE_SPARK_REPLIES).forEach(([sparkId, replies]) => {
  localRepliesStore.set(sparkId, [...replies]);
});

export const sparkService = {
  /**
   * Helper to normalize spark post data
   */
  normalizeSpark(data: any, id: string): CuriousBoardPost {
    return {
      id,
      authorId: data.authorId || '',
      authorName: data.authorName || 'Anonymous Thinker',
      authorLocation: data.authorLocation || 'Worldwide',
      authorRole: data.authorRole || 'Explorer',
      authorAvatar: data.authorAvatar || undefined,
      title: data.title || '',
      content: data.content || '',
      intents: Array.isArray(data.intents) ? data.intents : ['Exchange Ideas'],
      tags: Array.isArray(data.tags) ? data.tags : ['Curiosity'],
      timestamp: data.timestamp || 'Recently',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      repliesCount: typeof data.repliesCount === 'number' ? Math.max(0, data.repliesCount) : 0,
      thinkerIds: Array.isArray(data.thinkerIds) ? data.thinkerIds : [],
      thinkersSummary: typeof data.thinkersSummary === 'object' && data.thinkersSummary !== null ? data.thinkersSummary : {},
    };
  },

  /**
   * Helper to normalize spark reply data
   */
  normalizeReply(data: any, id: string, sparkId: string): SparkReply {
    return {
      id,
      sparkId: data.sparkId || sparkId,
      authorId: data.authorId || '',
      authorName: data.authorName || 'Thinker',
      authorRole: data.authorRole || '',
      authorLocation: data.authorLocation || '',
      authorAvatar: data.authorAvatar || '',
      content: data.content || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || undefined,
    };
  },

  /**
   * Helper to fetch author public profile with caching
   */
  async getAuthorProfile(authorId: string): Promise<PublicProfile | null> {
    if (!authorId) return null;
    if (profileCache.has(authorId)) {
      return profileCache.get(authorId)!;
    }
    try {
      const profile = await discoveryService.getPublicProfile(authorId);
      if (profile) {
        profileCache.set(authorId, profile);
        return profile;
      }
    } catch (err) {
      console.warn(`Failed to fetch public profile for ${authorId}:`, err);
    }
    return null;
  },

  /**
   * Real-time subscription to all Sparks (CuriousBoardPosts)
   */
  subscribeSparks(onUpdate: (sparks: CuriousBoardPost[]) => void): () => void {
    const q = query(collection(db, 'boardPosts'), limit(60));
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          onUpdate(SAMPLE_BOARD_POSTS);
          return;
        }
        const posts: CuriousBoardPost[] = [];
        snap.forEach((d) => posts.push(this.normalizeSpark(d.data(), d.id)));

        // Merge with sample posts so initial state is richly populated
        const ids = new Set(posts.map((p) => p.id));
        const merged = [...posts];
        for (const sample of SAMPLE_BOARD_POSTS) {
          if (!ids.has(sample.id)) {
            merged.push(sample);
          }
        }
        // Sort descending by createdAt
        merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(merged);
      },
      (error) => {
        console.warn('Falling back to sample board posts due to Firestore error:', error);
        onUpdate(SAMPLE_BOARD_POSTS);
      }
    );
  },

  /**
   * Fetch single Spark by ID
   */
  async getSpark(sparkId: string): Promise<CuriousBoardPost | null> {
    if (!sparkId) return null;

    try {
      const snap = await getDoc(doc(db, 'boardPosts', sparkId));
      if (snap.exists()) {
        return this.normalizeSpark(snap.data(), snap.id);
      }
    } catch (err) {
      console.warn(`Failed to get spark ${sparkId} from Firestore:`, err);
    }

    const sample = SAMPLE_BOARD_POSTS.find((p) => p.id === sparkId);
    return sample || null;
  },

  /**
   * Create a new Spark
   */
  async createSpark(input: CreateSparkInput): Promise<CuriousBoardPost> {
    const sparkId = `spark_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newPost: CuriousBoardPost = {
      id: sparkId,
      authorId: input.authorId,
      authorName: input.authorName,
      authorLocation: input.authorLocation || 'Worldwide',
      authorRole: input.authorRole || 'Explorer',
      authorAvatar: input.authorAvatar,
      title: input.title ? input.title.trim() : undefined,
      content: input.content.trim(),
      intents: input.intents || ['Exchange Ideas'],
      tags: input.tags.length ? input.tags : ['Curiosity'],
      timestamp: 'Just now',
      createdAt: now,
      updatedAt: now,
      repliesCount: 0,
      thinkerIds: [input.authorId],
      thinkersSummary: {
        [input.authorId]: {
          id: input.authorId,
          name: input.authorName,
          role: input.authorRole,
          location: input.authorLocation,
          avatarUrl: input.authorAvatar,
        },
      },
    };

    const sanitized = sanitizeFirestoreData(newPost);
    try {
      await setDoc(doc(db, 'boardPosts', sparkId), sanitized);
      return newPost;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `boardPosts/${sparkId}`);
      return newPost;
    }
  },

  /**
   * Update an existing Spark (author only)
   */
  async updateSpark(input: UpdateSparkInput): Promise<void> {
    const { sparkId, authorId, title, content, tags } = input;
    if (!sparkId || !authorId) throw new Error('Spark ID and author ID required');

    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
    };
    if (title !== undefined) updatePayload.title = title.trim();
    if (content !== undefined) updatePayload.content = content.trim();
    if (tags !== undefined) updatePayload.tags = tags;

    try {
      await updateDoc(doc(db, 'boardPosts', sparkId), updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `boardPosts/${sparkId}`);
    }
  },

  /**
   * Delete a Spark (author only)
   */
  async deleteSpark(sparkId: string, authorId: string): Promise<void> {
    if (!sparkId || !authorId) throw new Error('Spark ID and author ID required');
    try {
      await deleteDoc(doc(db, 'boardPosts', sparkId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `boardPosts/${sparkId}`);
    }
  },

  /**
   * Real-time subscription to public discussion replies for a specific Spark
   */
  subscribeSparkReplies(
    sparkId: string,
    onUpdate: (replies: SparkReply[]) => void
  ): () => void {
    if (!sparkId) {
      onUpdate([]);
      return () => {};
    }

    const repliesCol = collection(db, 'boardPosts', sparkId, 'replies');
    const q = query(repliesCol, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const firestoreReplies: SparkReply[] = [];
        snapshot.forEach((docSnap) => {
          firestoreReplies.push(this.normalizeReply(docSnap.data(), docSnap.id, sparkId));
        });

        // Merge with sample/local replies for rich exploration if spark is seeded
        const sampleList = localRepliesStore.get(sparkId) || SAMPLE_SPARK_REPLIES[sparkId] || [];
        const seenIds = new Set(firestoreReplies.map((r) => r.id));
        const merged = [...firestoreReplies];
        for (const sample of sampleList) {
          if (!seenIds.has(sample.id)) {
            merged.push(sample);
          }
        }

        // Sort ascending chronologically (conversation flow)
        merged.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

        // Enrich with cached author profiles synchronously
        for (const reply of merged) {
          if (profileCache.has(reply.authorId)) {
            reply.authorProfile = profileCache.get(reply.authorId);
          }
        }

        onUpdate(merged);

        // Fetch any missing author profiles in background
        const missingIds = Array.from(
          new Set(merged.map((r) => r.authorId).filter((id) => id && !profileCache.has(id)))
        );

        if (missingIds.length > 0) {
          Promise.all(missingIds.map((id) => this.getAuthorProfile(id))).then(() => {
            const enriched = merged.map((r) => ({
              ...r,
              authorProfile: profileCache.get(r.authorId) || null,
            }));
            onUpdate(enriched);
          });
        }
      },
      (error) => {
        console.warn(`Firestore replies subscription fallback for ${sparkId}:`, error);
        const fallbackList = localRepliesStore.get(sparkId) || SAMPLE_SPARK_REPLIES[sparkId] || [];
        onUpdate(fallbackList);
      }
    );

    return unsubscribe;
  },

  /**
   * Add a public reply to a Spark discussion
   */
  async addReply(input: CreateReplyInput): Promise<SparkReply> {
    const {
      sparkId,
      authorId,
      authorName,
      authorRole,
      authorLocation,
      authorAvatar,
      content,
      sparkAuthorId,
      sparkTitleOrSnippet,
      currentUserProfile,
    } = input;

    if (!sparkId || !authorId || !content.trim()) {
      throw new Error('Spark ID, author, and content are required.');
    }

    const replyId = `reply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newReply: SparkReply = {
      id: replyId,
      sparkId,
      authorId,
      authorName: authorName || 'Thinker',
      authorRole: authorRole || '',
      authorLocation: authorLocation || '',
      authorAvatar: authorAvatar || '',
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // Store in local store for immediate responsiveness
    const currentLocal = localRepliesStore.get(sparkId) || [];
    localRepliesStore.set(sparkId, [...currentLocal, newReply]);

    // Persist reply in Firestore subcollection
    const sanitizedReply = sanitizeFirestoreData(newReply);
    const replyRef = doc(db, 'boardPosts', sparkId, 'replies', replyId);

    try {
      await setDoc(replyRef, sanitizedReply);
    } catch (err) {
      console.warn('Persisting reply to Firestore subcollection failed (relying on local store):', err);
    }

    // Update Spark parent document metadata (increment reply count, record thinker)
    try {
      const sparkRef = doc(db, 'boardPosts', sparkId);
      const sparkSnap = await getDoc(sparkRef);
      if (sparkSnap.exists()) {
        const data = sparkSnap.data();
        const currentCount = typeof data.repliesCount === 'number' ? data.repliesCount : 0;
        const thinkerIds: string[] = Array.isArray(data.thinkerIds) ? data.thinkerIds : [];
        const thinkersSummary = typeof data.thinkersSummary === 'object' && data.thinkersSummary !== null ? { ...data.thinkersSummary } : {};

        if (!thinkerIds.includes(authorId)) {
          thinkerIds.push(authorId);
        }

        thinkersSummary[authorId] = {
          id: authorId,
          name: authorName,
          role: authorRole || '',
          location: authorLocation || '',
          avatarUrl: authorAvatar || '',
        };

        await updateDoc(sparkRef, {
          repliesCount: currentCount + 1,
          thinkerIds,
          thinkersSummary,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Could not update Spark parent metadata in Firestore:', err);
    }

    // Trigger SPARK_INTERACTION notification for Spark Author
    if (sparkAuthorId && sparkAuthorId !== authorId) {
      try {
        const preview = sparkTitleOrSnippet
          ? sparkTitleOrSnippet.length > 50
            ? `${sparkTitleOrSnippet.slice(0, 50)}...`
            : sparkTitleOrSnippet
          : 'your Spark question';

        await notificationService.createNotification({
          recipientId: sparkAuthorId,
          senderId: authorId,
          senderName: authorName,
          senderAvatar: authorAvatar,
          senderRole: authorRole,
          type: 'SPARK_INTERACTION',
          title: `${authorName} replied to your Spark`,
          message: `"${content.trim().slice(0, 100)}${content.length > 100 ? '...' : ''}" on ${preview}`,
          referenceId: sparkId,
        });
      } catch (notifErr) {
        console.warn('Failed to send spark interaction notification:', notifErr);
      }
    }

    return newReply;
  },

  /**
   * Update an existing reply (author only)
   */
  async updateReply(
    sparkId: string,
    replyId: string,
    authorId: string,
    newContent: string
  ): Promise<void> {
    if (!sparkId || !replyId || !authorId) return;

    // Update in local store
    const local = localRepliesStore.get(sparkId) || [];
    localRepliesStore.set(
      sparkId,
      local.map((r) => (r.id === replyId ? { ...r, content: newContent.trim(), updatedAt: new Date().toISOString() } : r))
    );

    try {
      const replyRef = doc(db, 'boardPosts', sparkId, 'replies', replyId);
      await updateDoc(replyRef, {
        content: newContent.trim(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to update reply in Firestore:', err);
    }
  },

  /**
   * Delete a reply (author only)
   */
  async deleteReply(sparkId: string, replyId: string, authorId: string): Promise<void> {
    if (!sparkId || !replyId || !authorId) return;

    // Remove from local store
    const local = localRepliesStore.get(sparkId) || [];
    localRepliesStore.set(
      sparkId,
      local.filter((r) => r.id !== replyId)
    );

    try {
      const replyRef = doc(db, 'boardPosts', sparkId, 'replies', replyId);
      await deleteDoc(replyRef);

      // Decrement repliesCount on parent spark
      const sparkRef = doc(db, 'boardPosts', sparkId);
      const sparkSnap = await getDoc(sparkRef);
      if (sparkSnap.exists()) {
        const count = sparkSnap.data().repliesCount || 0;
        await updateDoc(sparkRef, {
          repliesCount: Math.max(0, count - 1),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Failed to delete reply in Firestore:', err);
    }
  },
};
