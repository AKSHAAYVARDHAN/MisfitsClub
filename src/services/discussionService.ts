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
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import { SpacePost, SpaceComment, SpaceReaction, DiscussionPostType, PublicProfile, UserProfile } from '../types';
import { discoveryService } from './discoveryService';
import { notificationService } from './notificationService';

export interface CreatePostInput {
  spaceId: string;
  authorId: string;
  type: DiscussionPostType;
  title?: string;
  content: string;
}

export interface UpdatePostInput {
  spaceId: string;
  postId: string;
  authorId: string;
  type?: DiscussionPostType;
  title?: string;
  content?: string;
}

export interface CreateCommentInput {
  spaceId: string;
  postId: string;
  authorId: string;
  content: string;
  postAuthorId?: string;
  postTitle?: string;
  currentUserProfile?: UserProfile | null;
}

// In-memory cache for author public profiles to avoid repeated Firestore lookups
const profileCache: Map<string, PublicProfile> = new Map();

export const discussionService = {
  /**
   * Helper to normalize post data
   */
  normalizePost(data: any, id: string): SpacePost {
    return {
      id,
      spaceId: data.spaceId || '',
      authorId: data.authorId || '',
      type: (data.type as DiscussionPostType) || 'Discussion',
      title: data.title || '',
      content: data.content || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      commentCount: typeof data.commentCount === 'number' ? Math.max(0, data.commentCount) : 0,
      reactionCount: typeof data.reactionCount === 'number' ? Math.max(0, data.reactionCount) : 0,
    };
  },

  /**
   * Helper to normalize comment data
   */
  normalizeComment(data: any, id: string): SpaceComment {
    return {
      id,
      postId: data.postId || '',
      spaceId: data.spaceId || '',
      authorId: data.authorId || '',
      content: data.content || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  },

  /**
   * Fetch author public profile with memory cache
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
   * Real-time subscription to discussion posts in a space (newest first)
   */
  subscribePosts(spaceId: string, onUpdate: (posts: SpacePost[]) => void): () => void {
    if (!spaceId) {
      onUpdate([]);
      return () => {};
    }

    const postsCol = collection(db, 'spaces', spaceId, 'posts');
    const q = query(postsCol, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const posts: SpacePost[] = [];
        snapshot.forEach((docSnap) => {
          posts.push(this.normalizePost(docSnap.data(), docSnap.id));
        });

        // Enrich with cached author profiles synchronously
        for (const post of posts) {
          if (profileCache.has(post.authorId)) {
            post.authorProfile = profileCache.get(post.authorId);
          }
        }

        onUpdate(posts);

        // Asynchronously load any missing author profiles in the background
        const missingAuthorIds = Array.from(
          new Set(posts.map((p) => p.authorId).filter((id) => id && !profileCache.has(id)))
        );

        if (missingAuthorIds.length > 0) {
          Promise.all(missingAuthorIds.map((id) => this.getAuthorProfile(id))).then(() => {
            // After loading missing profiles, refresh with enriched data
            const enriched = posts.map((p) => ({
              ...p,
              authorProfile: profileCache.get(p.authorId) || null,
            }));
            onUpdate(enriched);
          });
        }
      },
      (error) => {
        console.warn('Error subscribing to space posts:', error);
        onUpdate([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Create a new discussion post inside a Space
   */
  async createPost(input: CreatePostInput): Promise<SpacePost> {
    const { spaceId, authorId, type, title, content } = input;

    if (!spaceId || !authorId || !content.trim()) {
      throw new Error('Space, author ID, and content are required.');
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const postData: SpacePost = {
      id: postId,
      spaceId,
      authorId,
      type: type || 'Discussion',
      title: title ? title.trim() : '',
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
      commentCount: 0,
      reactionCount: 0,
    };

    const sanitized = sanitizeFirestoreData(postData);
    const postRef = doc(db, 'spaces', spaceId, 'posts', postId);

    try {
      await setDoc(postRef, sanitized);
      return postData;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `spaces/${spaceId}/posts/${postId}`);
      throw error;
    }
  },

  /**
   * Update an existing discussion post (author only)
   */
  async updatePost(input: UpdatePostInput): Promise<void> {
    const { spaceId, postId, authorId, type, title, content } = input;

    if (!spaceId || !postId || !authorId) {
      throw new Error('Space ID, post ID, and author ID are required.');
    }

    const postRef = doc(db, 'spaces', spaceId, 'posts', postId);
    const now = new Date().toISOString();

    const updates: any = {
      updatedAt: now,
    };
    if (type) updates.type = type;
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();

    try {
      await updateDoc(postRef, updates);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}/posts/${postId}`);
      throw error;
    }
  },

  /**
   * Delete a discussion post (author or space owner)
   */
  async deletePost(spaceId: string, postId: string): Promise<void> {
    if (!spaceId || !postId) return;
    const postRef = doc(db, 'spaces', spaceId, 'posts', postId);

    try {
      await deleteDoc(postRef);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `spaces/${spaceId}/posts/${postId}`);
      throw error;
    }
  },

  /**
   * Real-time subscription to comments on a post (oldest first)
   */
  subscribeComments(
    spaceId: string,
    postId: string,
    onUpdate: (comments: SpaceComment[]) => void
  ): () => void {
    if (!spaceId || !postId) {
      onUpdate([]);
      return () => {};
    }

    const commentsCol = collection(db, 'spaces', spaceId, 'posts', postId, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const comments: SpaceComment[] = [];
        snapshot.forEach((docSnap) => {
          comments.push(this.normalizeComment(docSnap.data(), docSnap.id));
        });

        // Enrich with cached author profiles
        for (const comment of comments) {
          if (profileCache.has(comment.authorId)) {
            comment.authorProfile = profileCache.get(comment.authorId);
          }
        }

        onUpdate(comments);

        // Asynchronously load any missing author profiles in the background
        const missingAuthorIds = Array.from(
          new Set(comments.map((c) => c.authorId).filter((id) => id && !profileCache.has(id)))
        );

        if (missingAuthorIds.length > 0) {
          Promise.all(missingAuthorIds.map((id) => this.getAuthorProfile(id))).then(() => {
            const enriched = comments.map((c) => ({
              ...c,
              authorProfile: profileCache.get(c.authorId) || null,
            }));
            onUpdate(enriched);
          });
        }
      },
      (error) => {
        console.warn('Error subscribing to comments:', error);
        onUpdate([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Add a comment to a discussion post (atomic transaction)
   */
  async addComment(input: CreateCommentInput): Promise<SpaceComment> {
    const { spaceId, postId, authorId, content, postAuthorId, postTitle, currentUserProfile } = input;

    if (!spaceId || !postId || !authorId || !content.trim()) {
      throw new Error('All comment fields are required.');
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const commentData: SpaceComment = {
      id: commentId,
      postId,
      spaceId,
      authorId,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const postRef = doc(db, 'spaces', spaceId, 'posts', postId);
    const commentRef = doc(db, 'spaces', spaceId, 'posts', postId, 'comments', commentId);

    try {
      await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) {
          throw new Error('Discussion post not found.');
        }

        const postData = postSnap.data();
        const currentCount = typeof postData.commentCount === 'number' ? postData.commentCount : 0;

        transaction.set(commentRef, sanitizeFirestoreData(commentData));
        transaction.update(postRef, {
          commentCount: currentCount + 1,
          updatedAt: now,
        });
      });

      // Dispatch notification to post author if not commenting on own post
      if (postAuthorId && postAuthorId !== authorId) {
        try {
          await notificationService.createNotification({
            recipientId: postAuthorId,
            senderId: authorId,
            senderName: currentUserProfile?.name || 'A Misfits Member',
            senderAvatar: currentUserProfile?.avatarUrl || currentUserProfile?.profilePhoto,
            senderRole: currentUserProfile?.role,
            type: 'SPARK_INTERACTION',
            title: 'New Reply in Space',
            message: `${currentUserProfile?.name || 'A member'} commented on your discussion${postTitle ? ` "${postTitle.substring(0, 30)}..."` : ''}.`,
            referenceId: spaceId,
          });
        } catch (notifErr) {
          console.warn('Failed to send comment notification:', notifErr);
        }
      }

      return commentData;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `spaces/${spaceId}/posts/${postId}/comments/${commentId}`);
      throw error;
    }
  },

  /**
   * Delete a comment (author or space owner, atomic transaction)
   */
  async deleteComment(spaceId: string, postId: string, commentId: string): Promise<void> {
    if (!spaceId || !postId || !commentId) return;

    const postRef = doc(db, 'spaces', spaceId, 'posts', postId);
    const commentRef = doc(db, 'spaces', spaceId, 'posts', postId, 'comments', commentId);

    try {
      await runTransaction(db, async (transaction) => {
        const commentSnap = await transaction.get(commentRef);
        if (!commentSnap.exists()) return;

        const postSnap = await transaction.get(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          const currentCount = typeof postData.commentCount === 'number' ? postData.commentCount : 1;
          transaction.update(postRef, {
            commentCount: Math.max(0, currentCount - 1),
            updatedAt: new Date().toISOString(),
          });
        }

        transaction.delete(commentRef);
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `spaces/${spaceId}/posts/${postId}/comments/${commentId}`);
      throw error;
    }
  },

  /**
   * Toggle reaction on a discussion post (atomic transaction)
   */
  async toggleReaction(
    spaceId: string,
    postId: string,
    userId: string,
    postAuthorId?: string,
    postTitle?: string,
    currentUserProfile?: UserProfile | null
  ): Promise<{ reacted: boolean; count: number }> {
    if (!spaceId || !postId || !userId) {
      throw new Error('Space ID, post ID, and user ID are required.');
    }

    const postRef = doc(db, 'spaces', spaceId, 'posts', postId);
    const reactionRef = doc(db, 'spaces', spaceId, 'posts', postId, 'reactions', userId);

    try {
      const result = await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) {
          throw new Error('Discussion post not found.');
        }

        const reactionSnap = await transaction.get(reactionRef);
        const postData = postSnap.data();
        const currentCount = typeof postData.reactionCount === 'number' ? postData.reactionCount : 0;
        const now = new Date().toISOString();

        if (reactionSnap.exists()) {
          // Remove reaction
          const newCount = Math.max(0, currentCount - 1);
          transaction.delete(reactionRef);
          transaction.update(postRef, {
            reactionCount: newCount,
            updatedAt: now,
          });
          return { reacted: false, count: newCount };
        } else {
          // Add reaction
          const newCount = currentCount + 1;
          const reactionData: SpaceReaction = {
            uid: userId,
            createdAt: now,
            type: 'appreciate',
          };
          transaction.set(reactionRef, sanitizeFirestoreData(reactionData));
          transaction.update(postRef, {
            reactionCount: newCount,
            updatedAt: now,
          });
          return { reacted: true, count: newCount };
        }
      });

      // Send notification if reacted and not reacting to own post
      if (result.reacted && postAuthorId && postAuthorId !== userId) {
        try {
          await notificationService.createNotification({
            recipientId: postAuthorId,
            senderId: userId,
            senderName: currentUserProfile?.name || 'A Misfits Member',
            senderAvatar: currentUserProfile?.avatarUrl || currentUserProfile?.profilePhoto,
            senderRole: currentUserProfile?.role,
            type: 'SPARK_INTERACTION',
            title: 'Discussion Appreciated',
            message: `${currentUserProfile?.name || 'A member'} appreciated your discussion${postTitle ? ` "${postTitle.substring(0, 30)}..."` : ''}.`,
            referenceId: spaceId,
          });
        } catch (notifErr) {
          console.warn('Failed to send reaction notification:', notifErr);
        }
      }

      return result;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `spaces/${spaceId}/posts/${postId}/reactions/${userId}`);
      throw error;
    }
  },

  /**
   * Subscribe to user's reactions in a space to know which posts they've appreciated
   */
  subscribeUserReactionsForSpace(
    spaceId: string,
    userId: string,
    postIds: string[],
    onUpdate: (reactedPostIds: Set<string>) => void
  ): () => void {
    if (!spaceId || !userId || postIds.length === 0) {
      onUpdate(new Set());
      return () => {};
    }

    const unsubs: (() => void)[] = [];
    const activeReacted = new Set<string>();

    postIds.slice(0, 30).forEach((postId) => {
      const ref = doc(db, 'spaces', spaceId, 'posts', postId, 'reactions', userId);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            activeReacted.add(postId);
          } else {
            activeReacted.delete(postId);
          }
          onUpdate(new Set(activeReacted));
        },
        () => {
          // Non-blocking error handling
        }
      );
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  },
};
