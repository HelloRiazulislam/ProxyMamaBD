import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { History, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function WalletHistory() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'walletTransactions'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt : { toDate: () => new Date() }
      })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet History</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">View all your wallet transactions and balance changes.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Balance</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">৳{profile?.walletBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[150px] whitespace-nowrap">Transaction ID</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[100px] whitespace-nowrap">Type</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[200px] whitespace-nowrap">Description</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[100px] whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 border-r border-gray-100 dark:border-slate-800 min-w-[150px] whitespace-nowrap">Date</th>
                <th className="px-6 py-4 min-w-[100px] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading history...</td></tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{tx.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-900 dark:text-white">
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="mr-2 text-green-600 dark:text-green-400" size={16} />
                        ) : (
                          <ArrowDownLeft className="mr-2 text-red-600 dark:text-red-400" size={16} />
                        )}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white whitespace-nowrap">{tx.description}</td>
                    <td className={cn(
                      "px-6 py-4 font-bold whitespace-nowrap",
                      tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {tx.amount > 0 ? '+' : ''}৳{Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{format(tx.createdAt?.toDate() || new Date(), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full text-[10px] font-bold">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
