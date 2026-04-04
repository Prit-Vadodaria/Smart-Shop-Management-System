import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Menu, X, ShoppingBag, User, LogOut, Bell, ShoppingCart } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartTotalCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const { data } = await api.get('/notifications');
          setNotifications(data);
        } catch (err) {
          console.error('Failed to fetch notifications', err);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <ShoppingBag className="h-8 w-8 text-primary-600" />
              <span className="ml-2 font-bold text-xl text-gray-900 tracking-tight">ShopManage</span>
            </div>

            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/dashboard" className="border-transparent text-gray-500 hover:border-primary-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                {(user.role === 'Admin' || user.role === 'Manager') && (
                  <>
                    <Link to="/products" className="border-transparent text-gray-500 hover:border-primary-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                      Products
                    </Link>
                    <Link to="/subscriptions" className="border-transparent text-gray-500 hover:border-primary-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                      Subscriptions
                    </Link>
                  </>
                )}
                {(user.role === 'Admin' || user.role === 'Manager' || user.role === 'Staff') && (
                  <Link to="/store-orders" className="border-transparent text-gray-500 hover:border-primary-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                    Orders & POS
                  </Link>
                )}
                {user.role === 'Customer' && (
                  <>
                    <Link to="/shop" className="border-transparent text-gray-500 hover:border-primary-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                      Shop
                    </Link>
                    <Link to="/my-subscriptions" className="border-transparent text-gray-500 hover:border-primary-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                      My Auto-Delivery
                    </Link>
                    <Link to="/my-orders" className="border-transparent text-gray-500 hover:border-primary-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                      My Orders
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notification & Cart Icons */}
                <div className="flex items-center space-x-4 pr-4 border-r border-gray-200">
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-1 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400"></span>
                      )}
                      <Bell className="h-6 w-6" />
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                          {unreadCount > 0 && <span className="text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">No notifications</div>
                          ) : (
                            notifications.map(n => (
                              <div 
                                key={n._id} 
                                onClick={() => handleMarkAsRead(n._id)}
                                className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary-50/30' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <p className={`text-xs font-bold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                                  <span className="text-[9px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/cart')}
                    className="relative p-1 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {cartTotalCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 px-1 py-1 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                        {cartTotalCount}
                      </span>
                    )}
                    <ShoppingCart className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <div className="bg-primary-100 p-2 rounded-full text-primary-600">
                    <User className="h-4 w-4" />
                  </div>
                  <span>{user.name} ({user.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex items-center gap-2 sm:hidden">
            {user && (
              <button
                onClick={() => navigate('/cart')}
                className="relative p-1 rounded-full text-gray-400 hover:text-primary-600 transition-colors focus:outline-none"
              >
                {cartTotalCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 px-1 py-1 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                    {cartTotalCount}
                  </span>
                )}
                <ShoppingCart className="h-6 w-6" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden border-t border-gray-100">
          <div className="pt-2 pb-3 space-y-1 bg-white">
            {user ? (
              <>
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm font-medium text-gray-500 truncate">{user.email}</p>
                </div>
                <Link to="/dashboard" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                  Dashboard
                </Link>
                {(user.role === 'Admin' || user.role === 'Manager') && (
                  <>
                    <Link to="/products" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                      Products
                    </Link>
                    <Link to="/subscriptions" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                      Subscriptions
                    </Link>
                  </>
                )}
                {(user.role === 'Admin' || user.role === 'Manager' || user.role === 'Staff') && (
                  <Link to="/store-orders" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                    Orders & POS
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                  Log in
                </Link>
                <Link to="/register" className="block px-4 py-2 text-base font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
