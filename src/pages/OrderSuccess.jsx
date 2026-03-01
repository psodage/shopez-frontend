import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { fetchOrderById } from '../redux/orderSlice';

const OrderSuccess = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentOrder: order, currentLoading, currentError } = useSelector(
    (s) => s.order
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id]);

  const statusSteps = [
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ];

  const currentStatus = order?.status || 'processing';
  const isDelivered =
    currentStatus === 'delivered' || order?.isDelivered === true;

  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : '';

  const paymentMethod = order?.paymentMethod || 'COD';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Thank you for your order
            </h1>
            {order?.orderNumber && (
  <p className="text-xs text-slate-900 sm:text-sm dark:text-slate-50">
    Order ID:{' '}
    <span className="font-mono text-slate-900 dark:text-slate-50">
      {order.orderNumber}
    </span>
  </p>
)}
          </div>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-primary-400 sm:text-sm"
          >
            Continue shopping
          </button>
        </header>

        {currentLoading && (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {!currentLoading && currentError && (
          <Alert variant="error">{currentError}</Alert>
        )}

        {!currentLoading && order && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Order details
                </h2>
                <dl className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2 dark:text-slate-300">
                  <div>
                    <dt className="text-slate-500">Date</dt>
                    <dd>{createdAt || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payment method</dt>
                    <dd>
                      {paymentMethod === 'COD'
                        ? 'Cash on delivery'
                        : paymentMethod === 'RAZORPAY'
                        ? 'Razorpay'
                        : 'Stripe'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payment status</dt>
                    <dd className="capitalize">
                      {order.paymentStatus || 'pending'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Total amount</dt>
                    <dd className="font-semibold text-primary-700 dark:text-primary-300">
                      ₹{Number(order.totalPrice || 0).toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Shipping address
                </h2>
                <div className="mt-3 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">
                    {order.shippingAddress?.fullName}
                  </p>
                  <p>{order.shippingAddress?.phone}</p>
                  <p>
                    {order.shippingAddress?.addressLine1}
                    {order.shippingAddress?.addressLine2
                      ? `, ${order.shippingAddress.addressLine2}`
                      : ''}
                  </p>
                  <p>
                    {order.shippingAddress?.city},{' '}
                    {order.shippingAddress?.state}{' '}
                    {order.shippingAddress?.pincode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Order items
                </h2>
                <div className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {order.orderItems.map((item) => (
                    <div
                      key={`${item.product}-${item.name}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="h-8 w-8 rounded-md object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-slate-900 dark:text-slate-100">
                            {item.name}
                          </p>
                          <p className="text-[0.7rem] text-slate-500">
                            Qty {item.quantity} • ₹
                            {Number(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                          ₹
                          {(
                            Number(item.price || 0) *
                            Number(item.quantity || 0)
                          ).toFixed(2)}
                        </p>
                        {isDelivered && (
                          <Link
                            to={`/product/${
                              item.product?._id || item.product || ''
                            }?tab=reviews`}
                            className="inline-flex items-center justify-center rounded-lg border border-primary-500/70 bg-primary-500/10 px-2 py-1 text-[0.7rem] font-medium text-primary-700 hover:bg-primary-500/20 dark:border-primary-400/60 dark:text-primary-200"
                          >
                            Write a review
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Status timeline
                </h2>
                <ol className="mt-3 space-y-3 text-xs">
                  {statusSteps.map((s, idx) => {
                    const indexCurrent = statusSteps.findIndex(
                      (st) => st.id === currentStatus
                    );
                    const complete = idx <= indexCurrent;
                    return (
                      <li
                        key={s.id}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[0.65rem] ${
                            complete
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-700 dark:text-emerald-200'
                              : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`font-medium ${
                            complete ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'
                          }`}
                        >
                          {s.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Need help with this order?
                </p>
                <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Our support team is available 24/7 to help with delivery,
                  payments, or returns.
                </p>
                <Link
                  to="/"
                  className="mt-3 inline-flex rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-[0.7rem] font-medium text-slate-700 hover:border-primary-400/70 hover:text-primary-700 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:text-primary-200"
                >
                  Go to homepage
                </Link>
              </div>
            </aside>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;

