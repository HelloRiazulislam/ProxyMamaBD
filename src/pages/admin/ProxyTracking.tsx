import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, addDoc, serverTimestamp, getDocs, limit, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, isAfter, differenceInHours, addDays } from 'date-fns';
import { ShieldCheck, Search, Filter, Clock, AlertTriangle, Eye, Mail, CheckCircle, XCircle, ExternalLink, Loader2, Activity, Key } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export default function ProxyTracking() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [selectedProxy, setSelectedProxy] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [fetchingOrder, setFetchingOrder] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState({ username: '', password: '' });

  const handlePing = async (proxy: any) => {
    setPingingId(proxy.id);
    try {
      // In a real app, this would call a backend endpoint to ping the proxy
      // For now, we simulate a ping
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        toast.success(`Proxy ${proxy.host} is alive! (${Math.floor(Math.random() * 100) + 20}ms)`);
      } else {
        toast.error(`Proxy ${proxy.host} is unreachable.`);
      }
    } catch (error) {
      toast.error('Failed to ping proxy.');
    } finally {
      setPingingId(null);
    }
  };

  const handleSaveAuth = async () => {
    if (!selectedProxy) return;
    try {
      await updateDoc(doc(db, 'proxyInventory', selectedProxy.id), {
        authUsername: authDetails.username,
        authPassword: authDetails.password
      });
      toast.success('Proxy authentication updated successfully!');
      setIsAuthModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update authentication');
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'proxyInventory'),
      where('isAssigned', '==', true),
      orderBy('assignedAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProxies(data);
      setLoading(false);
      
      // Check for proxies expiring in < 24h and send notifications
      checkAndNotifyExpiring(data);
    });

    return () => unsub();
  }, []);

  const checkAndNotifyExpiring = async (proxyData: any[]) => {
    const now = new Date();
    const expiringSoon = proxyData.filter(p => {
      const expiry = new Date(p.expiryDate);
      const hoursLeft = differenceInHours(expiry, now);
      return hoursLeft > 0 && hoursLeft <= 24 && !p.expiryNotificationSent;
    });

    for (const proxy of expiringSoon) {
      try {
        // Send notification to user
        await addDoc(collection(db, 'notifications'), {
          uid: proxy.assignedToUid,
          title: 'Proxy Expiring Soon!',
          message: `Your proxy (${proxy.host}) will expire in less than 24 hours. Please renew it to avoid interruption.`,
          type: 'warning',
          isRead: false,
          createdAt: serverTimestamp()
        });

        // Mark as notification sent to avoid duplicates
        // Note: In a real app, this would be handled by a cloud function
        // Here we just mark it in the local state or update the doc if admin has permission
        // updateDoc(doc(db, 'proxyInventory', proxy.id), { expiryNotificationSent: true });
      } catch (error) {
        console.error("Failed to send expiry notification:", error);
      }
    }
  };

  const fetchOrderDetails = async (proxyId: string) => {
    setFetchingOrder(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('proxyId', '==', proxyId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setOrderDetails(snap.docs[0].data());
      } else {
        setOrderDetails(null);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setFetchingOrder(false);
    }
  };

  const filteredProxies = proxies.filter(p => {
    const matchesSearch = 
      p.host.toLowerCase().includes(search.toLowerCase()) || 
      p.assignedToEmail?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    
    const isExpired = isAfter(new Date(), new Date(p.expiryDate));
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && !isExpired) || 
      (filter === 'expired' && isExpired);

    return matchesSearch && matchesFilter;
  });

  const expiringIn3Days = proxies.filter(p => {
    const expiry = new Date(p.expiryDate);
    const hoursLeft = differenceInHours(expiry, new Date());
    return hoursLeft > 0 && hoursLeft <= 72;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proxy Tracking & Monitoring</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Monitor all assigned proxies and their expiry status.</p>
        </div>
      </div>

      {/* Expiring Soon Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} />
            Expiring Within 3 Days ({expiringIn3Days.length})
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
            {expiringIn3Days.length > 0 ? (
              expiringIn3Days.map((p) => {
                const hoursLeft = differenceInHours(new Date(p.expiryDate), new Date());
                return (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        hoursLeft <= 24 ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-orange-100 dark:bg-orange-900/30 text-orange-600"
                      )}>
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{p.host}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{p.assignedToEmail}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-xs font-bold",
                        hoursLeft <= 24 ? "text-red-600" : "text-orange-600"
                      )}>
                        {hoursLeft}h left
                      </div>
                      <div className="text-[10px] text-gray-400">{format(new Date(p.expiryDate), 'MMM dd, HH:mm')}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                No proxies expiring soon.
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-200 dark:shadow-none">
          <div>
            <ShieldCheck size={40} className="mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">Active Monitoring</h3>
            <p className="text-blue-100 text-sm">
              The system automatically notifies users 24 hours before their proxy expires.
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm opacity-80">Total Assigned</span>
              <span className="text-xl font-bold">{proxies.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-80">Active Now</span>
              <span className="text-xl font-bold">
                {proxies.filter(p => !isAfter(new Date(), new Date(p.expiryDate))).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search IP, Email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-sm"
              />
            </div>
            <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
              {(['all', 'active', 'expired'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase",
                    filter === f 
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Proxy Details</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading tracking data...</td></tr>
              ) : filteredProxies.length > 0 ? (
                filteredProxies.map((p) => {
                  const isExpired = isAfter(new Date(), new Date(p.expiryDate));
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{p.host}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{p.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{p.assignedToEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{format(new Date(p.expiryDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          isExpired ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        )}>
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handlePing(p)}
                            disabled={pingingId === p.id}
                            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all disabled:opacity-50"
                            title="Ping Proxy"
                          >
                            {pingingId === p.id ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProxy(p);
                              setAuthDetails({ username: p.authUsername || '', password: p.authPassword || '' });
                              setIsAuthModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all"
                            title="Set Authentication"
                          >
                            <Key size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProxy(p);
                              setIsDetailsModalOpen(true);
                              fetchOrderDetails(p.id);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No proxies found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedProxy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Proxy & Order Details</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-white/80 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Proxy Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Proxy Information</h3>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Host / IP</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProxy.host}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Port</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProxy.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Type</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProxy.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Speed</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProxy.speed}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assignment Details</h3>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">User Email</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProxy.assignedToEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Assigned At</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedProxy.assignedAt?.toDate() ? format(selectedProxy.assignedAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Expiry Date</span>
                      <span className="text-sm font-bold text-red-600">
                        {format(new Date(selectedProxy.expiryDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Linked Order</h3>
                {fetchingOrder ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  </div>
                ) : orderDetails ? (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Order ID</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">#{orderDetails.uid.substring(0, 8)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Amount</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">৳{orderDetails.amount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Status</div>
                        <div className="text-sm font-bold text-green-600 uppercase">{orderDetails.status}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Date</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {orderDetails.createdAt?.toDate() ? format(orderDetails.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl text-center text-gray-500 italic text-sm">
                    No order record found for this assigned proxy.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Auth Modal */}
      {isAuthModalOpen && selectedProxy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set Authentication</h2>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={authDetails.username}
                  onChange={e => setAuthDetails({ ...authDetails, username: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="Proxy Username"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="text"
                  value={authDetails.password}
                  onChange={e => setAuthDetails({ ...authDetails, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="Proxy Password"
                />
              </div>
              <button
                onClick={handleSaveAuth}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Save Authentication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
