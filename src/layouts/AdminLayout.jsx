import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useTheme } from '../context/ThemeContext';

const AdminLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { theme, toggleTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login', { replace: true });
  };

  const displayName = user?.name || 'Admin';

  const isAdminPath = (path) => {
    // Basic prefix match so detail pages under a section also mark its menu active
    if (!location?.pathname) return false;
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const linkBaseClasses =
    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-[0.875rem] transition-colors';
  const linkInactiveClasses =
    'text-slate-700 hover:bg-slate-100 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-primary-200';
  const linkActiveClasses =
    'bg-primary-50 text-primary-700 ring-1 ring-primary-500/40 dark:bg-slate-900 dark:text-primary-200';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Admin top bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/admin/dashboard"
            className="group inline-flex items-center text-2xl transition-colors"
          >
            <span className="font-extrabold tracking-tighter">
              <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500 bg-clip-text text-transparent group-hover:from-primary-200 group-hover:via-primary-300 group-hover:to-primary-400">
                Shop
              </span>
              <span className="text-slate-900 dark:text-white">EZ</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden flex-col text-right sm:flex">
              <span className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                Signed in as
              </span>
              <span className="text-[0.8rem] font-medium text-slate-900 dark:text-slate-100">
                {displayName}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 p-1.5 text-slate-700 hover:border-amber-400 hover:text-amber-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-amber-300"
            >
              <span className="sr-only">Toggle color theme</span>
              {theme === 'dark' ? (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4 4.2 19.8M19.8 4.2 18.4 5.6" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M21 12.8A9 9 0 0 1 11.2 3 6.5 6.5 0 1 0 21 12.8Z" />
                </svg>
              )}
            </button>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/15 text-primary-500 ring-1 ring-primary-500/40 dark:text-primary-300">
              {displayName
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-xl border border-red-500/70 bg-red-50 px-3 py-1.5 text-[0.75rem] font-medium text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20 sm:inline-flex"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 lg:hidden"
            >
              <span className="sr-only">Toggle navigation menu</span>
              {isMobileNavOpen ? (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      {isMobileNavOpen && (
        <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <nav className="grid gap-1 text-xs">
              <NavLink
                to="/admin/dashboard"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/dashboard')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  ⌁
                </span>
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/revenue"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/revenue')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  ₹
                </span>
                Revenue
              </NavLink>
              <NavLink
                to="/admin/orders"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/orders')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  📦
                </span>
                Orders
              </NavLink>
              <NavLink
                to="/admin/payments"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/payments')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  ⍰
                </span>
                Payments
              </NavLink>
              <NavLink
                to="/admin/products"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/products')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  🛍
                </span>
                Products
              </NavLink>
              <NavLink
                to="/admin/categories"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/categories')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  📁
                </span>
                Categories
              </NavLink>
              <NavLink
                to="/admin/coupons"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/coupons')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  %
                </span>
                Coupons
              </NavLink>
              <NavLink
                to="/admin/reviews"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/reviews')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  ★
                </span>
                Reviews
              </NavLink>
              <NavLink
                to="/admin/banners"
                onClick={() => setIsMobileNavOpen(false)}
                className={() =>
                  [
                    linkBaseClasses,
                    isAdminPath('/admin/banners')
                      ? linkActiveClasses
                      : linkInactiveClasses,
                  ].join(' ')
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  🖼
                </span>
                Banners
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleLogout();
                }}
                className="mt-2 flex w-full items-center justify-between rounded-xl border border-red-500/70 bg-red-50 px-3 py-2 text-[0.8rem] font-medium text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                <span>Logout</span>
                <span>⟶</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar + main content */}
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-16 pt-6 lg:flex-row lg:gap-6">
        <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300 lg:flex">
          <h2 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Navigation
          </h2>
          <nav className="space-y-1">
            <NavLink
              to="/admin/dashboard"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/dashboard')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                ⌁
              </span>
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/revenue"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/revenue')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                ₹
              </span>
              Revenue
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/orders')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                📦
              </span>
              Orders
            </NavLink>
            <NavLink
              to="/admin/payments"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/payments')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                ⍰
              </span>
              Payments
            </NavLink>
            <NavLink
              to="/admin/products"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/products')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                🛍
              </span>
              Products
            </NavLink>
            <NavLink
              to="/admin/categories"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/categories')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                📁
              </span>
              Categories
            </NavLink>
            <NavLink
              to="/admin/coupons"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/coupons')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                %
              </span>
              Coupons
            </NavLink>
            <NavLink
              to="/admin/reviews"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/reviews')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                ★
              </span>
              Reviews
            </NavLink>
            <NavLink
              to="/admin/banners"
              className={() =>
                [
                  linkBaseClasses,
                  isAdminPath('/admin/banners')
                    ? linkActiveClasses
                    : linkInactiveClasses,
                ].join(' ')
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                🖼
              </span>
              Banners
            </NavLink>
          </nav>
          <div className="pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-xl border border-red-500/70 bg-red-50 px-3 py-2 text-[0.8rem] font-medium text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              <span>Logout</span>
              <span>⟶</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

