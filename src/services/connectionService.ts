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
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import { Connection, ConnectionStatus, ProfileSummary, PublicProfile, UserProfile, ConnectionIntent } from '../types';
import { SAMPLE_PROFILES } from '../data/mockData';
import { notificationService } from './notificationService';

export function toProfileSummary(p: Partial<UserProfile | PublicProfile> & { id: string; name: string }): ProfileSummary {
  return {
    id: p.id,
    uid: p.uid || p.id,
    name: p.name,
    role: p.role || 'Explorer & Builder',
    roleEmoji: p.roleEmoji || '✨',
    avatarUrl: p.avatarUrl || p.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    profilePhoto: p.profilePhoto || p.avatarUrl,
    location: p.location || 'Worldwide',
    college: p.college || '',
    department: p.department || '',
    tagline: p.tagline || '',
    skills: p.skills || [],
    interests: p.interests || [],
    intents: p.intents || [],
  };
}

/**
 * Returns the other participant's user ID from a connection document.
 * Guarantees that the current user ID is never returned as the target.
 */
export function getOtherParticipantId(conn: Connection, currentUserId: string): string | null {
  if (conn.requesterId && conn.requesterId !== currentUserId) return conn.requesterId;
  if (conn.targetId && conn.targetId !== currentUserId) return conn.targetId;
  if (conn.participants && Array.isArray(conn.participants)) {
    const other = conn.participants.find((p) => p && p !== currentUserId);
    if (other) return other;
  }
  if (conn.profileId && conn.profileId !== currentUserId) return conn.profileId;
  if (conn.profile?.id && conn.profile.id !== currentUserId) return conn.profile.id;
  if (conn.profile?.uid && conn.profile.uid !== currentUserId) return conn.profile.uid;
  
  // Deterministic connection ID format: conn_uid1_uid2
  if (conn.id && conn.id.startsWith('conn_')) {
    const raw = conn.id.slice(5);
    const lastUnderscore = raw.lastIndexOf('_');
    if (lastUnderscore > 0) {
      const part1 = raw.slice(0, lastUnderscore);
      const part2 = raw.slice(lastUnderscore + 1);
      if (part1 === currentUserId && part2) return part2;
      if (part2 === currentUserId && part1) return part1;
    }
  }

  return null;
}

export interface SendConnectionParams {
  requester: UserProfile;
  target: PublicProfile | UserProfile;
  introNote?: string;
  sharedIntents?: ConnectionIntent[];
  sharedInterests?: string[];
}

