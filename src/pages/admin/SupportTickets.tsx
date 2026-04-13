import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MessageSquare, Clock, AlertCircle, ChevronRight, Filter, Search, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'supportTickets'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), { status });
      toast.success(`Ticket status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch = ticket.subject.toLowerCase().includes(search.toLowerCase()) || 
                         ticket.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Support Tickets</h1>
        <p className="text-gray-500 text-sm">Reply to user inquiries and manage ticket statuses.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by subject or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Update</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading tickets...</td></tr>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className={cn(
                    "hover:bg-gray-50 transition-colors text-sm",
                    ticket.adminUnread ? "bg-blue-50/50" : ""
                  )}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{ticket.userEmail}</div>
                      <div className="text-[10px] font-mono text-gray-400">#{ticket.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {ticket.adminUnread && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2" />}
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        ticket.priority === 'high' ? "bg-red-100 text-red-600" :
                        ticket.priority === 'medium' ? "bg-orange-100 text-orange-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        ticket.status === 'open' ? "bg-green-100 text-green-600" :
                        ticket.status === 'replied' ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {ticket.lastMessageAt ? format(ticket.lastMessageAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          to={`/admin/support/${ticket.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Reply"
                        >
                          <MessageSquare size={18} />
                        </Link>
                        {ticket.status !== 'closed' ? (
                          <button 
                            onClick={() => handleStatusChange(ticket.id, 'closed')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Close Ticket"
                          >
                            <XCircle size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusChange(ticket.id, 'open')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Reopen Ticket"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No tickets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
