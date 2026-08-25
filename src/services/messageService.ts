import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Conversation, ChatMessage, UserProfile, PublicProfile } from '../types';
import { notificationService } from './notificationService';

function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

export function formatMessageTime(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return 'Just now';
  try {
    const d = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
}

export const messageService = {
  /**
   * Deterministic conversation ID computation for 1-on-1 chats.
   * Ensures User A -> User B and User B -> User A always resolve to the identical conversation ID.
   */
  getDeterministicConversationId(userIdA: string, userIdB: string): string {
    if (!userIdA || !userIdB) {
      throw new Error(`Invalid participant IDs for conversation: userIdA='${userIdA}', userIdB='${userIdB}'`);
    }
    if (userIdA === userIdB) {
      throw new Error(`Cannot start a conversation with the same user ID: '${userIdA}'`);
    }
    const sorted = [userIdA, userIdB].sort();
    const cleanA = sorted[0].replace(/[^a-zA-Z0-9_\-]/g, '_');
    const cleanB = sorted[1].replace(/[^a-zA-Z0-9_\-]/g, '_');
    return `conv_${cleanA}_${cleanB}`;
  },

  /**
   * Get or create a conversation between two connected users.
   */
  async getOrCreateConversation(params: {
    currentUserId: string;
    targetUserId: string;
    currentUserProfile: UserProfile;
    targetProfile?: Partial<UserProfile | PublicProfile>;
    connectionId?: string;
  }): Promise<Conversation> {
    const { currentUserId, targetUserId, currentUserProfile, targetProfile, connectionId } = params;
    const conversationId = this.getDeterministicConversationId(currentUserId, targetUserId);
    const path = `conversations/${conversationId}`;
    const now = new Date().toISOString();

    try {
      const docRef = doc(db, 'conversations', conversationId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as Conversation;
        return data;
      }

      // Initialize fresh conversation
      const conversationData: Conversation = {
        id: conversationId,
        connectionId: connectionId || '',
        participantIds: [currentUserId, targetUserId],
        participantsSummary: {
          [currentUserId]: {
            name: currentUserProfile.name || 'Member',
            avatarUrl: currentUserProfile.avatarUrl || currentUserProfile.profilePhoto,
            profilePhoto: currentUserProfile.profilePhoto || currentUserProfile.avatarUrl,
            role: currentUserProfile.role || 'Explorer',
            location: currentUserProfile.location || 'Worldwide',
          },
          [targetUserId]: {
            name: targetProfile?.name || 'Member',
            avatarUrl: (targetProfile as any)?.avatarUrl || (targetProfile as any)?.profilePhoto,
            profilePhoto: (targetProfile as any)?.profilePhoto || (targetProfile as any)?.avatarUrl,
            role: (targetProfile as any)?.role || 'Explorer',
            location: (targetProfile as any)?.location || 'Worldwide',
          },
        },
        unreadCounts: {
          [currentUserId]: 0,
          [targetUserId]: 0,
        },
        lastMessage: 'Conversation opened',
        lastMessageAt: now,
        lastMessageSenderId: currentUserId,
        createdAt: now,
        updatedAt: now,
      };

      const sanitized = sanitizePayload(conversationData);
      await setDoc(docRef, sanitized);
      return conversationData;
    } catch (error) {
      console.error('Failed to get/create conversation in Firestore:', error);
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  /**
   * Subscribe in real time to the authenticated user's conversations list (Inbox).
   */
  subscribeUserConversations(
    userId: string,
    onUpdate: (conversations: Conversation[]) => void
  ): () => void {
    if (!userId) {
      onUpdate([]);
      return () => {};
    }

    const path = 'conversations';
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', userId),
        limit(50)
      );

      return onSnapshot(
        q,
        (snap) => {
          const list: Conversation[] = [];
          snap.forEach((d) => {
            list.push(d.data() as Conversation);
          });
          // Sort conversations by most recent message/update
          list.sort((a, b) => {
            const timeA = a.lastMessageAt || a.updatedAt || a.createdAt || '';
            const timeB = b.lastMessageAt || b.updatedAt || b.createdAt || '';
            return timeB.localeCompare(timeA);
          });
          onUpdate(list);
        },
        (error) => {
          console.warn('Conversations subscription fallback:', error);
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
    } catch (error) {
      console.warn('Failed to initiate conversations subscription:', error);
      return () => {};
    }
  },

  /**
   * Send a direct message in a conversation.
   * Ensures parent conversation document exists first, then writes message to subcollection,
   * updates parent conversation preview & unread count, and triggers notification.
   */
  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderProfile: UserProfile;
    recipientId: string;
    recipientProfile?: Partial<UserProfile | PublicProfile>;
    text: string;
    isStarterPrompt?: boolean;
    connectionId?: string;
  }): Promise<ChatMessage> {
    const {
      conversationId,
      senderId,
      senderProfile,
      recipientId,
      recipientProfile,
      text,
      isStarterPrompt,
      connectionId,
    } = params;

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Message text cannot be empty.');
    }
    if (!senderId || !recipientId) {
      throw new Error(`Invalid sender/recipient: senderId='${senderId}', recipientId='${recipientId}'`);
    }

    const now = new Date().toISOString();
    const formattedTime = formatMessageTime(now);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const messagePath = `conversations/${conversationId}/messages/${messageId}`;

    const messageData: ChatMessage = {
      id: messageId,
      conversationId,
      connectionId: connectionId || conversationId,
      senderId,
      senderName: senderProfile.name || 'Member',
      text: trimmedText,
      timestamp: formattedTime,
      createdAt: now,
      readBy: [senderId],
      isStarterPrompt: Boolean(isStarterPrompt),
    };

    const sanitizedMessage = sanitizePayload(messageData);

    try {
      // 1. Ensure the parent conversation document exists in Firestore first
      const convoDocRef = doc(db, 'conversations', conversationId);
      const convoSnap = await getDoc(convoDocRef);

      if (!convoSnap.exists()) {
        const conversationData: Conversation = {
          id: conversationId,
          connectionId: connectionId || '',
          participantIds: [senderId, recipientId],
          participantsSummary: {
            [senderId]: {
              name: senderProfile.name || 'Member',
              avatarUrl: senderProfile.avatarUrl || senderProfile.profilePhoto,
              profilePhoto: senderProfile.profilePhoto || senderProfile.avatarUrl,
              role: senderProfile.role || 'Explorer',
              location: senderProfile.location || 'Worldwide',
            },
            [recipientId]: {
              name: recipientProfile?.name || 'Member',
              avatarUrl: (recipientProfile as any)?.avatarUrl || (recipientProfile as any)?.profilePhoto,
              profilePhoto: (recipientProfile as any)?.profilePhoto || (recipientProfile as any)?.avatarUrl,
              role: (recipientProfile as any)?.role || 'Explorer',
              location: (recipientProfile as any)?.location || 'Worldwide',
            },
          },
          unreadCounts: {
            [senderId]: 0,
            [recipientId]: 1,
          },
          lastMessage: trimmedText,
          lastMessageAt: now,
          lastMessageSenderId: senderId,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(convoDocRef, sanitizePayload(conversationData));
      } else {
        // Update conversation metadata & increment recipient unread count
        await updateDoc(convoDocRef, {
          lastMessage: trimmedText,
          lastMessageAt: now,
          lastMessageSenderId: senderId,
          updatedAt: now,
          [`unreadCounts.${recipientId}`]: increment(1),
        });
      }

      // 2. Write message to conversation subcollection (guaranteed parent exists with sender in participantIds)
      const msgDocRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await setDoc(msgDocRef, sanitizedMessage);

      // 3. Trigger direct message notification for recipient (if real member)
      if (recipientId && recipientId !== senderId && !recipientId.startsWith('p-')) {
        try {
          const previewText =
            trimmedText.length > 60 ? `${trimmedText.slice(0, 57)}...` : trimmedText;

          await notificationService.createNotification({
            recipientId,
            senderId,
            senderName: senderProfile.name,
            senderAvatar: senderProfile.avatarUrl || senderProfile.profilePhoto,
            senderRole: senderProfile.role,
            type: 'MESSAGE',
            title: 'Direct Message',
            message: `${senderProfile.name}: "${previewText}"`,
            referenceId: conversationId,
          });
        } catch (notifErr) {
          console.warn('Failed to dispatch message notification document:', notifErr);
        }
      }

      return messageData;
    } catch (error) {
      console.error('Failed to send message to Firestore:', error);
      handleFirestoreError(error, OperationType.CREATE, messagePath);
      throw error;
    }
  },

  /**
   * Subscribe to real-time messages for an active conversation.
   */
  subscribeConversationMessages(
    conversationId: string,
    onUpdate: (messages: ChatMessage[]) => void,
    limitCount = 100
  ): () => void {
    if (!conversationId) {
      onUpdate([]);
      return () => {};
    }

    const path = `conversations/${conversationId}/messages`;

    try {
      const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        limit(limitCount)
      );

      return onSnapshot(
        q,
        (snap) => {
          const msgs: ChatMessage[] = [];
          snap.forEach((d) => {
            msgs.push(d.data() as ChatMessage);
          });

          // Sort chronologically
          msgs.sort((a, b) => {
            const timeA = a.createdAt || a.timestamp || '';
            const timeB = b.createdAt || b.timestamp || '';
            return timeA.localeCompare(timeB);
          });

          onUpdate(msgs);
        },
        (error) => {
          console.warn('Subcollection messages listener error, trying fallback listener:', error);
          // Fallback to top-level messages query if subcollection permissions are transitioning
          const fallbackQ = query(
            collection(db, 'messages'),
            where('connectionId', '==', conversationId),
            limit(limitCount)
          );
          return onSnapshot(fallbackQ, (fSnap) => {
            const fMsgs: ChatMessage[] = [];
            fSnap.forEach((d) => fMsgs.push(d.data() as ChatMessage));
            fMsgs.sort((a, b) => (a.createdAt || a.timestamp || '').localeCompare(b.createdAt || b.timestamp || ''));
            onUpdate(fMsgs);
          });
        }
      );
    } catch (error) {
      console.warn('Failed to subscribe to conversation messages:', error);
      return () => {};
    }
  },

  /**
   * Mark a conversation as read for the current user.
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    if (!conversationId || !userId) return;
    const path = `conversations/${conversationId}`;

    try {
      const convoDocRef = doc(db, 'conversations', conversationId);
      const convoSnap = await getDoc(convoDocRef);
      if (!convoSnap.exists()) {
        // Parent conversation not created in Firestore yet
        return;
      }

      const convoData = convoSnap.data() as Conversation;
      const currentUnread = convoData.unreadCounts?.[userId] || 0;
      if (currentUnread > 0) {
        await updateDoc(convoDocRef, {
          [`unreadCounts.${userId}`]: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn('Failed to mark conversation as read in Firestore:', error);
    }
  },
};
