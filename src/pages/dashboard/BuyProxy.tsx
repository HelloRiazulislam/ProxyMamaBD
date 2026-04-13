import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Zap, Globe, Clock, ShieldCheck, Tag, TrendingDown, Check, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../../services/activityService';

const PROXY_TYPES = [
  { id: 'SOCKS5', label: 'SOCKS5', icon: ShieldCheck },
  { id: 'HTTP', label: 'HTTP', icon: Globe },
  { id: 'L2TP', label: 'L2TP', icon: Zap },
  { id: 'PPTP', label: 'PPTP', icon: Zap },
  { id: 'Wireguard', label: 'Wireguard', icon: ShieldCheck },
  { id: 'OpenVPN', label: 'OpenVPN', icon: ShieldCheck },
];

const SPEEDS = [
  { id: '50mbps', label: '50 Mbps', basePrice: 80 },
  { id: '100mbps', label: '100 Mbps', basePrice: 130 },
  { id: '150mbps', label: '150 Mbps', basePrice: 170 },
];

const DURATIONS = [
  { id: '15days', label: '15 Days', days: 15, multiplier: 0.55, discount: 0 },
  { id: '30days', label: '30 Days', days: 30, multiplier: 1, discount: 0 },
  { id: '2months', label: '2 Months', days: 60, multiplier: 2, discount: 10 },
  { id: '6months', label: '6 Months', days: 180, multiplier: 6, discount: 20 },
];

