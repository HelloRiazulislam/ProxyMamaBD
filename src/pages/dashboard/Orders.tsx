import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { format } from 'date-fns';
import { ShoppingCart, ShieldCheck, Clock, AlertCircle, Copy, Check, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { generateInvoice } from '../../services/invoiceService';

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'orders'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Order ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">View all your proxy purchases and their status.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[200px] whitespace-nowrap">Order ID</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[150px] whitespace-nowrap">Plan Name</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[100px] whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[150px] whitespace-nowrap">Purchase Date</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[150px] whitespace-nowrap">Expiry Date</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[100px] whitespace-nowrap">Status</th>
                <th className="px-6 py-4 min-w-[100px] whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading orders...</td></tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{order.id}</span>
                        <button 
                          onClick={() => copyToClipboard(order.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md transition-all"
                          title="Copy Order ID"
                        >
                          {copiedId === order.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">{order.planTitle}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">৳{order.amount}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{format(order.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{order.expiryDate ? format(new Date(order.expiryDate), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold",
                        order.status === 'active' || order.status === 'completed' ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" :
                        order.status === 'expired' ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" :
                        "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400"
                      )}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => generateInvoice(order, profile)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="Download Invoice"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
