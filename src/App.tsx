import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState, createContext, useContext } from 'react';
import { auth, db } from './lib/firebase';
import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { translations, Language } from './lib/i18n';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Public Pages
import Home from './pages/Home';
import Downloads from './pages/Downloads';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackOrder from './pages/TrackOrder';
import VerifyEmail from './pages/VerifyEmail';

// Legal Pages
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Refund from './pages/legal/Refund';
import Cookies from './pages/legal/Cookies';

// User Dashboard
import UserLayout from './components/UserLayout';
import UserDashboard from './pages/dashboard/Dashboard';
import AddBalance from './pages/dashboard/AddBalance';
import WalletHistory from './pages/dashboard/WalletHistory';
import BuyProxy from './pages/dashboard/BuyProxy';
import MyProxies from './pages/dashboard/MyProxies';
import UserOrders from './pages/dashboard/Orders';
import UserNotifications from './pages/dashboard/Notifications';
import UserActivityLog from './pages/dashboard/ActivityLog';
import UserProfile from './pages/dashboard/Profile';
import Affiliate from './pages/dashboard/Affiliate';
import Reseller from './pages/dashboard/Reseller';
import Support from './pages/dashboard/Support';
import TicketDetails from './pages/dashboard/TicketDetails';

// Admin Panel
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminProxyInventory from './pages/admin/ProxyInventory';
import AdminProxyTracking from './pages/admin/ProxyTracking';
import AdminBalanceRequests from './pages/admin/BalanceRequests';
import AdminResellerRequests from './pages/admin/ResellerRequests';
import AdminOrders from './pages/admin/Orders';
import AdminWalletTransactions from './pages/admin/WalletTransactions';
import AdminNotifications from './pages/admin/Notifications';
import AdminSettings from './pages/admin/Settings';
import AdminCoupons from './pages/admin/Coupons';
import AdminSupportTickets from './pages/admin/SupportTickets';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminGiftCards from './pages/admin/GiftCards';
import AdminProxyServers from './pages/admin/ProxyServers';
import FreeProxyManager from './pages/admin/FreeProxyManager';
import AdminActivityLogs from './pages/admin/ActivityLogs';

// Types
interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  displayName: string;
  photoURL: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  telegram?: string;
  whatsapp?: string;
  country?: string;
  address?: string;
  walletBalance: number;
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  referralCount?: number;
  totalOrders?: number;
  isVerified?: boolean;
  isBanned?: boolean;
  isReseller?: boolean;
  onboardingCompleted?: boolean;
  lastReadNotificationAt?: any;
  readNotifications?: string[];
  createdAt: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

interface SettingsContextType {
  settings: any;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  t: any;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  logout: async () => {} 
});
const SettingsContext = createContext<SettingsContextType>({ 
  settings: null, 
  loading: true, 
  theme: 'light',
  toggleTheme: () => {},
  t: translations.en
});

export const useAuth = () => useContext(AuthContext);
export const useSettings = () => useContext(SettingsContext);

import { seedInitialData } from './services/seedService';
import { checkExpiredFreeProxies } from './services/dbService';
import NoticeBar from './components/NoticeBar';

import Onboarding from './pages/Onboarding';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return (saved as 'light' | 'dark') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  const t = translations.en;

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    // Seed initial data for preview
    seedInitialData().catch(console.error);
    
    // Check for expired free proxies
    checkExpiredFreeProxies().catch(console.error);

    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'platform'), 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSettings(data);
          
          // Update Branding
          if (data.platformName) {
            document.title = data.platformName;
          }
          if (data.branding?.faviconUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = data.branding.faviconUrl;
          }
        }
        setSettingsLoading(false);
      },
      (error) => {
        console.error("Settings listener error:", error);
        setSettingsLoading(false);
      }
    );

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Listen to profile changes in real-time
        const profileRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(profileRef, 
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              
              // Force admin role for the designated email
              if (user.email === 'itsrirx@gmail.com') {
                data.role = 'admin';
              }
              setProfile(data);
              
              // Update lastActiveAt for existing users
              try {
                await updateDoc(profileRef, {
                  lastActiveAt: serverTimestamp()
                });
              } catch (err) {
                // Ignore errors if rules block it
              }
            } else {
              // Handle case where user exists in Auth but not in Firestore yet
              // AUTO-CREATE PROFILE for all users to prevent permission issues
              const isAdmin = user.email === 'itsrirx@gmail.com';
              const newProfile: any = {
                uid: user.uid,
                email: user.email!,
                role: isAdmin ? 'admin' : 'user',
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || '',
                phoneNumber: '',
                telegram: '',
                whatsapp: '',
                country: '',
                address: '',
                walletBalance: 0,
                referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
                referralEarnings: 0,
                isBanned: false,
                onboardingCompleted: true, // Default to true for auto-created (usually existing users)
                lastReadNotificationAt: serverTimestamp(),
                readNotifications: [],
                createdAt: serverTimestamp(),
                lastActiveAt: serverTimestamp()
              };
              
              try {
                // We use setDoc to ensure the profile exists
                await setDoc(profileRef, newProfile);
                setProfile(newProfile);
              } catch (err) {
                console.error("Failed to auto-create profile:", err);
                // Fallback for UI if rules block it (though they shouldn't)
                setProfile(newProfile);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error("Profile listener error:", error);
            setLoading(false);
          }
        );
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  if (loading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Update favicon if set
  if (settings?.branding?.faviconUrl) {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = settings.branding.faviconUrl;
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, loading: settingsLoading, theme, toggleTheme, t }}>
      <AuthContext.Provider value={{ user, profile, loading, logout }}>
        <Router>
          <NoticeBar />
          <ScrollToTop />
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={
            user ? (
              user.emailVerified ? (
                profile?.onboardingCompleted === false ? <Navigate to="/onboarding" /> : <UserLayout />
              ) : <Navigate to="/verify-email" />
            ) : <Navigate to="/login" />
          }>
            <Route index element={<UserDashboard />} />
            <Route path="add-balance" element={<AddBalance />} />
            <Route path="wallet-history" element={<WalletHistory />} />
            <Route path="buy-proxy" element={<BuyProxy />} />
            <Route path="my-proxies" element={<MyProxies />} />
            <Route path="orders" element={<UserOrders />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="activity-log" element={<UserActivityLog />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="affiliate" element={<Affiliate />} />
            <Route path="reseller" element={<Reseller />} />
            <Route path="support" element={<Support />} />
            <Route path="support/:id" element={<TicketDetails />} />
          </Route>

          {/* Admin Panel Routes */}
          <Route path="/admin" element={profile?.role === 'admin' ? <AdminLayout /> : <Navigate to="/dashboard" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="proxy-inventory" element={<AdminProxyInventory />} />
            <Route path="proxy-servers" element={<AdminProxyServers />} />
            <Route path="proxy-tracking" element={<AdminProxyTracking />} />
            <Route path="balance-requests" element={<AdminBalanceRequests />} />
            <Route path="reseller-requests" element={<AdminResellerRequests />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="wallet-transactions" element={<AdminWalletTransactions />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="support" element={<AdminSupportTickets />} />
            <Route path="support/:id" element={<TicketDetails />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="gift-cards" element={<AdminGiftCards />} />
            <Route path="free-proxy" element={<FreeProxyManager />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="activity-logs" element={<AdminActivityLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
      </AuthContext.Provider>
    </SettingsContext.Provider>
  );
}
