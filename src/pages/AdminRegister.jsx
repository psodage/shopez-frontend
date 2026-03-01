import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthMessages, registerAdmin } from '../redux/authSlice';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const emailRegex = /^\S+@\S+\.\S+$/;

const AdminRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success, user, token } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({});

  useEffect(() => {
    dispatch(clearAuthMessages());
    return () => dispatch(clearAuthMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
    } else if (user && user.role === 'user') {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate('/admin/login'), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [success, navigate]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    else if (form.name.trim().length < 2)
      next.name = 'Name must be at least 2 characters.';

    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!emailRegex.test(form.email.trim()))
      next.email = 'Enter a valid email.';

    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6)
      next.password = 'Password must be at least 6 characters.';

    if (!form.confirmPassword)
      next.confirmPassword = 'Confirm your password.';
    else if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Passwords do not match.';

    return next;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0 && !loading;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (!canSubmit) return;

    try {
      await dispatch(
        registerAdmin({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      ).unwrap();
    } catch (_) {
      // handled in slice
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary-500/10 ring-1 ring-primary-500/30 px-4 py-2 dark:bg-primary-500/15">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-200">
              ShopEZ Admin
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Create admin account
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Provision a new admin for ShopEZ.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="space-y-3 mb-4">
            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
          </div>

          <form onSubmit={onSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                Name
              </label>
              <input
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={onChange}
                onBlur={onBlur}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                placeholder="Admin name"
              />
              {touched.name && errors.name && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-300">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                onBlur={onBlur}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                placeholder="admin@example.com"
              />
              {touched.email && errors.email && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-300">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                Password
              </label>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={onChange}
                onBlur={onBlur}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                placeholder="At least 6 characters"
              />
              {touched.password && errors.password && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-300">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={onChange}
                onBlur={onBlur}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                placeholder="Repeat password"
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-300">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Creating admin...
                </>
              ) : (
                'Create admin'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
            Need to sign in instead?{' '}
            <Link
              to="/admin/login"
              className="font-medium text-primary-700 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-200"
            >
              Go to admin login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;

