import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { completeOnboarding } from '../services/authService';
import { toast } from 'react-hot-toast';
import { Ticket, UserPlus, ArrowRight, SkipForward } from 'lucide-react';

export default function Onboarding() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async (skip: boolean = false) => {
    if (!profile) return;
    setLoading(true);
    try {
      await completeOnboarding(
        profile.uid, 
        skip ? undefined : couponCode, 
        skip ? undefined : referralCode
      );
      toast.success(skip ? 'Welcome to ProxyMama!' : 'Profile updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to ProxyMama!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Do you have a coupon or were you referred by someone?
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Ticket size={16} className="text-blue-500" />
              Coupon Code (Optional)
            </label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <UserPlus size={16} className="text-purple-500" />
              Referral Code (Optional)
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="REF12345"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => handleComplete(false)}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {loading ? 'Processing...' : <><ArrowRight size={20} /> Apply & Continue</>}
            </button>
            
            <button
              onClick={() => handleComplete(true)}
              disabled={loading}
              className="w-full py-4 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <SkipForward size={20} /> Skip for now
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest">
          You can always add balance later
        </p>
      </div>
    </div>
  );
}
