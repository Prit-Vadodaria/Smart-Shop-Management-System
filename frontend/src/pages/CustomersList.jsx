import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../shared/services/api';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  CreditCard,
  UserCheck,
  Ban,
  ArrowUpDown
} from 'lucide-react';

const CustomersList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [stats, setStats] = useState({
    total: 0,
    activeSubscribers: 0,
    activeAccounts: 0
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/customers', {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder
        }
      });
      setCustomers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCustomers(data.total || 0);

      // Compute quick stats based on current view or basic averages
      const activeSubs = (data.data || []).filter(c => c.activeSubscription).length;
      const activeAccts = (data.data || []).filter(c => c.status === 'Active').length;
      setStats({
        total: data.total || 0,
        activeSubscribers: activeSubs, // representative of list
        activeAccounts: activeAccts
      });
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 300); // Debounce search
    return () => clearTimeout(delayDebounce);
  }, [search, page, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Helper to generate initials for avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <Users className="h-9 w-9 text-primary-600" />
              Customers
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, email, phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-medium"
              />
            </div>
            <button
              onClick={fetchCustomers}
              className="p-3 text-slate-500 hover:text-primary-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Customers</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalCustomers}</p>
            </div>
            <div className="bg-primary-50 p-3.5 rounded-2xl text-primary-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Subscribers</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {customers.filter(c => c.activeSubscription).length}
              </p>
            </div>
            <div className="bg-green-50 p-3.5 rounded-2xl text-green-600">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Accounts</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                {customers.filter(c => c.status === 'Active').length}
              </p>
            </div>
            <div className="bg-indigo-50 p-3.5 rounded-2xl text-indigo-600">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Desktop and Tablet Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xl overflow-hidden mb-6 hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1.5">
                      Customer
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('email')}>
                    <span className="flex items-center gap-1.5">
                      Email
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('totalOrders')}>
                    <span className="flex items-center justify-center gap-1.5">
                      Orders
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('totalSpent')}>
                    <span className="flex items-center justify-end gap-1.5">
                      Total Spent
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('createdAt')}>
                    <span className="flex items-center justify-end gap-1.5">
                      Joined On
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-10 w-10 bg-slate-200 rounded-full inline-block mr-3 align-middle"></div><div className="h-4 w-28 bg-slate-200 rounded inline-block align-middle"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-40 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-8 bg-slate-200 rounded mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-200 rounded-full mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-200 rounded-full mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-200 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-16 text-center text-slate-400">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-40 animate-bounce" />
                      <p className="font-semibold text-lg text-slate-700">No Customers Found</p>
                      <p className="text-sm mt-1">Try relaxing your search terms or filters.</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => navigate(`/admin/customers/${c._id}`)}
                      className="hover:bg-primary-50/30 transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-105 transition-transform duration-200">
                            {getInitials(c.name)}
                          </div>
                          <span className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {c.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {c.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-900">
                        {c.totalOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                        ₹{c.totalSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${c.activeSubscription
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}
                        >
                          {c.activeSubscription ? 'Active Sub' : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${c.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-500 font-semibold">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: Stacked Cards */}
        <div className="md:hidden space-y-4 mb-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
                <div className="flex gap-4">
                  <div className="h-4 w-12 bg-slate-200 rounded"></div>
                  <div className="h-4 w-16 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))
          ) : customers.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-slate-700">No Customers Found</p>
            </div>
          ) : (
            customers.map((c) => (
              <div
                key={c._id}
                onClick={() => navigate(`/admin/customers/${c._id}`)}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm active:bg-slate-50 transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shadow-inner">
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">{c.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{c.customerId}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${c.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-red-50 text-red-700 border border-red-100'
                      }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="truncate"><span className="font-bold text-slate-400">Email:</span> {c.email}</p>
                  <p><span className="font-bold text-slate-400">Phone:</span> {c.phone}</p>
                </div>

                <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Orders</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{c.totalOrders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Spent</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">₹{c.totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {c.activeSubscription && (
                  <span className="absolute top-0 right-0 bg-green-500 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-bl-lg shadow-sm">
                    Subscribed
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 border border-slate-100 p-4 rounded-2xl shadow-sm backdrop-blur-sm">
            <p className="text-xs font-semibold text-slate-500">
              Showing page <span className="text-slate-900 font-bold">{page}</span> of{' '}
              <span className="text-slate-900 font-bold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="btn-secondary px-3.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="btn-secondary px-3.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersList;
