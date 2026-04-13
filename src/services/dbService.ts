import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  runTransaction,
  getDocs,
  limit,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import axios from 'axios';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic real-time listener
export const subscribeToCollection = (
  collectionName: string, 
  callback: (data: any[]) => void,
  queries: any[] = []
) => {
  const q = query(collection(db, collectionName), ...queries);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  });
};

import { logActivity } from './activityService';

// Balance Request
export const submitBalanceRequest = async (data: {
  uid: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  note: string;
  screenshotUrl: string;
  couponCode?: string;
}) => {
  try {
    await logActivity('balance_request_submit', `User submitted balance request for ৳${data.amount} via ${data.paymentMethod}`, { uid: data.uid });
    let bonusAmount = 0;
    if (data.couponCode) {
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', data.couponCode.toUpperCase()),
        where('status', '==', 'active'),
        where('usageType', '==', 'deposit')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const coupon = snap.docs[0].data();
        if (coupon.discountType === 'percentage') {
          bonusAmount = (data.amount * coupon.discountValue) / 100;
        } else {
          bonusAmount = coupon.discountValue;
        }
      }
    }

    return await addDoc(collection(db, 'balanceRequests'), {
      ...data,
      userName: auth.currentUser?.displayName || 'User',
      bonusAmount,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'balanceRequests');
  }
};

// Buy Proxy Transaction
export const buyProxy = async (uid: string, planId: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get Plan
      const planRef = doc(db, 'proxyPlans', planId);
      const planSnap = await transaction.get(planRef);
      if (!planSnap.exists()) throw new Error('Plan not found');
      const plan = planSnap.data();
      
      if (plan.stock <= 0) throw new Error('Out of stock');
      
      // 2. Get User
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data();
      
      if (user.walletBalance < plan.price) throw new Error('Insufficient balance');
      
      // 3. Get available proxy from inventory
      const inventoryQuery = query(
        collection(db, 'proxyInventory'), 
        where('planId', '==', planId), 
        where('isAssigned', '==', false),
        limit(1)
      );
      const inventorySnap = await getDocs(inventoryQuery);
      if (inventorySnap.empty) throw new Error('No proxy available in inventory');
      const proxyDoc = inventorySnap.docs[0];
      
      // 4. Update Balance
      transaction.update(userRef, {
        walletBalance: user.walletBalance - plan.price
      });
      
      // 5. Update Stock
      transaction.update(planRef, {
        stock: plan.stock - 1
      });
      
      // 6. Create Order
      const orderRef = doc(collection(db, 'orders'));
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.duration);
      
      transaction.set(orderRef, {
        uid,
        userName: user.displayName || 'User',
        planId,
        planTitle: plan.title,
        amount: plan.price,
        proxyId: proxyDoc.id,
        status: 'active',
        purchaseDate: serverTimestamp(),
        expiryDate: expiryDate.toISOString(),
        createdAt: serverTimestamp()
      });
      
      // 7. Assign Proxy
      transaction.update(proxyDoc.ref, {
        isAssigned: true,
        status: 'sold',
        assignedToUid: uid,
        orderId: orderRef.id,
        planTitle: plan.title,
        expiryDate: expiryDate.toISOString()
      });
      
      // 8. Create Wallet Transaction
      const walletTxRef = doc(collection(db, 'walletTransactions'));
      transaction.set(walletTxRef, {
        uid,
        amount: -plan.price,
        type: 'purchase',
        status: 'completed',
        description: `Purchased ${plan.title}`,
        createdAt: serverTimestamp()
      });
      
      return orderRef.id;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'buyProxy');
  }
};

