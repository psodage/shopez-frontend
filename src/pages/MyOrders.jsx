import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { fetchMyOrders, cancelOrder } from '../redux/orderSlice';

const PAGE_SIZE = 10;

const MyOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error } = useSelector((s) => s.order);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders || [];
    const term = search.trim().toLowerCase();
    return (orders || []).filter((order) => {
      const id = (order.orderNumber || order._id || '').toLowerCase();
      return id.includes(term);
    });
  }, [orders, search]);

  const totalPages = Math.max(
    Math.ceil((filteredOrders.length || 0) / PAGE_SIZE),
    1
  );

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const isEmpty = !loading && filteredOrders.length === 0;

  const handleCancelOrder = (order) => {
    if (
      !order ||
      order.status === 'shipped' ||
      order.status === 'delivered'
    ) {
      return;
    }
    const confirmed = window.confirm(
      'Are you sure you want to cancel this order?'
    );
    if (!confirmed) return;
    dispatch(cancelOrder(order._id));
  };

  const getPaymentBadgeClasses = (isPaid) =>
    isPaid
      ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-200'
      : 'bg-red-500/10 text-red-700 ring-1 ring-red-500/30 dark:text-red-200';

  const getDeliveryBadgeClasses = (status) => {
    const s = (status || 'processing').toLowerCase();
    if (s === 'delivered') {
      return 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-200';
    }
    if (s === 'shipped') {
      return 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-200';
    }
    if (s === 'processing') {
      return 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-200';
    }
    if (s === 'cancelled') {
      return 'bg-red-500/10 text-red-700 ring-1 ring-red-500/30 dark:text-red-200';
    }
    return 'bg-slate-200 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              My orders
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              View and track your recent orders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-primary-400 sm:text-sm"
          >
            Continue shopping
          </button>
        </header>

        {error && <Alert variant="error">{error}</Alert>}

        {loading && (
          <section className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="h-16 animate-pulse rounded-2xl bg-slate-200 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800"
              />
            ))}
          </section>
        )}

        {!loading && isEmpty && (
          <section className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <circle cx="9" cy="21" r="1.5" />
                <circle cx="18" cy="21" r="1.5" />
                <path d="M3 4h2l2.4 10.2A1.6 1.6 0 0 0 9 16h9a1.6 1.6 0 0 0 1.6-1.3L21 8H7" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-50">
              You have no orders yet
            </h2>
            <p className="mt-1 max-w-xs text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              When you place an order, it will appear here with its latest
              status.
            </p>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="mt-4 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-primary-400 sm:text-sm"
            >
              Browse products
            </button>
          </section>
        )}

        {!loading && !isEmpty && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by Order ID"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 sm:w-64 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
                />
              </div>
              <span className="hidden text-[0.7rem] text-slate-500 sm:inline">
                {filteredOrders.length} order
                {filteredOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900/70">
              <table className="min-w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="sticky top-0 border-b border-slate-200 bg-white text-[0.7rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/95">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {pagedOrders.map((order) => {
                    const createdAt = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : '';
                    const isPaid =
                      order.paymentStatus === 'paid' || order.isPaid;
                    const isDelivered =
                      order.status === 'delivered' || order.isDelivered;
                    const statusLabel = order.status || 'processing';
                    return (
                      <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/80">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.75rem] text-slate-900 dark:text-slate-200">
                          {order.orderNumber || order._id}
                        </td>
                        <td className="px-4 py-3 text-[0.75rem]">
                          {createdAt || '—'}
                        </td>
                        <td className="px-4 py-3 text-[0.75rem] text-primary-700 dark:text-primary-300">
                          ₹{Number(order.totalPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-[0.75rem]">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${getPaymentBadgeClasses(
                              isPaid
                            )}`}
                          >
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[0.75rem]">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${getDeliveryBadgeClasses(
                              statusLabel
                            )}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[0.75rem]">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/order/${order._id}`}
                              className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-1.5 text-[0.7rem] font-medium text-white hover:bg-primary-500 hover:text-slate-950 dark:bg-slate-800 dark:text-slate-100"
                            >
                              View
                            </Link>
                            {!isDelivered &&
                              order.status !== 'shipped' &&
                              order.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order)}
                                  className="inline-flex items-center rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-1.5 text-[0.7rem] font-medium text-red-700 hover:bg-red-500/20 dark:text-red-200"
                                >
                                  Cancel
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {pagedOrders.map((order) => {
                const createdAt = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : '';
                const isPaid =
                  order.paymentStatus === 'paid' || order.isPaid;
                const statusLabel = order.status || 'processing';
                const isDelivered =
                  order.status === 'delivered' || order.isDelivered;
                return (
                  <article
                    key={order._id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[0.7rem] text-slate-900 dark:text-slate-200">
                          {order.orderNumber || order._id}
                        </p>
                        <p className="text-[0.65rem] text-slate-500">
                          {createdAt || '—'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                        ₹{Number(order.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${getPaymentBadgeClasses(
                          isPaid
                        )}`}
                      >
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${getDeliveryBadgeClasses(
                          statusLabel
                        )}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Link
                        to={`/order/${order._id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-3 py-1.5 text-[0.7rem] font-medium text-white hover:bg-primary-500 hover:text-slate-950 dark:bg-slate-800 dark:text-slate-100"
                      >
                        View details
                      </Link>
                      {!isDelivered &&
                        order.status !== 'shipped' &&
                        order.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order)}
                            className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-1.5 text-[0.7rem] font-medium text-red-700 hover:bg-red-500/20 dark:text-red-200"
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  ‹ Previous
                </button>
                <span className="text-[0.75rem] text-slate-500 dark:text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  Next ›
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;

