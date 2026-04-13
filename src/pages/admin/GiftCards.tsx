import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Gift, Plus, X, Trash2, Copy, Check, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function AdminGiftCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    prefix: 'GIFT-',
    count: 1
  });

  useEffect(() => {
    const q = query(collection(db, 'giftCards'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const generateCode = (prefix: string) => {
    return prefix + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      for (let i = 0; i < formData.count; i++) {
        await addDoc(collection(db, 'giftCards'), {
          code: generateCode(formData.prefix),
          amount,
          isUsed: false,
          createdAt: serverTimestamp()
        });
      }
      toast.success(`${formData.count} Gift Card(s) generated!`);
      setIsModalOpen(false);
      setFormData({ amount: '', prefix: 'GIFT-', count: 1 });
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'giftCards', id));
      toast.success('Deleted');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
          <p className="text-gray-500 text-sm">Generate and manage prepaid gift cards for users.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center shadow-lg shadow-blue-100"
        >
          <Plus className="mr-2" size={20} /> Generate Cards
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Used By</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : cards.length > 0 ? (
                cards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-blue-600 font-bold">{card.code}</code>
                        <button onClick={() => copyCode(card.code, card.id)} className="text-gray-400 hover:text-blue-600">
                          {copiedId === card.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">৳{card.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        card.isUsed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      )}>
                        {card.isUsed ? 'Used' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {card.usedByUid ? <span className="text-xs font-mono">{card.usedByUid.substring(0, 8)}...</span> : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {card.createdAt ? format(card.createdAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteCard(card.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No gift cards found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Generate Gift Cards</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (৳)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code Prefix</label>
                  <input
                    type="text"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    placeholder="GIFT-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  {submitting ? 'Generating...' : 'Generate Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
