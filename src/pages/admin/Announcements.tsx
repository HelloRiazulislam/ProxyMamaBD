import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Megaphone, Plus, X, Trash2, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'danger',
    isActive: true
  });

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      toast.success('Announcement posted!');
      setIsModalOpen(false);
      setFormData({ title: '', content: '', type: 'info', isActive: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'announcements', id), { isActive: !currentStatus });
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.success('Deleted');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm">Manage global notices for your users.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center shadow-lg shadow-blue-100"
        >
          <Plus className="mr-2" size={20} /> New Announcement
        </button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : announcements.length > 0 ? (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  ann.type === 'info' ? "bg-blue-100 text-blue-600" :
                  ann.type === 'warning' ? "bg-orange-100 text-orange-600" :
                  ann.type === 'success' ? "bg-green-100 text-green-600" :
                  "bg-red-100 text-red-600"
                )}>
                  <Megaphone size={24} />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-gray-900">{ann.title}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      ann.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    )}>
                      {ann.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{ann.content}</p>
                  <div className="text-[10px] text-gray-400 font-medium">
                    Posted on {format(ann.createdAt?.toDate() || new Date(), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleStatus(ann.id, ann.isActive)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title={ann.isActive ? 'Deactivate' : 'Activate'}
                >
                  {ann.isActive ? <XCircle size={20} /> : <CheckCircle size={20} />}
                </button>
                <button
                  onClick={() => deleteAnnouncement(ann.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
            No announcements yet.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Announcement</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. System Maintenance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['info', 'warning', 'success', 'danger'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type as any })}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg border transition-all capitalize",
                        formData.type === type 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Write your announcement message here..."
                />
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
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
