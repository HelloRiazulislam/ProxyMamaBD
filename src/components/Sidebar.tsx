import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  ShoppingCart, 
  ShieldCheck, 
  FileText, 
  Bell, 
  User, 
  LogOut,
  Users,
  Package,
  Database,
  CreditCard,
  Settings,
  Menu,
  X,
  Server,
  Ticket,
  Gift,
  MessageSquare,
  Megaphone,
  Search,
  Activity,
  Sun,
  Moon,
  Cpu,
  Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useSettings, useAuth } from '../App';
import { logActivity } from '../services/activityService';

interface SidebarProps {
  role: 'admin' | 'user';
}

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [pendingBalanceCount, setPendingBalanceCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  const { t, theme, toggleTheme } = useSettings();
  const { profile } = useAuth();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Unread Notifications
    const q = query(
      collection(db, 'notifications'),
      where('uid', 'in', [auth.currentUser.uid, 'all']),
      orderBy('createdAt', 'desc')
    );
    
    const unsubNotifications = onSnapshot(q, (snap) => {
      if (!profile?.lastReadNotificationAt) {
        setUnreadCount(snap.size);
        return;
      }
      
      const lastRead = profile.lastReadNotificationAt.toDate ? profile.lastReadNotificationAt.toDate() : new Date(profile.lastReadNotificationAt);
      const unread = snap.docs.filter(doc => {
        const data = doc.data();
        // Check if ID is in readNotifications array
        if (profile?.readNotifications?.includes(doc.id)) return false;
        
        if (!data.createdAt) return false;
        if (!profile?.lastReadNotificationAt) return true;
        
        const lastRead = profile.lastReadNotificationAt.toDate ? profile.lastReadNotificationAt.toDate() : new Date(profile.lastReadNotificationAt);
        const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        return created.getTime() > lastRead.getTime();
      });
      
      setUnreadCount(unread.length);
    }, (error) => {
      console.error("Notification listener error:", error);
    });

    // Pending Balance Requests (Admin only)
    let unsubBalance = () => {};
    let unsubTickets = () => {};
    if (role === 'admin') {
      const qb = query(
        collection(db, 'balanceRequests'),
        where('status', '==', 'pending')
      );
      unsubBalance = onSnapshot(qb, (snap) => {
        setPendingBalanceCount(snap.size);
      });

      const qt = query(
        collection(db, 'supportTickets'),
        where('adminUnread', '==', true)
      );
      unsubTickets = onSnapshot(qt, (snap) => {
        setOpenTicketsCount(snap.size);
      });
    } else {
      // User unread tickets
      const qt = query(
        collection(db, 'supportTickets'),
        where('uid', '==', auth.currentUser.uid),
        where('userUnread', '==', true)
      );
      unsubTickets = onSnapshot(qt, (snap) => {
        setUnreadSupportCount(snap.size);
      });
    }

    return () => {
      unsubNotifications();
      unsubBalance();
      unsubTickets();
    };
  }, [role, auth.currentUser, profile?.lastReadNotificationAt]);

  const userLinks = [
    { name: t.dashboard, icon: LayoutDashboard, path: '/dashboard' },
    { name: t.addBalance, icon: Wallet, path: '/dashboard/add-balance' },
    { name: t.walletHistory, icon: History, path: '/dashboard/wallet-history' },
    { name: t.buyProxy, icon: ShoppingCart, path: '/dashboard/buy-proxy' },
    { name: t.myProxies, icon: ShieldCheck, path: '/dashboard/my-proxies' },
    { name: t.orders, icon: FileText, path: '/dashboard/orders' },
    { name: t.affiliate, icon: Gift, path: '/dashboard/affiliate' },
    { name: 'Reseller', icon: Package, path: '/dashboard/reseller' },
    { name: t.support, icon: MessageSquare, path: '/dashboard/support', badge: unreadSupportCount },
    { name: t.notifications, icon: Bell, path: '/dashboard/notifications', badge: unreadCount },
    { name: t.profile, icon: User, path: '/dashboard/profile' },
  ];

  const adminLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Proxy Servers', icon: Server, path: '/admin/proxy-servers' },
    { name: 'Proxy Inventory', icon: Database, path: '/admin/proxy-inventory' },
    { name: 'Proxy Tracking', icon: Search, path: '/admin/proxy-tracking' },
    { name: 'Balance Requests', icon: CreditCard, path: '/admin/balance-requests', badge: pendingBalanceCount },
    { name: 'Reseller Requests', icon: Package, path: '/admin/reseller-requests' },
    { name: 'Orders', icon: FileText, path: '/admin/orders' },
    { name: 'Wallet Transactions', icon: History, path: '/admin/wallet-transactions' },
    { name: 'Coupons', icon: Ticket, path: '/admin/coupons' },
    { name: 'Gift Cards', icon: Gift, path: '/admin/gift-cards' },
    { name: 'Free Proxy Campaign', icon: Zap, path: '/admin/free-proxy' },
    { name: 'Announcements', icon: Megaphone, path: '/admin/announcements' },
    { name: 'Support', icon: MessageSquare, path: '/admin/support', badge: openTicketsCount },
    { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { name: 'Activity Logs', icon: Activity, path: '/admin/activity-logs' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    if (profile) {
      await logActivity('Logout', 'User logged out', profile);
    }
    await signOut(auth);
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-md shadow-md border border-gray-200 dark:border-slate-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">ProxyMama</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === link.path
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <div className="flex items-center">
                  <link.icon className="mr-3" size={20} />
                  {link.name}
                </div>
                {link.badge > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t.logout}
            >
              <LogOut className="mr-2" size={20} />
              {t.logout}
            </button>
            <button
              onClick={toggleTheme}
              className="p-3 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <LogOut className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
              Confirm Logout
            </h3>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
