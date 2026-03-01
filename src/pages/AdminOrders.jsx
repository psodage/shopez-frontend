import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  fetchAllOrders,
  updateOrderStatus,
  deleteOrder,
} from '../redux/orderSlice';

const AdminOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { allOrders, loading, error } = useSelector((s) => s.order);

  const [filters, setFilters] = useState({
    paid: '',
    delivered: '',
    search: '',
    from: '',
    to: '',
  });

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllOrders({}));
  }, [dispatch]);

  const handleApplyFilters = (e) => {
    e?.preventDefault();
    const params = {};
    if (filters.paid) params.paid = filters.paid;
    if (filters.delivered) params.delivered = filters.delivered;
    if (filters.search) params.search = filters.search.trim();
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    dispatch(fetchAllOrders(params));
  };

  const handleStatusChange = (id, status) => {
    dispatch(updateOrderStatus({ id, data: { status } }));
  };

  const handleTogglePayment = async (order) => {
    const currentPaymentStatus =
      order.paymentStatus || (order.isPaid ? 'paid' : 'pending');
    const nextPaymentStatus =
      currentPaymentStatus === 'paid' ? 'pending' : 'paid';

    setUpdatingOrderId(order._id);
    try {
      await dispatch(
        updateOrderStatus({
          id: order._id,
          data: { paymentStatus: nextPaymentStatus },
        })
      ).unwrap?.();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to archive this order?')) {
      return;
    }
    dispatch(deleteOrder(id));
  };

  const summarizedOrders = useMemo(() => allOrders || [], [allOrders]);

  return (
    <AdminLayout>
      <section className="space-y-6">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Orders
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Monitor and manage all customer orders.
            </p>
          </div>
        </header>

        {error && <Alert variant="error">{error}</Alert>}

        <section className="space-y-4">
          <form
            onSubmit={handleApplyFilters}
            className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 sm:grid-cols-5 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-600 dark:text-slate-300">
                Payment
              </label>
              <select
                value={filters.paid}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, paid: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80"
              >
                <option value="">Any</option>
                <option value="true">Paid</option>
                <option value="false">Unpaid</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-600 dark:text-slate-300">
                Delivery
              </label>
              <select
                value={filters.delivered}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    delivered: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80"
              >
                <option value="">Any</option>
                <option value="true">Delivered</option>
                <option value="false">Not delivered</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-600 dark:text-slate-300">
                From
              </label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, from: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-600 dark:text-slate-300">
                To
              </label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, to: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[0.7rem] font-medium text-slate-600 dark:text-slate-300">
                Search by Order ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  placeholder="SHPZ-…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary-500 px-3 py-2 text-[0.7rem] font-semibold text-slate-950 hover:bg-primary-400"
                >
                  Apply
                </button>
              </div>
            </div>
          </form>

          {loading && (
            <div className="flex min-h-[200px] items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {!loading && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
              <table className="min-w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {summarizedOrders.map((order) => {
                    const createdAt = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : '';
                    const isPaid =
                      order.paymentStatus === 'paid' || order.isPaid;
                    const isDelivered =
                      order.status === 'delivered' || order.isDelivered;
                    const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
                    const canMarkDelivered = isPaid && !isDelivered && !isCancelled;
                    const customerName =
                      order.user?.name ||
                      order.shippingAddress?.fullName ||
                      order.customerName ||
                      '—';
                    return (
                      <tr
                        key={order._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/admin/orders/${order._id}`);
                          }
                        }}
                        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/80"
                        aria-label={`View order ${order.orderNumber || order._id}`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.75rem] text-slate-800 dark:text-slate-200">
                          {order.orderNumber || order._id}
                        </td>
                        <td className="px-4 py-3 text-[0.75rem]">
                          {customerName}
                        </td>
                        <td className="px-4 py-3 text-[0.75rem]">
                          {createdAt || '—'}
                        </td>
                        <td className="px-4 py-3 text-[0.75rem] text-primary-600 dark:text-primary-300">
                          ₹{Number(order.totalPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-[0.75rem]">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-200'
                                : 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-200'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[0.75rem]">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                              isDelivered
                                ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-200'
                                : 'bg-slate-200 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                            }`}
                          >
                            {order.status || 'processing'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[0.7rem]">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                updatingOrderId === order._id ||
                                isDelivered ||
                                isCancelled
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePayment(order);
                              }}
                              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.65rem] text-slate-700 hover:border-primary-400/70 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:text-primary-200"
                            >
                              {isPaid ? 'Mark unpaid' : 'Mark paid'}
                            </button>
                            <button
                              type="button"
                              disabled={isDelivered || isCancelled}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order._id, 'shipped');
                              }}
                              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.65rem] text-slate-700 hover:border-primary-400/70 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:text-primary-200"
                            >
                              Mark shipped
                            </button>
                            <button
                              type="button"
                              disabled={!canMarkDelivered}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order._id, 'delivered');
                              }}
                              className="rounded-lg border border-emerald-500/70 bg-emerald-500/10 px-2 py-1 text-[0.65rem] text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-emerald-500/60 dark:text-emerald-200"
                            >
                              Mark delivered
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {summarizedOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-xs text-slate-500"
                      >
                        No orders match your current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
};

export default AdminOrders;

