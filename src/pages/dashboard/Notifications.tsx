import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { Bell, Check, Trash2, MailOpen, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function Notifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'notifications'),
      where('uid', 'in', [profile.uid, 'all']),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(docs);
      setLoading(false);
    }, (error) => {
      console.error('Notification listener error:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.uid]);

  const isNew = (notification: any) => {
    if (!profile) return false;
    // Check if ID is in readNotifications array
    if (profile.readNotifications?.includes(notification.id)) return false;
    
    // Fallback to lastReadNotificationAt for older logic or global mark all
    if (!profile.lastReadNotificationAt) return true;
    if (!notification.createdAt) return false;
    
    const lastRead = profile.lastReadNotificationAt.toDate ? profile.lastReadNotificationAt.toDate() : new Date(profile.lastReadNotificationAt);
    const created = notification.createdAt.toDate ? notification.createdAt.toDate() : new Date(notification.createdAt);
    
    return created.getTime() > lastRead.getTime();
  };

  const markAsRead = async (id: string) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        readNotifications: arrayUnion(id)
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile || notifications.length === 0) return;
    try {
      const allIds = notifications.map(n => n.id);
      await updateDoc(doc(db, 'users', profile.uid), {
        lastReadNotificationAt: serverTimestamp(),
        readNotifications: arrayUnion(...allIds)
      });
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to update last read status:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Stay updated with your account activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Check size={16} />
            Mark all as read
          </button>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
            {notifications.filter(isNew).length} New
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse h-24" />
          ))
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const unread = isNew(n);
            return (
              <div 
                key={n.id} 
                onClick={() => unread && markAsRead(n.id)}
                className={cn(
                  "bg-white dark:bg-gray-900 p-6 rounded-2xl border transition-all group cursor-pointer",
                  !unread ? "border-gray-100 dark:border-gray-800 opacity-75" : "border-blue-200 dark:border-blue-900 shadow-md shadow-blue-50 dark:shadow-none hover:border-blue-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      !unread ? "bg-gray-100 dark:bg-gray-800 text-gray-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    )}>
                      {!unread ? <MailOpen size={20} /> : <Mail size={20} />}
                    </div>
                    <div>
                      <h3 className={cn("font-bold mb-1", !unread ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white")}>
                        {n.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{n.message}</p>
                      <div className="text-xs text-gray-400">
                        {format(n.createdAt?.toDate() || new Date(), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                  {unread && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-gray-900 p-12 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center text-gray-500">
            <Bell className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-lg font-medium">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
