import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { collection, query, onSnapshot, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { replyToTicket } from '../../services/dbService';
import { Send, ArrowLeft, Clock, Shield, User, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import FileUpload from '../../components/ui/FileUpload';

export default function TicketDetails() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !profile) return;

    const fetchTicket = async () => {
      const docRef = doc(db, 'supportTickets', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.uid !== profile.uid && profile.role !== 'admin') {
          toast.error('Unauthorized');
          navigate('/dashboard/support');
          return;
        }
        setTicket({ id: docSnap.id, ...data });
        
        // Mark as read if user
        if (profile.role === 'user' && data.userUnread) {
          await updateDoc(docRef, { userUnread: false });
        }
      } else {
        toast.error('Ticket not found');
        navigate('/dashboard/support');
      }
    };

    fetchTicket();

    const q = query(
      collection(db, 'supportTickets', id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [id, profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile || !newMessage.trim()) return;

    setSending(true);
    try {
      await replyToTicket(id, profile.uid, profile.role, newMessage, []);
      setNewMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (profile?.role === 'admin') {
      navigate('/admin/support');
    } else {
      navigate('/dashboard/support');
    }
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} /> Back to Tickets
        </button>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase",
          ticket.status === 'open' ? "bg-green-100 text-green-600" :
          ticket.status === 'replied' ? "bg-blue-100 text-blue-600" :
          "bg-gray-100 text-gray-600"
        )}>
          {ticket.status}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
        {/* Ticket Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center"><Clock size={14} className="mr-1" /> {format(ticket.createdAt?.toDate() || new Date(), 'MMM dd, yyyy HH:mm')}</span>
                <span className="capitalize">Category: <strong>{ticket.category}</strong></span>
                <span className="capitalize">Priority: <strong>{ticket.priority}</strong></span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-400 uppercase mb-1">Ticket ID</div>
              <div className="font-mono text-sm text-gray-900">#{ticket.id.substring(0, 8)}</div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200"
        >
          {messages.map((msg) => {
            const isMe = msg.senderUid === profile?.uid;
            const isAdmin = msg.senderRole === 'admin';

            return (
              <div 
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {!isMe && (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isAdmin ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    )}>
                      {isAdmin ? <Shield size={12} /> : <User size={12} />}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {isAdmin ? 'Support Agent' : isMe ? 'You' : 'User'} • {format(msg.createdAt?.toDate() || new Date(), 'HH:mm')}
                  </span>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-900 rounded-tl-none"
                )}>
                  {msg.message}
                </div>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map((url: string, idx: number) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
                      >
                        <img src={url} alt="attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-gray-100">
          {ticket.status === 'closed' ? (
            <div className="p-4 bg-gray-50 rounded-2xl text-center text-gray-500 text-sm font-medium">
              This ticket is closed. You cannot send more messages.
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleSend} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center disabled:opacity-50"
                >
                  {sending ? '...' : <Send size={20} />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
