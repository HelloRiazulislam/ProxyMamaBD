import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getFreeProxyCampaign, updateFreeProxyCampaign } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { Zap, Plus, Trash2, ShieldCheck, Clock, Globe, Activity, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function FreeProxyManager() {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    const fetchCampaign = async () => {
      const data = await getFreeProxyCampaign();
      if (data) {
        setCampaign(data);
      } else {
        // Initialize if not exists
        const campaignRef = await addDoc(collection(db, 'freeProxyCampaign'), {
          isActive: false,
          title: 'Daily Free Gift',
          description: 'Get 2 hours free proxy trial every day!',
          validity: '2h',
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
          validity: '2h', 
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
  }, []);

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

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Free Proxy Campaign</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage the daily free proxy trial for users.</p>
        </div>
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
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Trial Validity</label>
                <select
                  value={campaign?.validity}
                  onChange={(e) => handleUpdateCampaign({ validity: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="2h">2 Hours</option>
                  <option value="1d">1 Day</option>
                  <option value="3d">3 Days</option>
                  <option value="7d">7 Days</option>
                  <option value="50d">50 Days</option>
                </select>
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
    </div>
  );
}
