import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Store, Check, X, Clock, Search, Users, Shield, ShieldOff, Trash2, Percent, Save, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { logActivity } from '../../services/activityService';
import { useAuth } from '../../App';
import { updateResellerStatus, updateResellerDiscount, removeResellerStatus } from '../../services/dbService';
import { cn } from '../../lib/utils';

export default function AdminResellerPanel() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'resellers'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [resellers, setResellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Discount Modal State
  const [selectedReseller, setSelectedReseller] = useState<any>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    let unsub: () => void;

    if (activeTab === 'requests') {
      const q = query(collection(db, 'resellerRequests'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(q, (snap) => {
        setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
    } else {
      const q = query(collection(db, 'users'), where('isReseller', '==', true));
      unsub = onSnapshot(q, (snap) => {
        setResellers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
    }

    return () => unsub?.();
  }, [activeTab]);

  const handleRequestAction = async (requestId: string, uid: string, userEmail: string, action: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    try {
      await updateDoc(doc(db, 'resellerRequests', requestId), {
        status: action,
        updatedAt: new Date()
      });

      if (action === 'approved') {
        await updateDoc(doc(db, 'users', uid), {
          isReseller: true,
          resellerStatus: 'active',
          resellerDiscount: 0
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

  const handleStatusUpdate = async (uid: string, status: 'active' | 'suspended' | 'on-hold') => {
    try {
      await updateResellerStatus(uid, status);
      toast.success(`Reseller status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleRemoveReseller = async (uid: string) => {
    if (!confirm('Are you sure you want to remove reseller status from this user?')) return;
    try {
      await removeResellerStatus(uid);
      toast.success('Reseller status removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove reseller');
    }
  };

  const handleUpdateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReseller) return;
    setIsSubmitting(true);
    try {
      await updateResellerDiscount(selectedReseller.uid, discountValue);
      toast.success('Discount updated successfully');
      setIsDiscountModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = activeTab === 'requests' 
    ? requests.filter(req => 
        req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.uid?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : resellers.filter(res => 
        res.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reseller Panel</h1>
          <p className="text-gray-500 text-sm">Manage reseller applications and approved partners.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center",
              activeTab === 'requests' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Clock size={16} className="mr-2" /> Requests
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resellers')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center",
              activeTab === 'resellers' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Users size={16} className="mr-2" /> Approved Resellers
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'requests' ? "Search by email or UID..." : "Search by name or email..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'requests' ? (
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
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading requests...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {req.createdAt?.toDate() ? format(req.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{req.userEmail}</div>
                        <div className="text-xs text-gray-500 font-mono">{req.uid}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-gray-600" title={req.note}>{req.note || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        )}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRequestAction(req.id, req.uid, req.userEmail, 'approved')}
                              disabled={processingId === req.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRequestAction(req.id, req.uid, req.userEmail, 'rejected')}
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
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No requests found</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Reseller</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Wallet</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading resellers...</td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{res.displayName}</div>
                        <div className="text-xs text-gray-500">{res.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          res.resellerStatus === 'active' ? 'bg-green-100 text-green-700' :
                          res.resellerStatus === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        )}>
                          {res.resellerStatus || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center font-bold text-blue-600">
                          <Percent size={14} className="mr-1" /> {res.resellerDiscount || 0}%
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">৳{res.walletBalance?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedReseller(res); setDiscountValue(res.resellerDiscount || 0); setIsDiscountModalOpen(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Set Discount"
                          >
                            <Percent size={18} />
                          </button>
                          {res.resellerStatus === 'suspended' ? (
                            <button
                              onClick={() => handleStatusUpdate(res.uid, 'active')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Reactivate"
                            >
                              <Shield size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(res.uid, 'suspended')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Suspend"
                            >
                              <ShieldOff size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusUpdate(res.uid, 'on-hold')}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Hold"
                          >
                            <Clock size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveReseller(res.uid)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Reseller Status"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No approved resellers found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Discount Modal */}
      {isDiscountModalOpen && selectedReseller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Set Reseller Discount</h2>
              <button onClick={() => setIsDiscountModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateDiscount} className="p-6 space-y-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-2xl mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 font-bold text-blue-600">
                  {selectedReseller.displayName[0]}
                </div>
                <div>
                  <div className="font-bold text-blue-900">{selectedReseller.displayName}</div>
                  <div className="text-xs text-blue-600">{selectedReseller.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Discount Percentage (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">This discount will be applied to all proxy purchases for this reseller.</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                Save Discount
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
