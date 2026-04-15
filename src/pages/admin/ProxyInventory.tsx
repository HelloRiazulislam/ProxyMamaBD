import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Database, Plus, Edit2, Trash2, Globe, Shield, X, Search, Filter, Clock, AlertCircle, Upload, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { format, differenceInHours } from 'date-fns';
import Papa from 'papaparse';

export default function ProxyInventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterSpeed, setFilterSpeed] = useState('all');
  const [filterServer, setFilterServer] = useState('all');

  const [formData, setFormData] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    status: 'available',
    type: 'SOCKS5',
    speed: '50mbps',
    serverId: ''
  });
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invSnap, plansSnap, serversSnap] = await Promise.all([
          getDocs(query(collection(db, 'proxyInventory'), limit(1000))),
          getDocs(collection(db, 'proxyPlans')),
          getDocs(collection(db, 'proxyServers'))
        ]);

        setInventory(invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setPlans(plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setServers(serversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching inventory data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const recalculateStock = async (planId: string) => {
    if (!planId) return;
    const q = query(
      collection(db, 'proxyInventory'), 
      where('planId', '==', planId), 
      where('isAssigned', '==', false)
    );
    const snap = await getDocs(q);
    await updateDoc(doc(db, 'proxyPlans', planId), {
      stock: snap.size
    });
    return snap.size;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isBulkMode && !editingItem) {
        const lines = bulkInput.split('\n').filter(line => line.trim());
        if (lines.length === 0) throw new Error('Please enter at least one proxy');

        setUploadProgress({ current: 0, total: lines.length });
        let successCount = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          const parts = line.split(':');
          if (parts.length < 2) continue;

          const host = parts[0];
          const port = parts[1];
          const username = parts[2] || '';
          const password = parts[3] || '';

          await addDoc(collection(db, 'proxyInventory'), {
            host,
            port,
            username,
            password,
            status: 'available',
            type: formData.type,
            speed: formData.speed,
            serverId: formData.serverId,
            isAssigned: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          successCount++;
          setUploadProgress({ current: i + 1, total: lines.length });
        }

        toast.success(`Successfully added ${successCount} proxies`);
        setUploadProgress(null);
      } else {
        const data = {
          ...formData,
          isAssigned: formData.status === 'sold',
          updatedAt: serverTimestamp()
        };

        if (editingItem) {
          await updateDoc(doc(db, 'proxyInventory', editingItem.id), data);
          toast.success('Proxy updated successfully');
        } else {
          await addDoc(collection(db, 'proxyInventory'), {
            ...data,
            isAssigned: false,
            createdAt: serverTimestamp()
          });
          toast.success('Proxy added successfully');
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      host: '',
      port: '',
      username: '',
      password: '',
      status: 'available',
      type: 'SOCKS5',
      speed: '50mbps',
      serverId: ''
    });
    setBulkInput('');
    setIsBulkMode(false);
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      host: item.host,
      port: item.port,
      username: item.username,
      password: item.password,
      status: item.status,
      type: item.type,
      speed: item.speed || '50mbps',
      serverId: item.serverId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proxy?')) return;
    try {
      const item = inventory.find(i => i.id === id);
      if (!item) return;

      await deleteDoc(doc(db, 'proxyInventory', id));
      await recalculateStock(item.planId);
      
      toast.success('Proxy deleted and stock synchronized');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleDownloadTemplate = () => {
    const csv = Papa.unparse([
      { planId_or_Name: 'Plan Name or ID', host: '1.2.3.4', port: '8080', username: 'user1', password: 'pass1' }
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'proxy_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        let successCount = 0;
        let errorCount = 0;

        setUploadProgress({ current: 0, total: data.length });

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            const planIdentifier = row.planId_or_Name || row.planId;
            if (!planIdentifier || !row.host || !row.port) {
              setUploadProgress(prev => prev ? { ...prev, current: i + 1 } : null);
              continue;
            }
            
            // Find plan by ID or Title (case-insensitive)
            const selectedPlan = plans.find(p => 
              p.id === planIdentifier || 
              p.title.toLowerCase() === planIdentifier.toLowerCase()
            );
            
            if (!selectedPlan) {
              console.warn(`Plan not found for identifier: ${planIdentifier}`);
              errorCount++;
              setUploadProgress(prev => prev ? { ...prev, current: i + 1 } : null);
              continue;
            }

            await addDoc(collection(db, 'proxyInventory'), {
              planId: selectedPlan.id,
              host: row.host,
              port: row.port,
              username: row.username || '',
              password: row.password || '',
              status: 'available',
              location: selectedPlan.location,
              type: selectedPlan.type,
              speed: row.speed || '50mbps',
              isAssigned: false,
              createdAt: serverTimestamp()
            });
            
            await recalculateStock(selectedPlan.id);
            successCount++;
          } catch (err) {
            errorCount++;
          }
          setUploadProgress(prev => prev ? { ...prev, current: i + 1 } : null);
        }

        setUploadProgress(null);
        toast.success(`Successfully uploaded ${successCount} proxies. ${errorCount} errors.`, { id: 'csv-upload' });
      }
    });
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const hoursLeft = differenceInHours(new Date(expiryDate), new Date());
    return hoursLeft > 0 && hoursLeft <= 24;
  };

  const inventoryStats = useMemo(() => {
    const available = inventory.filter(i => i.status === 'available');
    
    const byServer = servers.map(s => ({
      id: s.id,
      name: s.name,
      count: available.filter(i => i.serverId === s.id).length
    }));

    const bySpeed = ['50mbps', '100mbps', '150mbps'].map(speed => ({
      name: speed,
      count: available.filter(i => i.speed === speed).length
    }));

    const byType = ['SOCKS5', 'HTTP', 'L2TP', 'PPTP', 'Wireguard', 'OpenVPN'].map(type => ({
      name: type,
      count: available.filter(i => i.type === type).length
    }));

    return { byServer, bySpeed, byType, totalAvailable: available.length };
  }, [inventory, servers]);

  const filteredInventory = inventory.filter(item => 
    (filterSpeed === 'all' || item.speed === filterSpeed) &&
    (filterServer === 'all' || item.serverId === filterServer) &&
    (item.host.includes(search) || item.username.includes(search) || item.id.includes(search))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proxy Inventory</h1>
          <p className="text-gray-500 text-sm">Manage individual proxy records and stock.</p>
        </div>
        <div className="flex items-center space-x-2">
          {uploadProgress && (
            <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <div className="text-xs font-bold text-blue-600">Uploading: {uploadProgress.current}/{uploadProgress.total}</div>
              <div className="w-24 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300" 
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-100"
          >
            <Plus className="mr-2" size={20} /> Add New Proxy
          </button>
        </div>
      </div>

      {/* Inventory Statistics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Server */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
            <Globe size={14} className="mr-2 text-blue-600" />
            Stock by Server
          </h3>
          <div className="space-y-3">
            {inventoryStats.byServer.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{s.name}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black",
                  s.count > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {s.count} Left
                </span>
              </div>
            ))}
            {inventoryStats.byServer.length === 0 && (
              <p className="text-xs text-gray-400 italic">No servers configured</p>
            )}
          </div>
        </div>

        {/* By Speed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
            <Shield size={14} className="mr-2 text-purple-600" />
            Stock by Speed
          </h3>
          <div className="space-y-3">
            {inventoryStats.bySpeed.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">{s.name}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black",
                  s.count > 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                )}>
                  {s.count} Left
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
            <Database size={14} className="mr-2 text-orange-600" />
            Stock by Type
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {inventoryStats.byType.map(s => (
              <div key={s.name} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-gray-500 uppercase">{s.name}</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by host or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterServer}
            onChange={(e) => setFilterServer(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
          >
            <option value="all">All Servers</option>
            {servers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterSpeed}
            onChange={(e) => setFilterSpeed(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
          >
            <option value="all">All Speeds</option>
            <option value="50mbps">50 Mbps</option>
            <option value="100mbps">100 Mbps</option>
            <option value="150mbps">150 Mbps</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-200">
              <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">Server</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">Host:Port</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">Credentials</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Type</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Speed</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[150px] whitespace-nowrap">Expiry</th>
                <th className="px-6 py-4 overflow-hidden resize-x border-r border-gray-100 min-w-[100px] whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right w-[100px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading inventory...</td></tr>
              ) : filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-blue-600">
                        {servers.find(s => s.id === item.serverId)?.name || 'Unknown Server'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 whitespace-nowrap">{item.host}:{item.port}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{item.username}:{item.password}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                        item.type === 'SOCKS5' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                      )}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-600">{item.speed || '50mbps'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.expiryDate ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-900 font-medium">
                            {format(new Date(item.expiryDate), 'MMM dd, yyyy')}
                          </span>
                          {isExpiringSoon(item.expiryDate) && (
                            <span className="flex items-center text-[9px] font-bold text-orange-600 animate-pulse">
                              <AlertCircle size={10} className="mr-1" /> EXPIRING SOON
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        item.status === 'available' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {item.status === 'available' ? 'Available' : 'Sold'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No proxies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Proxy' : 'Add New Proxy'}</h2>
                {!editingItem && (
                  <div className="flex items-center mt-1 space-x-4">
                    <button 
                      type="button"
                      onClick={() => setIsBulkMode(false)}
                      className={cn("text-xs font-bold transition-colors", !isBulkMode ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
                    >
                      Single Entry
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsBulkMode(true)}
                      className={cn("text-xs font-bold transition-colors", isBulkMode ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
                    >
                      Bulk Paste
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Server</label>
                  <select
                    required
                    value={formData.serverId}
                    onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Choose a Server</option>
                    {servers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
                  <select
                    value={formData.speed}
                    onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="50mbps">50 Mbps</option>
                    <option value="100mbps">100 Mbps</option>
                    <option value="150mbps">150 Mbps</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Protocol</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="SOCKS5">SOCKS5</option>
                    <option value="HTTP">HTTP</option>
                    <option value="L2TP">L2TP</option>
                    <option value="PPTP">PPTP</option>
                    <option value="Wireguard">Wireguard</option>
                    <option value="OpenVPN">OpenVPN</option>
                  </select>
                </div>
              </div>

              {isBulkMode && !editingItem ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Proxy Input</label>
                  <textarea
                    required
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="host:port:user:pass&#10;host:port:user:pass&#10;host:port"
                    className="w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  />
                  <p className="mt-2 text-[10px] text-gray-400">Enter one proxy per line. Format: host:port:user:pass or host:port</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                    <input
                      type="text"
                      required
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="1.2.3.4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                    <input
                      type="text"
                      required
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="8080"
                    />
                  </div>
                  {formData.type !== 'HTTP' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          required
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                          type="text"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  {editingItem ? 'Update Proxy' : 'Add Proxy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
