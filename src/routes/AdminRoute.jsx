import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Protects admin routes.
 * - Not logged in → redirect to /admin/login
 * - Logged in as user → redirect to / (403 - wrong role)
 * - Logged in as admin → allow access
 */
const AdminRoute = () => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const restoring = useSelector((state) => state.auth.restoring);
  const location = useLocation();

  if (restoring) {
    return null;
  }

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;

