import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../shared/services/api';
import { useRealtimeEvent } from '../shared/realtime/useRealtimeEvent.js';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldAlert,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Clock,
  TrendingUp,
  FileText,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Truck,
  ExternalLink
} from 'lucide-react';

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/customers/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to fetch customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  useRealtimeEvent(
    (event) => ['customer:changed', 'auth:changed', 'order:changed', 'subscription:changed', 'dashboard:changed'].includes(event.event),
    () => {
      fetchCustomerDetails();
    }
  );

  const handleToggleStatus = async () => {
    if (!data?.customer) return;
    try {
      setStatusUpdating(true);
      const newStatus = !data.customer.isActive;
      await api.put(`/admin/customers/${id}/status`, { isActive: newStatus });
      setData(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          isActive: newStatus
        }
      }));
      showToast('success', `Customer account successfully ${newStatus ? 'activated' : 'suspended'}.`);
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Profile Not Found</h2>
        <p className="text-slate-500 mt-2">The requested customer could not be found or you don't have access.</p>
        <button onClick={() => navigate('/admin/customers')} className="btn-primary mt-6 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </button>
      </div>
    );
  }

  const { customer, analytics, subscriptions, recentOrders, pendingPayments, activity } = data;

  const initials = customer.name ? customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back Link */}
        <button
          onClick={() => navigate('/admin/customers')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Customers
        </button>

        {/* Toast Alerts */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border backdrop-blur-sm shadow-sm ${message.type === 'success'
              ? 'bg-green-50/80 text-green-800 border-green-200'
              : 'bg-red-50/80 text-red-800 border-red-200'
              }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            )}
            <p className="font-semibold text-sm">{message.text}</p>
          </div>
        )}

        {/* Profile Header Block */}
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-3xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl shadow-inner border border-primary-200">
                {initials}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{customer.name}</h1>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${customer.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {customer.isActive ? 'Active Status' : 'Suspended'}
                  </span>
                  {analytics.activeSubscriptions > 0 && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-black bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                      Subscribed
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-2 px-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {customer.email}
                  </span>

                  <span className="flex items-center gap-2 px-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {customer.phone}
                  </span>

                  <span className="flex items-center gap-2 px-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase p-2">ID: {customer.customerId}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleToggleStatus}
                disabled={statusUpdating}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 border ${customer.isActive
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
              >
                {customer.isActive ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                {customer.isActive ? 'Suspend Account' : 'Unsuspend Account'}
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm min-h-[100px] flex flex-col justify-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">Total Spent</p>
              <p className="text-xl font-black text-slate-900 mt-1">₹{analytics.totalSpent.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm min-h-[100px] flex flex-col justify-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">Total Orders</p>
              <p className="text-xl font-black text-slate-900 mt-1">{analytics.totalOrders}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm min-h-[100px] flex flex-col justify-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">Joined On</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden min-h-[100px] flex flex-col justify-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">Subscription Dues</p>
              <p className={`text-xl font-black mt-1 ${analytics.pendingSubscriptionAmount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                ₹{analytics.pendingSubscriptionAmount.toLocaleString('en-IN')}
              </p>
            </div>
            {analytics.pendingSubscriptionAmount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm min-h-[100px] flex flex-col justify-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">Avg Order Value</p>
              <p className="text-xl font-black text-indigo-700 mt-1">₹{Math.round(analytics.averageOrderValue).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm min-h-[100px] flex flex-col justify-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">Last Order Date</p>
              <p className="text-sm font-black text-slate-700 mt-1">
                {analytics.lastOrderDate
                  ? new Date(analytics.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : 'No Orders'}
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">
                {analytics.lastOrderDate
                  ? new Date(analytics.lastOrderDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content Tabs / Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left / Middle: Subscription & Orders details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Pending Payments Alert Block */}
            {pendingPayments.length > 0 && (
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wider mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Outstanding Dues ({pendingPayments.length})
                </h3>
                <div className="divide-y divide-amber-100/50 space-y-3">
                  {pendingPayments.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pt-3 first:pt-0">
                      <div>
                        <p className="font-bold text-amber-900">
                          {p.orderChannel} Order Dues
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          Order Date: {new Date(p.dueDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-900 text-sm">₹{p.amount.toFixed(2)}</p>
                        <span className="inline-block mt-1 text-[9px] uppercase font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription Overview Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden min-h-[530px] overflow-y-auto custom-scrollbar">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  Subscription Lists
                </h3>
                <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Total: {subscriptions.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 p-6 space-y-6">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-sm">No active lists or subscriptions.</p>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div key={sub._id} className="first:pt-0 pt-6 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            {sub.type} Subscription
                            <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${{ 'Active': 'bg-green-100 text-green-700', 'Paused': 'bg-yellow-100 text-yellow-700', 'Inactive': 'bg-red-100 text-red-700' }[sub.status]}`}>
                              {sub.status}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">Started on {new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        {sub.vacationMode?.isOn && (
                          <span className="text-[10px] uppercase font-black bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-lg">
                            Vacation Mode On
                          </span>
                        )}
                      </div>

                      {/* Items Row */}
                      <div className="flex flex-wrap gap-2.5">
                        {sub.items?.map((item, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-sm text-xs font-semibold text-slate-700">
                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-black">x{item.quantity}</span>
                            <span>{item.product?.name || 'Unknown Product'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Additional Delivery Config for Daily / Alternate */}
                      {sub.customDates?.length > 0 && (
                        <div className="text-xs font-semibold text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          <p className="uppercase text-[9px] font-black text-slate-400 tracking-wider">Scheduled Delivery Dates</p>
                          <p className="mt-1 flex flex-wrap gap-1.5">
                            {sub.customDates.map((dateNum) => (
                              <span key={dateNum} className="bg-white border border-slate-100 rounded-md px-2 py-0.5 shadow-sm text-[10px]">
                                {dateNum}th
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary-600" />
                  Recent Store Orders
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto custom-scrollbar relative">
                {recentOrders.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <ShoppingBag className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-sm">No orders recorded for this customer.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Type</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Payment</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[0.92rem] leading-[1.45] font-medium text-slate-700">
                      {[...recentOrders]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 10)
                        .map((o) => (
                          <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-900 uppercase">
                              #{o._id.toString().substring(o._id.length - 8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${o.orderChannel === 'Subscription Order' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                {o.orderChannel || 'Regular'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                              ₹{o.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${o.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {o.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${o.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

          {/* Right side: Activity Timeline */}
          <div className="space-y-8">

            {/* Addresses Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary-600" />
                  Address Book
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {customer.addresses?.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No shipping addresses saved.</p>
                ) : (
                  customer.addresses?.map((addr) => (
                    <div key={addr._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 text-[0.92rem] leading-[1.45] space-y-1.5 relative">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-[10px] uppercase text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                          {addr.tag}
                        </span>
                        {addr.isDefaultDelivery && (
                          <span className="text-[9px] font-extrabold uppercase text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 mt-1">{addr.fullName}</p>
                      <p className="text-slate-600 font-semibold">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p className="text-slate-500 font-semibold">{addr.addressLine2}</p>}
                      <p className="text-slate-600 font-bold">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-slate-400 font-semibold">Phone: {addr.phoneNumber}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Timeline Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-600" />
                  Activity Timeline
                </h3>
              </div>
              <div className="p-6 space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar relative">
                {activity.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No recent activity.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-4">
                    {[...activity]
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .slice(0, 10)
                      .map((act, idx) => (
                        <div key={idx} className="relative pl-5">
                          {/* Bullet point icon/color based on type */}
                          <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-4 border-white bg-primary-500 shadow-sm"></span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{act.title}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{act.description}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">
                              {new Date(act.timestamp).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })} at {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomerProfile;
