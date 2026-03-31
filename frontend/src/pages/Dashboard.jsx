import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag, Users, Package, FileText, ArrowUpRight, TrendingUp } from 'lucide-react';

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                  Inventory <ArrowUpRight className="h-4 w-4 ml-1" />
                </a>
              </div>
              <div className="space-y-4">
                 {[
                   { name: 'Organic Milk 1L', stock: 4, min: 10 },
                   { name: 'Brown Bread', stock: 2, min: 15 },
                   { name: 'Fresh Eggs (Dozen)', stock: 5, min: 20 }
                 ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-red-600">Only {item.stock} left (Min: {item.min})</p>
                    </div>
                    <button className="text-sm px-3 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 shadow-sm">
                      Restock
                    </button>
                  </div>
                ))}
              </div>
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

            <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Recent Active Subscriptions</h3>
                <div className="divide-y divide-gray-100">
                    <div className="py-4 flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold">Fresh Farm Milk (1L)</p>
                                <p className="text-sm text-gray-500">Daily Delivery • Qty: 2</p>
                            </div>
                        </div>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Active</span>
                    </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
