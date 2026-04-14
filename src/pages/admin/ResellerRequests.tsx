import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Store, Check, X, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { logActivity } from '../../services/activityService';
import { useAuth } from '../../App';

export default function AdminResellerRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'resellerRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (requestId: string, uid: string, userEmail: string, action: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    try {
      // Update request status
      await updateDoc(doc(db, 'resellerRequests', requestId), {
        status: action,
        updatedAt: new Date()
      });

      // If approved, update user profile
      if (action === 'approved') {
        await updateDoc(doc(db, 'users', uid), {
          isReseller: true
        });
      }

      if (profile) {
        await logActivity(
          'Reseller Request',
          `${action === 'approved' ? 'Approved' : 'Rejected'} reseller request for ${userEmail}`,
          profile
        );
      }

      toast.success(`Request ${action} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reseller Requests</h1>
          <p className="text-gray-500 text-sm">Manage user applications for reseller status.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading requests...</td>
                </tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {req.createdAt?.toDate() ? format(req.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{req.userEmail}</div>
                      <div className="text-xs text-gray-500 font-mono">{req.uid}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-gray-600" title={req.note}>
                        {req.note || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, req.uid, req.userEmail, 'approved')}
                            disabled={processingId === req.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleAction(req.id, req.uid, req.userEmail, 'rejected')}
                            disabled={processingId === req.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