// Admin: Approve Balance Request
export const approveBalanceRequest = async (requestId: string) => {
  try {
    const requestRef = doc(db, 'balanceRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) throw new Error('Request not found');
    const request = requestSnap.data();
    
    if (request.status !== 'pending') throw new Error('Request already processed');

    const userRef = doc(db, 'users', request.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User not found');
    const user = userSnap.data();

    let referralDoc: any = null;
    if (user.referredBy) {
      const referralsQ = query(
        collection(db, 'referrals'),
        where('referredUid', '==', request.uid),
        where('status', '==', 'pending')
      );
      const referralsSnap = await getDocs(referralsQ);
      if (!referralsSnap.empty) {
        referralDoc = referralsSnap.docs[0];
      }
    }

    return await runTransaction(db, async (transaction) => {
      // Re-verify request status inside transaction
      const tRequestSnap = await transaction.get(requestRef);
      if (tRequestSnap.data()?.status !== 'pending') throw new Error('Request already processed');

      // Update Request
      transaction.update(requestRef, { 
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      
      // Update User Balance
      const totalToCredit = request.amount + (request.bonusAmount || 0);
      transaction.update(userRef, {
        walletBalance: user.walletBalance + totalToCredit
      });

      // Handle Referral Bonus (First Deposit)
      if (referralDoc) {
        const referrerRef = doc(db, 'users', user.referredBy);
        const referrerSnap = await transaction.get(referrerRef);
        
        if (referrerSnap.exists()) {
          const referrer = referrerSnap.data();
          const rewardAmount = request.amount * 0.1; // 10% referral bonus
          
          transaction.update(referrerRef, {
            walletBalance: referrer.walletBalance + rewardAmount,
            referralEarnings: (referrer.referralEarnings || 0) + rewardAmount
          });

          transaction.update(referralDoc.ref, {
            status: 'completed',
            rewardAmount,
            updatedAt: serverTimestamp()
          });

          // Notify Referrer
          const refNotificationRef = doc(collection(db, 'notifications'));
          transaction.set(refNotificationRef, {
            uid: user.referredBy,
            title: 'Referral Bonus Received! 💰',
            message: `You received ৳${rewardAmount.toFixed(2)} bonus for referring ${user.email}.`,
            isRead: false,
            createdAt: serverTimestamp()
          });

          // Create Wallet Transaction for Referrer
          const refTxRef = doc(collection(db, 'walletTransactions'));
          transaction.set(refTxRef, {
            uid: user.referredBy,
            amount: rewardAmount,
            type: 'adjustment',
            status: 'completed',
            description: `Referral bonus from ${user.email}`,
            createdAt: serverTimestamp()
          });
        }
      }
      
      // Create Wallet Transaction for User
      const walletTxRef = doc(collection(db, 'walletTransactions'));
      transaction.set(walletTxRef, {
        uid: request.uid,
        amount: totalToCredit,
        type: 'deposit',
        status: 'completed',
        description: `Deposit via ${request.paymentMethod}${request.bonusAmount ? ` (incl. ৳${request.bonusAmount} bonus)` : ''}`,
        createdAt: serverTimestamp()
      });
      
      // Create Notification
      const notificationRef = doc(collection(db, 'notifications'));
      transaction.set(notificationRef, {
        uid: request.uid,
        title: 'Balance Approved ✅',
        message: `Your deposit of ৳${request.amount}${request.bonusAmount ? ` plus ৳${request.bonusAmount} bonus` : ''} has been approved. Your new balance is ৳${(user.walletBalance + totalToCredit).toFixed(2)}.`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'approveBalanceRequest');
  }
};

// Admin: Reject Balance Request
export const rejectBalanceRequest = async (requestId: string, reason: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const requestRef = doc(db, 'balanceRequests', requestId);
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) throw new Error('Request not found');
      const request = requestSnap.data();
      
      if (request.status !== 'pending') throw new Error('Request already processed');
      
      // Update Request
      transaction.update(requestRef, { 
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      
      // Create Notification
      const notificationRef = doc(collection(db, 'notifications'));
      transaction.set(notificationRef, {
        uid: request.uid,
        title: 'Balance Rejected ❌',
        message: `Your deposit request of ৳${request.amount} has been rejected. Reason: ${reason}`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'rejectBalanceRequest');
  }
};

// Admin: Manual Balance Update
export const manualBalanceUpdate = async (uid: string, amount: number, description: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data();
      
      const newBalance = user.walletBalance + amount;
      if (newBalance < 0) throw new Error('Insufficient balance for deduction');
      
      transaction.update(userRef, { walletBalance: newBalance });
      
      const walletTxRef = doc(collection(db, 'walletTransactions'));
      transaction.set(walletTxRef, {
        uid,
        amount,
        type: 'adjustment',
        status: 'completed',
        description,
        createdAt: serverTimestamp()
      });
      
      const notificationRef = doc(collection(db, 'notifications'));
      transaction.set(notificationRef, {
        uid,
        title: amount > 0 ? 'Balance Added' : 'Balance Deducted',
        message: `Your wallet balance has been ${amount > 0 ? 'increased' : 'decreased'} by ৳${Math.abs(amount)}. Reason: ${description}`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      await logActivity('admin_balance_adjustment', `Admin adjusted balance for UID ${uid}: ${amount > 0 ? '+' : ''}৳${amount}. Reason: ${description}`, { uid: auth.currentUser?.uid, email: auth.currentUser?.email });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'manualBalanceUpdate');
  }
};

// Free Proxy Campaign Logic
export const getFreeProxyCampaign = async () => {
  try {
    const q = query(collection(db, 'freeProxyCampaign'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return { 
      id: snap.docs[0].id, 
      ...data,
      startTime: data.startTime?.toDate?.() || data.startTime,
      endTime: data.endTime?.toDate?.() || data.endTime,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'freeProxyCampaign');
  }
};

export const updateFreeProxyCampaign = async (id: string, data: any) => {
  try {
    const campaignRef = doc(db, 'freeProxyCampaign', id);
    const updateData = { ...data, updatedAt: serverTimestamp() };
    
    // Convert JS Dates to Firestore Timestamps if present
    if (data.startTime instanceof Date) updateData.startTime = data.startTime;
    if (data.endTime instanceof Date) updateData.endTime = data.endTime;
    
    await updateDoc(campaignRef, updateData);

    // Save to history if activating
    if (data.isActive) {
      await addDoc(collection(db, 'freeProxyCampaignHistory'), {
        ...data,
        campaignId: id,
        savedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `freeProxyCampaign/${id}`);
  }
};

export const getCampaignHistory = async () => {
  try {
    const q = query(collection(db, 'freeProxyCampaignHistory'), orderBy('savedAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime?.toDate?.() || doc.data().startTime,
      endTime: doc.data().endTime?.toDate?.() || doc.data().endTime,
      savedAt: doc.data().savedAt?.toDate?.() || doc.data().savedAt
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'freeProxyCampaignHistory');
  }
};

export const claimFreeProxy = async (uid: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get Campaign Settings
      const campaignQ = query(collection(db, 'freeProxyCampaign'), limit(1));
      const campaignSnap = await getDocs(campaignQ);
      if (campaignSnap.empty) throw new Error('Free proxy campaign not found.');
      
      const campaign = campaignSnap.docs[0].data();
      const now = new Date();
      
      if (!campaign.isActive) {
        throw new Error('Free proxy campaign is currently inactive.');
      }

      // Check campaign window if set
      if (campaign.startTime && now < campaign.startTime.toDate()) {
        throw new Error('Campaign has not started yet.');
      }
      if (campaign.endTime && now > campaign.endTime.toDate()) {
        throw new Error('Campaign has already expired.');
      }

      // 2. Check if user already claimed during THIS campaign window
      // If no window set, check for today
      const windowStart = campaign.startTime ? campaign.startTime.toDate() : new Date();
      if (!campaign.startTime) windowStart.setHours(0, 0, 0, 0);
      
      const claimsQ = query(
        collection(db, 'freeProxyClaims'),
        where('uid', '==', uid),
        where('claimedAt', '>=', windowStart)
      );
      const claimsSnap = await getDocs(claimsQ);
      if (!claimsSnap.empty) throw new Error('You have already claimed your free proxy for this campaign.');

      // 3. Calculate Expiry - Strictly tied to Campaign End Time
      // No matter when the user claims, it expires when the campaign ends.
      const expiryDate = campaign.endTime.toDate().toISOString();

      // 4. Create Claim Record with Proxy Details
      const claimRef = doc(collection(db, 'freeProxyClaims'));
      transaction.set(claimRef, {
        uid,
        campaignId: campaignSnap.docs[0].id,
        host: campaign.host,
        port: campaign.port,
        username: campaign.username,
        password: campaign.password,
        type: campaign.proxyType,
        speed: campaign.speed,
        planTitle: `Free Trial`,
        claimedAt: serverTimestamp(),
        expiryDate: expiryDate
      });

      // 5. Create Notification
      const notificationRef = doc(collection(db, 'notifications'));
      transaction.set(notificationRef, {
        uid,
        title: 'Free Proxy Claimed! 🎁',
        message: `You have successfully claimed your free proxy trial. Enjoy!`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      return claimRef.id;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'claimFreeProxy');
  }
};

export const checkExpiredFreeProxies = async () => {
  try {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'freeProxyClaims'),
      where('expiryDate', '<=', now)
    );
    
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(claimDoc => {
      batch.delete(claimDoc.ref);
    });
    
    await batch.commit();
    console.log(`Deleted ${snap.size} expired free proxy claims.`);
  } catch (error) {
    console.error('Error checking expired free proxies:', error);
  }
};

// User: Update Profile Data
export const updateProfileData = async (uid: string, data: Partial<any>) => {
  try {
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

// User: Update Profile Picture
export const updateProfilePicture = async (uid: string, photoURL: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, { photoURL });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

// Admin: Clear All Orders (Maintenance)
export const clearAllOrders = async () => {
  try {
    const q = query(collection(db, 'orders'));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    await logActivity('admin_maintenance', 'Admin cleared all orders from the system', { uid: auth.currentUser?.uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'orders');
  }
};

// Admin: Clear All Proxy Assignments (Maintenance)
export const clearAllProxyAssignments = async () => {
  try {
    const q = query(collection(db, 'proxyInventory'), where('isAssigned', '==', true));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.update(d.ref, {
        isAssigned: false,
        assignedToUid: null,
        status: 'available',
        orderId: null,
        expiryDate: null
      });
    });
    await batch.commit();
    await logActivity('admin_maintenance', 'Admin cleared all proxy assignments', { uid: auth.currentUser?.uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'proxyInventory');
  }
};

// Coupon Logic
export const validateCoupon = async (code: string, amount: number): Promise<any> => {
  try {
    const q = query(collection(db, 'coupons'), where('code', '==', code), where('status', '==', 'active'));
    const snap = await getDocs(q);
    
    if (snap.empty) throw new Error('Invalid coupon code');
    
    const couponDoc = snap.docs[0];
    const coupon = couponDoc.data();
    
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      throw new Error('Coupon expired');
    }
    
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      throw new Error('Coupon usage limit reached');
    }
    
    if (coupon.minPurchase && amount < coupon.minPurchase) {
      throw new Error(`Minimum purchase of ৳${coupon.minPurchase} required`);
    }
    
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }
    
    return { id: couponDoc.id, discount, ...coupon };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'coupons');
  }
};

// Updated buyProxy with Coupon support
export const buyProxyWithCoupon = async (uid: string, planId: string, couponCode?: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get Plan
      const planRef = doc(db, 'proxyPlans', planId);
      const planSnap = await transaction.get(planRef);
      if (!planSnap.exists()) throw new Error('Plan not found');
      const plan = planSnap.data();
      
      if (plan.stock <= 0) throw new Error('Out of stock');
      
      // 2. Get User
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data();
      
      let finalPrice = plan.price;
      let discountAmount = 0;
      let couponId = null;

      if (couponCode) {
        const q = query(collection(db, 'coupons'), where('code', '==', couponCode), where('status', '==', 'active'));
        const couponSnap = await getDocs(q);
        if (!couponSnap.empty) {
          const couponDoc = couponSnap.docs[0];
          const coupon = couponDoc.data();
          
          // Validation (simplified for transaction)
          if (!(coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) && 
              !(coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) &&
              !(coupon.minPurchase && plan.price < coupon.minPurchase)) {
            
            if (coupon.discountType === 'percentage') {
              discountAmount = (plan.price * coupon.discountValue) / 100;
            } else {
              discountAmount = coupon.discountValue;
            }
            finalPrice = Math.max(0, plan.price - discountAmount);
            couponId = couponDoc.id;
          }
        }
      }
      
      if (user.walletBalance < finalPrice) throw new Error('Insufficient balance');
      
      // 3. Get available proxy
      const inventoryQuery = query(
        collection(db, 'proxyInventory'), 
        where('planId', '==', planId), 
        where('isAssigned', '==', false),
        limit(1)
      );
      const inventorySnap = await getDocs(inventoryQuery);
      if (inventorySnap.empty) throw new Error('No proxy available in inventory');
      const proxyDoc = inventorySnap.docs[0];
      
      // 4. Update Balance
      transaction.update(userRef, {
        walletBalance: user.walletBalance - finalPrice
      });
      
      // 5. Update Stock
      transaction.update(planRef, {
        stock: plan.stock - 1
      });

      // 6. Update Coupon Usage
      if (couponId) {
        const cRef = doc(db, 'coupons', couponId);
        const cSnap = await transaction.get(cRef);
        transaction.update(cRef, {
          usedCount: (cSnap.data()?.usedCount || 0) + 1
        });
      }
      
      // 7. Create Order
      const orderRef = doc(collection(db, 'orders'));
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.duration);
      
      transaction.set(orderRef, {
        uid,
        userName: user.displayName || 'User',
        planId,
        planTitle: plan.title,
        amount: finalPrice,
        discountAmount,
        couponCode: couponCode || null,
        proxyId: proxyDoc.id,
        status: 'active',
        purchaseDate: serverTimestamp(),
        expiryDate: expiryDate.toISOString(),
        createdAt: serverTimestamp()
      });
      
      // 8. Assign Proxy
      transaction.update(proxyDoc.ref, {
        isAssigned: true,
        status: 'sold',
        assignedToUid: uid,
        orderId: orderRef.id,
        planTitle: plan.title,
        expiryDate: expiryDate.toISOString()
      });
      
      // 9. Create Wallet Transaction
      const walletTxRef = doc(collection(db, 'walletTransactions'));
      transaction.set(walletTxRef, {
        uid,
        amount: -finalPrice,
        type: 'purchase',
        status: 'completed',
        description: `Purchased ${plan.title}${couponCode ? ` (Coupon: ${couponCode})` : ''}`,
        createdAt: serverTimestamp()
      });
      
      return orderRef.id;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'buyProxyWithCoupon');
  }
};

// Proxy Renewal
export const renewProxy = async (uid: string, proxyId: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Get Proxy
      const proxyRef = doc(db, 'proxyInventory', proxyId);
      const proxySnap = await transaction.get(proxyRef);
      if (!proxySnap.exists()) throw new Error('Proxy not found');
      const proxy = proxySnap.data();
      
      if (proxy.assignedToUid !== uid) throw new Error('Unauthorized');
      
      // 2. Get Plan
      const planRef = doc(db, 'proxyPlans', proxy.planId);
      const planSnap = await transaction.get(planRef);
      if (!planSnap.exists()) throw new Error('Plan not found');
      const plan = planSnap.data();
      
      // 3. Get User
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data();
      
      if (user.walletBalance < plan.price) throw new Error('Insufficient balance');
      
      // 4. Update Balance
      transaction.update(userRef, {
        walletBalance: user.walletBalance - plan.price
      });
      
      // 5. Calculate New Expiry
      const currentExpiry = new Date(proxy.expiryDate);
      const now = new Date();
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + plan.duration);
      
      // 6. Update Proxy
      transaction.update(proxyRef, {
        expiryDate: newExpiry.toISOString()
      });
      
      // 7. Update Order if exists
      if (proxy.orderId) {
        const orderRef = doc(db, 'orders', proxy.orderId);
        transaction.update(orderRef, {
          expiryDate: newExpiry.toISOString(),
          status: 'active'
        });
      }
      
      // 8. Create Wallet Transaction
      const walletTxRef = doc(collection(db, 'walletTransactions'));
      transaction.set(walletTxRef, {
        uid,
        amount: -plan.price,
        type: 'purchase',
        status: 'completed',
        description: `Renewed ${plan.title}`,
        createdAt: serverTimestamp()
      });
      
      return newExpiry.toISOString();
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'renewProxy');
  }
};

// Support Ticket
export const openTicket = async (uid: string, email: string, subject: string, category: string, priority: string, message: string) => {
  try {
    const ticketRef = await addDoc(collection(db, 'supportTickets'), {
      uid,
      userEmail: email,
      subject,
      category,
      priority,
      status: 'open',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    await addDoc(collection(db, 'supportTickets', ticketRef.id, 'messages'), {
      ticketId: ticketRef.id,
      senderUid: uid,
      senderRole: 'user',
      message,
      createdAt: serverTimestamp()
    });
    
    return ticketRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'supportTickets');
  }
};

export const replyToTicket = async (ticketId: string, uid: string, role: 'admin' | 'user', message: string, attachments: string[] = []) => {
  try {
    await addDoc(collection(db, 'supportTickets', ticketId, 'messages'), {
      ticketId,
      senderUid: uid,
      senderRole: role,
      message,
      attachments,
      createdAt: serverTimestamp()
    });
    
    const updateData: any = {
      status: role === 'admin' ? 'replied' : 'open',
      lastMessageAt: serverTimestamp()
    };

    if (role === 'admin') {
      updateData.userUnread = true;
      updateData.adminUnread = false;
    } else {
      updateData.userUnread = false;
      updateData.adminUnread = true;
    }

    await updateDoc(doc(db, 'supportTickets', ticketId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `supportTickets/${ticketId}/messages`);
  }
};

// Referral Logic
export const applyReferralCode = async (uid: string, referralCode: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data();
      
      if (user.referredBy) throw new Error('Already referred');
      
      // Find referrer
      const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.trim()));
      const referrerSnap = await getDocs(q);
      if (referrerSnap.empty) throw new Error('Invalid referral code');
      
      const referrerDoc = referrerSnap.docs[0];
      if (referrerDoc.id === uid) throw new Error('Cannot refer yourself');
      
      // Update user
      transaction.update(userRef, {
        referredBy: referrerDoc.id
      });
      
      // Create Referral Record
      const referralRef = doc(collection(db, 'referrals'));
      transaction.set(referralRef, {
        referrerUid: referrerDoc.id,
        referredUid: uid,
        referredEmail: user.email,
        rewardAmount: 0,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      return referrerDoc.id;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'applyReferralCode');
  }
};

// Gift Card Logic
export const redeemGiftCard = async (uid: string, code: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const q = query(collection(db, 'giftCards'), where('code', '==', code.trim()), where('isUsed', '==', false));
      const snap = await getDocs(q);
      
      if (snap.empty) throw new Error('Invalid or already used gift card');
      
      const cardDoc = snap.docs[0];
      const card = cardDoc.data();
      
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data();
      
      // Update Card
      transaction.update(cardDoc.ref, {
        isUsed: true,
        usedByUid: uid,
        usedAt: serverTimestamp()
      });
      
      // Update User Balance
      transaction.update(userRef, {
        walletBalance: user.walletBalance + card.amount
      });
      
      // Create Wallet Transaction
      const walletTxRef = doc(collection(db, 'walletTransactions'));
      transaction.set(walletTxRef, {
        uid,
        amount: card.amount,
        type: 'deposit',
        status: 'completed',
        description: `Redeemed Gift Card: ${code}`,
        createdAt: serverTimestamp()
      });
      
      // Create Notification
      const notificationRef = doc(collection(db, 'notifications'));
      transaction.set(notificationRef, {
        uid,
        title: 'Gift Card Redeemed! 🎁',
        message: `৳${card.amount.toFixed(2)} has been added to your wallet.`,
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      return card.amount;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'redeemGiftCard');
  }
};

// Bulk Purchase
export const buyProxiesBulk = async (uid: string, planId: string, quantity: number) => {
  try {
    const results = [];
    for (let i = 0; i < quantity; i++) {
      const orderId = await buyProxyWithCoupon(uid, planId);
      results.push(orderId);
    }
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'buyProxiesBulk');
  }
};

// MikroTik Integration
export const getMikroTikRouters = async () => {
  try {
    const snap = await getDocs(collection(db, 'mikrotikRouters'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'mikrotikRouters');
  }
};

export const saveMikroTikRouter = async (id: string | null, config: any) => {
  try {
    const routerRef = id ? doc(db, 'mikrotikRouters', id) : doc(collection(db, 'mikrotikRouters'));
    await setDoc(routerRef, {
      ...config,
      status: config.status || 'active',
      updatedAt: serverTimestamp()
    }, { merge: true });
    return routerRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mikrotikRouters');
  }
};

export const deleteMikroTikRouter = async (id: string) => {
  try {
    await updateDoc(doc(db, 'mikrotikRouters', id), {
      status: 'deleted',
      deletedAt: serverTimestamp()
    });
    // Or actually delete it
    // await deleteDoc(doc(db, 'mikrotikRouters', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `mikrotikRouters/${id}`);
  }
};

export const testMikroTikConnection = async (config: any) => {
  try {
    const response = await axios.post('/api/mikrotik/test', config);
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const createAutoProxy = async (uid: string, data: {
  username: string;
  password: string;
  speed: '50Mbps' | '100Mbps' | '150Mbps';
  duration: 1 | 3 | 6;
  routerId: string;
}) => {
  try {
    // 1. Calculate Price
    const speedPrices: Record<string, number> = {
      '50Mbps': 80,
      '100Mbps': 120,
      '150Mbps': 160
    };
    const monthlyRate = speedPrices[data.speed] || 80;
    const totalPrice = monthlyRate * data.duration;

    // 2. Get User and Router Info (Initial Check)
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) throw new Error('User not found');
    const user = userSnap.data();

    if (user.walletBalance < totalPrice) throw new Error('Insufficient balance');

    const routerSnap = await getDoc(doc(db, 'mikrotikRouters', data.routerId));
    if (!routerSnap.exists()) throw new Error('Selected router not found');
    const config = routerSnap.data();

    // 3. Call Backend to create on MikroTik (Outside transaction)
    const speedLimit = data.speed.replace('Mbps', 'M') + '/' + data.speed.replace('Mbps', 'M');
    
    try {
      console.log(`[dbService] Calling /api/mikrotik/create-proxy for user: ${data.username}`);
      const mikrotikResponse = await axios.post('/api/mikrotik/create-proxy', {
        config,
        proxyData: {
          username: data.username,
          password: data.password,
          speedLimit
        }
      });
      console.log('[dbService] MikroTik response:', mikrotikResponse.data);

      if (!mikrotikResponse.data.success) {
        throw new Error(mikrotikResponse.data.error || 'Failed to create proxy on MikroTik');
      }
    } catch (err: any) {
      const backendError = err.response?.data?.error || err.message;
      throw new Error(backendError);
    }

    // 4. Finalize in Firestore with a transaction
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const freshUserSnap = await transaction.get(userRef);
      const freshUser = freshUserSnap.data();
      
      if (!freshUser || freshUser.walletBalance < totalPrice) {
        throw new Error('Insufficient balance at finalization');
      }

      // Update Balance
      transaction.update(userRef, {
        walletBalance: freshUser.walletBalance - totalPrice
      });

      // Create Auto Proxy Record
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + data.duration);

      const autoProxyRef = doc(collection(db, 'autoProxies'));
      transaction.set(autoProxyRef, {
        uid,
        username: data.username, // Use user's provided username
        password: data.password, // Use user's provided password
        speed: data.speed,
        duration: data.duration,
        price: totalPrice,
        status: 'active',
        routerId: data.routerId,
        routerName: config.name || config.host,
        host: config.host,
        port: config.socksPort || 1080,
        expiryDate: expiryDate.toISOString(),
        createdAt: serverTimestamp()
      });

      // Create Wallet Transaction
      const walletTxRef = doc(collection(db, 'walletTransactions'));
      transaction.set(walletTxRef, {
        uid,
        amount: -totalPrice,
        type: 'purchase',
        status: 'completed',
        description: `Automatic Proxy: ${data.speed} for ${data.duration} months`,
        createdAt: serverTimestamp()
      });

      return autoProxyRef.id;
    });
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    handleFirestoreError(error, OperationType.WRITE, 'autoProxies');
  }
};

export const toggleAutoRenew = async (proxyId: string, status: boolean) => {
  try {
    await updateDoc(doc(db, 'proxyInventory', proxyId), {
      autoRenew: status
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `proxyInventory/${proxyId}`);
  }
};

export const processAutoRenewals = async () => {
  try {
    const q = query(
      collection(db, 'proxyInventory'),
      where('autoRenew', '==', true),
      where('isAssigned', '==', true)
    );
    const snap = await getDocs(q);
    const proxies = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let processed = 0;
    let failed = 0;

    for (const proxy of proxies as any) {
      // Check if expired or expiring within 1 hour
      const expiryDate = new Date(proxy.expiryDate);
      const now = new Date();
      const diffHours = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours <= 1) {
        try {
          // Get plan price
          const planSnap = await getDoc(doc(db, 'proxyPlans', proxy.planId));
          if (!planSnap.exists()) continue;
          const plan = planSnap.data();

          // Get user balance
          const userSnap = await getDoc(doc(db, 'users', proxy.assignedToUid));
          if (!userSnap.exists()) continue;
          const user = userSnap.data();

          if (user.walletBalance >= plan.price) {
            await renewProxy(proxy.assignedToUid, proxy.id);
            processed++;
          } else {
            // Disable auto-renew if balance is low
            await updateDoc(doc(db, 'proxyInventory', proxy.id), {
              autoRenew: false
            });
            
            // Notify user
            await addDoc(collection(db, 'notifications'), {
              uid: proxy.assignedToUid,
              title: 'Auto-Renewal Failed ❌',
              message: `Auto-renewal for proxy ${proxy.id} failed due to insufficient balance.`,
              isRead: false,
              createdAt: serverTimestamp()
            });
            failed++;
          }
        } catch (err) {
          console.error(`Failed to auto-renew proxy ${proxy.id}:`, err);
          failed++;
        }
      }
    }
    return { processed, failed };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'autoRenewals');
  }
};

