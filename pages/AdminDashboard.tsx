import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Home, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  DollarSign,
  Layout as LayoutIcon,
  Search,
  MoreVertical,
  ArrowRight,
  ExternalLink,
  Eye,
  MousePointer2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  getAllUsers, 
  getListings, 
  getMonetizationAds, 
  getAdminStats, 
  updateUserRole, 
  deleteListing,
  updateListing,
  createMonetizationAd,
  updateMonetizationAd,
  deleteMonetizationAd,
  uploadImage
} from '../services/supabaseService';
import { 
  seedMockData, 
  clearMockData 
} from '../utils/seedMockData';
import { User, Listing, Monetization } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b'];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'listings' | 'monetization' | 'pages'>('analytics');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ads, setAds] = useState<Monetization[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [listingTab, setListingTab] = useState<'all' | 'pending' | 'rejected'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Monetization | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setActivePage(1); // Reset page on filter changes
  }, [debouncedSearch, listingTab, dateRange, activeTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, activePage, debouncedSearch, listingTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const statsData = await getAdminStats();
        setStats(statsData);
      } else if (activeTab === 'listings') {
        const filters: any = {
           page: activePage,
           pageSize,
           isAdminQuery: true,
           query: debouncedSearch
        };
        if (listingTab !== 'all') filters.status = listingTab;
        if (dateRange.start) filters.startDate = dateRange.start;
        if (dateRange.end) filters.endDate = dateRange.end;
        
        const listingsData = await getListings(filters);
        setListings(listingsData.listings);
        setTotalCount(listingsData.total);
      } else if (activeTab === 'users') {
        const usersData = await getAllUsers();
        // Since getAllUsers doesn't have pagination yet in this codebase, we'll just filter client side for now or implement totalCount
        setUsers(usersData);
      } else if (activeTab === 'monetization') {
        const adsData = await getMonetizationAds();
        setAds(adsData);
      }
    } catch (error) {
      console.error(`Error fetching admin data for ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'Agent' | 'Customer' | 'Admin') => {
    await updateUserRole(userId, newRole);
    fetchData();
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      await deleteListing(id);
      fetchData();
    }
  };

  const handleAdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setIsUploading(true);
    let imageUrl = formData.get('image_url') as string;
    const file = formData.get('image_file') as File;
    
    try {
      if (file && file.size > 0) {
        // Upload image if file is provided
        const path = `monetization/${Date.now()}_${file.name}`;
        imageUrl = await uploadImage(file, path);
      }
      
      const adData = {
        type: formData.get('type') as any,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        cta: formData.get('cta') as string,
        image: imageUrl || editingAd?.image || '',
        link: formData.get('link') as string,
        color: formData.get('color') as string,
        active: formData.get('active') === 'on',
        priority: parseInt(formData.get('priority') as string) || 0,
        countryCode: formData.get('countryCode') as string || undefined
      };

      if (editingAd) {
        await updateMonetizationAd(editingAd.id, adData);
      } else {
        await createMonetizationAd(adData);
      }
      setShowAdModal(false);
      setEditingAd(null);
      fetchData();
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Error saving ad. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      await deleteMonetizationAd(id);
      fetchData();
    }
  };

  const handleApproveListing = async (id: string) => {
    await updateListing(id, { status: 'active' });
    fetchData();
  };

  const handleRejectListing = async (id: string) => {
    await updateListing(id, { status: 'rejected' });
    fetchData();
  };

  const handleToggleListingStatus = async (id: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'pending' ? 'active' : currentStatus === 'active' ? 'rejected' : 'active';
    await updateListing(id, { status: newStatus });
    fetchData();
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    u.socials?.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredListings = listings; // Search is now done server-side

  const pendingCount = stats?.pendingApprovals || 0;

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xl">
            <LayoutIcon size={24} />
            <span>Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={20} />
            <span className="font-medium">Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('listings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'listings' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Home size={20} />
            <span className="font-medium">Listings</span>
          </button>
          <button 
            onClick={() => setActiveTab('monetization')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'monetization' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <DollarSign size={20} />
            <span className="font-medium">Monetization</span>
          </button>
          <button 
            onClick={() => setActiveTab('pages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'pages' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings size={20} />
            <span className="font-medium">Page Management</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 text-gray-400 text-sm">
            <TrendingUp size={16} />
            <span>v1.2.0 Stable</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
            <p className="text-gray-500">Manage your application and view real-time data.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => { if(window.confirm('Seed mock data?')) { await seedMockData(); fetchData(); } }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm"
            >
              Seed Mock Data
            </button>
            <button 
              onClick={async () => { if(window.confirm('CLEAR ALL DATA? This is irreversible!')) { await clearMockData(); fetchData(); } }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-sm"
            >
              Clear Data
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
              />
            </div>
            <button 
              onClick={fetchData}
              className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-xl transition-all"
            >
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Users size={24} />
                    </div>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      +12% <TrendingUp size={14} />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                      <Home size={24} />
                    </div>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      +5% <TrendingUp size={14} />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Total Listings</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalListings || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <MousePointer2 size={24} />
                    </div>
                    <span className="text-sm font-medium text-orange-600 flex items-center gap-1">
                      -2% <TrendingUp size={14} className="rotate-180" />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Ad Clicks</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.adPerformance?.totalClicks || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <Eye size={24} />
                    </div>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      +18% <TrendingUp size={14} />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Ad Impressions</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.adPerformance?.totalImpressions || 0}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">User Growth</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Jan', users: 400 },
                        { name: 'Feb', users: 600 },
                        { name: 'Mar', users: 800 },
                        { name: 'Apr', users: 1200 },
                        { name: 'May', users: 1500 },
                        { name: 'Jun', users: 2100 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="users" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, fill: '#ea580c' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">User Roles Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Admins', value: stats?.userRoles?.Admin || 0 },
                            { name: 'Agents', value: stats?.userRoles?.Agent || 0 },
                            { name: 'Customers', value: stats?.userRoles?.Customer || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {['Admins', 'Agents', 'Customers'].map((role, i) => (
                      <div key={role} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-sm text-gray-600">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">User</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">Role</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">Location</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">Joined</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <div className="font-bold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.socials?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border-none focus:ring-2 focus:ring-orange-500 ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'Agent' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <option value="Customer">Customer</option>
                          <option value="Agent">Agent</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.location || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.memberSince}</td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'listings' && (
            <motion.div 
              key="listings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-2">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setListingTab('all')}
                    className={`pb-2 border-b-2 font-medium text-sm transition-colors ${listingTab === 'all' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    All Listings
                  </button>
                  <button 
                    onClick={() => setListingTab('pending')}
                    className={`pb-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${listingTab === 'pending' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Pending Approvals
                    {pendingCount > 0 && (
                      <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setListingTab('rejected')}
                    className={`pb-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${listingTab === 'rejected' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Rejected
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                   <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="text-sm px-2 py-1 border rounded-lg" />
                   <span className="text-gray-400">to</span>
                   <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="text-sm px-2 py-1 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map(listing => (
                <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group flex flex-col">
                  <div className="relative h-48 flex-shrink-0">
                    <img src={listing.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => handleDeleteListing(listing.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                        {listing.currency} {listing.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                      <TrendingUp size={14} />
                      <span>{listing.type} • {listing.propertyType}</span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      {listing.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveListing(listing.id)}
                            className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectListing(listing.id)}
                            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleToggleListingStatus(listing.id, listing.status)}
                          className={`flex items-center gap-2 px-2 py-1 rounded border transition-colors ${
                            !listing.status || listing.status === 'active' 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            !listing.status || listing.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {!listing.status ? 'ACTIVE' : listing.status}
                          </span>
                        </button>
                      )}
                      
                      <button className="text-orange-600 text-sm font-bold flex flex-shrink-0 items-center gap-1 hover:underline ml-2">
                        View <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-bold text-gray-900">{((activePage - 1) * pageSize) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(activePage * pageSize, totalCount)}</span> of <span className="font-bold text-gray-900">{totalCount}</span> listings
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActivePage(p => Math.max(1, p - 1))}
                      disabled={activePage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setActivePage(p => p + 1)}
                      disabled={activePage * pageSize >= totalCount}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'monetization' && (
            <motion.div 
              key="monetization"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Active Campaigns</h2>
                <button 
                  onClick={() => { setEditingAd(null); setShowAdModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
                >
                  <Plus size={18} />
                  New Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ads.map(ad => (
                  <div key={ad.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                          <img src={ad.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{ad.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ad.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ad.active ? 'Active' : 'Paused'}
                            </span>
                            <span className="text-xs text-gray-400">{ad.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingAd(ad); setShowAdModal(true); }}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Impressions</div>
                        <div className="text-lg font-bold text-gray-900">{ad.impressions || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Clicks</div>
                        <div className="text-lg font-bold text-gray-900">{ad.clicks || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">CTR</div>
                        <div className="text-lg font-bold text-gray-900">
                          {ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <a 
                        href={ad.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {ad.link} <ExternalLink size={12} />
                      </a>
                      <div className="text-xs text-gray-400">Priority: {ad.priority}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'pages' && (
            <motion.div 
              key="pages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center"
            >
              <Settings size={48} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">CMS Coming Soon</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                We're building a powerful content management system to help you manage static pages and blog posts directly from this dashboard.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAd ? 'Edit Campaign' : 'Create New Campaign'}
              </h3>
              <button onClick={() => setShowAdModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAdSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Campaign Title</label>
                  <input 
                    name="title" 
                    defaultValue={editingAd?.title}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Type</label>
                  <select 
                    name="type" 
                    defaultValue={editingAd?.type || 'card'}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="card">Card Ad</option>
                    <option value="banner">Banner Ad</option>
                    <option value="popup">Popup Ad</option>
                    <option value="tall">Tall Ad</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Landing Page URL</label>
                <input 
                  name="link" 
                  defaultValue={editingAd?.link}
                  required
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700">Image Upload</label>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Upload File</label>
                  <input 
                    type="file"
                    name="image_file" 
                    accept="image/*"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100" 
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs text-gray-400 font-medium">OR URL</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <div className="space-y-2">
                  <input 
                    type="url"
                    name="image_url" 
                    defaultValue={editingAd?.image}
                    placeholder="https://... (Image URL)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Priority (0-100)</label>
                  <input 
                    name="priority" 
                    type="number"
                    defaultValue={editingAd?.priority || 0}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Country Code (Optional)</label>
                  <input 
                    name="countryCode" 
                    placeholder="e.g. GH, NG"
                    defaultValue={editingAd?.countryCode}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input 
                    type="checkbox" 
                    name="active" 
                    id="active"
                    defaultChecked={editingAd ? editingAd.active : true}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" 
                  />
                  <label htmlFor="active" className="text-sm font-bold text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAdModal(false)}
                  className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-50 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="px-8 py-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    editingAd ? 'Update Campaign' : 'Launch Campaign'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
