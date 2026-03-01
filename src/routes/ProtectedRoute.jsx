import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Protects user (storefront) routes.
 * - Not logged in → redirect to /login
 * - Logged in as admin → block access (admin must use admin panel)
 * - Logged in as user → allow access
 */
const ProtectedRoute = () => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const restoring = useSelector((state) => state.auth.restoring);
  const location = useLocation();

  if (restoring) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user && user.role === 'admin') {
    if (location.pathname.startsWith('/product/')) {
      return <Outlet />;
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Access restricted
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            You are currently signed in as an admin. This page is only available in the customer
            storefront.
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
            Please sign out from the admin account or use a separate browser to access the customer
            experience.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
