import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { processAutoRenewals } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  ShieldCheck, 
  Package, 
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Activity
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProxies: 0,
    totalStock: 0,
    pendingRequests: 0,
    autoRenewEnabled: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [processingAuto, setProcessingAuto] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Users
    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(1000)), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    // Orders & Revenue
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500)), (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const revenue = orders.reduce((acc, order: any) => acc + order.amount, 0);
      const active = orders.filter((order: any) => order.status === 'active').length;
      setStats(prev => ({ ...prev, totalOrders: snap.size, totalRevenue: revenue, activeProxies: active }));
      setRecentOrders(orders.slice(0, 5));

      // Chart Data (Last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        const dayOrders = orders.filter((o: any) => o.createdAt && isSameDay(o.createdAt.toDate(), date));
        return {
          name: format(date, 'MMM dd'),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((acc, o: any) => acc + o.amount, 0)
        };
      }).reverse();
      setChartData(last7Days);

      // Plan Distribution
      const plans: Record<string, number> = {};
      orders.forEach((o: any) => {
        plans[o.planTitle] = (plans[o.planTitle] || 0) + 1;
      });
      const dist = Object.entries(plans).map(([name, value]) => ({ name, value }));
      setPlanDistribution(dist);
    });

    // Stock
    const unsubStock = onSnapshot(query(collection(db, 'proxyInventory'), where('isAssigned', '==', false), limit(1000)), (snap) => {
      setStats(prev => ({ ...prev, totalStock: snap.size }));
    });

    // Pending Requests
    const unsubRequests = onSnapshot(query(collection(db, 'balanceRequests'), where('status', '==', 'pending')), (snap) => {
      setStats(prev => ({ ...prev, pendingRequests: snap.size }));
    });

    // Auto Renew Enabled
    const unsubAuto = onSnapshot(query(collection(db, 'proxyInventory'), where('autoRenew', '==', true)), (snap) => {
      setStats(prev => ({ ...prev, autoRenewEnabled: snap.size }));
    });

    // Recent Activity (One-time fetch)
    const fetchActivity = async () => {
      const activityQuery = query(
        collection(db, 'activityLogs'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(activityQuery);
      setRecentActivity(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchActivity();

    return () => {
      unsubUsers();
      unsubOrders();
      unsubStock();
      unsubRequests();
      unsubAuto();
    };
  }, []);

  const handleProcessAuto = async () => {
    setProcessingAuto(true);
    try {
      const result = await processAutoRenewals();
      if (result) {
        toast.success(`Processed ${result.processed} renewals. ${result.failed} failed.`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Processing failed');
    } finally {
      setProcessingAuto(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Revenue', value: `৳${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Active Proxies', value: stats.activeProxies, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Total Stock', value: stats.totalStock, icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: CreditCard, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Auto-Renew On', value: stats.autoRenewEnabled, icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of ProxyMama platform performance.</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          <button className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg">Last 7 Days</button>
          <button className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg">Last 30 Days</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-2 text-blue-600" size={20} /> Revenue Overview
            </h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 flex items-center">
              <PieChartIcon className="mr-2 text-purple-600" size={20} /> Plan Distribution
            </h2>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col space-y-2 ml-4">
              {planDistribution.map((entry, index) => (
                <div key={index} className="flex items-center text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                  <span className="font-medium">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Platform Orders</h2>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-left relative">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 text-gray-900">{order.uid.substring(0, 8)}...</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{order.planTitle}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">৳{order.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${order.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="mr-2 text-blue-600" size={20} /> Sales Performance
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Platform Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Activity className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{log.action}</div>
                      <div className="text-xs text-gray-500">{log.details} <span className="text-blue-600 ml-1">({log.userEmail})</span></div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {log.createdAt ? format(log.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'Just now'}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Activity className="mx-auto mb-3 text-gray-300" size={40} />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
