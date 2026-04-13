import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, Save, X, Shield, Globe, Zap, Clock, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminClashPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration: 30,
    status: 'active',
    proxies: [] as any[]
  });

  const [newProxy, setNewProxy] = useState({
    name: '',
    type: 'socks5',
    server: '',
    port: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const q = query(collection(db, 'clashSubscriptionPlans'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.proxies.length === 0) {
      toast.error('Please add at least one proxy');
      return;
    }

    try {
      if (editingPlan) {
        await updateDoc(doc(db, 'clashSubscriptionPlans', editingPlan.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Plan updated successfully');
      } else {
        await addDoc(collection(db, 'clashSubscriptionPlans'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        toast.success('Plan created successfully');
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deleteDoc(doc(db, 'clashSubscriptionPlans', id));
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      status: plan.status,
      proxies: plan.proxies || []
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      duration: 30,
      status: 'active',
      proxies: []
    });
    setNewProxy({
      name: '',
      type: 'socks5',
      server: '',
      port: '',
      username: '',
      password: ''
    });
  };

  const addProxy = () => {
    if (!newProxy.name || !newProxy.server || !newProxy.port) {
      toast.error('Please fill in Name, Server and Port');
      return;
    }
    setFormData({
      ...formData,
      proxies: [...formData.proxies, { ...newProxy, id: Date.now().toString() }]
    });
    setNewProxy({
      name: '',
      type: 'socks5',
      server: '',
      port: '',
      username: '',
      password: ''
    });
  };

  const removeProxy = (id: string) => {
    setFormData({
      ...formData,
      proxies: formData.proxies.filter(p => p.id !== id)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clash Subscription Plans</h1>
          <p className="text-gray-600">Manage multi-proxy subscription plans for users</p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(plan)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(plan)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price:</span>
                <span className="font-bold text-gray-900">৳{plan.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium text-gray-900">{plan.duration} Days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {plan.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Premium Global Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (৳)</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                    <input
                      type="number"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Proxy List */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Globe size={20} className="text-blue-600" />
                    Proxies in Plan
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Node Name</label>
                      <input
                        type="text"
                        value={newProxy.name}
                        onChange={(e) => setNewProxy({ ...newProxy, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. SG-Premium-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                      <select
                        value={newProxy.type}
                        onChange={(e) => setNewProxy({ ...newProxy, type: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="socks5">SOCKS5</option>
                        <option value="http">HTTP</option>
                        <option value="vmess">VMESS</option>
                        <option value="vless">VLESS</option>
                        <option value="shadowsocks">Shadowsocks</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Server Address</label>
                      <input
                        type="text"
                        value={newProxy.server}
                        onChange={(e) => setNewProxy({ ...newProxy, server: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1.2.3.4 or domain.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Port</label>
                      <input
                        type="text"
                        value={newProxy.port}
                        onChange={(e) => setNewProxy({ ...newProxy, port: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1080"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                      <input
                        type="text"
                        value={newProxy.username}
                        onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                      <input
                        type="text"
                        value={newProxy.password}
                        onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addProxy}
                        className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Add Node
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formData.proxies.map((proxy) => (
                      <div key={proxy.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Zap size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{proxy.name}</p>
                            <p className="text-xs text-gray-500">{proxy.type.toUpperCase()} • {proxy.server}:{proxy.port}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProxy(proxy.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {formData.proxies.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <List className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-500">No nodes added to this plan yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={20} />
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
