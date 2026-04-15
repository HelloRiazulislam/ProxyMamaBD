import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getFreeProxyCampaign, claimFreeProxy } from '../services/dbService';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Gift, Zap, Clock, ShieldCheck, CheckCircle2, AlertCircle, Activity, Timer, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow, isAfter, isBefore, format } from 'date-fns';

export default function FreeProxyClaim() {
  const { profile } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [activeClaim, setActiveClaim] = useState<any>(null);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
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

      // 2. Check for active claim
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

  // Listen to recent claims for FOMO
  useEffect(() => {
    if (!campaign?.isActive || !campaign?.startTime) {
      setRecentClaims([]);
      return;
    }

    const startTime = campaign.startTime instanceof Date 
      ? campaign.startTime 
      : (campaign.startTime?.toDate ? campaign.startTime.toDate() : new Date(campaign.startTime));

    const q = query(
      collection(db, 'freeProxyClaims'),
      where('claimedAt', '>=', startTime),
      orderBy('claimedAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      setRecentClaims(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [campaign?.isActive, campaign?.startTime, isExpired]);

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
          setActiveClaim(null);
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim free proxy');
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !campaign || (!campaign.isActive && !activeClaim)) return null;

  return (
    <div className="space-y-4">
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
              {recentClaims.length > 0 && (
                <div className="inline-flex items-center px-3 py-1 bg-green-400/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-green-300">
                  <Users size={12} className="mr-1.5" />
                  {recentClaims.length} Active Claims
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

      {/* Live Claim Feed for Users */}
      {recentClaims.length > 0 && !isExpired && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Activity size={14} className="mr-2 text-blue-600" />
              Live Claim Feed
            </h3>
            <span className="text-[10px] font-bold text-green-500 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Real-time
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentClaims.map((claim, idx) => (
              <div 
                key={claim.id} 
                className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-right-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {claim.displayName?.[0].toUpperCase() || 'U'}
                </div>
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                  {claim.displayName || 'User'} claimed
                </span>
                <span className="text-[9px] text-gray-400">
                  {claim.claimedAt ? formatDistanceToNow(claim.claimedAt.toDate(), { addSuffix: true }) : 'just now'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
