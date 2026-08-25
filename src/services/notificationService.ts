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
  limit,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AppNotification, NotificationType } from '../types';

export interface CreateNotificationInput {
  recipientId: string;
  senderId: string | null;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string;
}

function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

export const notificationService = {
  /**
   * Generates a deterministic notification ID to guarantee idempotency
   * and prevent duplicate notifications from repeat clicks, re-renders, or retries.
   */
  generateNotificationId(type: NotificationType, referenceId: string, recipientId: string): string {
    const cleanType = type.toLowerCase().replace(/_/g, '-');
    const cleanRef = referenceId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const cleanRecip = recipientId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return `notif_${cleanType}_${cleanRef}_${cleanRecip}`;
  },

  /**
   * Create and send a notification document
   */
  async createNotification(input: CreateNotificationInput): Promise<AppNotification | null> {
    const {
      recipientId,
      senderId,
      senderName,
      senderAvatar,
      senderRole,
      type,
      title,
      message,
      referenceId,
    } = input;

    // Safety checks: do not notify yourself
    if (!recipientId || recipientId === senderId) {
      return null;
    }

    const notifId = this.generateNotificationId(type, referenceId, recipientId);
    const path = `notifications/${notifId}`;
    const now = new Date().toISOString();

    const notifData: AppNotification = {
      id: notifId,
      recipientId,
      senderId: senderId || null,
      senderName: senderName || 'A Misfits Member',
      senderAvatar: senderAvatar || undefined,
      senderRole: senderRole || undefined,
      type,
      title,
      message,
      referenceId,
      read: false,
      createdAt: now,
      updatedAt: now,
    };

    const sanitized = sanitizePayload(notifData);

    try {
      // Check if notification already exists to preserve existing read state if duplicate action occurs
      const existingDoc = await getDoc(doc(db, 'notifications', notifId));
      if (existingDoc.exists()) {
        const existingData = existingDoc.data() as AppNotification;
        return existingData;
      }

      await setDoc(doc(db, 'notifications', notifId), sanitized, { merge: true });
      return notifData;
    } catch (error) {
      console.warn('Failed to persist notification to Firestore (using fallback):', error);
      handleFirestoreError(error, OperationType.CREATE, path);
      return notifData;
    }
  },

  /**
   * Fetch latest notifications for a specific user
   */
  async getNotifications(userId: string, limitCount = 40): Promise<AppNotification[]> {
    if (!userId) return [];
    const path = 'notifications';
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const items: AppNotification[] = [];
      snap.forEach((d) => {
        items.push(d.data() as AppNotification);
      });

      // Sort descending by createdAt
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return items;
    } catch (error) {
      console.warn('Could not fetch notifications from Firestore:', error);
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  /**
   * Mark a single notification document as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) return;
    const path = `notifications/${notificationId}`;
    const now = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        updatedAt: now,
      });
    } catch (error) {
      console.warn('Failed to mark notification as read in Firestore:', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Mark all unread notifications for a user as read in a batch
   */
  async markAllNotificationsAsRead(userId: string, currentNotifications?: AppNotification[]): Promise<void> {
    if (!userId) return;
    const path = 'notifications';
    const now = new Date().toISOString();

    try {
      let unreadList = currentNotifications ? currentNotifications.filter((n) => !n.read) : [];

      if (!currentNotifications) {
        const q = query(
          collection(db, 'notifications'),
          where('recipientId', '==', userId),
          where('read', '==', false)
        );
        const snap = await getDocs(q);
        unreadList = [];
        snap.forEach((d) => unreadList.push(d.data() as AppNotification));
      }

      if (unreadList.length === 0) return;

      const batch = writeBatch(db);
      for (const notif of unreadList) {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, {
          read: true,
          updatedAt: now,
        });
      }

      await batch.commit();
    } catch (error) {
      console.warn('Failed to mark all notifications as read in Firestore:', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Real-time subscription to notifications for an authenticated user
   */
  subscribeUserNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void,
    limitCount = 50
  ): () => void {
    if (!userId) {
      onUpdate([]);
      return () => {};
    }

    const path = 'notifications';
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snap) => {
        const list: AppNotification[] = [];
        snap.forEach((d) => {
          list.push(d.data() as AppNotification);
        });

        // Sort descending by createdAt
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      },
      (error) => {
        console.warn('Notifications subscription fallback:', error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};
