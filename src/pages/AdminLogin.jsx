import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser, clearAuthMessages, logout } from '../redux/authSlice';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, loading, error, success } = useSelector((s) => s.auth);
  const from = location.state?.from || '/admin/dashboard';
  const safeFrom = from.startsWith('/admin') ? from : '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    dispatch(clearAuthMessages());
    return () => dispatch(clearAuthMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!token) return;
    if (user && user.role === 'admin') {
      navigate(safeFrom, { replace: true });
    } else if (user && user.role === 'user') {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate, safeFrom]);

  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => dispatch(clearAuthMessages()), 2500);
      return () => clearTimeout(t);
    }
  }, [success, error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const result = await dispatch(
        loginUser({ email: email.trim(), password })
      ).unwrap();

      const loggedIn = result.user;

      if (!loggedIn || loggedIn.role !== 'admin') {
        dispatch(logout());
        alert('This account is not an admin user.');
        return;
      }

      navigate(safeFrom, { replace: true });
    } catch (_) {
      // error state handled by auth slice
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Background: mesh gradient + radial glow */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.08),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_0%,rgba(6,182,212,0.08),transparent)] dark:bg-[radial-gradient(ellipse_60%_60%_at_100%_0%,rgba(6,182,212,0.04),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,23,42,0.02)_100%)] dark:bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.2)_100%)]"
        aria-hidden="true"
      />

      {/* Left branding panel - hidden on mobile */}
      <aside className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-10 lg:flex xl:p-14">
        <div
          className={`transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <Link
            to="/"
            className="group inline-flex items-center text-4xl transition-colors"
          >
            <span className="font-extrabold tracking-tighter">
              <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500 bg-clip-text text-transparent group-hover:from-primary-200 group-hover:via-primary-300 group-hover:to-primary-400">Shop</span>
              <span className="text-black dark:text-white">EZ</span>
            </span>
          </Link>
        </div>

        <div
          className={`space-y-6 transition-all duration-700 ease-out delay-150 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Admin Dashboard
          </h2>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">
            Manage products, orders, and your store from one secure control
            center.
          </p>
          {/* Abstract grid illustration */}
          <div className="relative mt-8 h-48 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30">
            <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(135deg,transparent_40%,rgba(6,182,212,0.06)_100%)]" />
            <svg
              className="absolute inset-0 h-full w-full opacity-30"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="admin-login-grid"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#admin-login-grid)" />
            </svg>
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 flex-1 rounded-lg bg-slate-700/60 backdrop-blur animate-bar-in"
                  style={{
                    '--bar-opacity': 1 - i * 0.15,
                    animationDelay: `${400 + i * 120}ms`,
                    animationFillMode: 'forwards',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 text-xs text-slate-500 transition-all duration-700 ease-out delay-300 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <svg
            className="h-4 w-4 text-emerald-500/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          <span>Secure admin access</span>
        </div>
      </aside>

      {/* Right: login form */}
      <main className="relative flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-12 xl:px-16">
        <div
          className={`w-full max-w-md transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          {/* Mobile branding */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-500/30">
              <svg
                className="h-6 w-6 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              ShopEZ Admin
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Sign in to your dashboard
            </p>
          </div>

          {/* Glassmorphism card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] sm:p-8">
            {/* Desktop form header */}
            <div className="mb-6 hidden lg:block">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Sign in to access the admin dashboard
              </p>
            </div>

            {error && (
              <div className="mb-4">
                <Alert variant="error">{error}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@shopez.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Forgot password? Contact support
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={rememberMe ? 'current-password' : 'off'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus:ring-primary-400/30"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500/30 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-primary-400/30"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-primary-500/25 transition-all duration-200 hover:bg-primary-400 hover:shadow-xl hover:shadow-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:hover:shadow-lg dark:focus:ring-offset-slate-900"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-center dark:border-slate-700/80 dark:bg-slate-800/30">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Need an admin account?{' '}
                <Link
                  to="/admin/register"
                  className="font-semibold text-primary-600 transition-colors hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Create one
                </Link>
                {' · '}
                <Link
                  to="/"
                  className="font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Back to store
                </Link>
              </p>
            </div>
          </div>

          {/* Security badge - desktop */}
          <div className="mt-6 hidden items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 lg:flex">
            <svg
              className="h-4 w-4 text-emerald-500/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span>Secure admin access</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
