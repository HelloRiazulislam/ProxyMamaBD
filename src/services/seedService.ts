import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  setDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const seedInitialData = async () => {
  const plansSnap = await getDocs(collection(db, 'proxyPlans'));
  if (!plansSnap.empty) return; // Already seeded

  console.log('Seeding initial data...');

  // 1. Create Proxy Plans
  const plans = [
    {
      title: 'Bangladesh SOCKS5 - 1 Day',
      type: 'SOCKS5',
      location: 'Bangladesh',
      speed: '1Gbps',
      duration: 1,
      price: 1.50,
      stock: 10,
      status: 'active',
      description: 'High-speed SOCKS5 proxy for 24 hours.',
      createdAt: serverTimestamp()
    },
    {
      title: 'Bangladesh HTTP - 7 Days',
      type: 'HTTP',
      location: 'Bangladesh',
      speed: '2Gbps',
      duration: 7,
      price: 5.00,
      stock: 5,
      status: 'active',
      description: 'Reliable HTTP proxy for 1 week.',
      createdAt: serverTimestamp()
    },
    {
      title: 'Bangladesh SOCKS5 - 30 Days',
      type: 'SOCKS5',
      location: 'Bangladesh',
      speed: '5Gbps',
      duration: 30,
      price: 15.00,
      stock: 20,
      status: 'active',
      description: 'Premium SOCKS5 proxy for 1 month.',
      createdAt: serverTimestamp()
    }
  ];

  for (const plan of plans) {
    const planRef = await addDoc(collection(db, 'proxyPlans'), plan);
    
    // 2. Add Inventory for each plan
    for (let i = 0; i < 5; i++) {
      await addDoc(collection(db, 'proxyInventory'), {
        planId: planRef.id,
        host: `103.123.45.${Math.floor(Math.random() * 255)}`,
        port: 8080 + i,
        username: `user_${Math.random().toString(36).substring(7)}`,
        password: `pass_${Math.random().toString(36).substring(7)}`,
        status: 'available',
        isAssigned: false,
        assignedToUid: '',
        orderId: '',
        expiryDate: '',
        createdAt: serverTimestamp()
      });
    }
  }

  // 3. Create Platform Settings
  await setDoc(doc(db, 'settings', 'platform'), {
    platformName: 'ProxyMamaBD',
    supportEmail: 'support@proxymamabd.com',
    minDepositAmount: 10,
    paymentMethods: {
      bkash: '01321907688',
      nagad: '01321907688',
      rocket: '01321907688',
      bkashInstructions: '1. Dial *247#\n2. Choose "Send Money"\n3. Enter our bKash Number\n4. Enter Amount\n5. Enter PIN to confirm\n6. Copy Transaction ID',
      nagadInstructions: '1. Dial *167#\n2. Choose "Send Money"\n3. Enter our Nagad Number\n4. Enter Amount\n5. Enter PIN to confirm\n6. Copy Transaction ID',
      rocketInstructions: '1. Dial *322#\n2. Choose "Send Money"\n3. Enter our Rocket Number\n4. Enter Amount\n5. Enter PIN to confirm\n6. Copy Transaction ID',
      generalInstructions: 'Please follow the steps for your selected payment method.'
    },
    noticeBar: {
      content: 'Welcome to ProxyMamaBD! Get high-speed BDIX proxies at the best price.',
      isActive: true,
      type: 'info'
    },
    socialLinks: {
      telegram: 'https://t.me/proxymamabd',
      facebook: 'https://facebook.com/proxymamabd',
      whatsapp: 'https://wa.me/8801321907688'
    },
    branding: {
      logoUrl: '',
      faviconUrl: ''
    },
    legalPages: {
      termsAndConditions: '# Terms and Conditions\nWelcome to ProxyMamaBD...',
      privacyPolicy: '# Privacy Policy\nYour privacy is important...'
    },
    updatedAt: serverTimestamp()
  }, { merge: true });

  console.log('Seeding complete!');
};
