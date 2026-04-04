import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Products from './pages/Products';

import { CartProvider } from './context/CartContext';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import StoreOrders from './pages/StoreOrders';
import MySubscriptions from './pages/MySubscriptions';
import AdminSubscriptions from './pages/AdminSubscriptions';

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/shop" element={
              <ProtectedRoute roles={['Customer']}>
                <Shop />
              </ProtectedRoute>
            } />

            <Route path="/cart" element={
              <ProtectedRoute roles={['Customer']}>
                <Cart />
              </ProtectedRoute>
            } />

            <Route path="/checkout" element={
              <ProtectedRoute roles={['Customer']}>
                <Checkout />
              </ProtectedRoute>
            } />

            <Route path="/my-orders" element={
              <ProtectedRoute roles={['Customer']}>
                <MyOrders />
              </ProtectedRoute>
            } />

            <Route path="/products" element={
              <ProtectedRoute roles={['Admin', 'Manager', 'Staff']}>
                <Products />
              </ProtectedRoute>
            } />

            <Route path="/store-orders" element={
              <ProtectedRoute roles={['Admin', 'Manager', 'Staff']}>
                <StoreOrders />
              </ProtectedRoute>
            } />

            <Route path="/my-subscriptions" element={
              <ProtectedRoute roles={['Customer']}>
                <MySubscriptions />
              </ProtectedRoute>
            } />

            <Route path="/subscriptions" element={
              <ProtectedRoute roles={['Admin', 'Manager']}>
                <AdminSubscriptions />
              </ProtectedRoute>
            } />

            {/* Add more routes for orders, subscriptions, etc. */}
            <Route path="*" element={<div className="text-center p-10"><h2 className="text-2xl font-bold">404 - Page Not Found</h2></div>} />
          </Routes>
        </main>
      </div>
    </CartProvider>
  );
}

export default App;
