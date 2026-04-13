import { useState } from 'react';
import { useAuth, useSettings } from '../../App';
import { submitBalanceRequest, redeemGiftCard } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { Wallet, CreditCard, Upload, Info, Gift, Check, Copy, ChevronRight, Smartphone, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import FileUpload from '../../components/ui/FileUpload';
import { logActivity } from '../../services/activityService';

export default function AddBalance() {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'manual' | 'gift'>('manual');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [txId, setTxId] = useState('');
  const [coupon, setCoupon] = useState('');
  const [note, setNote] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const minAmount = settings?.minDepositAmount || 10;
    if (parseFloat(amount) < minAmount) {
      toast.error(`Minimum deposit amount is ৳${minAmount}`);
      return;
    }
    
    setLoading(true);
    try {
      await submitBalanceRequest({
        uid: profile.uid,
        amount: parseFloat(amount),
        paymentMethod: method,
        transactionId: txId,
        couponCode: coupon,
        note,
        screenshotUrl: screenshots[0] || '' // Use the first screenshot for now
      });
      await logActivity('Deposit Request', `Submitted ৳${amount} deposit request via ${method}`, profile);
      toast.success('Balance request submitted successfully!');
      setAmount('');
      setTxId('');
      setCoupon('');
      setNote('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !giftCode.trim()) return;

    setLoading(true);
    try {
      const redeemedAmount = await redeemGiftCard(profile.uid, giftCode);
      await logActivity('Gift Card Redeem', `Redeemed gift card: ${giftCode} (৳${redeemedAmount})`, profile);
      toast.success(`৳${redeemedAmount.toFixed(2)} added to your wallet!`);
      setGiftCode('');
    } catch (error: any) {
      toast.error(error.message || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const paymentMethods = settings?.paymentMethods || {};
  
  const getMethodInstructions = () => {
    if (!paymentMethods) return '';
    
    const m = method.toLowerCase();
    if (m.includes('bkash')) return paymentMethods.bkashInstructions || paymentMethods.generalInstructions || '';
    if (m.includes('nagad')) return paymentMethods.nagadInstructions || paymentMethods.generalInstructions || '';
    if (m.includes('rocket')) return paymentMethods.rocketInstructions || paymentMethods.generalInstructions || '';
    
    return paymentMethods.generalInstructions || '';
  };

  const getMethodNumber = () => {
    if (!paymentMethods) return '';
    
    const m = method.toLowerCase();
    if (m.includes('bkash')) return paymentMethods.bkash;
    if (m.includes('nagad')) return paymentMethods.nagad;
    if (m.includes('rocket')) return paymentMethods.rocket;
    
    return '';
  };

  const instructions = getMethodInstructions() || '';
  const activeNumber = getMethodNumber() || '';
  const steps = typeof instructions === 'string' ? instructions.split('\n').filter(s => s.trim()) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Add Balance</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Top up your wallet to purchase proxies instantly.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Balance</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">৳{profile?.walletBalance}</p>
          </div>
        </div>
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              "px-6 py-2.5 text-sm font-bold rounded-xl transition-all",
              activeTab === 'manual' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            Manual Deposit
          </button>
          <button
            onClick={() => setActiveTab('gift')}
            className={cn(
              "px-6 py-2.5 text-sm font-bold rounded-xl transition-all",
              activeTab === 'gift' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            Gift Card
          </button>
        </div>
      </div>

      {activeTab === 'manual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Instructions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 bg-blue-600 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Payment Info</h3>
                    <p className="text-xs text-blue-100">Send money to this number</p>
                  </div>
                </div>
                
                {activeNumber ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <div className="text-[10px] uppercase font-bold text-blue-200 mb-1">{method} Number</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-bold tracking-wider text-white">{activeNumber}</span>
                      <button 
                        onClick={() => copyToClipboard(activeNumber)}
                        className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-sm"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center italic text-sm text-blue-100">
                    Select a method to see number
                  </div>
                )}
              </div>

              <div className="p-6">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">How to pay</h4>
                <div className="space-y-6">
                  {steps.length > 0 ? steps.map((step, idx) => (
                    <div key={idx} className="flex space-x-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold border border-blue-100 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {idx + 1}
                        </div>
                        {idx !== steps.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-100 dark:bg-slate-800 my-1" />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                          {step.replace(/^\d+\.\s*/, '')}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600 italic text-sm">
                      No specific instructions available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 flex items-start space-x-3">
              <Info className="text-orange-500 mt-0.5" size={18} />
              <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
                <strong>Important:</strong> Please ensure you copy the Transaction ID correctly. Requests are usually processed within 5-15 minutes.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Amount (BDT)</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-blue-500 transition-colors">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-gray-900 dark:text-white font-medium"
                        placeholder="10.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Payment Method</label>
                    <div className="relative">
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-gray-900 dark:text-white font-medium appearance-none"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Binance">Binance (USDT)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronRight size={18} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Transaction ID / Sender Number</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-gray-900 dark:text-white font-mono"
                      placeholder="TRX123456789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Coupon Code</label>
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-gray-900 dark:text-white uppercase font-bold tracking-wider placeholder:font-normal placeholder:tracking-normal"
                      placeholder="BONUS100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Note (Optional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-gray-900 dark:text-white"
                      placeholder="Extra info..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Payment Screenshot (Optional)</label>
                  <FileUpload 
                    onUploadComplete={(urls) => setScreenshots(urls)}
                    maxFiles={3}
                    folder="payment_proofs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50 shadow-xl shadow-blue-200 dark:shadow-none active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <><Wallet className="mr-2" size={20} /> Submit Request</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center max-w-xl mx-auto">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Gift size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Redeem Gift Card</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-10">Enter your unique gift card code below to instantly add balance to your wallet.</p>
          
          <form onSubmit={handleRedeemGift} className="space-y-8">
            <div className="relative group">
              <input
                type="text"
                required
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none text-center font-mono text-2xl font-bold tracking-[0.3em] uppercase transition-all text-gray-900 dark:text-white placeholder:tracking-normal placeholder:font-normal placeholder:text-base"
                placeholder="GIFT-XXXX-XXXX"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !giftCode.trim()}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50 shadow-xl shadow-blue-200 dark:shadow-none active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Redeeming...</span>
                </div>
              ) : (
                <><Check className="mr-2" size={20} /> Redeem Now</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
