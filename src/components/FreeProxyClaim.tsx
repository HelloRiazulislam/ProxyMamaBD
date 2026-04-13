import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getFreeProxyCampaign, claimFreeProxy } from '../services/dbService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Gift, Zap, Clock, ShieldCheck, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FreeProxyClaim() {
  const { profile } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const checkClaimStatus = async () => {
      if (!profile) return;
      
      try {
        // 1. Get Campaign
        const campaignData = await getFreeProxyCampaign();
        setCampaign(campaignData);

        // 2. Check if already claimed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const q = query(
          collection(db, 'freeProxyClaims'),
          where('uid', '==', profile.uid),
          where('claimedAt', '>=', today)
        );
        const snap = await getDocs(q);
        setHasClaimedToday(!snap.empty);
      } catch (error) {
        console.error('Error checking free proxy status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkClaimStatus();
  }, [profile]);

  const handleClaim = async () => {
    if (!profile) return;
    setClaiming(true);
    try {
      await claimFreeProxy(profile.uid);
      setHasClaimedToday(true);
      toast.success('Free proxy claimed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim free proxy');
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !campaign || !campaign.isActive) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none overflow-hidden relative group">
      {/* Decorative Elements */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
            <Zap size={12} className="mr-1.5 fill-current" />
            Daily Free Gift
          </div>
          <h2 className="text-3xl font-black tracking-tight">{campaign.title || 'Claim Your Free Proxy!'}</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            {campaign.description || `Get a ${campaign.validity} free trial of our high-speed ${campaign.proxyType} proxies. No balance required!`}
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <Clock size={16} className="text-blue-200" />
              <span className="text-xs font-bold">{campaign.validity} Validity</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <Activity size={16} className="text-blue-200" />
              <span className="text-xs font-bold">{campaign.speed} Speed</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <ShieldCheck size={16} className="text-blue-200" />
              <span className="text-xs font-bold">{campaign.proxyType} Type</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {hasClaimedToday ? (
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[240px]">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
              <p className="font-bold text-lg">Already Claimed!</p>
              <p className="text-xs text-blue-200 mt-1">Come back tomorrow for more.</p>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[240px]"
            >
              {claiming ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  <span>Activating...</span>
                </div>
              ) : (
                <><Gift className="mr-3" size={24} /> Activate Now</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
