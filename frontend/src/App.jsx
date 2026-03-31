import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Products from './pages/Products';

function App() {
  return (
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

          <Route path="/products" element={
            <ProtectedRoute roles={['Admin', 'Manager', 'Staff']}>
              <Products />
            </ProtectedRoute>
          } />

          {/* Add more routes here for orders, subscriptions, customers, settings... */}
          
          <Route path="*" element={<div className="text-center p-10"><h2 className="text-2xl font-bold">404 - Page Not Found</h2></div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
