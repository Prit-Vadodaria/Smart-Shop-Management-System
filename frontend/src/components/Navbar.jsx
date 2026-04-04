import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Menu, X, ShoppingBag, User, LogOut, ShoppingCart } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartTotalCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
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
                  {user.role === 'Customer' && (
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
                  )}
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
            {user && user.role === 'Customer' && (
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
