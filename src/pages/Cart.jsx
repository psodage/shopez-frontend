import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  applyCoupon,
  clearCart,
  clearCoupon,
  removeFromCart,
  saveForLater,
  moveFromSavedToCart,
  updateQuantity,
} from '../redux/cartSlice';
import api from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((s) => s.cart);

  const [updatingId, setUpdatingId] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [toast, setToast] = useState(null);
  const [stockErrorId, setStockErrorId] = useState(null);

  const quantityTimersRef = useRef({});

  const hasItems = cart.items.length > 0;

  const totals = useMemo(() => {
    const subtotal = cart.subtotal || 0;
    const delivery = cart.deliveryFee || 0;
    const discount = cart.discountAmount || 0;
    const total = Math.max(subtotal + delivery - discount, 0);
    return { subtotal, delivery, discount, total };
  }, [cart.subtotal, cart.deliveryFee, cart.discountAmount]);

  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  };

  const handleChangeQty = (id, next, stock) => {
    const desired = Math.max(1, next);
    const max = stock != null ? Number(stock) : Infinity;

    if (desired > max) {
      setStockErrorId(id);
      setTimeout(() => setStockErrorId(null), 1200);
    }

    setUpdatingId(id);

    if (quantityTimersRef.current[id]) {
      clearTimeout(quantityTimersRef.current[id]);
    }

    quantityTimersRef.current[id] = setTimeout(() => {
      dispatch(updateQuantity({ id, quantity: desired }));
      setUpdatingId((current) => (current === id ? null : current));
      delete quantityTimersRef.current[id];
    }, 200);
  };

  useEffect(() => {
    return () => {
      Object.values(quantityTimersRef.current).forEach((timer) =>
        clearTimeout(timer)
      );
      quantityTimersRef.current = {};
    };
  }, []);

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
    triggerToast('Removed from cart');
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const raw = couponInput.trim();
    if (!raw) return;

    const code = raw.toUpperCase();

    try {
      const res = await api.post('/api/coupons/validate', {
        code,
        subtotal: cart.subtotal || 0,
      });
      const { code: normalized, discount, message } = res.data || {};
      dispatch(
        applyCoupon({
          code: normalized || code,
          discount: discount || 0,
        })
      );
      setCouponInput('');
      triggerToast(message || 'Coupon applied successfully.');
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Invalid or expired coupon.';
      dispatch(clearCoupon());
      triggerToast(message);
    }
  };

  const handleCheckout = () => {
    if (!hasItems) return;
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 space-y-6">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Your cart
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              {cart.totalItems
                ? `${cart.totalItems} item${cart.totalItems === 1 ? '' : 's'} in your cart`
                : 'No items yet. Start shopping to fill your cart.'}
            </p>
          </div>
          {hasItems && (
            <button
              type="button"
              onClick={() => dispatch(clearCart())}
              className="self-start rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-red-400/70 hover:text-red-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-red-300"
            >
              Clear cart
            </button>
          )}
        </header>

        {!hasItems ? (
          <section className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
              <svg
                className="h-8 w-8"
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
              Your cart is empty
            </h2>
            <p className="mt-1 max-w-xs text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Explore curated products and add your favorites to the cart to see
              them here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-4 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-primary-400 sm:text-sm"
            >
              Start shopping
            </button>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <div className="space-y-4">
              {cart.items.map((item) => {
                const max = item.stock != null ? Number(item.stock) : Infinity;
                const atMax = Number(item.quantity || 1) >= max && max !== Infinity;
                return (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-24 sm:w-24 dark:border-slate-800 dark:bg-slate-900">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[0.65rem] text-slate-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-50">
                          {item.name}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          ₹{Number(item.price || 0).toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                          <button
                            type="button"
                            onClick={() =>
                              handleChangeQty(
                                item.id,
                                Number(item.quantity || 1) - 1,
                                item.stock
                              )
                            }
                            disabled={Number(item.quantity || 1) <= 1}
                            className="px-3 py-2 text-slate-700 hover:text-primary-600 disabled:opacity-40 dark:text-slate-200 dark:hover:text-primary-300"
                          >
                            −
                          </button>
                          <div
                            className={`min-w-[2.5rem] text-center text-sm font-semibold text-slate-900 transition-transform duration-150 dark:text-slate-100 ${
                              updatingId === item.id ? 'scale-105' : ''
                            }`}
                          >
                            {item.quantity}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleChangeQty(
                                item.id,
                                Number(item.quantity || 1) + 1,
                                item.stock
                              )
                            }
                            disabled={atMax}
                            className="px-3 py-2 text-slate-700 hover:text-primary-600 disabled:opacity-40 dark:text-slate-200 dark:hover:text-primary-300"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <p className="text-sm font-semibold text-primary-600 dark:text-primary-300">
                            ₹
                            {(
                              Number(item.price || 0) *
                              Number(item.quantity || 0)
                            ).toFixed(2)}
                          </p>
                          <button
                            type="button"
                            onClick={() => dispatch(saveForLater(item.id))}
                            className="text-[0.7rem] font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-300"
                          >
                            Save for later
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="text-[0.7rem] font-medium text-slate-500 hover:text-red-500 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {stockErrorId === item.id && (
                        <p className="text-[0.7rem] text-red-500 dark:text-red-300">
                          Only {max} in stock.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}

              {cart.savedForLater.length > 0 && (
                <section className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Saved for later
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Items here won&apos;t be included in your total until moved
                    back to the cart.
                  </p>
                  <div className="mt-3 space-y-3">
                    {cart.savedForLater.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/40"
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
                          <p className="line-clamp-1 text-slate-900 dark:text-slate-200">
                            {item.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            ₹{Number(item.price || 0).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(moveFromSavedToCart(item.id))
                            }
                            className="rounded-lg bg-primary-500 px-3 py-1 text-[0.7rem] font-semibold text-slate-950 hover:bg-primary-400"
                          >
                            Move to cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Order summary
                </h2>
                <div className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Items</span>
                    <span>{cart.totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery</span>
                    <span>
                      {totals.delivery === 0 && totals.subtotal > 0
                        ? 'Free'
                        : `₹${totals.delivery.toFixed(2)}`}
                    </span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-300">
                      <span>Discount</span>
                      <span>- ₹{totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="mt-2 border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span>₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleApplyCoupon}
                  className="mt-4 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code (e.g. SAVE10)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-800 px-3 py-2 text-[0.7rem] font-semibold text-slate-100 hover:bg-slate-700"
                  >
                    Apply
                  </button>
                </form>
                {cart.couponCode && (
                  <button
                    type="button"
                    onClick={() => dispatch(clearCoupon())}
                    className="mt-2 text-[0.7rem] text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-300"
                  >
                    Remove coupon ({cart.couponCode})
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!hasItems}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {!hasItems && <Spinner className="h-4 w-4 opacity-0" />}
                  Checkout
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                <p className="font-semibold text-slate-900 dark:text-slate-200">
                  Shopping securely with ShopEZ
                </p>
                <ul className="mt-2 space-y-1.5">
                  <li>• Encrypted payments and protected checkout.</li>
                  <li>• Easy returns within 30 days on eligible items.</li>
                  <li>• 24/7 support for all your orders.</li>
                </ul>
              </div>
            </aside>
          </section>
        )}
      </main>

      {hasItems && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="flex-1 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                ₹{totals.total.toFixed(2)}{' '}
                <span className="text-slate-500">/ total</span>
              </p>
              <p className="text-[0.7rem] text-slate-500">
                {cart.totalItems} item{cart.totalItems === 1 ? '' : 's'} •{' '}
                {totals.delivery === 0 && totals.subtotal > 0
                  ? 'Free delivery'
                  : `+ ₹${totals.delivery.toFixed(2)} delivery`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!hasItems}
              className="rounded-2xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-xs text-slate-200 ring-1 ring-slate-700 backdrop-blur">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Cart;

