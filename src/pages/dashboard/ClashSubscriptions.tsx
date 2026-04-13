import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { getClashSubscriptionPlans, buyClashSubscription, getUserClashSubscriptions } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { Shield, Zap, Clock, Globe, Copy, Check, ExternalLink, Package } from 'lucide-react';
import { motion } from 'motion/react';

export default function ClashSubscriptions() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [plansData, subsData] = await Promise.all([
        getClashSubscriptionPlans(),
        getUserClashSubscriptions(profile.uid)
      ]);
      setPlans(plansData || []);
      setMySubs(subsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (plan: any) => {
    if (!profile) return;
    if (profile.walletBalance < plan.price) {
      toast.error('Insufficient balance. Please add balance first.');
      return;
    }

    setBuying(plan.id);
    try {
      await buyClashSubscription(profile.uid, plan.id);
      toast.success('Subscription purchased successfully!');
      setConfirming(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to purchase subscription');
    } finally {
      setBuying(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const getSubUrl = (token: string) => {
    // Use the Cloud Run URL for subscriptions to avoid Vercel environment variable issues
    const backendUrl = 'https://ais-dev-lvmadlmx5b6cikhqcncuq6-813018954709.asia-southeast1.run.app';
    return `${backendUrl}/sub/${token}`;
  };

  const getImportUrl = (token: string) => {
    const subUrl = getSubUrl(token);
    return `clash://install-config?url=${encodeURIComponent(subUrl)}&name=${encodeURIComponent('ProxyMama')}`;
  };

  const getMetaImportUrl = (token: string) => {
    const subUrl = getSubUrl(token);
    return `clashmeta://install-config?url=${encodeURIComponent(subUrl)}&name=${encodeURIComponent('ProxyMama')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proxy Subscriptions</h1>
          <p className="text-gray-600">Get high-speed proxy configurations for Clash and other apps</p>
        </div>
      </div>

      {/* Available Plans */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="text-yellow-500" size={20} />
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Shield className="text-blue-600" size={24} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">৳{plan.price}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>Validity: {plan.duration} Days</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe size={16} />
                    <span>Proxies: {plan.proxies?.length || 0} Premium Nodes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap size={16} className="text-yellow-500" />
                    <span>High Speed & Low Latency</span>
                  </div>
                </div>
                
                {confirming === plan.id ? (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-gray-500 font-medium">Confirm purchase?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBuy(plan)}
                        disabled={buying === plan.id}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {buying === plan.id ? '...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming(plan.id)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium">No active subscription plans available.</p>
            </div>
          )}
        </div>
      </section>

      {/* My Subscriptions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="text-blue-600" size={20} />
          My Subscriptions
        </h2>
        <div className="space-y-4">
          {mySubs.map((sub) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{sub.planName}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Expires: {new Date(sub.expiryDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex-1 max-w-md">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Subscription URL</label>
                  <div className="space-y-3">
                    <div className="relative group">
                      <input
                        type="text"
                        readOnly
                        value={getSubUrl(sub.token)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href={getImportUrl(sub.token)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                      >
                        <Zap size={16} />
                        Import to Clash
                      </a>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(getSubUrl(sub.token));
                            const text = await response.text();
                            const blob = new Blob([text], { type: 'text/yaml' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `ProxyMama_${sub.planName.replace(/\s+/g, '_')}.yaml`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            toast.success('Config file downloaded!');
                          } catch (error) {
                            toast.error('Failed to download config');
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                      >
                        <Package size={16} />
                        Download .yaml
                      </button>
                      <a
                        href={getMetaImportUrl(sub.token)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
                      >
                        <Zap size={16} />
                        Import to Meta
                      </a>
                      <button
                        onClick={() => copyToClipboard(getSubUrl(sub.token), sub.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                      >
                        {copied === sub.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        Copy URL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {mySubs.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-500">You don't have any active subscriptions yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
