import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Bell, Send, Trash2, Users, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    uid: '', // Empty for all users
    type: 'announcement'
  });

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'notifications'), {
        ...formData,
        uid: formData.uid || 'all', // 'all' means global
        isRead: false,
        createdAt: serverTimestamp()
      });
      toast.success('Notification sent!');
      setFormData({ title: '', message: '', uid: '', type: 'announcement' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast.success('Notification deleted');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Send className="mr-2 text-blue-600" size={20} /> Send Notification
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target User ID (Optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.uid}
                  onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Leave empty for all users"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Notification Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                placeholder="Enter message content..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Send Notification
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Notification History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading history...</div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="p-6 hover:bg-gray-50 transition-all flex items-start justify-between group">
                  <div className="flex items-start space-x-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      n.uid ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                    )}>
                      {n.uid ? <User size={20} /> : <Users size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-gray-900">{n.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase">
                          {n.uid ? 'Direct' : 'Global'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                      <div className="text-xs text-gray-400">
                        {format(n.createdAt?.toDate() || new Date(), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">No history found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
