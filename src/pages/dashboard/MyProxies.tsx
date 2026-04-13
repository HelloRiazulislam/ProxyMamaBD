import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, isAfter, differenceInHours } from 'date-fns';
import { ShieldCheck, Copy, Eye, EyeOff, Clock, Globe, Zap, AlertCircle, ShoppingCart, QrCode, X as CloseIcon, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { renewProxy, toggleAutoRenew } from '../../services/dbService';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { generateInvoice } from '../../services/invoiceService';

export default function MyProxies() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreds, setShowCreds] = useState<Record<string, boolean>>({});
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedProxy, setSelectedProxy] = useState<any | null>(null);

  useEffect(() => {
    if (!profile) return;

    const q1 = query(
      collection(db, 'proxyInventory'),
      where('assignedToUid', '==', profile.uid),
      where('isAssigned', '==', true)
    );

    const q2 = query(
      collection(db, 'freeProxyClaims'),
      where('uid', '==', profile.uid)
    );

    const unsub1 = onSnapshot(q1, (snap) => {
      const p1 = snap.docs.map(doc => ({ id: doc.id, collection: 'proxyInventory', ...doc.data() }));
      setProxies(prev => {
        const others = prev.filter(p => p.collection !== 'proxyInventory');
        return [...others, ...p1].sort((a, b) => {
          if (a.collection === 'freeProxyClaims' && b.collection !== 'freeProxyClaims') return -1;
          if (a.collection !== 'freeProxyClaims' && b.collection === 'freeProxyClaims') return 1;
          const dateA = a.assignedAt?.toDate ? a.assignedAt.toDate().getTime() : new Date(a.assignedAt || 0).getTime();
          const dateB = b.assignedAt?.toDate ? b.assignedAt.toDate().getTime() : new Date(b.assignedAt || 0).getTime();
          return dateB - dateA;
        });
      });
      setLoading(false);
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      const p2 = snap.docs.map(doc => ({ id: doc.id, collection: 'freeProxyClaims', ...doc.data() }));
      setProxies(prev => {
        const others = prev.filter(p => p.collection !== 'freeProxyClaims');
        return [...others, ...p2].sort((a, b) => {
          if (a.collection === 'freeProxyClaims' && b.collection !== 'freeProxyClaims') return -1;
          if (a.collection !== 'freeProxyClaims' && b.collection === 'freeProxyClaims') return 1;
          const dateA = a.assignedAt?.toDate ? a.assignedAt.toDate().getTime() : 
                        a.claimedAt?.toDate ? a.claimedAt.toDate().getTime() : new Date(a.assignedAt || a.claimedAt || 0).getTime();
          const dateB = b.assignedAt?.toDate ? b.assignedAt.toDate().getTime() : 
                        b.claimedAt?.toDate ? b.claimedAt.toDate().getTime() : new Date(b.assignedAt || b.claimedAt || 0).getTime();
          return dateB - dateA;
        });
      });
      setLoading(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [profile]);

  const toggleCreds = (id: string) => {
    setShowCreds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleRenew = async (proxyId: string) => {
    if (!profile) return;
    toast.error('Please contact support for manual renewal or purchase a new proxy.');
    navigate('/dashboard/buy-proxy');
  };

  const handleToggleAutoRenew = async (proxyId: string, currentStatus: boolean) => {
    setTogglingId(proxyId);
    try {
      await toggleAutoRenew(proxyId, !currentStatus);
      toast.success(`Auto-renewal ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update auto-renewal');
    } finally {
      setTogglingId(null);
    }
  };

  const getStatus = (expiryDate: string) => {
    const isExpired = isAfter(new Date(), new Date(expiryDate));
    return isExpired ? 'EXPIRED' : 'ACTIVE';
  };

  const isExpiringSoon = (expiryDate: string) => {
    const hoursLeft = differenceInHours(new Date(expiryDate), new Date());
    return hoursLeft > 0 && hoursLeft <= 24;
  };

  const handleDownloadInvoice = async (proxy: any) => {
    if (!profile || !proxy.orderId) {
      toast.error('Order information not found for this proxy.');
      return;
    }

    try {
      const orderRef = doc(db, 'orders', proxy.orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        generateInvoice({ id: orderSnap.id, ...orderSnap.data() }, profile);
      } else {
        // Fallback: generate basic invoice from proxy data if order doc is missing
        generateInvoice({
          id: proxy.orderId || 'N/A',
          planTitle: proxy.planTitle || 'Proxy Subscription',
          amount: 0, // We don't have the price in inventory doc
          createdAt: { toDate: () => new Date(proxy.assignedAt?.toDate() || Date.now()) }
        }, profile);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to generate invoice.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Proxies</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and use your purchased proxies.</p>
        </div>
        <Link 
          to="/dashboard/buy-proxy"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
        >
          <ShoppingCart size={18} className="mr-2" />
          Buy New Proxy
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm animate-pulse h-48" />
          ))}
        </div>
      ) : proxies.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {proxies.map((proxy) => {
            const status = getStatus(proxy.expiryDate);
            const expiringSoon = isExpiringSoon(proxy.expiryDate);
            const isVisible = showCreds[proxy.id];
            
            return (
              <div key={proxy.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Left: Proxy Info */}
                    <div className="flex items-center space-x-4 min-w-[240px]">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">
                          {proxy.planTitle || 'Bangladesh Proxy'}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            status === 'ACTIVE' ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          )}>
                            {status}
                          </span>
                          {expiringSoon && status === 'ACTIVE' && (
                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                              EXPIRING SOON
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Connection Details (IP & Port) */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 group relative">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">Host / IP Address</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white tracking-wider">
                            {proxy.host}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(proxy.host)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                            title="Copy IP"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 group relative">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">Port Number</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white tracking-wider">
                            {proxy.port}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(proxy.port.toString())}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                            title="Copy Port"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Credentials */}
                    {proxy.type !== 'HTTP' ? (
                      <div className="flex-1 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">Credentials</div>
                          <button 
                            onClick={() => toggleCreds(proxy.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-bold flex items-center"
                          >
                            {isVisible ? <EyeOff size={12} className="mr-1" /> : <Eye size={12} className="mr-1" />}
                            {isVisible ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase mb-0.5">Username</div>
                            <div className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate">
                              {isVisible ? proxy.username : '••••••••'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase mb-0.5">Password</div>
                            <div className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate">
                              {isVisible ? proxy.password : '••••••••'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                          <button 
                            onClick={() => setSelectedProxy(proxy)}
                            className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 text-[10px] font-bold flex items-center"
                          >
                            <QrCode size={12} className="mr-1" /> QR Code
                          </button>
                          <button 
                            onClick={() => copyToClipboard(`${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`)}
                            className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 text-[10px] font-bold flex items-center"
                          >
                            <Copy size={12} className="mr-1" /> Copy Full Proxy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-center">
                        <div className="text-center">
                          <Globe size={24} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase">No Credentials Required</p>
                          <p className="text-[9px] text-gray-500">HTTP Proxy uses IP Authentication</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: Expiry & Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        Expires: <strong className="ml-1 text-gray-900 dark:text-gray-200">{format(new Date(proxy.expiryDate), 'MMM dd, yyyy')}</strong>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Auto-Renew</span>
                        <button
                          onClick={() => handleToggleAutoRenew(proxy.id, !!proxy.autoRenew)}
                          disabled={togglingId === proxy.id}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none",
                            proxy.autoRenew ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm",
                              proxy.autoRenew ? "translate-x-5.5" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadInvoice(proxy)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="Download Invoice"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleRenew(proxy.id)}
                        disabled={renewingId === proxy.id}
                        className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100 dark:shadow-none"
                      >
                        {renewingId === proxy.id ? 'Renewing...' : `Renew Proxy`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-gray-300 dark:text-slate-600" size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Proxies</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">You haven't purchased any proxies yet. Start by choosing a plan that fits your needs.</p>
          <Link 
            to="/dashboard/buy-proxy" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <ShoppingCart size={20} className="mr-2" />
            Browse Proxy Plans
          </Link>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedProxy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setSelectedProxy(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <CloseIcon size={24} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Proxy QR Code</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Scan with v2rayNG or any proxy app</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
                <QRCodeSVG 
                  value={`${(selectedProxy.type || 'socks5').toLowerCase()}://${selectedProxy.username}:${selectedProxy.password}@${selectedProxy.host}:${selectedProxy.port}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 text-left">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Configuration URL</div>
                  <div className="font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all">
                    {(selectedProxy.type || 'socks5').toLowerCase()}://{selectedProxy.username}:{selectedProxy.password}@{selectedProxy.host}:{selectedProxy.port}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const protocol = (selectedProxy.type || 'socks5').toLowerCase();
                    copyToClipboard(`${protocol}://${selectedProxy.username}:${selectedProxy.password}@${selectedProxy.host}:${selectedProxy.port}`);
                    setSelectedProxy(null);
                  }}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                >
                  Copy Config URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
