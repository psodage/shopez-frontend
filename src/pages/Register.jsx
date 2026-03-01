import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthMessages, registerUser } from '../redux/authSlice';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const emailRegex = /^\S+@\S+\.\S+$/;

// Password strength: 0–4 (weak to strong)
const getPasswordStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
};

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = [
  'bg-slate-200 dark:bg-slate-700',
  'bg-red-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-emerald-600',
];

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success, token } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    dispatch(clearAuthMessages());
    return () => dispatch(clearAuthMessages());
  }, [dispatch]);

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate('/login'), 900);
      return () => clearTimeout(t);
    }
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

    if (!acceptedTerms) next.terms = 'You must accept the Terms & Conditions.';

    return next;
  }, [form, acceptedTerms]);

  const canSubmit = Object.keys(errors).length === 0 && !loading;
  const pwdStrength = getPasswordStrength(form.password);

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
      terms: true,
    });
    if (!canSubmit) return;

    try {
      await dispatch(
        registerUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      ).unwrap();
    } catch (_) {
      // handled by slice
    }
  };

  const inputBase =
    'peer w-full rounded-xl border-2 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder-transparent outline-none transition-all duration-200 dark:bg-slate-950/50 dark:text-slate-100';
  const inputDefault =
    'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:focus:border-primary-400 dark:focus:ring-primary-400/10';
  const inputError =
    'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-red-500/80 dark:focus:border-red-400 dark:focus:ring-red-400/10';
  const inputSuccess =
    'border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-500/70 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10';

  const getInputClass = (name) => {
    const hasError = touched[name] && errors[name];
    const hasSuccess = touched[name] && !errors[name] && form[name];
    return `${inputBase} ${hasError ? inputError : hasSuccess ? inputSuccess : inputDefault}`;
  };

  const labelBase =
    'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 peer-focus:top-0 peer-focus:left-3 peer-focus:translate-y-0 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-90';
  const labelDefault = 'text-slate-500 dark:text-slate-400';
  const labelFocus = 'peer-focus:text-primary-600 dark:peer-focus:text-primary-400';
  const labelFilled = 'peer-[:not(:placeholder-shown)]:text-slate-700 dark:peer-[:not(:placeholder-shown)]:text-slate-300';
  const labelError = 'peer-focus:text-red-600 dark:peer-focus:text-red-400';
  const labelSuccess = 'peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400';

  const getLabelClass = (name) => {
    const hasError = touched[name] && errors[name];
    const hasSuccess = touched[name] && !errors[name] && form[name];
    return `${labelBase} ${labelDefault} ${labelFilled} ${
      hasError ? labelError : hasSuccess ? labelSuccess : labelFocus
    }`;
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
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]"
        aria-hidden="true"
      />

      <main className="relative flex w-full flex-col lg:flex-row lg:items-stretch lg:min-h-screen">
        {/* Left: Branding / headline */}
        <div
          className={`relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:order-1 lg:px-12 xl:px-16 transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="w-full max-w-md lg:max-w-lg text-center lg:text-left">
            <Link
              to="/"
              className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/90 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.06),0_10px_24px_-4px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_16px_-4px_rgba(15,23,42,0.1),0_20px_40px_-8px_rgba(15,23,42,0.15)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-slate-900/80 dark:ring-slate-700/80 dark:focus:ring-offset-slate-950"
              aria-label="ShopEZ Home"
            >
              <span className="text-4xl font-extrabold tracking-tighter">
                <span className="bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                  S
                </span>
                <span className="text-slate-900 dark:text-white">EZ</span>
              </span>
            </Link>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400">
              Create your account
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl lg:text-4xl xl:text-5xl">
              Join ShopEZ today
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400 lg:text-lg">
              Get faster checkout, order tracking, wishlists, and personalized
              recommendations. Create your free account in seconds.
            </p>
          </div>
        </div>

        {/* Right: Signup form */}
        <div
          className={`relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:order-2 lg:px-12 xl:px-16 transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="w-full max-w-md">
          {/* Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05),0_12px_28px_-6px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.03)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_8px_16px_-4px_rgba(15,23,42,0.08),0_24px_48px_-12px_rgba(15,23,42,0.15),0_0_0_1px_rgba(15,23,42,0.04)] dark:border-slate-800/90 dark:bg-slate-900/70 dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2),0_12px_28px_-6px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.25),0_24px_48px_-12px_rgba(0,0,0,0.4)] sm:p-8">
            {/* Form header */}
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/15 ring-1 ring-primary-500/25">
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Create your account
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Fill in your details to get started
              </p>
            </div>

            <div className="mb-6 space-y-3">
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <div className="relative">
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder=" "
                    className={getInputClass('name')}
                    aria-invalid={touched.name && !!errors.name}
                    aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
                  />
                  <label htmlFor="register-name" className={getLabelClass('name')}>
                    Full name
                  </label>
                </div>
                {touched.name && errors.name && (
                  <p id="name-error" className="text-xs font-medium text-red-500 dark:text-red-300" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder=" "
                    className={getInputClass('email')}
                    aria-invalid={touched.email && !!errors.email}
                    aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                  />
                  <label htmlFor="register-email" className={getLabelClass('email')}>
                    Email address
                  </label>
                </div>
                {touched.email && errors.email && (
                  <p id="email-error" className="text-xs font-medium text-red-500 dark:text-red-300" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder=" "
                    className={`${getInputClass('password')} pr-12`}
                    aria-invalid={touched.password && !!errors.password}
                    aria-describedby={
                      touched.password && errors.password
                        ? 'password-error'
                        : form.password
                        ? 'password-strength'
                        : undefined
                    }
                  />
                  <label htmlFor="register-password" className={getLabelClass('password')}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus:ring-primary-400/30"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {form.password && (
                  <div id="password-strength" className="flex items-center gap-3" role="status" aria-live="polite">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${strengthColors[pwdStrength]}`}
                        style={{ width: `${(pwdStrength / 4) * 100}%` }}
                      />
                    </div>
                    <span className="min-w-[3rem] text-xs font-medium text-slate-500 dark:text-slate-400">
                      {strengthLabels[pwdStrength]}
                    </span>
                  </div>
                )}
                {touched.password && errors.password && (
                  <p id="password-error" className="text-xs font-medium text-red-500 dark:text-red-300" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    id="register-confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder=" "
                    className={`${getInputClass('confirmPassword')} pr-12`}
                    aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                    aria-describedby={touched.confirmPassword && errors.confirmPassword ? 'confirm-error' : undefined}
                  />
                  <label htmlFor="register-confirm" className={getLabelClass('confirmPassword')}>
                    Confirm password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus:ring-primary-400/30"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p id="confirm-error" className="text-xs font-medium text-red-500 dark:text-red-300" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    id="register-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 rounded-md border-2 border-slate-300 text-primary-500 transition-colors focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-primary-400/30"
                    aria-invalid={!!(touched.terms && errors.terms)}
                    aria-describedby={touched.terms && errors.terms ? 'terms-error' : undefined}
                  />
                  <label htmlFor="register-terms" className="cursor-pointer text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    I agree to the{' '}
                    <Link to="/terms" className="font-semibold text-primary-600 underline-offset-4 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="font-semibold text-primary-600 underline-offset-4 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {touched.terms && errors.terms && (
                  <p id="terms-error" className="text-xs font-medium text-red-500 dark:text-red-300" role="alert">
                    {errors.terms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-primary-500/25 transition-all duration-200 hover:bg-primary-400 hover:shadow-xl hover:shadow-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary-500 disabled:hover:shadow-lg dark:focus:ring-offset-slate-900"
              >
                {loading ? (
                  <>
                    <Spinner className="h-5 w-5" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-800/30">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary-600 underline-offset-4 transition-colors hover:text-primary-500 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

         
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
