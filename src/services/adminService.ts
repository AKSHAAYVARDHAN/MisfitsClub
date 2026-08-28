import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import { 
  AdminRole, 
  StaffMember, 
  AuditLogItem, 
  PlatformMetric, 
  UserProfile, 
  FeedbackItem, 
  ContactMessageItem,
  AdminConnectionItem,
  ModerationReport,
  ReportStatus,
  SystemBroadcast
} from '../types';

export const adminService = {
  /**
   * Fetch staff role for a user UID directly from authoritative Firestore collection adminRoles/{uid}
   */
  async getStaffRole(uid: string): Promise<StaffMember | null> {
    if (!uid) return null;
    const path = `adminRoles/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'adminRoles', uid));
      if (snap.exists()) {
        return snap.data() as StaffMember;
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch staff role from Firestore:', error);
      return null;
    }
  },

  /**
   * Securely bootstrap initial owner role for the authenticated user
   */
  async bootstrapOwner(user: UserProfile): Promise<StaffMember> {
    const uid = user.uid || user.id;
    const now = new Date().toISOString();
    const staffDoc: StaffMember = {
      uid,
      email: (user.email || '').toLowerCase().trim(),
      name: user.name || 'Owner',
      role: 'OWNER',
      status: 'active',
      assignedBy: 'SYSTEM_BOOTSTRAP',
      assignedAt: now,
      updatedAt: now,
    };

    // 1. Try secure server-side bootstrap endpoint first
    try {
      const { auth } = await import('./firebase');
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        const response = await fetch('/api/admin/bootstrap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
          const resData = await response.json();
          return resData.staff || staffDoc;
        }
      }
    } catch (serverErr) {
      console.warn('Server bootstrap endpoint note:', serverErr);
    }

    // 2. Direct Firestore write (protected by deployed firestore.rules)
    try {
      await setDoc(doc(db, 'adminRoles', uid), sanitizeFirestoreData(staffDoc));
      try {
        await this.createAuditLog({
          actorId: uid,
          actorEmail: user.email,
          actorRole: 'OWNER',
          action: 'BOOTSTRAP_OWNER_PROVISIONED',
          targetType: 'STAFF_ROLE',
          targetId: uid,
          details: `Initial owner privileges provisioned for ${user.email}`,
        });
      } catch (auditErr) {
        console.warn('Audit log write note:', auditErr);
      }
      return staffDoc;
    } catch (err) {
      console.error('Failed to bootstrap owner:', err);
      throw err;
    }
  },

  /**
   * Fetch all staff members
   */
  async getAllStaff(): Promise<StaffMember[]> {
    try {
      const snap = await getDocs(collection(db, 'adminRoles'));
      const list: StaffMember[] = [];
      snap.forEach((d) => {
        list.push(d.data() as StaffMember);
      });
      return list;
    } catch (err) {
      console.warn('Could not list staff members:', err);
      return [];
    }
  },

  /**
   * Assign or update a staff role (Requires OWNER role in rules)
   */
  async assignStaffRole(
    actor: { uid: string; email?: string; role: AdminRole },
    target: { uid: string; email: string; name?: string; role: AdminRole; status?: 'active' | 'suspended' }
  ): Promise<StaffMember> {
    const now = new Date().toISOString();
    const staffData: StaffMember = {
      uid: target.uid,
      email: target.email.trim().toLowerCase(),
      name: target.name || 'Team Member',
      role: target.role,
      status: target.status || 'active',
      assignedBy: actor.uid,
      assignedAt: now,
      updatedAt: now,
    };

    const path = `adminRoles/${target.uid}`;
    try {
      await setDoc(doc(db, 'adminRoles', target.uid), sanitizeFirestoreData(staffData), { merge: true });
      
      // Log privileged action to immutable audit trail
      await this.createAuditLog({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'ROLE_ASSIGNED',
        targetType: 'USER_ROLE',
        targetId: target.uid,
        details: `Assigned role ${target.role} (${target.status || 'active'}) to ${target.email}`,
      });

      return staffData;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Revoke or remove a staff member (Requires OWNER)
   */
  async revokeStaffRole(
    actor: { uid: string; email?: string; role: AdminRole },
    targetUid: string,
    targetEmail: string
  ): Promise<void> {
    const path = `adminRoles/${targetUid}`;
    try {
      await deleteDoc(doc(db, 'adminRoles', targetUid));
      
      await this.createAuditLog({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'ROLE_REVOKED',
        targetType: 'USER_ROLE',
        targetId: targetUid,
        details: `Revoked staff privileges for ${targetEmail}`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Record an immutable audit log entry
   */
  async createAuditLog(log: Omit<AuditLogItem, 'id' | 'createdAt'>): Promise<void> {
    try {
      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fullLog: AuditLogItem = {
        ...log,
        id: logId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'auditLogs', logId), sanitizeFirestoreData(fullLog));
    } catch (err) {
      console.warn('Audit log write exception:', err);
    }
  },

  /**
   * Retrieve recent audit logs
   */
  async getAuditLogs(limitCount = 50): Promise<AuditLogItem[]> {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      const list: AuditLogItem[] = [];
      snap.forEach((d) => {
        list.push(d.data() as AuditLogItem);
      });
      return list;
    } catch (err) {
      console.warn('Failed to load audit logs from Firestore:', err);
      return [];
    }
  },

  /**
   * Fetch all registered club members directly from users collection (Authorized Staff only)
   */
  async getAllMembers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          uid: data.uid || d.id,
          name: data.name || 'Anonymous Builder',
          email: data.email || '',
          handle: data.handle || '',
          role: data.role || 'Member',
          bio: data.bio || '',
          skills: Array.isArray(data.skills) ? data.skills : [],
          interests: Array.isArray(data.interests) ? data.interests : [],
          curiousAbout: Array.isArray(data.curiousAbout) ? data.curiousAbout : [],
          intents: Array.isArray(data.intents) ? data.intents : [],
          college: data.college || '',
          department: data.department || '',
          year: data.year || '',
          location: data.location || (data.city ? `${data.city}, ${data.country || ''}` : ''),
          city: data.city || '',
          country: data.country || '',
          avatarUrl: data.avatarUrl || data.profilePhoto || '',
          profilePhoto: data.profilePhoto || data.avatarUrl || '',
          onboardingCompleted: data.onboardingCompleted ?? true,
          joinedDate: data.joinedDate || data.createdAt || '',
          createdAt: data.createdAt || data.joinedDate || '',
          updatedAt: data.updatedAt || '',
          tagline: data.tagline || '',
          building: data.building || '',
          learning: data.learning || '',
          openQuestion: data.openQuestion || '',
          links: data.links || {},
        });
      });
      return list;
    } catch (err) {
      console.warn('Failed to load members from Firestore:', err);
      return [];
    }
  },

  /**
   * Update member account status (active, restricted, suspended) with audit logging
   */
  async updateMemberStatus(
    actor: { uid: string; email?: string; role: AdminRole },
    target: { uid: string; name: string; email?: string },
    newStatus: 'active' | 'restricted' | 'suspended',
    reason?: string
  ): Promise<void> {
    const userPath = `users/${target.uid}`;
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        accountStatus: newStatus,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: actor.uid,
      });

      await this.createAuditLog({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: `MEMBER_STATUS_${newStatus.toUpperCase()}`,
        targetType: 'MEMBER',
        targetId: target.uid,
        details: `Set account status to ${newStatus.toUpperCase()} for ${target.name}. Reason: ${reason || 'Administrative action'}`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  },

  /**
   * Delete a member document (Authorized Owner or Admin only)
   */
  async deleteMember(
    actor: { uid: string; email?: string; role: AdminRole },
    target: { uid: string; email?: string; name: string }
  ): Promise<void> {
    const userPath = `users/${target.uid}`;
    try {
      await deleteDoc(doc(db, 'users', target.uid));
      
      // Also attempt cleanup of public profile if present
      try {
        await deleteDoc(doc(db, 'publicProfiles', target.uid));
      } catch (pubErr) {
        console.warn('Public profile cleanup note:', pubErr);
      }

      await this.createAuditLog({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'MEMBER_RECORD_DELETED',
        targetType: 'MEMBER',
        targetId: target.uid,
        details: `Deleted member account for ${target.name} (${target.email || target.uid})`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, userPath);
    }
  },

  /**
   * Retrieve all platform connections for moderation and platform health
   */
  async getAllConnections(): Promise<AdminConnectionItem[]> {
    try {
      const snap = await getDocs(collection(db, 'connections'));
      const list: AdminConnectionItem[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const reqSummary = data.requesterSummary || {};
        const tgtSummary = data.targetSummary || {};
        list.push({
          id: d.id,
          requesterId: data.requesterId || reqSummary.id || '',
          requesterName: reqSummary.name || data.requesterName || 'Unknown Builder',
          requesterAvatar: reqSummary.avatarUrl || reqSummary.profilePhoto,
          requesterRole: reqSummary.role,
          targetId: data.targetId || tgtSummary.id || '',
          targetName: tgtSummary.name || data.targetName || 'Unknown Builder',
          targetAvatar: tgtSummary.avatarUrl || tgtSummary.profilePhoto,
          targetRole: tgtSummary.role,
          status: data.status || 'pending',
          introNote: data.introNote || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
        });
      });
      // Sort newest first
      list.sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
      return list;
    } catch (err) {
      console.warn('Failed to load connections:', err);
      return [];
    }
  },

  /**
   * Retrieve real moderation reports
   */
  async getAllReports(): Promise<ModerationReport[]> {
    try {
      const snap = await getDocs(collection(db, 'moderationReports'));
      const list: ModerationReport[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });

      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return list;
    } catch (err) {
      console.warn('Failed to load moderation reports:', err);
      return [];
    }
  },

  /**
   * Update report status (Resolve, Dismiss, In Review) with immutable audit logging
   */
  async updateReportStatus(
    actor: { uid: string; email?: string; role: AdminRole },
    reportId: string,
    newStatus: ReportStatus,
    resolutionNotes?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const path = `moderationReports/${reportId}`;
    try {
      await setDoc(
        doc(db, 'moderationReports', reportId),
        {
          status: newStatus,
          resolutionNotes: resolutionNotes || '',
          resolvedBy: actor.uid,
          resolvedAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      await this.createAuditLog({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: `REPORT_${newStatus}`,
        targetType: 'REPORT',
        targetId: reportId,
        details: `Updated report status to ${newStatus}. Notes: ${resolutionNotes || 'No notes'}`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Create a new moderation report
   */
  async createModerationReport(report: Omit<ModerationReport, 'id' | 'createdAt'>): Promise<ModerationReport> {
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const docData: ModerationReport = {
      ...report,
      id: reportId,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'moderationReports', reportId), sanitizeFirestoreData(docData));
      return docData;
    } catch (error) {
      console.warn('Failed to record moderation report:', error);
      return docData;
    }
  },

  /**
   * Fetch system broadcasts
   */
  async getSystemBroadcasts(): Promise<SystemBroadcast[]> {
    try {
      const snap = await getDocs(collection(db, 'systemBroadcasts'));
      const list: SystemBroadcast[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return list;
    } catch (err) {
      console.warn('Failed to load system broadcasts:', err);
      return [];
    }
  },

  /**
   * Create a system broadcast
   */
  async createSystemBroadcast(
    actor: { uid: string; email?: string; role: AdminRole; name?: string },
    data: { title: string; message: string; type: SystemBroadcast['type']; audience: SystemBroadcast['audience'] }
  ): Promise<SystemBroadcast> {
    const broadcastId = `bc_${Date.now()}`;
    const broadcast: SystemBroadcast = {
      id: broadcastId,
      title: data.title,
      message: data.message,
      type: data.type,
      audience: data.audience,
      authorName: actor.name || 'System Admin',
      authorRole: actor.role,
      createdAt: new Date().toISOString(),
      active: true,
    };
    try {
      await setDoc(doc(db, 'systemBroadcasts', broadcastId), sanitizeFirestoreData(broadcast));
      await this.createAuditLog({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SYSTEM_BROADCAST_CREATED',
        targetType: 'SYSTEM',
        targetId: broadcastId,
        details: `Published system ${data.type} broadcast: "${data.title}" to ${data.audience}`,
      });
      return broadcast;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `systemBroadcasts/${broadcastId}`);
      return broadcast;
    }
  },

  /**
   * Delete system broadcast
   */
  async deleteSystemBroadcast(
    actor: { uid: string; email?: string; role: AdminRole },
    broadcastId: string
  ): Promise<void> {
    try {
      await deleteDoc(doc(db, 'systemBroadcasts', broadcastId));
      await this.createAuditLog({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SYSTEM_BROADCAST_DELETED',
        targetType: 'SYSTEM',
        targetId: broadcastId,
        details: `Removed system broadcast: ${broadcastId}`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `systemBroadcasts/${broadcastId}`);
    }
  },

  /**
   * Retrieve contextual connections for a specific member
   */
  async getMemberConnections(memberUid: string): Promise<AdminConnectionItem[]> {
    try {
      const map = new Map<string, AdminConnectionItem>();

      try {
        const qArray = query(collection(db, 'connections'), where('participants', 'array-contains', memberUid));
        const snapArray = await getDocs(qArray);
        snapArray.forEach((d) => {
          const data = d.data();
          const reqSummary = data.requesterSummary || {};
          const tgtSummary = data.targetSummary || {};
          map.set(d.id, {
            id: d.id,
            requesterId: data.requesterId || reqSummary.id || '',
            requesterName: reqSummary.name || data.requesterName || 'Builder',
            requesterAvatar: reqSummary.avatarUrl || reqSummary.profilePhoto,
            requesterRole: reqSummary.role,
            targetId: data.targetId || tgtSummary.id || '',
            targetName: tgtSummary.name || data.targetName || 'Builder',
            targetAvatar: tgtSummary.avatarUrl || tgtSummary.profilePhoto,
            targetRole: tgtSummary.role,
            status: data.status || 'pending',
            introNote: data.introNote || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });
      } catch (err) {
        console.warn('Participant array query note:', err);
      }

      if (map.size === 0) {
        const [reqSnap, tgtSnap] = await Promise.all([
          getDocs(query(collection(db, 'connections'), where('requesterId', '==', memberUid))),
          getDocs(query(collection(db, 'connections'), where('targetId', '==', memberUid))),
        ]);

        reqSnap.forEach((d) => {
          const data = d.data();
          const reqSummary = data.requesterSummary || {};
          const tgtSummary = data.targetSummary || {};
          map.set(d.id, {
            id: d.id,
            requesterId: data.requesterId || reqSummary.id || '',
            requesterName: reqSummary.name || data.requesterName || 'Builder',
            requesterAvatar: reqSummary.avatarUrl || reqSummary.profilePhoto,
            requesterRole: reqSummary.role,
            targetId: data.targetId || tgtSummary.id || '',
            targetName: tgtSummary.name || data.targetName || 'Builder',
            targetAvatar: tgtSummary.avatarUrl || tgtSummary.profilePhoto,
            targetRole: tgtSummary.role,
            status: data.status || 'pending',
            introNote: data.introNote || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });

        tgtSnap.forEach((d) => {
          const data = d.data();
          const reqSummary = data.requesterSummary || {};
          const tgtSummary = data.targetSummary || {};
          map.set(d.id, {
            id: d.id,
            requesterId: data.requesterId || reqSummary.id || '',
            requesterName: reqSummary.name || data.requesterName || 'Builder',
            requesterAvatar: reqSummary.avatarUrl || reqSummary.profilePhoto,
            requesterRole: reqSummary.role,
            targetId: data.targetId || tgtSummary.id || '',
            targetName: tgtSummary.name || data.targetName || 'Builder',
            targetAvatar: tgtSummary.avatarUrl || tgtSummary.profilePhoto,
            targetRole: tgtSummary.role,
            status: data.status || 'pending',
            introNote: data.introNote || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });
      }

      const list = Array.from(map.values());
      list.sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
      return list;
    } catch (err) {
      console.warn('Failed to query member connections:', err);
      return [];
    }
  },

  /**
   * Retrieve sparks authored by a specific member
   */
  async getMemberSparks(memberUid: string): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'boardPosts'));
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (
          data.authorId === memberUid ||
          data.userId === memberUid ||
          data.author?.uid === memberUid ||
          data.author?.id === memberUid
        ) {
          list.push({ id: d.id, ...data });
        }
      });
      list.sort((a, b) => (b.createdAt || b.timestamp || '').localeCompare(a.createdAt || a.timestamp || ''));
      return list;
    } catch (err) {
      console.warn('Failed to query member sparks:', err);
      return [];
    }
  },

  /**
   * Retrieve spaces affiliated with a specific member
   */
  async getMemberSpaces(memberUid: string): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'spaces'));
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (
          data.creatorId === memberUid ||
          data.authorId === memberUid ||
          (Array.isArray(data.members) && data.members.includes(memberUid))
        ) {
          list.push({ id: d.id, ...data });
        }
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return list;
    } catch (err) {
      console.warn('Failed to query member spaces:', err);
      return [];
    }
  },

  /**
   * Fetch aggregate platform metrics from live collections
   */
  async getPlatformMetrics(): Promise<PlatformMetric> {
    try {
      const [usersSnap, sparksSnap, spacesSnap, feedbackSnap, contactsSnap, staffSnap, connectionsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'boardPosts')),
        getDocs(collection(db, 'spaces')),
        getDocs(collection(db, 'feedback')),
        getDocs(collection(db, 'contactMessages')),
        getDocs(collection(db, 'adminRoles')),
        getDocs(collection(db, 'connections')),
      ]);

      let pendingFeedback = 0;
      feedbackSnap.forEach((d) => {
        const item = d.data() as FeedbackItem;
        if (item.status === 'new' || item.status === 'in_review') {
          pendingFeedback++;
        }
      });

      let pendingContacts = 0;
      contactsSnap.forEach((d) => {
        const item = d.data() as ContactMessageItem;
        if (item.status === 'new' || item.status === 'in_progress') {
          pendingContacts++;
        }
      });

      return {
        totalUsers: usersSnap.size,
        totalSparks: sparksSnap.size,
        totalSpaces: spacesSnap.size,
        totalConnections: connectionsSnap.size,
        pendingFeedbackCount: pendingFeedback,
        pendingContactCount: pendingContacts,
        activeStaffCount: staffSnap.size,
      };
    } catch (err) {
      console.warn('Metrics calculation error:', err);
      return {
        totalUsers: 0,
        totalSparks: 0,
        totalSpaces: 0,
        totalConnections: 0,
        pendingFeedbackCount: 0,
        pendingContactCount: 0,
        activeStaffCount: 0,
      };
    }
  },
};