export const connectionService = {
  /**
   * Helper to generate consistent deterministic connection ID or check if one exists
   */
  generateConnectionId(uid1: string, uid2: string): string {
    const sorted = [uid1, uid2].sort();
    return `conn_${sorted[0]}_${sorted[1]}`;
  },

  /**
   * Send a connection request from requester to target
   */
  async sendConnectionRequest({
    requester,
    target,
    introNote = '',
    sharedIntents = [],
    sharedInterests = [],
  }: SendConnectionParams): Promise<Connection> {
    const requesterId = requester.uid || requester.id;
    const targetId = target.uid || target.id;
    const connId = this.generateConnectionId(requesterId, targetId);
    const path = `connections/${connId}`;

    const requesterSummary = toProfileSummary(requester);
    const targetSummary = toProfileSummary(target);

    // Compute shared synergies if not supplied
    const finalIntents = sharedIntents.length > 0 
      ? sharedIntents 
      : (requester.intents || []).filter((i) => (target.intents || []).includes(i));
    
    const finalInterests = sharedInterests.length > 0
      ? sharedInterests
      : (requester.interests || []).filter((i) => 
          (target.interests || []).some((ti) => ti.toLowerCase() === i.toLowerCase())
        );

    const now = new Date().toISOString();

    const connectionData: Connection = {
      id: connId,
      requesterId,
      targetId,
      participants: [requesterId, targetId],
      profileId: targetId,
      profile: target,
      requesterSummary,
      targetSummary,
      status: 'pending',
      sharedIntents: finalIntents,
      sharedInterests: finalInterests,
      introNote: introNote.trim() || undefined,
      lastMessage: introNote.trim() || 'Sent a connection request',
      lastMessageTime: 'Just now',
      unreadCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    const sanitized = sanitizeFirestoreData(connectionData);

    try {
      await setDoc(doc(db, 'connections', connId), sanitized, { merge: true });

      // Trigger CONNECTION_REQUEST notification for the target user
      if (targetId && targetId !== requesterId) {
        try {
          await notificationService.createNotification({
            recipientId: targetId,
            senderId: requesterId,
            senderName: requester.name,
            senderAvatar: requester.avatarUrl || requester.profilePhoto,
            senderRole: requester.role,
            type: 'CONNECTION_REQUEST',
            title: 'Connection Request',
            message: `${requester.name} sent you a connection request.`,
            referenceId: connId,
          });
        } catch (notifErr) {
          console.warn('Failed to send connection request notification document:', notifErr);
        }
      }

      return connectionData;
    } catch (error) {
      console.warn('Failed to send connection request to Firestore, using optimistic update', error);
      handleFirestoreError(error, OperationType.CREATE, path);
      return connectionData;
    }
  },

  /**
   * Accept a pending connection request
   */
  async acceptConnection(connectionId: string, currentUserId: string, currentUserProfile?: UserProfile): Promise<void> {
    const path = `connections/${connectionId}`;
    const now = new Date().toISOString();

    try {
      // Get connection document first to determine original requester
      let requesterId: string | undefined;
      let targetName: string = currentUserProfile?.name || 'A Misfits Member';
      let targetAvatar: string | undefined = currentUserProfile?.avatarUrl || currentUserProfile?.profilePhoto;
      let targetRole: string | undefined = currentUserProfile?.role;

      try {
        const connSnap = await getDoc(doc(db, 'connections', connectionId));
        if (connSnap.exists()) {
          const connData = connSnap.data() as Connection;
          requesterId = connData.requesterId;
          if (connData.targetSummary?.name) {
            targetName = connData.targetSummary.name;
          }
          if (connData.targetSummary?.avatarUrl || connData.targetSummary?.profilePhoto) {
            targetAvatar = connData.targetSummary.avatarUrl || connData.targetSummary.profilePhoto;
          }
          if (connData.targetSummary?.role) {
            targetRole = connData.targetSummary.role;
          }
        }
      } catch (lookupErr) {
        console.warn('Could not read existing connection for notification recipient lookup:', lookupErr);
      }

      await updateDoc(doc(db, 'connections', connectionId), {
        status: 'connected',
        connectedAt: now,
        updatedAt: now,
      });

      // Trigger CONNECTION_ACCEPTED notification for the original requester
      if (requesterId && requesterId !== currentUserId) {
        try {
          await notificationService.createNotification({
            recipientId: requesterId,
            senderId: currentUserId,
            senderName: targetName,
            senderAvatar: targetAvatar,
            senderRole: targetRole,
            type: 'CONNECTION_ACCEPTED',
            title: 'Connection Accepted',
            message: `${targetName} accepted your connection request.`,
            referenceId: connectionId,
          });
        } catch (notifErr) {
          console.warn('Failed to send connection accepted notification document:', notifErr);
        }
      }
    } catch (error) {
      console.warn('Failed to accept connection in Firestore', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Decline a pending connection request
   */
  async declineConnection(connectionId: string, currentUserId: string): Promise<void> {
    const path = `connections/${connectionId}`;
    const now = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'connections', connectionId), {
        status: 'declined',
        updatedAt: now,
      });
    } catch (error) {
      console.warn('Failed to decline connection in Firestore', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Cancel an outgoing connection request
   */
  async cancelConnectionRequest(connectionId: string, currentUserId: string): Promise<void> {
    const path = `connections/${connectionId}`;
    try {
      await deleteDoc(doc(db, 'connections', connectionId));
    } catch (error) {
      console.warn('Failed to cancel connection request in Firestore', error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Remove an existing connection
   */
  async removeConnection(connectionId: string, currentUserId: string): Promise<void> {
    const path = `connections/${connectionId}`;
    try {
      await deleteDoc(doc(db, 'connections', connectionId));
    } catch (error) {
      console.warn('Failed to remove connection in Firestore', error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Real-time subscription to all connections where user is a participant
   */
  subscribeUserConnections(
    userId: string,
    onUpdate: (connections: Connection[]) => void
  ): () => void {
    if (!userId) return () => {};

    const path = 'connections';
    const q = query(collection(db, 'connections'), where('participants', 'array-contains', userId));

    return onSnapshot(
      q,
      (snap) => {
        const conns: Connection[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          
          // Determine other person in connection to populate 'profile' snapshot correctly
          const isRequester = data.requesterId === userId;
          const otherSummary = isRequester ? data.targetSummary : data.requesterSummary;
          const otherProfileId = isRequester ? data.targetId : data.requesterId;

          const populatedProfile: PublicProfile = otherSummary ? {
            id: otherSummary.id,
            uid: otherSummary.id,
            name: otherSummary.name,
            role: otherSummary.role,
            roleEmoji: otherSummary.roleEmoji,
            avatarUrl: otherSummary.avatarUrl || otherSummary.profilePhoto,
            profilePhoto: otherSummary.profilePhoto || otherSummary.avatarUrl,
            location: otherSummary.location || 'Worldwide',
            college: otherSummary.college || '',
            department: otherSummary.department || '',
            tagline: otherSummary.tagline || '',
            skills: otherSummary.skills || [],
            interests: otherSummary.interests || [],
            intents: otherSummary.intents || [],
            bio: '',
            isOnline: true,
          } : (data.profile || SAMPLE_PROFILES[0]);

          conns.push({
            ...data,
            id: d.id,
            profileId: otherProfileId || data.profileId,
            profile: populatedProfile,
          } as Connection);
        });

        // Sort by updatedAt or createdAt desc
        conns.sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
        onUpdate(conns);
      },
      (error) => {
        console.warn('Connections subscription fallback on permissions/offline', error);
      }
    );
  },

  /**
   * Get the connection relationship status between two users
   */
  getConnectionRelationship(
    user1Id?: string,
    user2Id?: string,
    connections: Connection[] = []
  ): {
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'declined';
    connection?: Connection;
  } {
    if (!user1Id || !user2Id || user1Id === user2Id) {
      return { status: 'none' };
    }

    const conn = connections.find(
      (c) =>
        (c.requesterId === user1Id && c.targetId === user2Id) ||
        (c.requesterId === user2Id && c.targetId === user1Id) ||
        (c.profileId === user2Id) ||
        (c.id === this.generateConnectionId(user1Id, user2Id))
    );

    if (!conn) return { status: 'none' };

    if (conn.status === 'connected') {
      return { status: 'connected', connection: conn };
    }

    if (conn.status === 'pending') {
      if (conn.requesterId === user1Id) {
        return { status: 'pending_sent', connection: conn };
      }
      return { status: 'pending_received', connection: conn };
    }

    if (conn.status === 'declined') {
      return { status: 'declined', connection: conn };
    }

    return { status: 'none', connection: conn };
  },
};
