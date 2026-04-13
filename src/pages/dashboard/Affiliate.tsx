import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { applyReferralCode } from '../../services/dbService';
import { Users, Gift, TrendingUp, Copy, Check, Info, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function Affiliate() {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'referrals'),
      where('referrerUid', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setReferrals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${profile?.uid}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyReferral = async () => {
    if (!profile || !referralInput.trim()) return;
    setApplying(true);
    try {
      await applyReferralCode(profile.uid, referralInput);
      toast.success('Referral code applied successfully!');
      setReferralInput('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply code');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Affiliate Program</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Invite friends and earn 10% commission on their first deposit.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Gift size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Total Earnings</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">৳{(profile?.referralEarnings || 0).toFixed(2)}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Lifetime referral commissions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Total Referrals</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{referrals.length}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">People you have invited</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Conversion Rate</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {referrals.length > 0 
              ? ((referrals.filter(r => r.status === 'completed').length / referrals.length) * 100).toFixed(1)
              : '0.0'}%
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Percentage of active referrals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Your Referral Link</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <code className="text-sm font-mono text-blue-600 dark:text-blue-400 font-bold break-all">
                  {window.location.origin}/register?ref={profile?.uid}
                </code>
                <button 
                  onClick={copyLink}
                  className="ml-4 p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Info size={14} />
                <span>Share this link to invite friends. Your referral code is <strong className="text-gray-900 dark:text-white">{profile?.uid}</strong></span>
              </div>
            </div>
          </div>

          {!profile?.referredBy && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Have a Referral Code?</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleApplyReferral}
                  disabled={applying || !referralInput.trim()}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {applying ? '...' : 'Apply'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                If someone invited you, enter their code here to link your accounts.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Referrals</h3>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
            <table className="w-full text-left relative">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                ) : referrals.length > 0 ? (
                  referrals.map((ref) => (
                    <tr key={ref.id} className="text-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{ref.referredEmail}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{format(ref.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          ref.status === 'completed' ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400"
                        )}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                        {ref.rewardAmount > 0 ? `৳${ref.rewardAmount.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No referrals yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
