import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ActivityLog {
  uid?: string;
  userEmail?: string;
  action: string;
  details: string;
  ip?: string;
  createdAt: any;
}

export const logActivity = async (action: string, details: string, profile?: any) => {
  // Only log important actions to save Firestore write quota
  const importantActions = [
    'Proxy Purchase',
    'Deposit Request',
    'Gift Card Redeem',
    'Reseller Request',
    'Support Ticket',
    'Registration',
    'admin_balance_adjustment',
    'admin_maintenance',
    'clash_subscription_purchase',
    'Free Proxy Claim'
  ];

  if (!importantActions.includes(action)) {
    return;
  }

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