export default function BuyProxy() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(PROXY_TYPES[0]);
  const [selectedSpeed, setSelectedSpeed] = useState(SPEEDS[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]);
  const [loading, setLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);

  // Calculate prices
  const baseTotal = selectedSpeed.basePrice * selectedDuration.multiplier;
  const discountAmount = (baseTotal * selectedDuration.discount) / 100;
  const finalPrice = Math.round(baseTotal - discountAmount);
  const savings = Math.round(discountAmount);

  useEffect(() => {
    fetchAvailableCount();
  }, [selectedSpeed, selectedType]);

  const fetchAvailableCount = async () => {
    try {
      const q = query(
        collection(db, 'proxyInventory'),
        where('isAssigned', '==', false),
        where('speed', '==', selectedSpeed.id),
        where('type', '==', selectedType.id)
      );
      const snap = await getDocs(q);
      setAvailableCount(snap.size);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handlePurchase = async () => {
    if (!profile) return;
    if (profile.walletBalance < finalPrice) {
      toast.error('Insufficient balance. Please add balance first.');
      navigate('/dashboard/add-balance');
      return;
    }

    setLoading(true);
    try {
      // 1. Get an available proxy with matching speed and type
      const q = query(
        collection(db, 'proxyInventory'),
        where('isAssigned', '==', false),
        where('speed', '==', selectedSpeed.id),
        where('type', '==', selectedType.id)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        throw new Error(`No ${selectedType.label} ${selectedSpeed.label} proxies available at the moment.`);
      }
      
      const proxyDoc = snap.docs[0];

      // 2. Update proxy inventory
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + selectedDuration.days);

      await updateDoc(proxyDoc.ref, {
        isAssigned: true,
        assignedToUid: profile.uid,
        assignedToEmail: profile.email,
        assignedAt: serverTimestamp(),
        expiryDate: expiryDate.toISOString(),
        planTitle: `${selectedType.label} - ${selectedSpeed.label} - ${selectedDuration.label}`,
        autoRenew: false
      });

      // 3. Deduct balance
      await updateDoc(doc(db, 'users', profile.uid), {
        walletBalance: increment(-finalPrice)
      });

      // 4. Create order record
      await addDoc(collection(db, 'orders'), {
        uid: profile.uid,
        userEmail: profile.email,
        proxyId: proxyDoc.id,
        planTitle: `${selectedType.label} - ${selectedSpeed.label} - ${selectedDuration.label}`,
        amount: finalPrice,
        status: 'completed',
        createdAt: serverTimestamp()
      });

      // 5. Log activity
      await logActivity(
        'Proxy Purchase',
        `Purchased ${selectedType.label} ${selectedSpeed.label} for ${selectedDuration.label} (৳${finalPrice})`,
        profile
      );

      toast.success('Proxy purchased successfully!');
      navigate('/dashboard/my-proxies');
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customize Your Proxy</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Select your preferred speed and duration.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl">
          <Globe size={16} />
          <span>{availableCount} Proxies Available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Customizer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proxy Type Selection */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-500" />
              1. Select Proxy Type
            </h2>
            
            {/* Mobile Dropdown */}
            <div className="block md:hidden">
              <select
                value={selectedType.id}
                onChange={(e) => setSelectedType(PROXY_TYPES.find(t => t.id === e.target.value) || PROXY_TYPES[0])}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold"
              >
                {PROXY_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PROXY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3",
                    selectedType.id === type.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    selectedType.id === type.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                  )}>
                    <type.icon size={20} />
                  </div>
                  <div className={cn(
                    "font-bold text-sm",
                    selectedType.id === type.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                  )}>
                    {type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Speed Selection */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={16} className="text-yellow-500" />
              2. Select Speed
            </h2>

            {/* Mobile Dropdown */}
            <div className="block md:hidden">
              <select
                value={selectedSpeed.id}
                onChange={(e) => setSelectedSpeed(SPEEDS.find(s => s.id === e.target.value) || SPEEDS[0])}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold"
              >
                {SPEEDS.map((speed) => (
                  <option key={speed.id} value={speed.id}>{speed.label} - ৳{speed.basePrice}/month</option>
                ))}
              </select>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SPEEDS.map((speed) => (
                <button
                  key={speed.id}
                  onClick={() => setSelectedSpeed(speed)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    selectedSpeed.id === speed.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
                  )}
                >
                  <div className={cn(
                    "font-bold text-lg",
                    selectedSpeed.id === speed.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                  )}>
                    {speed.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">৳{speed.basePrice}/month</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              3. Select Duration
            </h2>

            {/* Mobile Dropdown */}
            <div className="block md:hidden">
              <select
                value={selectedDuration.id}
                onChange={(e) => setSelectedDuration(DURATIONS.find(d => d.id === e.target.value) || DURATIONS[1])}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold"
              >
                {DURATIONS.map((duration) => (
                  <option key={duration.id} value={duration.id}>
                    {duration.label} {duration.discount > 0 ? `(-${duration.discount}%)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-4 gap-4">
              {DURATIONS.map((duration) => (
                <button
                  key={duration.id}
                  onClick={() => setSelectedDuration(duration)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center relative",
                    selectedDuration.id === duration.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
                  )}
                >
                  {duration.discount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      -{duration.discount}%
                    </span>
                  )}
                  <div className={cn(
                    "font-bold text-sm",
                    selectedDuration.id === duration.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                  )}>
                    {duration.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Included Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'High Speed Connection',
                'Unlimited Bandwidth',
                'SOCKS5 & HTTP Support',
                'Instant Delivery',
                '24/7 Support Access',
                'Private IP Address'
              ].map((feature, i) => (
                <div key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Check size={16} className="text-green-500 mr-2" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Proxy Type</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedType.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Selected Speed</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedSpeed.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan Duration</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedDuration.label}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">৳{baseTotal}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between items-center text-green-600 mt-1">
                    <span className="text-xs flex items-center gap-1 font-bold">
                      <Tag size={12} /> Discount ({selectedDuration.discount}%)
                    </span>
                    <span className="text-sm font-bold">-৳{savings}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl mb-8">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Total Amount</div>
              <div className="text-3xl font-black text-blue-700 dark:text-blue-300">৳{finalPrice}</div>
              {savings > 0 && (
                <div className="mt-2 flex items-center gap-1 text-green-600 text-xs font-bold">
                  <TrendingDown size={14} />
                  You saved ৳{savings}!
                </div>
              )}
            </div>

            <button
              onClick={handlePurchase}
              disabled={loading || availableCount === 0 || profile.walletBalance < finalPrice}
              className={cn(
                "w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2",
                loading || availableCount === 0 || profile.walletBalance < finalPrice
                  ? "bg-gray-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : availableCount === 0 ? (
                <>
                  <AlertTriangle size={20} />
                  No Stock Available
                </>
              ) : profile.walletBalance < finalPrice ? (
                <>
                  <AlertTriangle size={20} />
                  Insufficient Balance
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Confirm Purchase
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
