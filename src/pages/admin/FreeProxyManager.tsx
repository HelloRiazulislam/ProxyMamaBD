import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getFreeProxyCampaign, updateFreeProxyCampaign } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { Zap, Plus, Trash2, ShieldCheck, Clock, Globe, Activity, Save, ToggleLeft, ToggleRight, Calendar, Timer, Users, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow, isAfter, isBefore, format } from 'date-fns';

export default function FreeProxyManager() {
  const [campaign, setCampaign] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  useEffect(() => {
    const fetchCampaign = async () => {
      const data = await getFreeProxyCampaign();
      if (data) {
        setCampaign(data);
      } else {
        // Initialize if not exists
        const campaignRef = await addDoc(collection(db, 'freeProxyCampaign'), {
          isActive: false,
          title: 'Free Proxy Trial',
          description: 'Claim your high-speed proxy trial for the duration of this campaign.',
          speed: 'Uncapped',
          proxyType: 'SOCKS5',
          host: '',
          port: 0,
          username: '',
          password: '',
          updatedAt: serverTimestamp()
        });
        setCampaign({ 
          id: campaignRef.id, 
          isActive: false, 
          speed: 'Uncapped', 
          proxyType: 'SOCKS5',
          host: '',
          port: 0,
          username: '',
          password: ''
        });
      }
      setLoading(false);
    };

    fetchCampaign();

    // Listen to claims
    const claimsQuery = query(collection(db, 'freeProxyClaims'), orderBy('claimedAt', 'desc'), limit(50));
    const unsubClaims = onSnapshot(claimsQuery, (snap) => {
      setClaims(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubClaims();
  }, []);

  // Timer logic
  useEffect(() => {
    if (!campaign?.isActive || !campaign?.endTime) {
      setTimeLeft('');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(campaign.endTime);
      const start = campaign.startTime ? new Date(campaign.startTime) : null;

      if (start && isBefore(now, start)) {
        setTimeLeft(`Starts in ${formatDistanceToNow(start)}`);
      } else if (isAfter(now, end)) {
        setTimeLeft('Expired');
        // Auto deactivate if expired? Maybe just show expired
      } else {
        setTimeLeft(`Expires in ${formatDistanceToNow(end, { addSuffix: false })}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [campaign]);

  const handleUpdateCampaign = async (updates: any) => {
    if (!campaign) return;
    setSaving(true);
    try {
      await updateFreeProxyCampaign(campaign.id, updates);
      setCampaign({ ...campaign, ...updates });
      toast.success('Campaign settings updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const startCampaign = async (durationHours: number) => {
    const startTime = new Date();
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + durationHours);

    await handleUpdateCampaign({
      isActive: true,
      startTime,
      endTime
    });
  };

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Free Proxy Campaign</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage the daily free proxy trial for users.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-900/30 flex items-center font-bold text-sm">
            <UserCheck size={16} className="mr-2" />
            {claims.length} Claims
          </div>
          {timeLeft && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center font-bold text-sm">
              <Timer size={16} className="mr-2" />
              {timeLeft}
            </div>
          )}
          {campaign && (
            <button
              onClick={() => handleUpdateCampaign({ isActive: !campaign.isActive })}
              disabled={saving}
              className={cn(
                "flex items-center px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg",
                campaign.isActive 
                  ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-green-100" 
                  : "bg-red-100 text-red-700 hover:bg-red-200 shadow-red-100"
              )}
            >
              {campaign.isActive ? <ToggleRight className="mr-2" /> : <ToggleLeft className="mr-2" />}
              Campaign {campaign.isActive ? 'Active' : 'Inactive'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Settings */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Zap className="mr-2 text-blue-600" size={20} />
              Campaign Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Campaign Title</label>
                <input
                  type="text"
                  value={campaign?.title}
                  onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                  onBlur={() => handleUpdateCampaign({ title: campaign.title })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Campaign Description</label>
                <textarea
                  value={campaign?.description}
                  onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                  onBlur={() => handleUpdateCampaign({ description: campaign.description })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Proxy Type</label>
                  <input
                    type="text"
                    value={campaign?.proxyType}
                    onChange={(e) => setCampaign({ ...campaign, proxyType: e.target.value })}
                    onBlur={() => handleUpdateCampaign({ proxyType: campaign.proxyType })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. SOCKS5 / HTTP"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Speed Limit</label>
                  <select
                    value={campaign?.speed}
                    onChange={(e) => handleUpdateCampaign({ speed: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Uncapped">Uncapped</option>
                    <option value="150Mbps">150 Mbps</option>
                    <option value="100Mbps">100 Mbps</option>
                    <option value="70Mbps">70 Mbps</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Quick Start Campaign</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 6, 12, 24, 72, 168].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => startCampaign(hours)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all flex items-center justify-center"
                    >
                      <Calendar size={14} className="mr-2" />
                      {hours >= 24 ? `${hours / 24} Day${hours > 24 ? 's' : ''}` : `${hours} Hours`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Section */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 p-6">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center">
              <Trash2 className="mr-2" size={20} />
              System Maintenance
            </h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete ALL previous orders? This cannot be undone.')) {
                    try {
                      const { clearAllOrders } = await import('../../services/dbService');
                      await clearAllOrders();
                      toast.success('All orders cleared successfully');
                    } catch (e) {
                      toast.error('Failed to clear orders');
                    }
                  }
                }}
                className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center"
              >
                Clear All Orders
              </button>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to clear all proxy assignments?')) {
                    try {
                      const { clearAllProxyAssignments } = await import('../../services/dbService');
                      await clearAllProxyAssignments();
                      toast.success('All proxy assignments cleared');
                    } catch (e) {
                      toast.error('Failed to clear assignments');
                    }
                  }
                }}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/30 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center"
              >
                Clear Proxy Assignments
              </button>
            </div>
          </div>
        </div>

        {/* Proxy Credentials */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <ShieldCheck className="mr-2 text-blue-600" size={20} />
              Proxy Credentials (Shared)
            </h2>
            <p className="text-xs text-gray-500 mb-6">This proxy will be shared among all users who claim the free gift.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Host / IP</label>
                  <input
                    type="text"
                    value={campaign?.host}
                    onChange={(e) => setCampaign({ ...campaign, host: e.target.value })}
                    onBlur={() => handleUpdateCampaign({ host: campaign.host })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Port</label>
                  <input
                    type="number"
                    value={campaign?.port}
                    onChange={(e) => setCampaign({ ...campaign, port: parseInt(e.target.value) || 0 })}
                    onBlur={() => handleUpdateCampaign({ port: campaign.port })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Username</label>
                  <input
                    type="text"
                    value={campaign?.username}
                    onChange={(e) => setCampaign({ ...campaign, username: e.target.value })}
                    onBlur={() => handleUpdateCampaign({ username: campaign.username })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Password</label>
                  <input
                    type="text"
                    value={campaign?.password}
                    onChange={(e) => setCampaign({ ...campaign, password: e.target.value })}
                    onBlur={() => handleUpdateCampaign({ password: campaign.password })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
                  <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                    <strong>Warning:</strong> Changing these credentials will only affect new claims. Users who have already claimed will keep using the previous credentials until their trial expires.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Users className="mr-2 text-blue-600" size={20} />
          Recent Claims ({claims.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-400 uppercase font-bold border-b border-gray-50 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Claimed At</th>
                <th className="px-4 py-3">Expires At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {claims.length > 0 ? claims.map((claim) => (
                <tr key={claim.id} className="text-sm">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{claim.displayName}</td>
                  <td className="px-4 py-3 text-gray-500">{claim.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {claim.claimedAt?.toDate ? format(claim.claimedAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {claim.expiresAt?.toDate ? format(claim.expiresAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No claims yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
