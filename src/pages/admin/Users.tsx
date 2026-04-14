import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { manualBalanceUpdate } from '../../services/dbService';
import { Users as UsersIcon, User, Search, Shield, ShieldOff, Wallet, Mail, Calendar, Plus, Minus, Key, Loader2, X, Save, Ban, Eye, Phone, Globe, MapPin, MessageCircle, Send, Gift, TrendingUp, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [balanceDesc, setBalanceDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(1000));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change user role to ${newRole}?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Update failed');
    }
  };

  const toggleBan = async (userId: string, currentIsBanned: boolean) => {
    const newStatus = !currentIsBanned;
    if (!confirm(`Are you sure you want to ${newStatus ? 'BAN' : 'UNBAN'} this user?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: newStatus });
      toast.success(`User ${newStatus ? 'banned' : 'unbanned'}`);
    } catch (error: any) {
      console.error('Error updating ban status:', error);
      toast.error(error.message || 'Update failed');
    }
  };

  const handleManualBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await manualBalanceUpdate(selectedUser.uid, balanceAmount, balanceDesc);
      toast.success('Balance updated successfully');
      setIsBalanceModalOpen(false);
      setBalanceAmount(0);
      setBalanceDesc('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to completely delete this user? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase()) || 
    user.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const DetailRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
      <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
        <Icon size={14} className="mr-2 text-blue-600 dark:text-blue-400" /> {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-white">{value || 'N/A'}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage platform users and their roles.</p>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/30">
              {users.length} Registered
            </span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 dark:border-slate-800 min-w-[150px] whitespace-nowrap">User</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 dark:border-slate-800 min-w-[200px] whitespace-nowrap">Email</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 dark:border-slate-800 min-w-[100px] whitespace-nowrap">Wallet</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 dark:border-slate-800 min-w-[100px] whitespace-nowrap">Role</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 dark:border-slate-800 min-w-[120px] whitespace-nowrap">Joined</th>
                <th className="px-6 py-4 text-right w-[150px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading users...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user.displayName[0]
                          )}
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white">{user.displayName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">৳{user.walletBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit",
                          user.role === 'admin' ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        )}>
                          {user.role}
                        </span>
                        {user.isBanned && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold uppercase w-fit">
                            BANNED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{format(user.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === user.id ? null : user.id);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {activeDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
                            <div className="py-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsDetailsModalOpen(true); setActiveDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                              >
                                <Eye size={16} className="mr-2 text-blue-500" /> View Details
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsBalanceModalOpen(true); setActiveDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                              >
                                <Plus size={16} className="mr-2 text-green-500" /> Adjust Balance
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResetPassword(user.email); setActiveDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                              >
                                <Key size={16} className="mr-2 text-yellow-500" /> Reset Password
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleAdmin(user.id, user.role); setActiveDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                              >
                                {user.role === 'admin' ? <ShieldOff size={16} className="mr-2 text-purple-500" /> : <Shield size={16} className="mr-2 text-purple-500" />}
                                {user.role === 'admin' ? "Remove Admin" : "Make Admin"}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleBan(user.id, user.isBanned); setActiveDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                              >
                                <Ban size={16} className="mr-2 text-red-500" /> {user.isBanned ? "Unban User" : "Ban User"}
                              </button>
                              <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); setActiveDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 size={16} className="mr-2" /> Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-blue-600 text-white">
              <h2 className="text-xl font-bold">User Profile Details</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-slate-800 overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-3xl">
                      {selectedUser.displayName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.displayName}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase">
                      {selectedUser.role}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-[10px] font-bold uppercase">
                      Wallet: ৳{selectedUser.walletBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow icon={User} label="First Name" value={selectedUser.firstName} />
                <DetailRow icon={User} label="Last Name" value={selectedUser.lastName} />
                <DetailRow icon={Phone} label="Phone Number" value={selectedUser.phoneNumber} />
                <DetailRow icon={Globe} label="Country" value={selectedUser.country} />
                <DetailRow icon={MessageCircle} label="WhatsApp" value={selectedUser.whatsapp} />
                <DetailRow icon={Send} label="Telegram" value={selectedUser.telegram} />
                <div className="md:col-span-2">
                  <DetailRow icon={MapPin} label="Address" value={selectedUser.address} />
                </div>
                <DetailRow icon={Calendar} label="Joined Date" value={format(selectedUser.createdAt?.toDate() || new Date(), 'MMMM dd, yyyy')} />
                <DetailRow icon={Gift} label="Referral Code" value={selectedUser.referralCode} />
                <DetailRow icon={TrendingUp} label="Referral Earnings" value={`৳${(selectedUser.referralEarnings || 0).toFixed(2)}`} />
                <DetailRow icon={UsersIcon} label="Referred By" value={selectedUser.referredBy || 'None'} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {isBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adjust Balance</h2>
              <button onClick={() => setIsBalanceModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleManualBalance} className="p-6 space-y-4">
              <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 overflow-hidden font-bold text-blue-600 dark:text-blue-400">
                  {selectedUser?.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    selectedUser?.displayName[0]
                  )}
                </div>
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-300">{selectedUser?.displayName}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Current: ৳{selectedUser?.walletBalance.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Amount (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500 or -200"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Positive to add, negative to subtract.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bonus for loyalty"
                  value={balanceDesc}
                  onChange={e => setBalanceDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || balanceAmount === 0}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                Update Balance
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
