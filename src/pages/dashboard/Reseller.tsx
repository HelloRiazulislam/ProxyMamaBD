import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Store, CheckCircle, Clock, XCircle, AlertTriangle, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { logActivity } from '../../services/activityService';

export default function Reseller() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'resellerRequests'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    if (!note.trim()) {
      toast.error('Please provide a note explaining how you plan to use/sell the proxies.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'resellerRequests'), {
        uid: profile.uid,
        userEmail: profile.email,
        note,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      await logActivity('Reseller Request', 'Submitted a reseller application', profile);
      toast.success('Reseller request submitted successfully!');
      setNote('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingRequest = requests.some(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reseller Program</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Become a reseller and get exclusive discounts on bulk proxy purchases.</p>
      </div>

      {profile?.isReseller ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Store size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">You are a Reseller!</h2>
                <p className="text-blue-100">Enjoy exclusive wholesale pricing.</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="font-bold mb-2">Reseller Benefits:</h3>
              <ul className="space-y-2 text-sm text-blue-50">
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /> Automatic discount on all proxy purchases.</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /> Bulk purchase option enabled.</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /> Export proxies in TXT format.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Why become a Reseller?</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Wholesale Pricing</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Get significant discounts on all proxy plans.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Bulk Purchasing</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Buy up to 50 proxies at once with a single click.</p>
                  </div>
                </div>
              </div>
            </div>

            {hasPendingRequest ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-800/30">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="text-yellow-600 dark:text-yellow-500" size={24} />
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-500">Application Pending</h3>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400/80">
                  Your reseller application is currently under review by our team. We will notify you once it's approved.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Apply for Reseller</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      How do you plan to use/sell the proxies? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      placeholder="Tell us about your use case..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Application
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Application History</h2>
            <div className="space-y-3">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold uppercase",
                        req.status === 'approved' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        req.status === 'rejected' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}>
                        {req.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {req.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    {req.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">"{req.note}"</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No previous applications found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
