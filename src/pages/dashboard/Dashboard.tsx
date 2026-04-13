import { useAuth, useSettings } from '../../App';
import { 
  Wallet, 
  ShieldCheck, 
  Clock, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertCircle,
  Megaphone,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, differenceInHours } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { logActivity } from '../../services/activityService';

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useSettings();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeProxiesCount, setActiveProxiesCount] = useState(0);
  const [expiringProxies, setExpiringProxies] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;

    logActivity('dashboard_view', 'User viewed dashboard', profile);

    // Announcements
    const annQuery = query(
      collection(db, 'announcements'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubAnn = onSnapshot(annQuery, (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Recent Orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      setRecentOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setActiveProxiesCount(snap.docs.filter(doc => doc.data().status === 'active').length);
    });

    // Pending Balance Requests
    const requestsQuery = query(
      collection(db, 'balanceRequests'),
      where('uid', '==', profile.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      setPendingRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Expiring Proxies (within 24h)
    const inventoryQuery = query(
      collection(db, 'proxyInventory'),
      where('assignedToUid', '==', profile.uid),
      where('isAssigned', '==', true)
    );
    const unsubInventory = onSnapshot(inventoryQuery, (snap) => {
      const expiring = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((proxy: any) => {
          const hoursLeft = differenceInHours(new Date(proxy.expiryDate), new Date());
          return hoursLeft > 0 && hoursLeft <= 24;
        });
      setExpiringProxies(expiring);
    });

    return () => {
      unsubAnn();
      unsubOrders();
      unsubRequests();
      unsubInventory();
    };
  }, [profile]);

  const stats = [
    { label: t.walletBalance, value: `৳${profile?.walletBalance}`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: t.activeProxies, value: activeProxiesCount, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { label: t.pendingRequests, value: pendingRequests.length, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: t.totalOrders, value: recentOrders.length, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, {profile?.displayName}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.overviewAccount}</p>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              className={cn(
                "p-4 rounded-2xl border flex items-start space-x-4 animate-in fade-in slide-in-from-left-4 duration-500",
                ann.type === 'info' ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300" :
                ann.type === 'warning' ? "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-300" :
                ann.type === 'success' ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300" :
                "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl",
                ann.type === 'info' ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" :
                ann.type === 'warning' ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" :
                ann.type === 'success' ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" :
                "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
              )}>
                {ann.type === 'info' && <Info size={20} />}
                {ann.type === 'warning' && <AlertTriangle size={20} />}
                {ann.type === 'success' && <CheckCircle size={20} />}
                {ann.type === 'danger' && <XCircle size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{ann.title}</h3>
                <p className="text-sm opacity-90">{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expiry Alert */}
      {expiringProxies.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-4 flex items-start space-x-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-xl text-orange-600 dark:text-orange-400">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-orange-900 dark:text-orange-300">{t.proxyExpiringSoon}</h3>
            <p className="text-sm text-orange-700 dark:text-orange-400/90">
              You have {expiringProxies.length} {expiringProxies.length === 1 ? 'proxy' : 'proxies'} expiring within the next 24 hours. 
              {t.renewAvoidInterruption}
            </p>
            <Link to="/dashboard/my-proxies" className="inline-block mt-2 text-sm font-bold text-orange-900 dark:text-orange-300 hover:underline">
              {t.viewExpiringProxies} →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} dark:bg-opacity-20 ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">{t.recentOrders}</h2>
            <Link to="/dashboard/orders" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">{t.viewAll}</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="text-gray-600 dark:text-gray-400" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{order.planTitle}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{format(order.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">৳{order.amount}</div>
                    <div className={`text-xs font-medium ${order.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {order.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <ShoppingCart className="mx-auto mb-3 text-gray-300 dark:text-slate-700" size={40} />
                <p>{t.noOrders}</p>
                <Link to="/dashboard/buy-proxy" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">{t.buyFirstProxy}</Link>
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">{t.pendingBalanceRequests}</h2>
            <Link to="/dashboard/add-balance" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">{t.addBalance}</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{request.paymentMethod}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">TXID: {request.transactionId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">৳{request.amount}</div>
                    <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">PENDING</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Wallet className="mx-auto mb-3 text-gray-300 dark:text-slate-700" size={40} />
                <p>{t.noPendingRequests}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
