import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export interface ActivityLog {
  uid?: string;
  userEmail?: string;
  action: string;
  details: string;
  ip?: string;
  createdAt: any;
}

export const logActivity = async (action: string, details: string, profile?: any) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      uid: profile?.uid || 'guest',
      userEmail: profile?.email || 'guest',
      action,
      details,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
