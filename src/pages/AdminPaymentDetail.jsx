import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  fetchPaymentDetails,
  processRefund,
  clearAdminPaymentMessages,
} from '../redux/adminPaymentSlice';
import api from '../services/api';

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

const AdminPaymentDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { paymentDetails, loading, error, success } = useSelector(
    (s) => s.adminPayments
  );
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [localError, setLocalError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentDetails(id));
    return () => {
      dispatch(clearAdminPaymentMessages());
    };
  }, [dispatch, id]);

  const payment = paymentDetails?.payment;
  const refundHistory = paymentDetails?.refundHistory || [];
  const webhookLogs = paymentDetails?.webhookLogs || [];
  const fraudRiskScore = paymentDetails?.fraudRiskScore ?? 0;

  const refundableAmount = useMemo(() => {
    if (!payment) return 0;
    return (payment.amount || 0) - (payment.refundAmount || 0);
  }, [payment]);

  const handleRefund = (e) => {
    e.preventDefault();
    setLocalError('');
    const numericAmount = Number(refundAmount);
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setLocalError('Refund amount must be greater than 0.');
      return;
    }
    if (numericAmount > refundableAmount) {
      setLocalError('Refund cannot exceed remaining refundable amount.');
      return;
    }
    dispatch(
      processRefund({ id, amount: numericAmount, reason: refundReason })
    );
  };

  const handleMarkReviewed = async () => {
    try {
      setActionLoading(true);
      await api.post(`/api/admin/payments/${id}/review`);
      dispatch(fetchPaymentDetails(id));
    } catch (err) {
      setLocalError(
        err.response?.data?.message || 'Unable to mark payment as reviewed.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    try {
      setActionLoading(true);
      await api.post(`/api/admin/payments/${id}/retry`);
      dispatch(fetchPaymentDetails(id));
    } catch (err) {
      setLocalError(
        err.response?.data?.message || 'Unable to mark payment for retry.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const providerResponsePretty = useMemo(() => {
    if (!payment?.providerResponse) return '';
    try {
      return JSON.stringify(payment.providerResponse, null, 2);
    } catch {
      return String(payment.providerResponse);
    }
  }, [payment]);

  return (
    <AdminLayout>
      <section className="space-y-6">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Payment details
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Inspect a single payment, review provider response, and manage refunds.
            </p>
          </div>
          <Link
            to="/admin/payments"
            className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 hover:border-primary-400 hover:text-primary-200"
          >
            Back to payments
          </Link>
        </header>

        {error && <Alert variant="error">{error}</Alert>}
        {localError && <Alert variant="error">{localError}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {loading && !payment && (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner className="h-7 w-7" />
          </div>
        )}

        {payment && (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-50">
                      Transaction overview
                    </h2>
                    <p className="text-[0.7rem] text-slate-400">
                      High-level snapshot of this payment.
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                      STATUS_COLORS[payment.status] ||
                      'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
                <dl className="grid gap-3 text-[0.75rem] sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      Transaction ID
                    </dt>
                    <dd className="mt-1 font-mono text-[0.72rem] text-slate-100 break-all">
                      {payment.transactionId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      Order
                    </dt>
                    <dd className="mt-1 text-slate-100">
                      {payment.order?.orderNumber || payment.order?._id || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      User
                    </dt>
                    <dd className="mt-1 text-slate-100">
                      <div className="flex flex-col">
                        <span>{payment.user?.name || '—'}</span>
                        <span className="text-[0.65rem] text-slate-400">
                          {payment.user?.email}
                        </span>
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      Payment provider
                    </dt>
                    <dd className="mt-1 text-slate-100 uppercase">
                      {payment.paymentProvider}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      Amount
                    </dt>
                    <dd className="mt-1 text-primary-300">
                      {formatCurrency(payment.amount, payment.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      Refunds
                    </dt>
                    <dd className="mt-1 text-slate-100">
                      {formatCurrency(
                        payment.refundAmount || 0,
                        payment.currency
                      )}{' '}
                      <span className="text-[0.65rem] text-slate-400">
                        ({formatCurrency(refundableAmount, payment.currency)}{' '}
                        remaining)
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      Created at
                    </dt>
                    <dd className="mt-1 text-slate-100">
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleString()
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                      Settlement status
                    </dt>
                    <dd className="mt-1 text-slate-100 capitalize">
                      {payment.settlementStatus}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-slate-50">
                  Fraud & review
                </h2>
                <p className="text-[0.7rem] text-slate-400">
                  Internal risk score and manual review status.
                </p>
                <div className="space-y-2 text-[0.75rem]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Fraud risk score</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                        fraudRiskScore >= 70
                          ? 'bg-red-500/10 text-red-200 ring-1 ring-red-500/40'
                          : fraudRiskScore >= 40
                          ? 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/40'
                          : 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/40'
                      }`}
                    >
                      {fraudRiskScore.toFixed(0)} / 100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Reviewed</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                        payment.isReviewed
                          ? 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/40'
                          : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
                      }`}
                    >
                      {payment.isReviewed ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleMarkReviewed}
                      disabled={payment.isReviewed || actionLoading}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[0.75rem] font-medium text-slate-100 hover:border-primary-400 hover:text-primary-200 disabled:opacity-40"
                    >
                      Mark as reviewed
                    </button>
                    {payment.status === 'failed' && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[0.75rem] font-medium text-amber-100 hover:bg-amber-500/20 disabled:opacity-40"
                      >
                        Retry failed payment
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-2">
                <h2 className="text-sm font-semibold text-slate-50">
                  Provider response
                </h2>
                <p className="text-[0.7rem] text-slate-400">
                  Raw payload returned by Stripe / Razorpay for this payment.
                </p>
                <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-slate-950/80 p-3 text-[0.7rem] text-slate-200">
                  {providerResponsePretty || 'No provider response stored.'}
                </pre>
              </article>

              <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-slate-50">
                  Refunds
                </h2>
                <p className="text-[0.7rem] text-slate-400">
                  Full or partial refunds associated with this payment.
                </p>
                <div className="mt-1 space-y-2 text-[0.75rem]">
                  {refundHistory.map((r, idx) => (
                    <div
                      // eslint-disable-next-line react/no-array-index-key
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-primary-300">
                          {formatCurrency(r.amount, payment.currency)}
                        </span>
                        <span className="text-[0.65rem] text-slate-400">
                          {r.refundedAt
                            ? new Date(r.refundedAt).toLocaleString()
                            : ''}
                        </span>
                      </div>
                      {r.reason && (
                        <p className="mt-1 text-[0.7rem] text-slate-300">
                          {r.reason}
                        </p>
                      )}
                    </div>
                  ))}
                  {!refundHistory.length && (
                    <p className="text-[0.75rem] text-slate-500">
                      No refunds have been processed for this payment yet.
                    </p>
                  )}
                </div>
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-2">
                <h2 className="text-sm font-semibold text-slate-50">
                  Order details
                </h2>
                <p className="text-[0.7rem] text-slate-400">
                  Snapshot of the order this payment is attached to.
                </p>
                {payment.order ? (
                  <div className="mt-2 space-y-2 text-[0.75rem]">
                    <div className="flex flex-wrap gap-3">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.7rem] text-slate-200">
                        Order #{payment.order.orderNumber || payment.order._id}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.7rem] text-slate-200">
                        Payment: {payment.order.paymentStatus}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.7rem] text-slate-200">
                        Method: {payment.order.paymentMethod}
                      </span>
                    </div>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-left text-[0.7rem] text-slate-300">
                        <thead className="border-b border-slate-800 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                          <tr>
                            <th className="px-2 py-1">Item</th>
                            <th className="px-2 py-1">Category</th>
                            <th className="px-2 py-1 text-right">Qty</th>
                            <th className="px-2 py-1 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {(payment.order.orderItems || []).map((item) => (
                            <tr key={item._id}>
                              <td className="px-2 py-1 text-slate-100">
                                {item.name}
                              </td>
                              <td className="px-2 py-1 text-slate-400">
                                {item.product?.category || '—'}
                              </td>
                              <td className="px-2 py-1 text-right">
                                {item.quantity}
                              </td>
                              <td className="px-2 py-1 text-right text-primary-300">
                                {formatCurrency(
                                  item.price,
                                  payment.currency
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-[0.75rem] text-slate-500">
                    Order details are not available for this payment.
                  </p>
                )}
              </article>

              <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-slate-50">
                  Refund payment
                </h2>
                <p className="text-[0.7rem] text-slate-400">
                  Issue a full or partial refund. All refund calculations are validated on the server.
                </p>
                <form onSubmit={handleRefund} className="space-y-3 text-[0.75rem]">
                  <div>
                    <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-primary-400 focus:outline-none"
                    />
                    <p className="mt-1 text-[0.65rem] text-slate-500">
                      Remaining refundable:{' '}
                      {formatCurrency(refundableAmount, payment.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Reason (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={refundableAmount <= 0}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[0.75rem] font-medium text-red-100 hover:bg-red-500/20 disabled:opacity-40"
                  >
                    Process refund
                  </button>
                </form>
              </article>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h2 className="text-sm font-semibold text-slate-50">
                Webhook logs
              </h2>
              <p className="text-[0.7rem] text-slate-400">
                Events received via the payment webhook endpoint for this transaction.
              </p>
              <div className="mt-1 overflow-x-auto text-[0.75rem]">
                <table className="min-w-full text-left text-[0.75rem] text-slate-300">
                  <thead className="border-b border-slate-800 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-2 py-1">Event ID</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Received at</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {webhookLogs.map((w, idx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={idx}>
                        <td className="px-2 py-1 font-mono text-[0.7rem] text-slate-100">
                          {w.providerEventId || '—'}
                        </td>
                        <td className="px-2 py-1 text-[0.7rem] text-slate-200">
                          {w.type || '—'}
                        </td>
                        <td className="px-2 py-1 text-[0.7rem] text-slate-400">
                          {w.receivedAt
                            ? new Date(w.receivedAt).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                    {!webhookLogs.length && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-2 py-3 text-center text-[0.75rem] text-slate-500"
                        >
                          No webhook events recorded yet for this payment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminPaymentDetail;

