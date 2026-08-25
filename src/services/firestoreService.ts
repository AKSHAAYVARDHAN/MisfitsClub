import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, CuriousBoardPost, Connection, ChatMessage } from '../types';
import { SAMPLE_PROFILES, SAMPLE_BOARD_POSTS } from '../data/mockData';

// Helper to sanitize undefined values before writing to Firestore
function sanitizeData<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

export const firestoreService = {
  // =========================================================================
  // USER PROFILES
  // =========================================================================
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<UserProfile> {
    const path = `users/${profile.id}`;
    const sanitized = sanitizeData({
      ...profile,
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, 'users', profile.id), sanitized, { merge: true });
      return sanitized as UserProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      
      // If Firestore users collection is currently empty, seed with sample profiles
      if (list.length === 0) {
        return SAMPLE_PROFILES;
      }
      
      // Combine with sample profiles so the Orb and Discover views are always populated
      const existingIds = new Set(list.map((u) => u.id));
      const merged = [...list];
      for (const sample of SAMPLE_PROFILES) {
        if (!existingIds.has(sample.id)) {
          merged.push(sample);
        }
      }
      return merged;
    } catch (error) {
      console.warn('Failed to fetch remote users, using sample profiles fallback', error);
      return SAMPLE_PROFILES;
    }
  },

  subscribeUsers(onUpdate: (users: UserProfile[]) => void): () => void {
    const path = 'users';
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((d) => list.push(d.data() as UserProfile));
        
        const existingIds = new Set(list.map((u) => u.id));
        const merged = [...list];
        for (const sample of SAMPLE_PROFILES) {
          if (!existingIds.has(sample.id)) {
            merged.push(sample);
          }
        }
        onUpdate(merged);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  // =========================================================================
  // CURIOSITY BOARD POSTS
  // =========================================================================
  async getBoardPosts(): Promise<CuriousBoardPost[]> {
    const path = 'boardPosts';
    try {
      const q = query(collection(db, 'boardPosts'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const posts: CuriousBoardPost[] = [];
      snap.forEach((d) => posts.push(d.data() as CuriousBoardPost));
      
      if (posts.length === 0) {
        return SAMPLE_BOARD_POSTS;
      }
      
      // Merge with sample posts
      const ids = new Set(posts.map((p) => p.id));
      const merged = [...posts];
      for (const sample of SAMPLE_BOARD_POSTS) {
        if (!ids.has(sample.id)) {
          merged.push(sample);
        }
      }
      return merged;
    } catch (error) {
      console.warn('Falling back to local sample board posts', error);
      return SAMPLE_BOARD_POSTS;
    }
  },

  async addBoardPost(post: CuriousBoardPost): Promise<CuriousBoardPost> {
    const path = `boardPosts/${post.id}`;
    const sanitized = sanitizeData({
      ...post,
      createdAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, 'boardPosts', post.id), sanitized);
      return sanitized as CuriousBoardPost;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async reactToBoardPost(postId: string, newLikesCount: number): Promise<void> {
    const path = `boardPosts/${postId}`;
    try {
      await updateDoc(doc(db, 'boardPosts', postId), {
        likesCount: newLikesCount,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  subscribeBoardPosts(onUpdate: (posts: CuriousBoardPost[]) => void): () => void {
    const path = 'boardPosts';
    const q = query(collection(db, 'boardPosts'), limit(60));
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          onUpdate(SAMPLE_BOARD_POSTS);
          return;
        }
        const posts: CuriousBoardPost[] = [];
        snap.forEach((d) => posts.push(d.data() as CuriousBoardPost));
        
        // Merge with sample posts so initial exploration is rich
        const ids = new Set(posts.map((p) => p.id));
        const merged = [...posts];
        for (const sample of SAMPLE_BOARD_POSTS) {
          if (!ids.has(sample.id)) {
            merged.push(sample);
          }
        }
        onUpdate(merged);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  // =========================================================================
  // CONNECTIONS
  // =========================================================================
  async getConnections(userId: string): Promise<Connection[]> {
    const path = 'connections';
    try {
      const qRequester = query(collection(db, 'connections'), where('requesterId', '==', userId));
      const qTarget = query(collection(db, 'connections'), where('targetId', '==', userId));
      
      const [snap1, snap2] = await Promise.all([getDocs(qRequester), getDocs(qTarget)]);
      const connsMap = new Map<string, Connection>();
      
      snap1.forEach((d) => connsMap.set(d.id, d.data() as Connection));
      snap2.forEach((d) => connsMap.set(d.id, d.data() as Connection));
      
      return Array.from(connsMap.values());
    } catch (error) {
      console.warn('Using local connections fallback', error);
      return [];
    }
  },

  async saveConnection(conn: Connection): Promise<Connection> {
    const path = `connections/${conn.id}`;
    const sanitized = sanitizeData({
      ...conn,
      createdAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, 'connections', conn.id), sanitized, { merge: true });
      return sanitized as Connection;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  subscribeConnections(userId: string, onUpdate: (conns: Connection[]) => void): () => void {
    const path = 'connections';
    const q1 = query(collection(db, 'connections'), where('requesterId', '==', userId));
    
    return onSnapshot(
      q1,
      (snap) => {
        const conns: Connection[] = [];
        snap.forEach((d) => conns.push(d.data() as Connection));
        onUpdate(conns);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  // =========================================================================
  // MESSAGES
  // =========================================================================
  async getMessages(connectionId: string): Promise<ChatMessage[]> {
    const path = 'messages';
    try {
      const q = query(collection(db, 'messages'), where('connectionId', '==', connectionId), limit(100));
      const snap = await getDocs(q);
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => msgs.push(d.data() as ChatMessage));
      return msgs;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async sendMessage(message: ChatMessage): Promise<ChatMessage> {
    const path = `messages/${message.id}`;
    const sanitized = sanitizeData({
      ...message,
      createdAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, 'messages', message.id), sanitized);
      return sanitized as ChatMessage;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeMessages(connectionId: string, onUpdate: (messages: ChatMessage[]) => void): () => void {
    const path = 'messages';
    const q = query(collection(db, 'messages'), where('connectionId', '==', connectionId));
    return onSnapshot(
      q,
      (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach((d) => msgs.push(d.data() as ChatMessage));
        // Sort chronologically
        msgs.sort((a, b) => ((a as any).createdAt || a.timestamp || '').localeCompare((b as any).createdAt || b.timestamp || ''));
        onUpdate(msgs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};
