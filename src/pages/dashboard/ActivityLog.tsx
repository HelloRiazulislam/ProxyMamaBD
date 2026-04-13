import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../App';
import { format } from 'date-fns';
import { Activity, Clock, Info, AlertCircle } from 'lucide-react';

export default function UserActivityLog() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'activityLogs'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Activity logs error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">View your recent account activities and transactions.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-sm text-left relative">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400 dark:text-slate-600">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-red-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={24} />
                      <span>Error: {error}</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                        <span>{log.createdAt?.toDate() ? format(log.createdAt.toDate(), 'MMM dd, HH:mm:ss') : 'Just now'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        log.action.includes('delete') || log.action.includes('ban') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                        log.action.includes('buy') || log.action.includes('add') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <div className="max-w-md break-words">
                        {log.details}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400 dark:text-gray-600">No activity logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
