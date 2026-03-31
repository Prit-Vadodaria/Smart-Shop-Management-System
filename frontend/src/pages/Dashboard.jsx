import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag, Users, Package, FileText, ArrowUpRight, TrendingUp, Settings as SettingsIcon, Save } from 'lucide-react';
import api from '../services/api';

const StoreSettings = () => {
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
      alert('Settings updated successfully!');
    } catch (err) {
      console.error('Error saving settings', err);
      alert('Failed to save settings');
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

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
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
    <div className="bg-primary-50 p-4 rounded-full text-primary-600">
      <Icon className="h-6 w-6" />
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-500 mt-2">
          Here's an overview of your activity today. role: {user.role}
        </p>
      </div>

      {user.role === 'Admin' || user.role === 'Manager' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Revenue" value="₹45,231" icon={ShoppingBag} trend="+12%" />
            <StatCard title="Active Subscriptions" value="128" icon={FileText} trend="+5%" />
            <StatCard title="Products in Stock" value="1,245" icon={Package} />
            <StatCard title="Total Customers" value="842" icon={Users} trend="+2%" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                  View all <ArrowUpRight className="h-4 w-4 ml-1" />
                </a>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Order #ORD-{3042 + i}</p>
                      <p className="text-sm text-gray-500">2 items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{450 + (i * 120)}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Configuration Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <StoreSettings />
            </div>
          </div>
        </>
      ) : user.role === 'Staff' ? (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center cursor-pointer hover:bg-primary-50 transition-colors">
            <ShoppingBag className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold">New POS Bill</h3>
            <p className="text-gray-500 mt-2">Start a new point of sale transaction.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center cursor-pointer hover:bg-primary-50 transition-colors">
            <Package className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold">Today's Deliveries</h3>
            <p className="text-gray-500 mt-2">View and manage orders out for delivery.</p>
          </div>
        </div>
      ) : (
        // Customer Dashboard
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Wallet Balance" value="₹120" icon={ShoppingBag} />
          <StatCard title="Active Subscriptions" value="2" icon={FileText} />
          <StatCard title="Total Orders" value="15" icon={Package} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
