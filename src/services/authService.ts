import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, increment, addDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user profile
      const isAdmin = user.email === 'itsrirx@gmail.com';
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
        telegram: '',
        whatsapp: '',
        country: '',
        address: '',
        role: isAdmin ? 'admin' : 'user',
        walletBalance: 0,
        referralCode: user.uid,
        referralEarnings: 0,
        isBanned: false,
        onboardingCompleted: false,
        createdAt: serverTimestamp()
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const registerWithEmail = async (
  email: string, 
  pass: string, 
  firstName: string, 
  lastName: string, 
  phoneNumber: string, 
  country: string,
  address: string,
  couponCode?: string, 
  referralCode?: string
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    
    const fullName = `${firstName} ${lastName}`.trim();
    await updateProfile(user, { displayName: fullName });
    
    let initialBalance = 0;
    let bonusApplied = false;

    if (couponCode) {
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', couponCode.toUpperCase()),
        where('status', '==', 'active'),
        where('usageType', '==', 'registration')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const couponDoc = snap.docs[0];
        const data = couponDoc.data();
        if (data.usedCount < (data.usageLimit || 1000)) {
          initialBalance = data.discountValue;
          bonusApplied = true;
          await updateDoc(couponDoc.ref, { usedCount: increment(1) });
        }
      }
    }

    let referredBy = null;
    if (referralCode) {
      // Try searching by referralCode first
      const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        referredBy = snap.docs[0].id;
      } else {
        // Try searching by UID
        const userRef = doc(db, 'users', referralCode.trim());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          referredBy = userSnap.id;
        }
      }
    }

    // Create user profile
    const isAdmin = user.email === 'itsrirx@gmail.com';
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: fullName,
      firstName,
      lastName,
      photoURL: '',
      phoneNumber,
      telegram: '',
      whatsapp: '',
      country,
      address,
      role: isAdmin ? 'admin' : 'user',
      walletBalance: initialBalance,
      referralCode: user.uid,
      referralEarnings: 0,
      referredBy,
      isBanned: false,
      onboardingCompleted: true,
      createdAt: serverTimestamp()
    });

    if (referredBy) {
      await addDoc(collection(db, 'referrals'), {
        referrerUid: referredBy,
        referredUid: user.uid,
        referredEmail: user.email,
        rewardAmount: 0,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    }

    if (bonusApplied) {
      await addDoc(collection(db, 'walletTransactions'), {
        uid: user.uid,
        amount: initialBalance,
        type: 'adjustment',
        status: 'completed',
        description: `Registration bonus (Coupon: ${couponCode?.toUpperCase()})`,
        createdAt: serverTimestamp()
      });
    }

    // Send verification email
    const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
    const actionCodeSettings = {
      url: origin + '/verify-email',
      handleCodeInApp: true,
    };
    await sendEmailVerification(user, actionCodeSettings);
    
    return user;
  } catch (error) {
    console.error('Error registering with email:', error);
    throw error;
  }
};

export const completeOnboarding = async (uid: string, couponCode?: string, referralCode?: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User not found');
    const user = userSnap.data();

    let balanceIncrement = 0;
    let referredBy = null;

    if (couponCode) {
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', couponCode.toUpperCase()),
        where('status', '==', 'active'),
        where('usageType', '==', 'registration')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const couponDoc = snap.docs[0];
        const data = couponDoc.data();
        if (data.usedCount < (data.usageLimit || 1000)) {
          balanceIncrement = data.discountValue;
          await updateDoc(couponDoc.ref, { usedCount: increment(1) });
          
          await addDoc(collection(db, 'walletTransactions'), {
            uid,
            amount: balanceIncrement,
            type: 'adjustment',
            status: 'completed',
            description: `Registration bonus (Coupon: ${couponCode.toUpperCase()})`,
            createdAt: serverTimestamp()
          });
        }
      }
    }

    if (referralCode && !user.referredBy) {
      const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        referredBy = snap.docs[0].id;
      } else {
        const refUserRef = doc(db, 'users', referralCode.trim());
        const refUserSnap = await getDoc(refUserRef);
        if (refUserSnap.exists()) {
          referredBy = refUserSnap.id;
        }
      }

      if (referredBy && referredBy !== uid) {
        await addDoc(collection(db, 'referrals'), {
          referrerUid: referredBy,
          referredUid: uid,
          referredEmail: user.email,
          rewardAmount: 0,
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }
    }

    await updateDoc(userRef, {
      walletBalance: increment(balanceIncrement),
      referredBy: referredBy || user.referredBy || null,
      onboardingCompleted: true,
      updatedAt: serverTimestamp()
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
