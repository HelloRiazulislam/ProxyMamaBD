import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Ticket, Plus, Trash2, Calendar, Tag, Users, Clock, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    usageLimit: 100,
    usageType: 'purchase',
    expiryDate: '',
    status: 'active'
  });

  useEffect(() => {
    const q = query(collection(db, 'coupons'));
    const unsub = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        ...formData,
        code: formData.code.toUpperCase(),
        usedCount: 0,
        createdAt: serverTimestamp(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null
      });
      toast.success('Coupon created successfully!');
      setIsModalOpen(false);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        usageLimit: 100,
        usageType: 'purchase',
        expiryDate: '',
        status: 'active'
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Coupon deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete coupon');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'coupons', id), {
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
      toast.success('Coupon status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-500 text-sm">Create and manage discount coupons for users.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2" size={20} /> Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">Code</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">Type</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Discount</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">Min. Purchase</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Usage</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[120px] whitespace-nowrap">Expiry</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right w-[100px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <Ticket className="text-blue-600" size={16} />
                        </div>
                        <span className="font-mono font-bold text-gray-900">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase">
                        {coupon.usageType || 'purchase'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">৳{coupon.minPurchase}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="mr-2 text-gray-400" size={14} />
                        {coupon.usedCount} / {coupon.usageLimit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="mr-2 text-gray-400" size={14} />
                        {coupon.expiryDate ? format(coupon.expiryDate.toDate(), 'MMM dd, yyyy') : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(coupon.id, coupon.status)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          coupon.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {coupon.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No coupons found. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PROXY50"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Usage Type</label>
                <select
                  value={formData.usageType}
                  onChange={e => setFormData({ ...formData, usageType: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="purchase">Proxy Purchase</option>
                  <option value="registration">New Registration Bonus</option>
                  <option value="deposit">Deposit Bonus</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Min. Purchase (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minPurchase}
                    onChange={e => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Plus className="mr-2" size={20} />}
                Create Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
