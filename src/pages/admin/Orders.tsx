import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ShoppingCart, Search, Filter, ExternalLink } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isExpiringSoon = (expiryDate: any) => {
    if (!expiryDate) return false;
    const date = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const hoursLeft = differenceInHours(date, new Date());
    return hoursLeft > 0 && hoursLeft <= 24;
  };

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(search.toLowerCase()) || 
    order.uid.toLowerCase().includes(search.toLowerCase()) ||
    order.planTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <p className="text-gray-500 text-sm">Monitor all proxy sales and order history.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">Order ID</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">User</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">Plan</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">Date</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading orders...</td></tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{order.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap">{order.userName || 'User'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{order.planTitle}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">৳{order.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{format(order.createdAt?.toDate() || new Date(), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit",
                          order.status === 'active' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {order.status}
                        </span>
                        {isExpiringSoon(order.expiresAt) && order.status === 'active' && (
                          <span className="flex items-center text-[9px] font-bold text-orange-600 animate-pulse">
                            <AlertCircle size={10} className="mr-1" /> EXPIRING SOON
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
