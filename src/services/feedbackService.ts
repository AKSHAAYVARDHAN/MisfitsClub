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
import { FeedbackItem, FeedbackStatus } from '../types';

export const feedbackService = {
  /**
   * Submit a new feedback note from landing page or authenticated user
   */
  async submitFeedback(data: {
    category: string;
    content: string;
    email?: string;
    authorId?: string;
  }): Promise<FeedbackItem> {
    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newFeedback: FeedbackItem = {
      id: feedbackId,
      category: data.category,
      content: data.content.trim(),
      email: data.email?.trim() || undefined,
      authorId: data.authorId || undefined,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };

    const path = `feedback/${feedbackId}`;
    try {
      await setDoc(doc(db, 'feedback', feedbackId), sanitizeFirestoreData(newFeedback));
      return newFeedback;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Get all feedback submissions (Staff only)
   */
  async getAllFeedback(limitCount = 100): Promise<FeedbackItem[]> {
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      const list: FeedbackItem[] = [];
      snap.forEach((d) => {
        list.push(d.data() as FeedbackItem);
      });
      return list;
    } catch (err) {
      console.warn('Failed to load feedback collection from Firestore:', err);
      return [];
    }
  },

  /**
   * Update status or internal admin notes of a feedback item
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackStatus,
    adminNotes?: string
  ): Promise<void> {
    const path = `feedback/${feedbackId}`;
    const now = new Date().toISOString();
    try {
      const updatePayload: any = {
        status,
        updatedAt: now,
      };
      if (adminNotes !== undefined) {
        updatePayload.adminNotes = adminNotes;
      }
      await updateDoc(doc(db, 'feedback', feedbackId), sanitizeFirestoreData(updatePayload));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Delete feedback submission (Owner/Admin only)
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    const path = `feedback/${feedbackId}`;
    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
};
