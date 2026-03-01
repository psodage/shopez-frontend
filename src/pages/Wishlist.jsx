import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import {
  clearWishlist,
  removeWishlistItem,
  selectRecentlyAddedWishlist,
  selectWishlistCount,
} from '../redux/wishlistSlice';
import { addToCart } from '../redux/cartSlice';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((s) => s.wishlist.items);
  const total = useSelector(selectWishlistCount);
  const recentlyAdded = useSelector(selectRecentlyAddedWishlist);

  const [toast, setToast] = useState(null);
  const [movingId, setMovingId] = useState(null);

  const hasItems = items.length > 0;

  const handleToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 1400);
  };

  const handleMoveToCart = (item) => {
    if (!item || item.stock <= 0) return;
    setMovingId(item.id);
    dispatch(
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        stock: item.stock,
        quantity: 1,
      })
    );
    dispatch(removeWishlistItem(item.id));
    handleToast('Moved to cart');
    setTimeout(() => setMovingId(null), 250);
  };

  const handleRemove = (id) => {
    dispatch(removeWishlistItem(id));
    handleToast('Removed from wishlist');
  };

  const subtitle = useMemo(() => {
    if (!total) return 'Save items you love to quickly find them later.';
    if (total === 1) return '1 item in your wishlist';
    return `${total} items in your wishlist`;
  }, [total]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Your wishlist
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              {subtitle}
            </p>
          </div>
          {hasItems && (
            <button
              type="button"
              onClick={() => dispatch(clearWishlist())}
              className="self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-red-400/70 hover:text-red-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-red-300"
            >
              Clear wishlist
            </button>
          )}
        </header>

        {!hasItems ? (
          <section className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M12 20.5s-5.5-3.2-8.4-6.1A4.7 4.7 0 0 1 7 5.2 4.9 4.9 0 0 1 12 7a4.9 4.9 0 0 1 5-1.8 4.7 4.7 0 0 1 3.4 9.2c-2.9 2.9-8.4 6.1-8.4 6.1Z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-50">
              Your wishlist is empty
            </h2>
            <p className="mt-1 max-w-xs text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Browse products and tap the heart icon to save items you want to
              keep an eye on.
            </p>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="mt-4 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-primary-400 sm:text-sm"
            >
              Discover products
            </button>
          </section>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  All saved items
                </h2>
                <span className="text-[0.7rem] text-slate-500">
                  Tap a card to view details or move items directly to your
                  cart.
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const inStock = (item.stock ?? 0) > 0;
                  return (
                    <article
                      key={item.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <Link
                        to={`/product/${item.id}`}
                        className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
                        <div className="space-y-1">
                          <Link
                            to={`/product/${item.id}`}
                            className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-primary-700 dark:text-slate-50 dark:hover:text-primary-200"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {inStock ? 'In stock' : 'Out of stock'}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                              ₹{Number(item.price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveToCart(item)}
                              disabled={!inStock}
                              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[0.7rem] font-semibold shadow-sm transition ${
                                inStock
                                  ? 'bg-primary-500 text-slate-950 hover:bg-primary-400'
                                  : 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-60 dark:bg-slate-800'
                              }`}
                            >
                              {movingId === item.id && (
                                <Spinner className="h-3 w-3" />
                              )}
                              <span>Move to cart</span>
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
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {recentlyAdded.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Recently added
                  </h2>
                  <span className="text-[0.7rem] text-slate-500">
                    Your most recent favorites at a glance.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {recentlyAdded.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      to={`/product/${item.id}`}
                      className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-slate-900 dark:text-slate-100">
                          {item.name}
                        </p>
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          ₹{Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Share your wishlist
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const url = window.location.href;
                      await navigator.clipboard.writeText(url);
                      handleToast('Wishlist link copied');
                    } catch {
                      handleToast('Unable to copy link');
                    }
                  }}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-[0.7rem] font-medium text-slate-700 hover:border-primary-400/70 hover:text-primary-700 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:text-primary-200"
                >
                  Copy share link
                </button>
              </div>
              <p className="mt-2 text-[0.7rem] text-slate-500 dark:text-slate-500">
                Send this link to friends or family so they can see what you&apos;re
                considering.
              </p>
            </section>
          </>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-xs text-slate-200 ring-1 ring-slate-700 backdrop-blur">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Wishlist;

