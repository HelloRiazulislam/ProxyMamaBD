import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { getFreeProxyCampaign, claimFreeProxy } from '../services/dbService';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Gift, Zap, Clock, ShieldCheck, CheckCircle2, AlertCircle, Activity, Timer } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow, isAfter, isBefore } from 'date-fns';

export default function FreeProxyClaim() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [activeClaim, setActiveClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [campaignTimeLeft, setCampaignTimeLeft] = useState<string>('');
  const [claimTimeLeft, setClaimTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  const checkClaimStatus = async () => {
    if (!profile) return;
    
    try {
      // 1. Get Campaign
      const campaignData = await getFreeProxyCampaign();
      setCampaign(campaignData);

      // 2. Check for active claim (not just today, but any that hasn't expired)
      const now = new Date().toISOString();
      const q = query(
        collection(db, 'freeProxyClaims'),
        where('uid', '==', profile.uid),
        where('expiryDate', '>', now),
        orderBy('expiryDate', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setActiveClaim({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setActiveClaim(null);
      }
    } catch (error) {
      console.error('Error checking free proxy status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkClaimStatus();
  }, [profile]);

  // Timers logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      // Campaign Timer
      if (campaign?.isActive && campaign?.endTime) {
        const end = new Date(campaign.endTime);
        const start = campaign.startTime ? new Date(campaign.startTime) : null;

        if (start && isBefore(now, start)) {
          setCampaignTimeLeft(`Starts in ${formatDistanceToNow(start)}`);
          setIsExpired(false);
        } else if (isAfter(now, end)) {
          setCampaignTimeLeft('Campaign Expired');
          setIsExpired(true);
        } else {
          setCampaignTimeLeft(`Ends in ${formatDistanceToNow(end, { addSuffix: false })}`);
          setIsExpired(false);
        }
      } else {
        setCampaignTimeLeft('');
        setIsExpired(false);
      }

      // Claim Timer
      if (activeClaim?.expiryDate) {
        const end = new Date(activeClaim.expiryDate);
        if (isAfter(now, end)) {
          setClaimTimeLeft('Expired');
          setActiveClaim(null); // Clear active claim if expired
        } else {
          setClaimTimeLeft(formatDistanceToNow(end, { addSuffix: false }));
        }
      } else {
        setClaimTimeLeft('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [campaign, activeClaim]);

  const handleClaim = async () => {
    if (!profile) return;
    setClaiming(true);
    try {
      await claimFreeProxy(profile.uid);
      await checkClaimStatus();
      toast.success('Free proxy claimed successfully!');
      navigate('/dashboard/my-proxies');
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim free proxy');
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !campaign || (!campaign.isActive && !activeClaim)) return null;

  if (activeClaim) {
    return (
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Free Proxy Active</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-blue-700 dark:text-blue-400 font-medium flex items-center">
            <Timer size={12} className="mr-1" /> {claimTimeLeft}
          </span>
          <span className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-bold shadow-sm">
            {campaign.speed}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none overflow-hidden relative group">
      {/* Decorative Elements */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            {campaignTimeLeft && (
              <div className="inline-flex items-center px-3 py-1 bg-blue-400/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                <Timer size={12} className="mr-1.5" />
                {campaignTimeLeft}
              </div>
            )}
          </div>
          <h2 className="text-3xl font-black tracking-tight">{campaign.title || 'Claim Your Free Proxy!'}</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            {campaign.description}
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <Activity size={16} className="text-blue-200" />
              <span className="text-xs font-bold">{campaign.speed} Speed</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <ShieldCheck size={16} className="text-blue-200" />
              <span className="text-xs font-bold">{campaign.proxyType} Type</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <Timer size={16} className="text-blue-200" />
              <span className="text-xs font-bold">Expires with Campaign</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {activeClaim ? (
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[240px]">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
              <p className="font-bold text-lg">Proxy Active!</p>
              <div className="flex flex-col items-center mt-2">
                <span className="text-[10px] text-blue-200 uppercase font-black tracking-widest mb-1">Remaining Time</span>
                <div className="flex items-center text-white font-black text-xl">
                  <Timer size={20} className="mr-2 text-blue-300" />
                  {claimTimeLeft}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming || isExpired || !campaign.isActive}
              className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[240px]"
            >
              {claiming ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  <span>Activating...</span>
                </div>
              ) : isExpired ? (
                <><AlertCircle className="mr-3" size={24} /> Expired</>
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
