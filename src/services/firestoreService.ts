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
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import { UserProfile, PublicProfile, CuriousBoardPost, Connection, ChatMessage, AppNotification, NotificationType } from '../types';
import { SAMPLE_PROFILES, SAMPLE_BOARD_POSTS } from '../data/mockData';
import { userService } from './userService';
import { discoveryService } from './discoveryService';
import { connectionService, SendConnectionParams } from './connectionService';
import { notificationService, CreateNotificationInput } from './notificationService';

export const firestoreService = {
  // =========================================================================
  // USER & PUBLIC PROFILES
  // =========================================================================
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return userService.getUserProfile(userId);
  },

  async saveUserProfile(profile: UserProfile): Promise<UserProfile> {
    const uid = profile.uid || profile.id;
    return userService.updateUserProfile(uid, profile);
  },

  async getAllUsers(currentUserId?: string): Promise<PublicProfile[]> {
    return discoveryService.getPublicProfiles(currentUserId);
  },

  subscribeUsers(onUpdate: (users: PublicProfile[]) => void, currentUserId?: string): () => void {
    return discoveryService.subscribePublicProfiles(onUpdate, currentUserId);
  },

  async getPublicProfile(uid: string): Promise<PublicProfile | null> {
    return discoveryService.getPublicProfile(uid);
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
    const sanitized = sanitizeFirestoreData({
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
  // CONNECTIONS & NETWORK
  // =========================================================================
  async sendConnectionRequest(params: SendConnectionParams): Promise<Connection> {
    return connectionService.sendConnectionRequest(params);
  },

  async acceptConnection(connectionId: string, currentUserId: string): Promise<void> {
    return connectionService.acceptConnection(connectionId, currentUserId);
  },

  async declineConnection(connectionId: string, currentUserId: string): Promise<void> {
    return connectionService.declineConnection(connectionId, currentUserId);
  },

  async cancelConnectionRequest(connectionId: string, currentUserId: string): Promise<void> {
    return connectionService.cancelConnectionRequest(connectionId, currentUserId);
  },

  async removeConnection(connectionId: string, currentUserId: string): Promise<void> {
    return connectionService.removeConnection(connectionId, currentUserId);
  },

  async getConnections(userId: string): Promise<Connection[]> {
    return connectionService.subscribeUserConnections ? [] : [];
  },

  async saveConnection(conn: Connection): Promise<Connection> {
    const path = `connections/${conn.id}`;
    const sanitized = sanitizeFirestoreData({
      ...conn,
      createdAt: conn.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, 'connections', conn.id), sanitized, { merge: true });
      return sanitized as Connection;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  subscribeConnections(userId: string, onUpdate: (conns: Connection[]) => void): () => void {
    return connectionService.subscribeUserConnections(userId, onUpdate);
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
    const sanitized = sanitizeFirestoreData({
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

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================
  async createNotification(input: CreateNotificationInput): Promise<AppNotification | null> {
    return notificationService.createNotification(input);
  },

  async getNotifications(userId: string, limitCount = 40): Promise<AppNotification[]> {
    return notificationService.getNotifications(userId, limitCount);
  },

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    return notificationService.markNotificationAsRead(notificationId, userId);
  },

  async markAllNotificationsAsRead(userId: string, currentNotifications?: AppNotification[]): Promise<void> {
    return notificationService.markAllNotificationsAsRead(userId, currentNotifications);
  },

  subscribeNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void,
    limitCount = 50
  ): () => void {
    return notificationService.subscribeUserNotifications(userId, onUpdate, limitCount);
  },
};