// Admin Analytics
export const getAdminAnalytics = async () => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const txSnap = await getDocs(collection(db, 'walletTransactions'));
    
    const totalUsers = usersSnap.size;
    const totalOrders = ordersSnap.size;
    
    let totalRevenue = 0;
    ordersSnap.docs.forEach(doc => {
      totalRevenue += doc.data().amount || 0;
    });

    let totalDeposits = 0;
    txSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.type === 'deposit' && data.status === 'completed') {
        totalDeposits += data.amount || 0;
      }
    });

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalDeposits
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'analytics');
  }
};

// Clash Subscription Plans
export const getClashSubscriptionPlans = async () => {
  try {
    const q = query(collection(db, 'clashSubscriptionPlans'), where('status', '==', 'active'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'clashSubscriptionPlans');
  }
};

export const buyClashSubscription = async (uid: string, planId: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data();

      const planRef = doc(db, 'clashSubscriptionPlans', planId);
      const planSnap = await transaction.get(planRef);
      if (!planSnap.exists()) throw new Error('Plan not found');
      const plan = planSnap.data();

      if (user.walletBalance < plan.price) throw new Error('Insufficient balance');

      // 1. Deduct Balance
      transaction.update(userRef, {
        walletBalance: user.walletBalance - plan.price
      });

      // 2. Create Subscription
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.duration);
      
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const subRef = doc(collection(db, 'userClashSubscriptions'));
      transaction.set(subRef, {
        uid,
        planId,
        planName: plan.name,
        token,
        expiryDate: expiryDate.toISOString(),
        status: 'active',
        createdAt: serverTimestamp()
      });

      // 3. Create Wallet Transaction
      const txRef = doc(collection(db, 'walletTransactions'));
      transaction.set(txRef, {
        uid,
        amount: -plan.price,
        type: 'purchase',
        status: 'completed',
        description: `Clash Subscription: ${plan.name}`,
        createdAt: serverTimestamp()
      });

      await logActivity('clash_subscription_purchase', `User purchased Clash subscription: ${plan.name} for ৳${plan.price}`, { uid, email: user.email });

      return subRef.id;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'userClashSubscriptions');
  }
};

export const getUserClashSubscriptions = async (uid: string) => {
  try {
    const q = query(
      collection(db, 'userClashSubscriptions'), 
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'userClashSubscriptions');
  }
};
