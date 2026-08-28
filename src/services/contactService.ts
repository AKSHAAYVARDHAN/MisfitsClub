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
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from './firebase';
import { ContactMessageItem, ContactStatus } from '../types';

export const contactService = {
  /**
   * Submit a direct inquiry from the landing page
   */
  async submitContactMessage(data: {
    name: string;
    email: string;
    message: string;
    authorId?: string;
  }): Promise<ContactMessageItem> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newContact: ContactMessageItem = {
      id: messageId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      message: data.message.trim(),
      authorId: data.authorId || undefined,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };

    const path = `contactMessages/${messageId}`;
    try {
      await setDoc(doc(db, 'contactMessages', messageId), sanitizeFirestoreData(newContact));
      return newContact;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Fetch all contact inquiries (Staff only)
   */
  async getAllContactMessages(limitCount = 100): Promise<ContactMessageItem[]> {
    try {
      const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      const list: ContactMessageItem[] = [];
      snap.forEach((d) => {
        list.push(d.data() as ContactMessageItem);
      });
      return list;
    } catch (err) {
      console.warn('Failed to load contact messages from Firestore:', err);
      return [];
    }
  },

  /**
   * Update status, assignee, or notes for a contact inquiry
   */
  async updateContactStatus(
    messageId: string,
    status: ContactStatus,
    assignedTo?: string,
    adminNotes?: string
  ): Promise<void> {
    const path = `contactMessages/${messageId}`;
    const now = new Date().toISOString();
    try {
      const updatePayload: any = {
        status,
        updatedAt: now,
      };
      if (assignedTo !== undefined) {
        updatePayload.assignedTo = assignedTo;
      }
      if (adminNotes !== undefined) {
        updatePayload.adminNotes = adminNotes;
      }
      await updateDoc(doc(db, 'contactMessages', messageId), sanitizeFirestoreData(updatePayload));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Delete contact inquiry (Owner/Admin only)
   */
  async deleteContactMessage(messageId: string): Promise<void> {
    const path = `contactMessages/${messageId}`;
    try {
      await deleteDoc(doc(db, 'contactMessages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
};
