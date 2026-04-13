import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Search, Package, Calendar, Clock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const docRef = doc(db, 'orders', orderId.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        setOrder(null);
        toast.error('Order not found. Please check the ID.');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      toast.error('Failed to track order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-100">
              <Package size={32} />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Track Your Order</h1>
            <p className="text-gray-600">
              Enter your Order ID to see the status and details of your proxy purchase.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. abc123xyz)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Track Now'}
              </button>
            </form>
          </div>

          {searched && !loading && order && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldCheck size={24} />
                  <span className="font-bold">Order Details</span>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                  {order.status}
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</label>
                    <div className="font-mono text-lg font-bold text-gray-900 break-all">{order.id}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plan Name</label>
                    <div className="text-lg font-bold text-gray-900">{order.planTitle}</div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase">Purchase Date</div>
                      <div className="font-bold text-gray-900">
                        {order.createdAt ? format(order.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase">Expiry Date</div>
                      <div className="font-bold text-gray-900">
                        {order.expiryDate ? format(new Date(order.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase">Amount Paid</div>
                      <div className="font-bold text-gray-900">৳{order.amount?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center space-x-3 text-gray-600 mb-2">
                    <AlertCircle size={18} className="text-blue-500" />
                    <span className="text-sm font-medium">Status Information</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {order.status === 'active' 
                      ? 'Your proxy is currently active and ready for use. You can find the credentials in your dashboard.' 
                      : order.status === 'expired' 
                      ? 'This order has expired. Please purchase a new plan to continue using our services.' 
                      : 'Your order is being processed. Please check back in a few minutes.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {searched && !loading && !order && (
            <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 text-center animate-in fade-in duration-500">
              <AlertCircle className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-gray-500">We couldn't find any order with the ID you provided. Please double-check and try again.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
