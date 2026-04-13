import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { ShieldCheck, Zap, Globe, Clock, CheckCircle, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Pricing() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const q = query(
      collection(db, 'proxyPlans'), 
      where('status', '==', 'active'),
      orderBy('price', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredPlans = plans.filter(plan => filterType === 'all' || plan.type === filterType);

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. No hidden fees, no contracts.
            </p>
            
            <div className="mt-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl p-1 w-fit mx-auto shadow-sm">
              {['all', 'SOCKS5', 'HTTP'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-6 py-2 text-sm font-bold rounded-lg transition-all capitalize",
                    filterType === type ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-pulse h-96" />
              ))
            ) : filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all flex flex-col relative group">
                {plan.duration >= 30 && (
                  <div className="absolute top-0 right-0 mt-4 mr-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Best Value
                  </div>
                )}
                
                <div className="mb-8">
                  <div className={cn(
                    "inline-flex px-3 py-1 rounded-lg text-xs font-bold mb-4",
                    plan.type === 'SOCKS5' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                  )}>
                    {plan.type}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-gray-900">৳{plan.price.toFixed(2)}</span>
                    <span className="text-gray-500 ml-2">/ {plan.duration} Days</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                  <div className="flex items-center text-gray-600">
                    <Globe className="mr-3 text-blue-500" size={20} />
                    <span>Location: <strong>Bangladesh</strong></span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Zap className="mr-3 text-yellow-500" size={20} />
                    <span>Speed: <strong>{plan.speed}</strong></span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="mr-3 text-purple-500" size={20} />
                    <span>Duration: <strong>{plan.duration} Days</strong></span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ShieldCheck className="mr-3 text-green-500" size={20} />
                    <span>Stock: <strong>{plan.stock} available</strong></span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="mr-3 text-blue-500" size={20} />
                    <span>Unlimited Bandwidth</span>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-[1.02]"
                >
                  <ShoppingCart className="mr-2" size={20} /> Buy Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
