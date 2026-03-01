import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { fetchPayments } from '../redux/adminPaymentSlice';
import { updateOrderStatus } from '../redux/orderSlice';

const STATUS_COLORS = {
  success:
    'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/40',
  pending: 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/40',
  failed: 'bg-red-500/10 text-red-200 ring-1 ring-red-500/40',
  refunded: 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/40',
};

const formatCurrency = (value, currency = 'INR') => {
  if (typeof value !== 'number') return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const AdminPayments = () => {
  const dispatch = useDispatch();
  const { payments, loading, error, page, totalPages, total } = useSelector(
    (s) => s.adminPayments
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [localSearch, setLocalSearch] = useState(
    searchParams.get('transactionId') || ''
  );

  const currentFilters = useMemo(
    () => ({
      page: Number(searchParams.get('page') || 1),
      status: searchParams.get('status') || '',
      paymentProvider: searchParams.get('paymentProvider') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      transactionId: searchParams.get('transactionId') || '',
      sort: searchParams.get('sort') || 'date_desc',
    }),
    [searchParams]
  );

  useEffect(() => {
    dispatch(fetchPayments(currentFilters));
  }, [dispatch, currentFilters]);

  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (nextPage) => {
    const pageNum = Math.max(1, Math.min(nextPage, totalPages || 1));
    const next = new URLSearchParams(searchParams);
    next.set('page', String(pageNum));
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange('transactionId', localSearch.trim());
  };

  const handleExportCsv = () => {
    if (!payments || !payments.length) return;
    const headers = [
      'Transaction ID',
      'Order ID',
      'User',
      'Payment Provider',
      'Amount',
      'Currency',
      'Status',
      'Date',
    ];
    const rows = payments.map((p) => [
      p.transactionId,
      p.order?.orderNumber || p.order?._id || '',
      p.user?.email || p.user?.name || '',
      (p.paymentProvider || '').toUpperCase(),
      p.amount,
      p.currency,
      p.status,
      p.createdAt ? new Date(p.createdAt).toISOString() : '',
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((cell) => {
            const v = cell == null ? '' : String(cell);
            if (v.includes(',') || v.includes('"') || v.includes('\n')) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
          })
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'payments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleOrderPayment = async (payment) => {
    if (!payment.order?._id) return;

    const currentStatus = payment.order.paymentStatus || 'pending';
    const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';

    setUpdatingPaymentId(payment._id);
    try {
      await dispatch(
        updateOrderStatus({
          id: payment.order._id,
          data: { paymentStatus: nextStatus },
        })
      ).unwrap?.();
      // Refresh payments so the populated order.paymentStatus stays in sync
      dispatch(fetchPayments(currentFilters));
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  return (
    <AdminLayout>
      <section className="space-y-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Payments
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Monitor all payment transactions, statuses, and amounts.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
          >
            <span>Export CSV</span>
          </button>
        </header>

        {error && <Alert variant="error">{error}</Alert>}

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Search by transaction ID
                </label>
                <input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="e.g. pi_1234, pay_abc..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-500 focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 sm:w-72">
                <div className="flex-1">
                  <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </label>
                  <select
                    value={currentFilters.status}
                    onChange={(e) =>
                      handleFilterChange('status', e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">All</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Provider
                  </label>
                  <select
                    value={currentFilters.paymentProvider}
                    onChange={(e) =>
                      handleFilterChange('paymentProvider', e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">All</option>
                    <option value="stripe">Stripe</option>
                    <option value="razorpay">Razorpay</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-80">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    From
                  </label>
                  <input
                    type="date"
                    value={currentFilters.from}
                    onChange={(e) =>
                      handleFilterChange('from', e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    To
                  </label>
                  <input
                    type="date"
                    value={currentFilters.to}
                    onChange={(e) => handleFilterChange('to', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Sort
                  </label>
                  <select
                    value={currentFilters.sort}
                    onChange={(e) =>
                      handleFilterChange('sort', e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="date_desc">Date (newest)</option>
                    <option value="date_asc">Date (oldest)</option>
                    <option value="amount_desc">Amount (high to low)</option>
                    <option value="amount_asc">Amount (low to high)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-500/20 dark:text-primary-100"
                >
                  Apply
                </button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between text-[0.7rem] text-slate-400">
            <span>
              Showing page {page} of {totalPages} • {total} payments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[0.75rem] text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                <tr>
                  <th className="px-3 py-2">Transaction</th>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Order Payment</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {payments.map((p) => {
                  const createdAt = p.createdAt
                    ? new Date(p.createdAt).toLocaleString()
                    : '';
                  const statusClass =
                    STATUS_COLORS[p.status] ||
                    'bg-slate-800 text-slate-200 ring-1 ring-slate-700';
                  const orderPaymentStatus = p.order?.paymentStatus || 'pending';
                  const isOrderPaid = orderPaymentStatus === 'paid';
                  return (
                    <tr key={p._id} className="hover:bg-slate-100 dark:hover:bg-slate-900/70">
                      <td className="max-w-[190px] px-3 py-2 font-mono text-[0.7rem] text-slate-800 dark:text-slate-200">
                        <span className="block truncate" title={p.transactionId}>
                          {p.transactionId}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[0.7rem]">
                        {p.order?.orderNumber || p.order?._id || '—'}
                      </td>
                      <td className="px-3 py-2 text-[0.7rem]">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                            isOrderPaid
                              ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-200'
                              : 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-200'
                          }`}
                        >
                          {isOrderPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[0.7rem]">
                        <div className="flex flex-col">
                          <span>{p.user?.name || '—'}</span>
                          <span className="text-[0.65rem] text-slate-500">
                            {p.user?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[0.7rem] uppercase">
                        {p.paymentProvider}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-[0.7rem] text-primary-600 dark:text-primary-300">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="px-3 py-2 text-[0.7rem]">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${statusClass}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[0.7rem]">{createdAt}</td>
                      <td className="px-3 py-2 text-right text-[0.7rem]">
                        <div className="inline-flex items-center gap-2">
                          {p.order?._id && (
                            <button
                              type="button"
                              onClick={() => handleToggleOrderPayment(p)}
                              disabled={updatingPaymentId === p._id}
                              className="rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-[0.65rem] text-slate-700 hover:border-primary-400 hover:text-primary-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
                            >
                              {isOrderPaid ? 'Mark Unpaid' : 'Mark Paid'}
                            </button>
                          )}
                          <Link
                            to={`/admin/payments/${p._id}`}
                            className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-[0.7rem] text-slate-700 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!payments.length && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-4 text-center text-[0.75rem] text-slate-500"
                    >
                      No payments found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-6">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[0.7rem] text-slate-500 dark:border-slate-800 dark:text-slate-300">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950"
            >
              Next
            </button>
          </div>
        </section>
      </section>
    </AdminLayout>
  );
};

export default AdminPayments;

