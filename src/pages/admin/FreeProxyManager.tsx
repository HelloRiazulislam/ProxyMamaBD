import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getFreeProxyCampaign, updateFreeProxyCampaign, getCampaignHistory } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { Zap, Plus, Trash2, ShieldCheck, Clock, Globe, Activity, Save, ToggleLeft, ToggleRight, Calendar, Timer, Users, UserCheck, History as HistoryIcon, RotateCcw, TrendingUp, Gift, ExternalLink, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow, isAfter, isBefore, format, startOfDay, endOfDay } from 'date-fns';

export default function FreeProxyManager() {
  const [campaign, setCampaign] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(24);
  
  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayClaims = claims.filter(c => {
      const claimDate = c.claimedAt?.toDate ? c.claimedAt.toDate() : new Date(c.claimedAt);
      return claimDate >= today;
    }).length;

    return {
      total: claims.length,
      today: todayClaims,
      active: (campaign?.isActive && !isExpired) ? 'ACTIVE' : 'INACTIVE',
      historyCount: history.length
    };
  }, [claims, campaign, history, isExpired]);

  const filteredClaims = useMemo(() => {
    return claims.filter(c => 
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [claims, searchTerm]);
  
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

    const fetchHistory = async () => {
      const data = await getCampaignHistory();
      if (data) setHistory(data);
    };

    fetchCampaign();
    fetchHistory();
  }, []);

  // Listen to claims based on campaign status
  useEffect(() => {
    const isCampaignActive = campaign?.isActive && 
      campaign?.startTime && 
      campaign?.endTime && 
      !isExpired;

    if (!isCampaignActive) {
      setClaims([]);
      return;
    }

    // Convert startTime to Date if it's not already
    const startTime = campaign.startTime instanceof Date 
      ? campaign.startTime 
      : (campaign.startTime?.toDate ? campaign.startTime.toDate() : new Date(campaign.startTime));

    const claimsQuery = query(
      collection(db, 'freeProxyClaims'), 
      where('claimedAt', '>=', startTime),
      orderBy('claimedAt', 'desc'), 
      limit(1000)
    );

    const unsubClaims = onSnapshot(claimsQuery, (snap) => {
      setClaims(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error listening to claims:", error);
    });

    return () => unsubClaims();
  }, [campaign?.isActive, campaign?.startTime, campaign?.endTime, isExpired]);

  // Timer logic
  useEffect(() => {
    if (!campaign?.isActive || !campaign?.endTime) {
      setTimeLeft('');
      setIsExpired(false);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(campaign.endTime);
      const start = campaign.startTime ? new Date(campaign.startTime) : null;

      if (start && isBefore(now, start)) {
        setTimeLeft(`Starts in ${formatDistanceToNow(start)}`);
        setIsExpired(false);
      } else if (isAfter(now, end)) {
        setTimeLeft('Expired');
        setIsExpired(true);
        // Automatically stop campaign when time ends
        if (campaign.isActive) {
           handleUpdateCampaign({ isActive: false });
        }
      } else {
        setTimeLeft(`Expires in ${formatDistanceToNow(end, { addSuffix: false })}`);
        setIsExpired(false);
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
    
    // Refresh history
    const data = await getCampaignHistory();
    if (data) setHistory(data);
  };

  const reuseCampaign = (h: any) => {
    if (!confirm('Reuse these settings for the current campaign?')) return;
    setCampaign({
      ...campaign,
      title: h.title,
      description: h.description,
      proxyType: h.proxyType,
      speed: h.speed,
      host: h.host,
      port: h.port,
      username: h.username,
      password: h.password
    });
    toast.success('Settings loaded from history. Click "Quick Start" or toggle Active to start.');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
            <Gift className="mr-3 text-blue-600" size={32} />
            Campaign Command Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage, monitor, and deploy free proxy gift campaigns.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={cn(
            "px-4 py-2 rounded-2xl border flex items-center space-x-2 font-bold text-sm transition-all",
            campaign?.isActive 
              ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400" 
              : "bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400"
          )}>
            <div className={cn("w-2 h-2 rounded-full", campaign?.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
            <span>{campaign?.isActive ? 'LIVE NOW' : 'OFFLINE'}</span>
          </div>
          <button
            onClick={() => {
              if (campaign?.isActive) {
                handleUpdateCampaign({ isActive: false });
              } else {
                startCampaign(selectedDuration);
              }
            }}
            className={cn(
              "px-6 py-2 rounded-2xl font-bold text-sm transition-all shadow-lg",
              campaign?.isActive 
                ? "bg-red-600 text-white hover:bg-red-700 shadow-red-100 dark:shadow-none" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 dark:shadow-none"
            )}
          >
            {campaign?.isActive ? 'Stop Campaign' : 'Start Campaign'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Users size={24} />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Claims</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl">
              <Zap size={24} />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-600 rounded-lg">TODAY</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.today}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Claims Today</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl">
              <HistoryIcon size={24} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.historyCount}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Past Campaigns</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl">
              <Timer size={24} />
            </div>
          </div>
          <div className="text-lg font-black text-gray-900 dark:text-white truncate">{timeLeft || 'No Active Window'}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time Remaining</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <Activity className="mr-2 text-blue-600" size={20} />
                Campaign Configuration
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Auto-saves on blur</span>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Campaign Identity</label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Campaign Title"
                        value={campaign?.title}
                        onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                        onBlur={() => handleUpdateCampaign({ title: campaign.title })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      />
                      <textarea
                        placeholder="Campaign Description"
                        value={campaign?.description}
                        onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                        onBlur={() => handleUpdateCampaign({ description: campaign.description })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Protocol (Proxy Type)</label>
                      <select
                        value={campaign?.proxyType}
                        onChange={(e) => handleUpdateCampaign({ proxyType: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      >
                        <option value="SOCKS5">SOCKS5</option>
                        <option value="HTTP">HTTP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Speed</label>
                      <select
                        value={campaign?.speed}
                        onChange={(e) => handleUpdateCampaign({ speed: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      >
                        <option value="Uncapped">Uncapped</option>
                        <option value="150Mbps">150 Mbps</option>
                        <option value="100Mbps">100 Mbps</option>
                        <option value="70Mbps">70 Mbps</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Network Credentials</label>
                    <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-900/20 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Host / IP"
                            value={campaign?.host}
                            onChange={(e) => setCampaign({ ...campaign, host: e.target.value })}
                            onBlur={() => handleUpdateCampaign({ host: campaign.host })}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Port"
                            value={campaign?.port}
                            onChange={(e) => setCampaign({ ...campaign, port: parseInt(e.target.value) || 0 })}
                            onBlur={() => handleUpdateCampaign({ port: campaign.port })}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Username"
                          value={campaign?.username}
                          onChange={(e) => setCampaign({ ...campaign, username: e.target.value })}
                          onBlur={() => handleUpdateCampaign({ username: campaign.username })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Password"
                          value={campaign?.password}
                          onChange={(e) => setCampaign({ ...campaign, password: e.target.value })}
                          onBlur={() => handleUpdateCampaign({ password: campaign.password })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Campaign Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 6, 12, 24, 72, 168].map((hours) => (
                        <button
                          key={hours}
                          onClick={() => setSelectedDuration(hours)}
                          className={cn(
                            "py-2.5 border rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter",
                            selectedDuration === hours 
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 dark:shadow-none" 
                              : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 hover:border-blue-300"
                          )}
                        >
                          {hours >= 24 ? `${hours / 24}D` : `${hours}H`}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-bold italic">* Select duration then click "Start Campaign" above.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Claims List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <UserCheck className="mr-2 text-blue-600" size={20} />
                Live Claim Feed
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] text-gray-400 uppercase font-black tracking-widest bg-gray-50/50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4">User Identity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Claimed At</th>
                    <th className="px-6 py-4">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredClaims.length > 0 ? filteredClaims.map((claim) => {
                    const isExpired = isAfter(new Date(), new Date(claim.expiryDate));
                    return (
                      <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">
                              {claim.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{claim.displayName || 'User'}</div>
                              <div className="text-xs text-gray-500">{claim.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                            isExpired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                          )}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {claim.claimedAt?.toDate ? format(claim.claimedAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {claim.expiryDate ? format(new Date(claim.expiryDate), 'MMM dd, HH:mm') : 'N/A'}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <Users size={32} className="mb-2 opacity-20" />
                          <p className="text-sm font-bold">No claims found matching your search.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: History & Maintenance */}
        <div className="space-y-8">
          {/* Campaign History */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <HistoryIcon className="mr-2 text-blue-600" size={20} />
                Deployment History
              </h2>
            </div>
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
              {history.length > 0 ? history.map((h) => (
                <div key={h.id} className="group p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                      {format(h.savedAt, 'MMM dd, yyyy')}
                    </span>
                    <button 
                      onClick={() => reuseCampaign(h)}
                      className="p-2 bg-white dark:bg-slate-800 text-gray-400 hover:text-blue-600 hover:scale-110 rounded-xl border border-gray-100 dark:border-slate-700 transition-all shadow-sm"
                      title="Reuse Settings"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                  <div className="text-sm font-black text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{h.title}</div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 text-gray-500 rounded text-[9px] font-bold border border-gray-100 dark:border-slate-700 uppercase">{h.proxyType}</span>
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 text-gray-500 rounded text-[9px] font-bold border border-gray-100 dark:border-slate-700 uppercase">{h.speed}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 text-[10px] font-mono text-gray-400">
                    {h.host}:{h.port}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <HistoryIcon size={32} className="mx-auto mb-2 opacity-10" />
                  <p className="text-sm text-gray-400 font-bold">No history records yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Section */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20 p-8">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-6 flex items-center">
              <Trash2 className="mr-2" size={20} />
              Danger Zone
            </h2>
            <div className="space-y-4">
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
                className="w-full px-6 py-4 bg-red-600 text-white font-black text-sm rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none uppercase tracking-widest"
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
                className="w-full px-6 py-4 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/30 font-black text-sm rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all uppercase tracking-widest"
              >
                Reset Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
