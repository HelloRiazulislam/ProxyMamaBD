import { Settings, Shield, Globe, Bell, Save, Database, Trash2, CreditCard, Megaphone, Share2, Image, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    platformName: 'ProxyMama',
    supportEmail: 'support@proxymama.com',
    maintenanceMode: false,
    referralBonusPercentage: 10,
    minDepositAmount: 100,
    paymentMethods: {
      bkash: '',
      nagad: '',
      rocket: '',
      bkashInstructions: '',
      nagadInstructions: '',
      rocketInstructions: '',
      generalInstructions: ''
    },
    noticeBar: {
      content: '',
      isActive: false,
      type: 'info'
    },
    socialLinks: {
      telegram: '',
      facebook: '',
      whatsapp: ''
    },
    downloadLinks: {
      android: '',
      windows: '',
      ios: '',
      macos: ''
    },
    branding: {
      logoUrl: '',
      faviconUrl: ''
    },
    legalPages: {
      termsAndConditions: '',
      privacyPolicy: ''
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'platform');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({
            ...prev,
            ...data,
            paymentMethods: { ...prev.paymentMethods, ...(data.paymentMethods || {}) },
            noticeBar: { ...prev.noticeBar, ...(data.noticeBar || {}) },
            socialLinks: { ...prev.socialLinks, ...(data.socialLinks || {}) },
            branding: { ...prev.branding, ...(data.branding || {}) },
            legalPages: { ...prev.legalPages, ...(data.legalPages || {}) }
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'platform'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleClearExpiredOrders = async () => {
    if (!confirm('Are you sure you want to clear orders expired for more than 30 days?')) return;
    
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'expired'),
        where('expiryDate', '<=', thirtyDaysAgo.toISOString())
      );
      
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.success('No expired orders to clear.');
        return;
      }

      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      
      toast.success(`Cleared ${snap.size} expired orders.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear orders');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 text-sm">Configure global application settings and security.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
            <button 
              onClick={() => setActiveTab('general')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'general' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Settings className="mr-3" size={18} /> General Settings
            </button>
            <button 
              onClick={() => setActiveTab('payment')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'payment' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <CreditCard className="mr-3" size={18} /> Payment Methods
            </button>
            <button 
              onClick={() => setActiveTab('notice')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'notice' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Megaphone className="mr-3" size={18} /> Notice Bar
            </button>
            <button 
              onClick={() => setActiveTab('referral')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'referral' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Globe className="mr-3" size={18} /> Referral & Bonus
            </button>
            <button 
              onClick={() => setActiveTab('social')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'social' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Share2 className="mr-3" size={18} /> Social Links
            </button>
            <button 
              onClick={() => setActiveTab('downloads')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'downloads' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Database className="mr-3" size={18} /> Download Links
            </button>
            <button 
              onClick={() => setActiveTab('branding')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'branding' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Image className="mr-3" size={18} /> Branding
            </button>
            <button 
              onClick={() => setActiveTab('legal')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'legal' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <FileText className="mr-3" size={18} /> Legal Pages
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={cn(
                "w-full px-4 py-3 font-bold rounded-xl flex items-center text-sm transition-all",
                activeTab === 'security' ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Shield className="mr-3" size={18} /> Security & Auth
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
            {activeTab === 'general' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Settings className="mr-2 text-blue-600" size={20} /> General Configuration
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div>
                      <div className="text-sm font-bold text-blue-900">Maintenance Mode</div>
                      <div className="text-xs text-blue-700">Disable all user access to the platform.</div>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        settings.maintenanceMode ? "bg-blue-600" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                        settings.maintenanceMode ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="mr-2 text-blue-600" size={20} /> Payment Methods
                </h3>
                <div className="space-y-8">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mr-2" /> bKash Settings
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">bKash Number</label>
                        <input
                          type="text"
                          value={settings.paymentMethods?.bkash}
                          onChange={(e) => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, bkash: e.target.value } })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">bKash Instructions (Step by Step)</label>
                        <textarea
                          rows={3}
                          value={settings.paymentMethods?.bkashInstructions}
                          onChange={(e) => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, bkashInstructions: e.target.value } })}
                          placeholder="e.g. 1. Dial *247#&#10;2. Choose Send Money&#10;3. Enter Number"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" /> Nagad Settings
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nagad Number</label>
                        <input
                          type="text"
                          value={settings.paymentMethods?.nagad}
                          onChange={(e) => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, nagad: e.target.value } })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nagad Instructions</label>
                        <textarea
                          rows={3}
                          value={settings.paymentMethods?.nagadInstructions}
                          onChange={(e) => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, nagadInstructions: e.target.value } })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" /> Rocket Settings
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rocket Number</label>
                        <input
                          type="text"
                          value={settings.paymentMethods?.rocket}
                          onChange={(e) => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, rocket: e.target.value } })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rocket Instructions</label>
                        <textarea
                          rows={3}
                          value={settings.paymentMethods?.rocketInstructions}
                          onChange={(e) => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, rocketInstructions: e.target.value } })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">General Payment Instructions (Fallback)</label>
                    <textarea
                      rows={4}
                      value={settings.paymentMethods?.generalInstructions}
                      onChange={(e) => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, generalInstructions: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notice' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Megaphone className="mr-2 text-blue-600" size={20} /> Notice Bar Configuration
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div>
                      <div className="text-sm font-bold text-blue-900">Show Notice Bar</div>
                      <div className="text-xs text-blue-700">Display a global notice at the top of the site.</div>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, noticeBar: { ...settings.noticeBar, isActive: !settings.noticeBar.isActive } })}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        settings.noticeBar?.isActive ? "bg-blue-600" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                        settings.noticeBar?.isActive ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notice Content</label>
                    <textarea
                      rows={3}
                      value={settings.noticeBar?.content}
                      onChange={(e) => setSettings({ ...settings, noticeBar: { ...settings.noticeBar, content: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notice Type</label>
                    <select
                      value={settings.noticeBar?.type}
                      onChange={(e) => setSettings({ ...settings, noticeBar: { ...settings.noticeBar, type: e.target.value as any } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Warning (Yellow)</option>
                      <option value="success">Success (Green)</option>
                      <option value="danger">Danger (Red)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'referral' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Globe className="mr-2 text-blue-600" size={20} /> Referral & Bonus Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Referral Bonus (%)</label>
                    <input
                      type="number"
                      value={settings.referralBonusPercentage}
                      onChange={(e) => setSettings({ ...settings, referralBonusPercentage: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Deposit Amount (৳)</label>
                    <input
                      type="number"
                      value={settings.minDepositAmount}
                      onChange={(e) => setSettings({ ...settings, minDepositAmount: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Share2 className="mr-2 text-blue-600" size={20} /> Social & Support Links
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Link</label>
                    <input
                      type="text"
                      value={settings.socialLinks?.telegram}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, telegram: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Group/Page</label>
                    <input
                      type="text"
                      value={settings.socialLinks?.facebook}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                    <input
                      type="text"
                      value={settings.socialLinks?.whatsapp}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, whatsapp: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'downloads' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Database className="mr-2 text-blue-600" size={20} /> App Download Links
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Android App Link</label>
                    <input
                      type="text"
                      value={settings.downloadLinks?.android}
                      onChange={(e) => setSettings({ ...settings, downloadLinks: { ...settings.downloadLinks, android: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Windows App Link</label>
                    <input
                      type="text"
                      value={settings.downloadLinks?.windows}
                      onChange={(e) => setSettings({ ...settings, downloadLinks: { ...settings.downloadLinks, windows: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">iOS App Link</label>
                    <input
                      type="text"
                      value={settings.downloadLinks?.ios}
                      onChange={(e) => setSettings({ ...settings, downloadLinks: { ...settings.downloadLinks, ios: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">macOS App Link</label>
                    <input
                      type="text"
                      value={settings.downloadLinks?.macos}
                      onChange={(e) => setSettings({ ...settings, downloadLinks: { ...settings.downloadLinks, macos: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Image className="mr-2 text-blue-600" size={20} /> Branding Assets
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                    <input
                      type="text"
                      value={settings.branding?.logoUrl}
                      onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, logoUrl: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                    <input
                      type="text"
                      value={settings.branding?.faviconUrl}
                      onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, faviconUrl: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="mr-2 text-blue-600" size={20} /> Legal Pages Content
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                    <textarea
                      rows={10}
                      value={settings.legalPages?.termsAndConditions}
                      onChange={(e) => setSettings({ ...settings, legalPages: { ...settings.legalPages, termsAndConditions: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Policy</label>
                    <textarea
                      rows={10}
                      value={settings.legalPages?.privacyPolicy}
                      onChange={(e) => setSettings({ ...settings, legalPages: { ...settings.legalPages, privacyPolicy: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="mr-2 text-blue-600" size={20} /> Database Maintenance
                </h3>
                <div className="space-y-4">
                  <button 
                    onClick={handleClearExpiredOrders}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center">
                      <Trash2 className="mr-4 text-red-500" size={20} />
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">Clear Expired Orders</div>
                        <div className="text-xs text-gray-500">Remove all orders that have been expired for more than 30 days.</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 group-hover:text-red-600 group-hover:border-red-100">
                      RUN NOW
                    </div>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center disabled:opacity-50"
            >
              <Save className="mr-2" size={20} /> {loading ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
