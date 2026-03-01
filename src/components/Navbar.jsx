import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { logout } from '../redux/authSlice';
import { selectWishlistCount } from '../redux/wishlistSlice';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);
  const cartCount = useSelector((s) =>
    s.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useSelector(selectWishlistCount);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/api/products', {
          params: { search: query.trim(), limit: 5 },
        });
        if (!active) return;
        setSuggestions(res.data?.products || []);
      } catch (e) {
        if (!active) return;
        setSuggestions([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const hasSuggestions = useMemo(
    () => suggestions && suggestions.length > 0,
    [suggestions]
  );

  const handleSelectSuggestion = (product) => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    navigate(`/product/${product.id || product._id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (token) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const authActions = token ? (
    <button
      onClick={handleLogout}
  className="text-xs sm:text-sm font-medium text-red-500 dark:text-red-400"
    >
      Logout
    </button>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="text-xs sm:text-sm font-medium text-slate-200 hover:text-primary-300 transition-colors"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="hidden sm:inline-flex rounded-lg bg-primary-500 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-primary-400 transition-colors"
      >
        Sign up
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="flex flex-1 items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/80 lg:hidden"
            onClick={() => setShowMobile((v) => !v)}
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link
            to="/"
            className="group inline-flex items-center text-2xl transition-colors"
          >
            <span className="font-extrabold tracking-tighter">
              <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500 bg-clip-text text-transparent group-hover:from-primary-200 group-hover:via-primary-300 group-hover:to-primary-400">Shop</span>
              <span className="text-slate-900 dark:text-white">EZ</span>
            </span>
          </Link>
        </div>

        <div className="relative hidden flex-[2] items-center md:flex">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search products..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-50"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="6" />
                  <path d="m16 16 4 4" />
                </svg>
              </span>
            </div>
          </form>

          {open && (isLoading || hasSuggestions) && (
            <div className="absolute top-full z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl dark:border-slate-800 dark:bg-slate-950/95">
              {isLoading && (
                <div className="px-2 py-2 text-xs text-slate-400">
                  Searching...
                </div>
              )}
              {!isLoading && hasSuggestions && (
                <ul className="divide-y divide-slate-800">
                  {suggestions.map((p) => (
                    <li
                      key={p.id || p._id}
                      className="cursor-pointer px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/80"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(p);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-slate-900 dark:text-slate-100">
                          {p.name}
                        </span>
                        {(p.price != null ||
                          p.bannerDiscountPrice != null ||
                          p.discountPrice != null) && (
                          <span className="text-xs text-slate-400">
                            ₹
                            {(
                              p.bannerDiscountPrice ??
                              p.discountPrice ??
                              p.price ??
                              0
                            ).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!isLoading && !hasSuggestions && query.trim() && (
                <div className="px-3 py-2 text-xs text-slate-500">
                  No matches found.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 p-1.5 text-slate-700 hover:border-amber-400 hover:text-amber-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-amber-300"
          >
            <span className="sr-only">Toggle color theme</span>
            {theme === 'dark' ? (
              <svg
                className="h-5 w-5"
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
                className="h-5 w-5"
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
          <button
            type="button"
            onClick={() => navigate('/wishlist')}
            className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-1.5 text-slate-700 hover:border-rose-400/70 hover:text-rose-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-rose-300"
          >
            <span className="sr-only">Open wishlist</span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M12 20.5s-5.5-3.2-8.4-6.1A4.7 4.7 0 0 1 7 5.2 4.9 4.9 0 0 1 12 7a4.9 4.9 0 0 1 5-1.8 4.7 4.7 0 0 1 3.4 9.2c-2.9 2.9-8.4 6.1-8.4 6.1Z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-semibold text-slate-950 transition-transform duration-150">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-1.5 text-slate-700 hover:border-primary-500/60 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-primary-300"
          >
            <span className="sr-only">Open cart</span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="9" cy="21" r="1.5" />
              <circle cx="18" cy="21" r="1.5" />
              <path d="M3 4h2l2.4 10.2A1.6 1.6 0 0 0 9 16h9a1.6 1.6 0 0 0 1.6-1.3L21 8H7" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-primary-500 px-1 text-[0.65rem] font-semibold text-slate-950">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleProfileClick}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-1.5 text-slate-700 hover:border-emerald-400/70 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-emerald-300"
          >
            <span className="sr-only">
              {token ? 'Open profile' : 'Go to login'}
            </span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="3.2" />
              <path d="M6 18.5c0-2.6 2.7-4.5 6-4.5s6 1.9 6 4.5" />
            </svg>
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-xs sm:text-sm font-medium ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-slate-900 dark:text-slate-300'
                } hover:text-primary-600 dark:hover:text-primary-300`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `text-xs sm:text-sm font-medium ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-slate-900 dark:text-slate-300'
                } hover:text-primary-600 dark:hover:text-primary-300`
              }
            >
              Products
            </NavLink>
          </div>

          <div className="hidden lg:flex items-center">{authActions}</div>
        </div>
      </nav>

      {showMobile && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
          <div className="space-y-3">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-50"
                />
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="6" />
                    <path d="m16 16 4 4" />
                  </svg>
                </span>
              </div>
            </form>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs font-medium text-slate-900 dark:text-slate-300">
                <NavLink to="/" className="hover:text-primary-600 dark:hover:text-primary-300">
                  Home
                </NavLink>
                <NavLink to="/products" className="hover:text-primary-600 dark:hover:text-primary-300">
                  Products
                </NavLink>
              </div>
              <div className="flex items-center gap-3">{authActions}</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

