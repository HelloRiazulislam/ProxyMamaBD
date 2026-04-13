import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Wallet, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function AdminWalletTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'walletTransactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => 
      (tx.id || '').toLowerCase().includes(search.toLowerCase()) || 
      (tx.uid || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Transactions</h1>
          <p className="text-gray-500 text-sm">Audit all balance changes across the platform.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
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
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">TX ID</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">User ID</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Type</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[200px] whitespace-nowrap">Description</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading transactions...</td></tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{tx.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">{tx.uid.substring(0, 8)}...</td>
                    <td className="px-6 py-4 capitalize whitespace-nowrap">
                      <div className="flex items-center">
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="mr-2 text-green-600" size={16} />
                        ) : (
                          <ArrowDownLeft className="mr-2 text-red-600" size={16} />
                        )}
                        {tx.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{tx.description}</td>
                    <td className={cn(
                      "px-6 py-4 font-bold whitespace-nowrap",
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {tx.amount > 0 ? '+' : ''}৳{Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{format(tx.createdAt?.toDate() || new Date(), 'MMM dd, HH:mm')}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
