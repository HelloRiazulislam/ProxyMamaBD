import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { openTicket } from '../../services/dbService';
import { MessageSquare, Plus, X, Clock, AlertCircle, ChevronRight, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { logActivity } from '../../services/activityService';

export default function Support() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  });

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'supportTickets'),
      where('uid', '==', profile.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
    ticket.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSubmitting(true);
    try {
      await openTicket(
        profile.uid,
        profile.email,
        formData.subject,
        formData.category,
        formData.priority,
        formData.message
      );
      await logActivity('Support Ticket', `Opened new ticket: ${formData.subject}`, profile);
      toast.success('Ticket opened successfully!');
      setIsModalOpen(false);
      setFormData({ subject: '', category: 'general', priority: 'medium', message: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to open ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Need help? Open a ticket and our team will get back to you.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none"
        >
          <Plus className="mr-2" size={20} /> Open New Ticket
        </button>
      </div>

      <div className="relative">
        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by subject or ticket ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full text-gray-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Update</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading tickets...</td></tr>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 dark:text-gray-500">#{ticket.id.substring(0, 8)}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{ticket.subject}</td>
                    <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-400">{ticket.category}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        ticket.priority === 'high' ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" :
                        ticket.priority === 'medium' ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" :
                        "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                      )}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        ticket.status === 'open' ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" :
                        ticket.status === 'replied' ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      )}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {ticket.lastMessageAt ? format(ticket.lastMessageAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/dashboard/support/${ticket.id}`}
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        View <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <MessageSquare className="mx-auto mb-4 text-gray-300 dark:text-gray-700" size={48} />
                    <p className="text-lg font-medium">No tickets found.</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Open your first ticket</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Open New Ticket</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  placeholder="Briefly describe your issue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-900 dark:text-white"
                  placeholder="Describe your problem in detail..."
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center"
                >
                  {submitting ? 'Opening...' : <><Send className="mr-2" size={18} /> Open Ticket</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
