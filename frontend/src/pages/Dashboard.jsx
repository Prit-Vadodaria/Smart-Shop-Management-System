import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../shared/context/AuthContext';
import { ShoppingBag, Users, Package, FileText, ArrowUpRight, TrendingUp, Settings as SettingsIcon, Save, AlertTriangle, RefreshCw, Clock, Truck, Play, Pause } from 'lucide-react';
import api from '../shared/services/api';

const StoreSettings = ({ setCustomAlert }) => {
  const [settings, setSettings] = useState({ shippingPercentage: 5, freeShippingThreshold: 500 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data.data);
      } catch (err) {
        console.error('Error fetching settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', settings);
      setCustomAlert('Settings updated successfully!');
    } catch (err) {
      console.error('Error saving settings', err);
      setCustomAlert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-40 bg-gray-50 rounded-xl"></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary-600" />
          Store Configuration
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2 shadow-sm"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Percentage (%)</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={settings.shippingPercentage}
              onChange={(e) => setSettings({ ...settings, shippingPercentage: parseFloat(e.target.value) })}
              className="w-full pl-4 pr-12 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <span className="absolute right-4 top-2 text-gray-400 font-bold">%</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Calculated as a percentage of the customer's total subtotal.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Free Shipping Threshold (₹)</label>
          <div className="relative">
            <input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <span className="absolute left-3 top-2 text-gray-400 font-bold">₹</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Shipping becomes ₹0 if the subtotal exceeds this value.</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, to }) => {
  const CardContent = (
    <>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend} from last month
          </p>
        )}
      </div>
      <div className="bg-primary-50 p-4 rounded-full text-primary-600 flex-shrink-0">
        <Icon className="h-6 w-6" />
      </div>
    </>
  );

  const containerClasses = "bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all h-full";

  if (to) {
    return (
      <Link to={to} className={`${containerClasses} hover:shadow-md hover:border-primary-200 cursor-pointer`}>
        {CardContent}
      </Link>
    );
  }

  return (
    <div className={containerClasses}>
      {CardContent}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [numberOfOrders, setNumberOfOrders] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isLowStockLoading, setIsLowStockLoading] = useState(false);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [myLists, setMyLists] = useState([]);
  const [customAlert, setCustomAlert] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [stats, setStats] = useState({
    totalInventoryValue: 0,
    totalProductsInStock: 0,
    totalCustomers: 0,
    activeSubscriptions: 0,
    mySubscriptions: 0
  });

  const fetchStats = async () => {
    if (user.role === 'admin') {
      try {
        const { data } = await api.get('/products/dashboard-stats');
        setStats(data.data);
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      }
    }
  };

  const fetchLowStock = async () => {
    if (user.role === 'admin') {
      try {
        setIsLowStockLoading(true);
        const { data } = await api.get('/products/low-stock');
        setLowStockProducts(data.data);
      } catch (err) {
        console.error('Error fetching low stock products', err);
      } finally {
        setIsLowStockLoading(false);
      }
    }
  };

  const fetchNumberOfOrdersofCustomer = async () => {
    if (user.role === 'customer') {
      try {
        const { data } = await api.get('/orders/myorders');
        setNumberOfOrders(data.length);
        setCustomerOrders(data);
      } catch (err) {
        console.error('Error fetching number of orders of customer', err);
      }
    }
  };

  const fetchMySubscriptionsCount = async () => {
    if (user.role === 'customer') {
      try {
        const { data } = await api.get('/subscriptions/my-lists');
        const activeCount = data.filter(l => l.items?.length > 0 && l.status === 'Active').length;
        setStats(prev => ({ ...prev, mySubscriptions: activeCount }));
        setMyLists(data);
      } catch (err) {
        console.error('Error fetching my subscriptions count', err);
      }
    }
  };

  const toggleListStatus = async (list) => {
    if (!list.items || list.items.length === 0) {
      setCustomAlert("Cannot start an empty list. Please add items first.");
      return;
    }
    try {
      const newStatus = list.status === 'Active' ? 'Paused' : 'Active';
      await api.put(`/subscriptions/${list._id}/settings`, { status: newStatus });
      setMyLists(myLists.map(l => l._id === list._id ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error('Error toggling list status', err);
      setCustomAlert(err.response?.data?.message || 'Failed to update list status');
    }
  };

  const fetchAssignedOrders = async () => {
    if (user.role === 'employee') {
      try {
        setIsOrdersLoading(true);
        const { data } = await api.get('/orders');
        const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAssignedOrders(sortedOrders);
      } catch (err) {
        console.error('Error fetching orders', err);
      } finally {
        setIsOrdersLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLowStock();
    fetchAssignedOrders();
    fetchStats();
    fetchNumberOfOrdersofCustomer();
    fetchMySubscriptionsCount();
  }, [user.role]);

  const handleCancelOrder = (orderId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
        try {
          await api.put(`/orders/${orderId}/cancel`);
          fetchNumberOfOrdersofCustomer();
          setCustomAlert('Order cancelled successfully.');
        } catch (err) {
          console.error('Error cancelling order:', err);
          setCustomAlert(err.response?.data?.message || 'Failed to cancel order.');
        }
      }
    });
  };

  const customerTotalSpent = customerOrders.reduce((acc, order) => acc + order.totalPrice, 0);
  const customerPendingOrdersCount = customerOrders.filter(o => ['Pending', 'Packed', 'Pickup Ready', 'Ready to deliver'].includes(o.status)).length;
  const cancellableOrders = customerOrders.filter(o => ['Pending', 'Packed'].includes(o.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-500 mt-2">
          Here's an overview of your activity today.
          {user.role === 'employee' && (
            <span className="ml-1 capitalize text-primary-600 font-medium">
              ({user.employeeType === 'manager' ? 'Manager' : 'Staff'})
            </span>
          )}
        </p>
      </div>

      {/* Low Stock Notification Banner */}
      {user.role === 'admin' && lowStockProducts.length > 0 && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6 shadow-sm animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900">Low Stock Alert</h2>
                <p className="text-red-700 text-sm font-medium">
                  {lowStockProducts.length} product(s) have reached their minimum stock threshold.
                </p>
              </div>
            </div>
            <button
              onClick={fetchLowStock}
              disabled={isLowStockLoading}
              className="text-red-500 hover:text-red-700 transition-colors p-2"
              title="Refresh stock status"
            >
              <RefreshCw className={`h-5 w-5 ${isLowStockLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {lowStockProducts.map(product => (
              <div key={product._id} className="bg-white/60 border border-red-100 rounded-lg p-3 flex justify-between items-center group hover:bg-white transition-all">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                  <p className="text-xs text-red-600 font-black">Stock: {product.countInStock} (Min: {product.minStockThreshold})</p>
                </div>
                <a
                  href="/products"
                  className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 p-1.5 rounded-md hover:bg-red-100"
                  title="Update Stock"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === 'admin' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Inventory Value" value={`₹${stats.totalInventoryValue.toLocaleString()}`} icon={ShoppingBag} to="/products" />
            <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={FileText} to="/subscriptions" />
            <StatCard title="Products in Stock" value={stats.totalProductsInStock.toLocaleString()} icon={Package} to="/products" />
            <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} />
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            {/* Store Configuration Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <StoreSettings setCustomAlert={setCustomAlert} />
            </div>
          </div>
        </>
      ) : user.role === 'employee' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title={user.employeeType === 'manager' ? 'Store Orders' : 'Assigned Orders'}
              value={assignedOrders.length}
              icon={ShoppingBag}
              to="/store-orders"
            />
            <StatCard
              title="Pending"
              value={assignedOrders.filter(o => ['Pending', 'Packed', 'Pickup Ready', 'Ready to deliver'].includes(o.status)).length}
              icon={Clock}
              to="/store-orders"
            />
            <StatCard
              title="Deliveries"
              value={assignedOrders.filter(o => ['Out for delivery', 'Delivered'].includes(o.status)).length}
              icon={Truck}
              to="/store-orders?tab=completed"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-6 w-6 text-primary-600" />
                {user.employeeType === 'manager' ? 'Store Orders Overview' : 'My Assigned Orders'}
              </h3>
              <a href="/store-orders" className="btn-primary py-1.5 px-4 text-xs">
                Manage All Orders
              </a>
            </div>

            {isOrdersLoading ? (
              <div className="p-12 text-center text-gray-500 font-medium">Loading your orders...</div>
            ) : assignedOrders.length === 0 ? (
              <div className="p-16 text-center">
                <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Package className="h-8 w-8 text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">
                  {user.employeeType === 'manager' ? 'No Store Orders' : 'No Orders Assigned'}
                </h4>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">
                  {user.employeeType === 'manager'
                    ? 'There are no orders in the system right now.'
                    : "You don't have any orders assigned for processing at the moment."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assignedOrders.slice(0, 3).map((order) => (
                  <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'Delivered' || order.status === 'Picked Up' ? 'bg-green-100 text-green-700' :
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Customer: <span className="text-gray-900">{order.customer?.name}</span></p>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div className="hidden sm:block">
                          <p className="text-xs text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Items</p>
                          <p className="text-sm font-bold text-gray-900">{order.orderItems.length} Product(s)</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Subtotal</p>
                          <p className="text-lg font-black text-gray-900">₹{order.totalPrice}</p>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Customer Dashboard
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Spent" value={`₹${customerTotalSpent.toLocaleString()}`} icon={ShoppingBag} />
            <StatCard title="Total Orders" value={customerOrders.length} icon={Package} to="/my-orders" />
            <StatCard title="Pending Orders" value={customerPendingOrdersCount} icon={Clock} to="/my-orders?status=pending" />
          </div>

          {/* Pending Orders Section */}
          {cancellableOrders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary-600" />
                  Pending Orders
                </h3>
                <Link to="/my-orders" className="btn-primary py-1.5 px-4 text-xs">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {cancellableOrders.map(order => (
                  <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'Packed' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{order.orderItems.length} Product(s)</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Subtotal</p>
                          <p className="text-lg font-black text-gray-900">₹{order.totalPrice.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-all border border-red-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary-600" />
                My Active Lists
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {myLists.length > 0 ? (
                myLists.map(list => {
                  const isListEmpty = !list.items || list.items.length === 0;
                  const displayStatus = isListEmpty ? 'Inactive' : list.status;
                  const isActive = list.status === 'Active' && !isListEmpty;

                  return (
                    <div key={list._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-gray-900 text-lg truncate">{list.type} Delivery</h4>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {list.items?.slice(0, 3).map(item => (
                              <span key={item.product._id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-medium border border-gray-200">
                                {item.product.name} <span className="text-gray-400">x{item.quantity}</span>
                              </span>
                            ))}
                            {list.items?.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                                +{list.items.length - 3} more
                              </span>
                            )}
                            {isListEmpty && (
                              <span className="text-xs text-gray-400 italic">No items in this list</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                          <span className={`whitespace-nowrap flex-shrink-0 text-[10px] uppercase font-black px-2 py-1 rounded-full ${displayStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {displayStatus}
                          </span>
                          <button
                            onClick={() => toggleListStatus(list)}
                            className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${isActive ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                          >
                            {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            {isActive ? 'Pause' : (list.status === 'Paused' && !isListEmpty ? 'Resume' : 'Start')}
                          </button>
                          <Link
                            to="/my-subscriptions"
                            state={{ tab: list.type }}
                            className="flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-center"
                          >
                            Edit List
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-12 text-center">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No subscription lists found.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom Alert Modal */}
      {customAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Notice</h3>
            <p className="text-gray-500 font-medium mb-6">{customAlert}</p>
            <button
              onClick={() => setCustomAlert('')}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-500 font-medium mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
              >
                No, Keep it
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
