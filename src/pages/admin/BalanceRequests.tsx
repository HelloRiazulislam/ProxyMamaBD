import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { approveBalanceRequest, rejectBalanceRequest } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { CreditCard, Check, X, Eye, Clock, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function BalanceRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'balanceRequests'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveBalanceRequest(id);
      toast.success('Request approved and balance added!');
    } catch (error: any) {
      toast.error(error.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    setProcessingId(id);
    try {
      await rejectBalanceRequest(id, reason);
      toast.success('Request rejected');
    } catch (error: any) {
      toast.error(error.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => filterStatus === 'all' || req.status === filterStatus);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Requests</h1>
          <p className="text-gray-500 text-sm">Review and process user deposit requests.</p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                filterStatus === status ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">User</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Method</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">TXID</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">Date</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right w-[120px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading requests...</td></tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap">{req.userName || 'User'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">৳{req.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{req.paymentMethod}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{req.transactionId}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{format(req.createdAt?.toDate() || new Date(), 'MMM dd, HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold w-fit",
                          req.status === 'pending' ? "bg-yellow-100 text-yellow-600" :
                          req.status === 'approved' ? "bg-green-100 text-green-600" :
                          "bg-red-100 text-red-600"
                        )}>
                          {req.status.toUpperCase()}
                        </span>
                        {req.status === 'rejected' && req.rejectionReason && (
                          <span className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={req.rejectionReason}>
                            Reason: {req.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleApprove(req.id)}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleReject(req.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
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
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
