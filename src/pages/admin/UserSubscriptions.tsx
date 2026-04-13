import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, orderBy, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Shield, User, Calendar, CheckCircle, XCircle, AlertCircle, Search, Filter, Copy, Trash2, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminUserSubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const q = query(collection(db, 'userClashSubscriptions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const subsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubs(subsData);

      // Fetch user details for each unique UID
      const uniqueUids = Array.from(new Set(subsData.map((s: any) => s.uid)));
      const userDetails: Record<string, any> = { ...users };
      
      for (const uid of uniqueUids) {
        if (!userDetails[uid]) {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) {
            userDetails[uid] = userSnap.data();
          }
        }
      }
      setUsers(userDetails);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'userClashSubscriptions', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Subscription ${newStatus} successfully`);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    try {
      await deleteDoc(doc(db, 'userClashSubscriptions', id));
      toast.success('Subscription deleted successfully');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const copyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopied(id);
    toast.success('Token copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredSubs = subs.filter(sub => {
    const user = users[sub.uid];
    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
    const matchesSearch = 
      sub.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.token?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Subscriptions</h1>
        <p className="text-gray-600">Manage and monitor all user Clash subscriptions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Plan, UID, or Token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left relative">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User / Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Token</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Expiry</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubs.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Shield className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{sub.planName}</div>
                        <div className="text-xs text-gray-500 flex flex-col">
                          <span className="font-medium text-blue-600">
                            {users[sub.uid] ? `${users[sub.uid].firstName} ${users[sub.uid].lastName}` : 'Loading...'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {sub.uid.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">
                        {sub.token.substring(0, 10)}...
                      </code>
                      <button
                        onClick={() => copyToken(sub.token, sub.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy Token"
                      >
                        {copied === sub.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      {new Date(sub.expiryDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 
                      sub.status === 'expired' ? 'bg-orange-100 text-orange-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {sub.status === 'active' ? (
                        <button
                          onClick={() => updateStatus(sub.id, 'suspended')}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Suspend"
                        >
                          <AlertCircle size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus(sub.id, 'active')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(sub.id, 'expired')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Mark Expired"
                      >
                        <XCircle size={18} />
                      </button>
                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Subscription"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSubs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No subscriptions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
