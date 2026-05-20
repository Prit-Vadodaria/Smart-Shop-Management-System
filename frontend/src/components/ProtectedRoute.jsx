import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../shared/context/AuthContext';

const isManagerOrAdmin = (user) => {
  const role = (user?.role || '').toLowerCase();
  return role === 'admin' || (role === 'employee' && user?.employeeType === 'manager');
};

const ProtectedRoute = ({ children, roles, requireManager }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user.role || '').toLowerCase();

  if (requireManager && !isManagerOrAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (roles && !roles.map((r) => r.toLowerCase()).includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export { isManagerOrAdmin };

export default ProtectedRoute;
