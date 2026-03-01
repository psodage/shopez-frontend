import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { fetchOrderDetails } from '../redux/orderSlice';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { currentOrder, currentLoading, currentError } = useSelector(
    (s) => s.order
  );

  useEffect(() => {
    if (id) dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  const order = currentOrder;

  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : '';

  const customerName =
    order?.user?.name ||
    order?.shippingAddress?.fullName ||
    order?.customerName ||
    '—';

  const customerEmail = order?.user?.email || order?.email || '—';

  const isPaid = order?.paymentStatus === 'paid' || order?.isPaid;
  const isDelivered = order?.status === 'delivered' || order?.isDelivered;

  const items = useMemo(() => order?.orderItems || [], [order]);

  return (
    <AdminLayout>
      <section className="space-y-6">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Order details
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Order{' '}
              <span className="font-mono">
                {order?.orderNumber || order?._id || id}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/orders"
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[0.7rem] font-semibold text-slate-700 hover:border-primary-400/70 hover:text-primary-700 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:text-primary-200"
            >
              Back to orders
            </Link>
          </div>
        </header>

        {currentError && <Alert variant="error">{currentError}</Alert>}

        {currentLoading && (
          <div className="flex min-h-[240px] items-center justify-center">
            <Spinner className="h-7 w-7" />
          </div>
        )}

        {!currentLoading && order && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
            <div className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Summary
                </h2>
                <dl className="mt-3 grid gap-3 text-xs text-slate-700 sm:grid-cols-2 dark:text-slate-300">
                  <div>
                    <dt className="text-slate-500">Placed</dt>
                    <dd>{createdAt || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-semibold text-primary-700 dark:text-primary-300">
                      ₹{Number(order.totalPrice || 0).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payment</dt>
                    <dd className="capitalize">
                      {order.paymentStatus || (isPaid ? 'paid' : 'pending')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd className="capitalize">{order.status || 'processing'}</dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Customer
                </h2>
                <div className="mt-3 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {customerName}
                  </p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    {customerEmail}
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Shipping address
                </h2>
                <div className="mt-3 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">
                    {order.shippingAddress?.fullName || customerName}
                  </p>
                  <p>{order.shippingAddress?.phone || '—'}</p>
                  <p className="mt-1">
                    {order.shippingAddress?.addressLine1 || '—'}
                    {order.shippingAddress?.addressLine2
                      ? `, ${order.shippingAddress.addressLine2}`
                      : ''}
                  </p>
                  <p>
                    {order.shippingAddress?.city || '—'}
                    {order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}{' '}
                    {order.shippingAddress?.pincode || ''}
                  </p>
                  <p>{order.shippingAddress?.country || ''}</p>
                </div>
              </article>

              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Items
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {items.map((item) => (
                        <tr key={item._id || `${item.product}-${item.name}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  loading="lazy"
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : null}
                              <div className="min-w-0">
                                <p className="line-clamp-1 text-slate-900 dark:text-slate-100">
                                  {item.name}
                                </p>
                                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                                  {item.product?._id || item.product || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {Number(item.quantity || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-primary-700 dark:text-primary-300">
                            ₹{Number(item.price || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            ₹
                            {(
                              Number(item.price || 0) *
                              Number(item.quantity || 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {!items.length && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-xs text-slate-500"
                          >
                            No items found for this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Badges
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ring-1 ${
                      isPaid
                        ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/40 dark:text-emerald-200'
                        : 'bg-amber-500/10 text-amber-700 ring-amber-500/40 dark:text-amber-200'
                    }`}
                  >
                    {isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ring-1 ${
                      isDelivered
                        ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/40 dark:text-emerald-200'
                        : 'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                    }`}
                  >
                    {isDelivered ? 'Delivered' : 'Not delivered'}
                  </span>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Payment
                </h2>
                <dl className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Method</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">
                      {order.paymentMethod || 'COD'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Status</dt>
                    <dd className="capitalize">
                      {order.paymentStatus || (isPaid ? 'paid' : 'pending')}
                    </dd>
                  </div>
                </dl>
              </article>
            </aside>
          </section>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminOrderDetail;

