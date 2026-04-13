import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../App';
import { Camera, Mail, User, Shield, LogOut, Copy, Check, Edit2, Save, X, Phone, Globe, MapPin, MessageCircle, Send, Gift, TrendingUp, Loader2, Clock, CheckCircle, ShieldCheck, Package, Users, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { updateProfilePicture, updateProfileData } from '../../services/dbService';
import { logActivity } from '../../services/activityService';
import { cn } from '../../lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Profile() {
  const { profile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [realtimeOrders, setRealtimeOrders] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(collection(db, 'orders'), where('uid', '==', profile.uid));
    const unsub = onSnapshot(q, (snap) => {
      setRealtimeOrders(snap.size);
    });
    return () => unsub();
  }, [profile?.uid]);

  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    telegram: profile?.telegram || '',
    whatsapp: profile?.whatsapp || '',
    country: profile?.country || '',
    address: profile?.address || '',
  });

  if (!profile) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setLoading(true);
      try {
        await updateProfilePicture(profile.uid, base64String);
        await logActivity('Profile Update', 'Updated profile picture', profile);
        toast.success('Profile picture updated!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to update picture');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedData = {
        ...formData,
        displayName: `${formData.firstName} ${formData.lastName}`.trim()
      };
      await updateProfileData(profile.uid, updatedData);
      await logActivity('Profile Update', 'Updated profile information', profile);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const InfoItem = ({ icon: Icon, label, value, field, type = "text" }: any) => (
    <div className="flex flex-col space-y-1">
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
        <Icon size={14} className="mr-1" /> {label}
      </label>
      {isEditing ? (
        <input
          type={type}
          value={formData[field as keyof typeof formData]}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
        />
      ) : (
        <p className="text-gray-900 dark:text-white font-medium">{value || 'Not set'}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Section - Modern Glassmorphism Style */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-500">
        <div className="h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="px-8 pb-10">
          <div className="relative flex flex-col md:flex-row md:items-end -mt-20 space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2rem] border-8 border-white dark:border-slate-900 overflow-hidden bg-gray-100 dark:bg-slate-800 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                    <User size={64} />
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 size={32} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-all transform hover:scale-110 active:scale-95 z-10"
                title="Change Photo"
              >
                <Camera size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  {isEditing ? (
                    <input
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="bg-gray-50 dark:bg-slate-800 border-2 border-blue-500 rounded-xl px-4 py-1 outline-none text-3xl"
                    />
                  ) : (
                    profile.displayName
                  )}
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/30">
                    {profile.role}
                  </span>
                  {profile.isVerified && (
                    <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full text-green-600 dark:text-green-400" title="Verified Account">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Mail size={16} className="mr-2 text-blue-500" /> {profile.email}
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2 text-red-500" /> {profile.country || 'Global Citizen'}
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-green-500" /> Joined {format(profile.createdAt?.toDate() || new Date(), 'MMM yyyy')}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center"
                  >
                    <X size={20} className="mr-2" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center shadow-xl shadow-blue-500/25 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white font-bold rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center shadow-lg active:scale-95"
                >
                  <Edit2 size={20} className="mr-2 text-blue-600" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Security */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Stats Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Account Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Balance</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">৳{profile.walletBalance}</p>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Earned</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">৳{(profile.referralEarnings || 0)}</p>
              </div>
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1">Orders</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{realtimeOrders}</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Referrals</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{profile.referralCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Shield className="mr-3 text-blue-600" size={20} /> Security Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Email Verified</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Secure connection active</p>
                  </div>
                </div>
                <CheckCircle className="text-green-500" size={20} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 opacity-60">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">2FA Auth</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Coming soon</p>
                  </div>
                </div>
                <div className="w-8 h-4 bg-gray-300 dark:bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-8 space-y-8">
          {/* Information Bento Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center">
              <User className="mr-4 text-blue-600" size={28} /> 
              {isEditing ? 'Update Your Profile' : 'Personal Details'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <InfoItem icon={User} label="First Name" value={profile.firstName} field="firstName" />
              <InfoItem icon={User} label="Last Name" value={profile.lastName} field="lastName" />
              <InfoItem icon={Phone} label="Phone Number" value={profile.phoneNumber} field="phoneNumber" type="tel" />
              <InfoItem icon={Globe} label="Country" value={profile.country} field="country" />
              <InfoItem icon={MessageCircle} label="WhatsApp" value={profile.whatsapp} field="whatsapp" />
              <InfoItem icon={Send} label="Telegram" value={profile.telegram} field="telegram" />
              <div className="md:col-span-2">
                <InfoItem icon={MapPin} label="Full Address" value={profile.address} field="address" />
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center border-2 border-red-100 dark:border-red-900/20 active:scale-95"
          >
            <LogOut size={20} className="mr-2" /> LOGOUT ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
}
