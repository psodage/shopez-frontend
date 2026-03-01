import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  clearAdminCouponMessages,
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  toggleCouponStatus,
} from '../redux/adminCouponSlice';

const typeLabels = {
  percentage: 'Percentage',
  fixed: 'Fixed amount',
  free_shipping: 'Free shipping',
  buy_x_get_y: 'Buy X Get Y',
  category: 'Category',
  product: 'Product',
  automatic: 'Automatic',
};

const emptyCouponForm = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  usageLimit: '',
  startDate: '',
  expiryDate: '',
  isActive: true,
};

const AdminCoupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error, success, page, totalPages, total } =
    useSelector((s) => s.adminCoupons);

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('created_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(clearAdminCouponMessages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchCoupons({
        page: currentPage,
        search: search || undefined,
        type: type === 'all' ? undefined : type,
        status: status === 'all' ? undefined : status,
        sort,
      })
    );
  }, [dispatch, currentPage, search, type, status, sort]);

  const pagination = useMemo(() => {
    const items = [];
    for (let i = 1; i <= totalPages; i += 1) {
      items.push(i);
    }
    return items;
  }, [totalPages]);

  const allSelectedOnPage =
    coupons.length > 0 &&
    coupons.every((c) => selectedIds.includes(String(c._id)));

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) =>
        prev.filter((id) => !coupons.some((c) => String(c._id) === id))
      );
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...coupons
          .map((c) => String(c._id))
          .filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(String(id))
        ? prev.filter((x) => x !== String(id))
        : [...prev, String(id)]
    );
  };

  const handleToggleStatus = (id) => {
    dispatch(toggleCouponStatus(id));
  };

  const openCreateModal = () => {
    setCouponForm(emptyCouponForm);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isSaving) return;
    setFormError(null);
    setIsCreateOpen(false);
  };

  const mapCouponToForm = (coupon = {}) => ({
    code: coupon.code || '',
    type: coupon.type || 'percentage',
    value: coupon.value ?? '',
    minOrderAmount: coupon.minOrderAmount ?? '',
    usageLimit: coupon.usageLimit ?? '',
    startDate: coupon.startDate
      ? new Date(coupon.startDate).toISOString().slice(0, 10)
      : '',
    expiryDate: coupon.expiryDate
      ? new Date(coupon.expiryDate).toISOString().slice(0, 10)
      : '',
    isActive: coupon.isActive ?? true,
  });

  const handleDuplicate = (coupon) => {
    setCouponForm(mapCouponToForm(coupon));
    setFormError(null);
    setIsCreateOpen(true);
  };

  const validateForm = () => {
    if (!couponForm.code.trim()) {
      return 'Coupon code is required.';
    }
    if (!couponForm.type) {
      return 'Coupon type is required.';
    }
    const requiresValue = couponForm.type !== 'free_shipping';
    if (requiresValue) {
      const parsed = Number(couponForm.value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return 'Enter a valid coupon value.';
      }
      if (couponForm.type === 'percentage' && parsed > 100) {
        return 'Percentage value cannot exceed 100.';
      }
    }
    if (couponForm.startDate && couponForm.expiryDate) {
      const start = new Date(couponForm.startDate);
      const expiry = new Date(couponForm.expiryDate);
      if (expiry < start) {
        return 'Expiry date must be after start date.';
      }
    }
    return null;
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSaving(true);
    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      type: couponForm.type,
      isActive: couponForm.isActive,
    };

    if (couponForm.type !== 'free_shipping') {
      payload.value = Number(couponForm.value);
    }
    if (couponForm.minOrderAmount !== '') {
      payload.minOrderAmount = Number(couponForm.minOrderAmount);
    }
    if (couponForm.usageLimit !== '') {
      payload.usageLimit = Number(couponForm.usageLimit);
    }
    if (couponForm.startDate) {
      payload.startDate = couponForm.startDate;
    }
    if (couponForm.expiryDate) {
      payload.expiryDate = couponForm.expiryDate;
    }

    const action = await dispatch(createCoupon(payload));
    setIsSaving(false);
    if (createCoupon.fulfilled.match(action)) {
      setIsCreateOpen(false);
      setCouponForm(emptyCouponForm);
      setCurrentPage(1);
      dispatch(
        fetchCoupons({
          page: 1,
          search: search || undefined,
          type: type === 'all' ? undefined : type,
          status: status === 'all' ? undefined : status,
          sort,
        })
      );
      return;
    }

    setFormError(
      typeof action.payload === 'string'
        ? action.payload
        : 'Unable to create coupon.'
    );
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await dispatch(deleteCoupon(confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const bulkDelete = async () => {
    // simple sequential deletes to avoid new bulk API
    // keep UX minimal while satisfying requirement
    // eslint-disable-next-line no-restricted-syntax
    for (const id of selectedIds) {
      // eslint-disable-next-line no-await-in-loop
      await dispatch(deleteCoupon(id));
    }
    setSelectedIds([]);
  };

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Coupons
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Create and manage discount codes and automatic promotions for ShopEZ.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-primary-400"
          >
            <span className="text-base">＋</span>
            New coupon
          </button>
        </header>

        <div className="space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by coupon code"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
              >
                <option value="all">All</option>
                {Object.entries(typeLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
              <span>
                Selected:{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedIds.length}
                </span>
              </span>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={bulkDelete}
                className="rounded-xl border border-red-500/70 bg-red-500/10 px-3 py-1 text-[0.7rem] font-medium text-red-700 disabled:opacity-40 dark:border-red-500/40 dark:text-red-200"
              >
                Bulk delete
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
              >
                <option value="created_desc">Newest</option>
                <option value="expiry_asc">Expiry soon</option>
                <option value="expiry_desc">Expiry latest</option>
                <option value="usage_desc">Most used</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[0.75rem] text-slate-700 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Min order</th>
                    <th className="px-3 py-2">Usage</th>
                    <th className="px-3 py-2">Start</th>
                    <th className="px-3 py-2">Expiry</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {coupons.map((c) => {
                    const start = c.startDate
                      ? new Date(c.startDate).toLocaleDateString()
                      : '—';
                    const expiry = c.expiryDate
                      ? new Date(c.expiryDate).toLocaleDateString()
                      : '—';
                    const now = new Date();
                    const isExpired = c.expiryDate
                      ? new Date(c.expiryDate) < now
                      : false;
                    const isActive = c.isActive && !isExpired;
                    const statusLabel = !c.isActive
                      ? 'Disabled'
                      : isExpired
                      ? 'Expired'
                      : 'Active';

                    const usageLimit = c.usageLimit || 0;
                    const used = c.usedCount || 0;
                    const usagePercent =
                      usageLimit > 0
                        ? Math.min(
                            100,
                            Math.round((used / usageLimit) * 100)
                          )
                        : 0;

                    return (
                      <tr key={c._id} className="hover:bg-slate-100 dark:hover:bg-slate-900/70">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(String(c._id))}
                            onChange={() => toggleSelectOne(c._id)}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-[0.75rem] text-slate-900 dark:text-slate-100">
                          {c.code}
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          {typeLabels[c.type] || c.type}
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          {c.type === 'percentage'
                            ? `${c.value || 0}%`
                            : c.type === 'fixed'
                            ? `₹${c.value || 0}`
                            : c.type === 'free_shipping'
                            ? 'Free shipping'
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          {c.minOrderAmount
                            ? `₹${Number(c.minOrderAmount).toFixed(0)}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-800 dark:text-slate-200">
                              {used} / {usageLimit || '∞'}
                            </span>
                            {usageLimit > 0 && (
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-primary-500"
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">{start}</td>
                        <td className="px-3 py-2 text-[0.75rem]">{expiry}</td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1 ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/40 dark:text-emerald-200'
                                : isExpired
                                ? 'bg-amber-500/10 text-amber-700 ring-amber-500/40 dark:text-amber-200'
                                : 'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDuplicate(c)}
                              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c._id)}
                              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-primary-200"
                            >
                              {c.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(c._id)}
                              className="rounded-lg border border-red-500/70 bg-red-500/10 px-2 py-1 text-[0.7rem] text-red-700 hover:bg-red-500/20 dark:border-red-500/40 dark:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!coupons.length && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-3 py-6 text-center text-[0.75rem] text-slate-500"
                      >
                        No coupons found. Try adjusting your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pagination.length > 1 && (
            <div className="flex items-center justify-between pt-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="inline-flex gap-1">
                {pagination.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`h-7 w-7 rounded-lg text-xs ${
                      p === page
                        ? 'bg-primary-500 text-slate-950'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {confirmDeleteId && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <h2 className="text-sm font-semibold text-slate-50">
                Delete coupon?
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                This will permanently remove the coupon. Existing orders that
                used it will not be affected.
              </p>
              <div className="mt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-red-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-red-400"
                >
                  Confirm delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isCreateOpen && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <h2 className="text-sm font-semibold text-slate-50">
                Create coupon
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Add a new coupon code that can be used at checkout.
              </p>

              {(formError || error) && (
                <div className="mt-3">
                  <Alert variant="error">{formError || error}</Alert>
                </div>
              )}

              <form onSubmit={handleCreateCoupon} className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Coupon code
                    </label>
                    <input
                      type="text"
                      value={couponForm.code}
                      onChange={(e) =>
                        setCouponForm((prev) => ({
                          ...prev,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="WELCOME10"
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Type
                    </label>
                    <select
                      value={couponForm.type}
                      onChange={(e) =>
                        setCouponForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                          value:
                            e.target.value === 'free_shipping' ? '' : prev.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-primary-500/40"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                      <option value="free_shipping">Free shipping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Value
                    </label>
                    <input
                      type="number"
                      value={couponForm.value}
                      disabled={couponForm.type === 'free_shipping'}
                      onChange={(e) =>
                        setCouponForm((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      placeholder={
                        couponForm.type === 'percentage' ? '10' : '250'
                      }
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Min order amount
                    </label>
                    <input
                      type="number"
                      value={couponForm.minOrderAmount}
                      onChange={(e) =>
                        setCouponForm((prev) => ({
                          ...prev,
                          minOrderAmount: e.target.value,
                        }))
                      }
                      placeholder="999"
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Usage limit
                    </label>
                    <input
                      type="number"
                      value={couponForm.usageLimit}
                      onChange={(e) =>
                        setCouponForm((prev) => ({
                          ...prev,
                          usageLimit: e.target.value,
                        }))
                      }
                      placeholder="100"
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={couponForm.startDate}
                      onChange={(e) =>
                        setCouponForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Expiry date
                    </label>
                    <input
                      type="date"
                      value={couponForm.expiryDate}
                      onChange={(e) =>
                        setCouponForm((prev) => ({
                          ...prev,
                          expiryDate: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={couponForm.isActive}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Activate coupon immediately
                </label>

                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-primary-400 disabled:opacity-60"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Create coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminCoupons;

