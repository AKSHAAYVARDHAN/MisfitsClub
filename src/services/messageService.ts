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
  arrayUnion,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import { Conversation, ChatMessage, UserProfile, PublicProfile } from '../types';
import { notificationService } from './notificationService';

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

      const sanitized = sanitizeFirestoreData(conversationData);
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
    // Guard: sample/demo profile IDs (p-*, sample-target) are not real Firebase Auth UIDs.
    // Writing to Firestore with these as participants always produces permission-denied.
    // The App.tsx layer should already skip this call for such targets, but guard defensively.
    if (recipientId.startsWith('p-') || recipientId === 'sample-target') {
      throw new Error(
        `Cannot persist message to Firestore: recipientId '${recipientId}' is a sample/demo profile ID, not a real Firebase Auth UID. This conversation is local-only.`
      );
    }
    if (senderId.startsWith('p-')) {
      throw new Error(
        `Cannot persist message to Firestore: senderId '${senderId}' is a sample/demo profile ID, not a real Firebase Auth UID.`
      );
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
      recipientId,
      senderName: senderProfile.name || 'Member',
      text: trimmedText,
      timestamp: formattedTime,
      createdAt: now,
      read: false,
      readBy: [senderId],
      isStarterPrompt: Boolean(isStarterPrompt),
    };

    const sanitizedMessage = sanitizeFirestoreData(messageData);

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
        await setDoc(convoDocRef, sanitizeFirestoreData(conversationData));
      } else {
        // Update conversation metadata & increment recipient unread count, reset sender unread count
        await updateDoc(convoDocRef, {
          lastMessage: trimmedText,
          lastMessageAt: now,
          lastMessageSenderId: senderId,
          updatedAt: now,
          [`unreadCounts.${recipientId}`]: increment(1),
          [`unreadCounts.${senderId}`]: 0,
        });
      }

      // 2. Write message to conversation subcollection (guaranteed parent exists with sender in participantIds)
      const msgDocRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await setDoc(msgDocRef, sanitizedMessage);

      // 3. Keep linked connection document in sync with latest message activity
      const sortedIds = [senderId, recipientId].sort();
      const deterministicConnId = `conn_${sortedIds[0]}_${sortedIds[1]}`;
      const connIdToUpdate = connectionId || deterministicConnId;

      if (connIdToUpdate && !connIdToUpdate.startsWith('conn-p-') && !connIdToUpdate.startsWith('c-')) {
        try {
          const connRef = doc(db, 'connections', connIdToUpdate);
          const connSnap = await getDoc(connRef);
          if (connSnap.exists()) {
            await updateDoc(connRef, {
              lastMessage: trimmedText.length > 500 ? `${trimmedText.slice(0, 497)}...` : trimmedText,
              lastMessageTime: formattedTime,
              lastMessageAt: now,
              updatedAt: now,
            });
          }
        } catch (connErr) {
          console.warn('Could not update connection doc metadata on message send:', connErr);
        }
      }

      // 4. Trigger direct message notification for recipient (if real member)
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
   * Clears unread count on the conversation document and marks individual
   * unread messages where user is the recipient as read with readBy and readAt.
   * Also ensures linked connection document unreadCount is reset to 0 in Firestore.
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
    connectionId?: string
  ): Promise<void> {
    if (!conversationId || !userId) return;
    // Guard: skip conversations that involve sample/demo profile IDs.
    if (conversationId.includes('_p-') || conversationId.startsWith('conv_p-') || conversationId.startsWith('conn-p-')) return;

    const now = new Date().toISOString();

    // 1. Immediately reset connection document unreadCount if provided
    const targetConnId = connectionId || (conversationId.startsWith('conn_') ? conversationId : null);
    if (targetConnId && !targetConnId.startsWith('conn-p-') && !targetConnId.startsWith('c-')) {
      try {
        const connRef = doc(db, 'connections', targetConnId);
        const connSnap = await getDoc(connRef);
        if (connSnap.exists()) {
          const data = connSnap.data() as any;
          if (data.unreadCount && data.unreadCount !== 0) {
            await updateDoc(connRef, { unreadCount: 0, updatedAt: now });
          }
        }
      } catch (connErr) {
        console.warn('Could not reset connection unreadCount:', connErr);
      }
    }

    try {
      const convoDocRef = doc(db, 'conversations', conversationId);
      const convoSnap = await getDoc(convoDocRef);
      if (!convoSnap.exists()) {
        return;
      }

      const convoData = convoSnap.data() as Conversation;
      const currentUnread = convoData.unreadCounts?.[userId] || 0;

      // 2. Reset unreadCounts for this user on the conversation document
      if (currentUnread > 0 || convoData.unreadCounts?.[userId] !== 0) {
        await updateDoc(convoDocRef, {
          [`unreadCounts.${userId}`]: 0,
          updatedAt: now,
        });
      }

      // 3. Mark individual unread messages as read in the subcollection
      try {
        const msgsRef = collection(db, 'conversations', conversationId, 'messages');
        const msgsSnap = await getDocs(query(msgsRef, limit(100)));

        const updatePromises: Promise<void>[] = [];
        msgsSnap.forEach((msgDoc) => {
          const mData = msgDoc.data() as ChatMessage;
          // If sender was someone else and current user hasn't read it yet
          if (mData.senderId !== userId && (!mData.readBy || !mData.readBy.includes(userId))) {
            const updateP = updateDoc(msgDoc.ref, {
              readBy: arrayUnion(userId),
              readAt: now,
              read: true,
            }).catch((err) => {
              console.warn('Failed to mark message read doc:', err);
            });
            updatePromises.push(updateP);
          }
        });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      } catch (subErr) {
        console.warn('Notice updating messages read state in subcollection:', subErr);
      }

      // 4. If there is a linked connection, ensure its unreadCount is also 0
      const linkedConnId = convoData.connectionId || targetConnId;
      if (linkedConnId && !linkedConnId.startsWith('conn-p-') && !linkedConnId.startsWith('c-')) {
        try {
          const connRef = doc(db, 'connections', linkedConnId);
          const connSnap = await getDoc(connRef);
          if (connSnap.exists() && (connSnap.data() as any).unreadCount !== 0) {
            await updateDoc(connRef, { unreadCount: 0, updatedAt: now });
          }
        } catch {
          // ignore non-critical connection sync
        }
      }
    } catch (error) {
      console.warn('Failed to mark conversation as read in Firestore:', error);
    }
  },

  /**
   * Helper to retrieve unread message count for a given user in a conversation
   */
  getUnreadCountForUser(conversation: Conversation | undefined | null, userId: string): number {
    if (!conversation || !userId) return 0;
    return conversation.unreadCounts?.[userId] || 0;
  },

  /**
   * Authoritative calculation of total unread messages across conversations for a user
   */
  calculateTotalUnread(conversations: Conversation[], userId: string, activeConversationId?: string | null): number {
    if (!conversations || !userId) return 0;
    return conversations.reduce((total, c) => {
      // If user is actively viewing this conversation, count is 0
      if (activeConversationId && (c.id === activeConversationId || c.connectionId === activeConversationId)) {
        return total;
      }
      if (c.participantIds && c.participantIds.includes(userId)) {
        return total + (c.unreadCounts?.[userId] || 0);
      }
      return total;
    }, 0);
  },
};
