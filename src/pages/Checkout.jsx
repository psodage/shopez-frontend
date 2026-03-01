import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { clearCart } from '../redux/cartSlice';
import { createOrder, clearOrder } from '../redux/orderSlice';

const SHIPPING_STORAGE_KEY = 'shopez_shipping_v1';

const emptyShipping = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cart = useSelector((s) => s.cart);
  const { order, loading, error, success } = useSelector((s) => s.order);

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState(emptyShipping);
  const [shippingErrors, setShippingErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [localError, setLocalError] = useState(null);

  const hasItems = cart.items.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SHIPPING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      setShipping((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearOrder());
    };
  }, [dispatch]);

  const summary = useMemo(() => {
    const itemsPrice = cart.subtotal || 0;
    const taxPrice = Math.round(itemsPrice * 0.05 * 100) / 100;
    const shippingPrice =
      itemsPrice >= 999 || itemsPrice === 0 ? 0 : 79;
    const discount = cart.discountAmount || 0;
    const totalPrice = Math.max(
      itemsPrice + taxPrice + shippingPrice - discount,
      0
    );
    return {
      itemsPrice,
      taxPrice,
      shippingPrice,
      discount,
      totalPrice,
    };
  }, [cart.subtotal, cart.discountAmount]);

  const validateShipping = () => {
    const errors = {};
    if (!shipping.fullName.trim()) errors.fullName = 'Full name is required';
    if (!shipping.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{7,15}$/.test(shipping.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }
    if (!shipping.addressLine1.trim())
      errors.addressLine1 = 'Address is required';
    if (!shipping.city.trim()) errors.city = 'City is required';
    if (!shipping.state.trim()) errors.state = 'State is required';
    if (!shipping.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{4,10}$/.test(shipping.pincode.trim())) {
      errors.pincode = 'Pincode must be numeric';
    }
    if (!shipping.country.trim()) errors.country = 'Country is required';
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextFromShipping = () => {
    if (!validateShipping()) {
      setLocalError('Please fix the highlighted fields before continuing.');
      return;
    }
    setLocalError(null);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        SHIPPING_STORAGE_KEY,
        JSON.stringify(shipping)
      );
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!hasItems) {
      setLocalError('Your cart is empty.');
      return;
    }
    if (!validateShipping()) {
      setLocalError('Please fix the highlighted fields before placing order.');
      setStep(1);
      return;
    }
    setLocalError(null);
    setPlacing(true);
    const payload = {
      orderItems: cart.items.map((item) => ({
        product: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: shipping,
      paymentMethod,
      prices: {
        itemsPrice: summary.itemsPrice,
        taxPrice: summary.taxPrice,
        shippingPrice: summary.shippingPrice,
        totalPrice: summary.totalPrice,
      },
      couponCode: cart.couponCode || '',
      cartSnapshot: {
        items: cart.items,
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
        deliveryFee: cart.deliveryFee,
        discountAmount: cart.discountAmount,
        couponCode: cart.couponCode,
      },
    };

    const action = await dispatch(createOrder(payload));
    setPlacing(false);

    if (createOrder.fulfilled.match(action)) {
      dispatch(clearCart());
      const created = action.payload;
      const id = created._id || created.id;
      if (id) {
        navigate(`/order-success/${id}`);
      }
    }
  };

  const steps = [
    { id: 1, label: 'Shipping' },
    { id: 2, label: 'Payment' },
    { id: 3, label: 'Review & place' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <header className="space-y-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Checkout
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            Complete your order in a few quick steps.
          </p>

          <ol className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            {steps.map((s, index) => {
              const active = s.id === step;
              const complete = s.id < step;
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (complete || s.id === step) setStep(s.id);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ${
                      active
                        ? 'bg-primary-500/15 text-primary-700 ring-1 ring-primary-500/40 dark:text-primary-200'
                        : complete
                        ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-200'
                        : 'bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:ring-slate-800'
                    }`}
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[0.6rem] text-white dark:bg-slate-950">
                      {index + 1}
                    </span>
                    <span>{s.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <span className="hidden text-slate-600 sm:inline">
                      —
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="space-y-4">
            {(localError || error) && (
              <Alert variant="error">{localError || error}</Alert>
            )}

            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
              {(step === 1 || step === 2 || step === 3) && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Shipping address
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={shipping.fullName}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      {shippingErrors.fullName && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          {shippingErrors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      {shippingErrors.phone && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          {shippingErrors.phone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Address line 1
                      </label>
                      <input
                        type="text"
                        value={shipping.addressLine1}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            addressLine1: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      {shippingErrors.addressLine1 && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          {shippingErrors.addressLine1}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Address line 2 (optional)
                      </label>
                      <input
                        type="text"
                        value={shipping.addressLine2}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            addressLine2: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        City
                      </label>
                      <input
                        type="text"
                        value={shipping.city}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      {shippingErrors.city && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          {shippingErrors.city}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        State
                      </label>
                      <input
                        type="text"
                        value={shipping.state}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      {shippingErrors.state && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          {shippingErrors.state}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={shipping.pincode}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            pincode: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      {shippingErrors.pincode && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          {shippingErrors.pincode}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Country
                      </label>
                      <input
                        type="text"
                        value={shipping.country}
                        onChange={(e) =>
                          setShipping((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      {shippingErrors.country && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          {shippingErrors.country}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
                    <span>
                      Your address will be saved securely for faster checkout
                      next time.
                    </span>
                    <button
                      type="button"
                      onClick={handleNextFromShipping}
                      className="hidden rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-primary-400 sm:inline-flex"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Payment method
              </h2>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                {['COD', 'RAZORPAY', 'STRIPE'].map((method) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="h-3.5 w-3.5 accent-primary-500"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {method === 'COD'
                          ? 'Cash on delivery'
                          : method === 'RAZORPAY'
                          ? 'Razorpay (UPI / cards)'
                          : 'Stripe (cards)'}
                      </span>
                      <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                        {method === 'COD'
                          ? 'Pay when your order is delivered.'
                          : 'Secure online payment. This demo flow records the method but does not process real payments.'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Review & place order
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ensure your details are correct before placing your order.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <li>
                  • Shipping to{' '}
                  <span className="font-semibold">
                    {shipping.fullName || '—'}
                  </span>{' '}
                  at{' '}
                  <span className="font-semibold">
                    {shipping.city || '—'},{' '}
                    {shipping.country || '—'}
                  </span>
                </li>
                <li>
                  • Payment method:{' '}
                  <span className="font-semibold">
                    {paymentMethod === 'COD'
                      ? 'Cash on delivery'
                      : paymentMethod === 'RAZORPAY'
                      ? 'Razorpay'
                      : 'Stripe'}
                  </span>
                </li>
                <li>
                  • Items in cart:{' '}
                  <span className="font-semibold">
                    {cart.totalItems}
                  </span>
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[0.7rem] font-medium text-slate-500 hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-300"
                >
                  Edit shipping
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={!hasItems || placing || loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(placing || loading) && (
                    <Spinner className="h-4 w-4" />
                  )}
                  <span>
                    {placing || loading ? 'Placing order...' : 'Place order'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Order summary
              </h2>
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1 text-xs text-slate-700 dark:text-slate-300">
                {!hasItems ? (
                  <p className="text-slate-500">
                    Your cart is empty.
                  </p>
                ) : (
                  cart.items.map((item) => (
                    <div
                      key={item.id}
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
                      <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                        ₹
                        {(
                          Number(item.price || 0) *
                          Number(item.quantity || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{summary.itemsPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax (5%)</span>
                  <span>₹{summary.taxPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>
                    {summary.shippingPrice === 0 &&
                    summary.itemsPrice > 0
                      ? 'Free'
                      : `₹${summary.shippingPrice.toFixed(2)}`}
                  </span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-300">
                    <span>Discount</span>
                    <span>- ₹{summary.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="mt-2 border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span>₹{summary.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Secure checkout
              </p>
              <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                Your details are encrypted and orders are protected with
                ShopEZ&apos;s buyer safety policies.
              </p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;

