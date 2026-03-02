import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const Hero = () => {
  const { theme } = useTheme();
  const [heroBanner, setHeroBanner] = useState(null);
  const navigate = useNavigate();

  const product = heroBanner?.product || null;
  const productLink =
    heroBanner?.redirectUrl ||
    (product?._id ? `/product/${product._id}` : null);

  const handleShopNow = () => {
    if (productLink) {
      navigate(productLink);
    } else {
      const el = document.querySelector('#featured-products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    api
      .get('/api/banners/hero')
      .then((res) => {
        if (!isMounted) return;
        setHeroBanner(res.data?.banner || null);
      })
      // eslint-disable-next-line no-console
      .catch(() => {
        if (!isMounted) return;
        setHeroBanner(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const productBasePrice =
    product && product.price != null ? Number(product.price) : null;
  const productDiscountPrice =
    product && product.discountPrice != null
      ? Number(product.discountPrice)
      : null;
  const bannerDiscountPrice =
    heroBanner && heroBanner.discountPrice != null
      ? Number(heroBanner.discountPrice)
      : null;

  const salePrice =
    bannerDiscountPrice ?? productDiscountPrice ?? productBasePrice;

  let originalPrice = null;
  if (
    salePrice != null &&
    productBasePrice != null &&
    salePrice < productBasePrice
  ) {
    originalPrice = productBasePrice;
  }

  const salePriceLabel =
    salePrice != null
      ? `₹${salePrice.toFixed(2)}`
      : heroBanner?.metadata?.salePrice || '₹89.00';

  const originalPriceLabel =
    originalPrice != null
      ? `₹${originalPrice.toFixed(2)}`
      : heroBanner?.metadata?.originalPrice || '₹129.00';

  let discountLabel = heroBanner?.metadata?.discountLabel || 'Save 30% today';
  if (salePrice != null && originalPrice != null && originalPrice > 0) {
    const pct = Math.round((1 - salePrice / originalPrice) * 100);
    if (pct > 0 && Number.isFinite(pct)) {
      discountLabel = `Save ${pct}% today`;
    }
  }

  let reviewLabel = heroBanner?.metadata?.reviewLabel || '4.8 • 320+ reviews';
  if (product && product.rating != null) {
    const rating = Number(product.rating).toFixed(1);
    const reviews =
      product.numReviews || product.reviewsCount || product.reviewCount;
    reviewLabel = reviews
      ? `${rating} • ${reviews}+ reviews`
      : `${rating} • Top rated`;
  }

  let stockLabel = heroBanner?.metadata?.stockLabel || '75% claimed';
  if (product && product.countInStock != null) {
    const stock = Number(product.countInStock);
    if (Number.isFinite(stock)) {
      if (stock <= 5) {
        stockLabel = `Only ${stock} left`;
      } else {
        stockLabel = `${stock} in stock`;
      }
    }
  }

  const heroImageSrc =
    heroBanner?.image ||
    product?.image ||
    (Array.isArray(product?.images) && product.images[0]) ||
    null;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-200 px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16 shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 dark:shadow-[0_22px_60px_rgba(15,23,42,0.9)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-2rem] h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center">
        <div className="w-full max-w-xl space-y-4">
          <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:ring-slate-700/80">
            New • Spring collection 2026
          </p>
          <h1
            id="hero-heading"
            className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-slate-50"
          >
            Shop smarter with{' '}
            <span className="bg-gradient-to-r from-primary-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              ShopEZ
            </span>
          </h1>
          <p className="max-w-lg text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Curated products, seamless checkout, and delivery that actually
            keeps its promise. All in one minimal, distraction‑free experience.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleShopNow}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-primary-400"
            >
              Shop now
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700/80 dark:bg-slate-950/60 dark:text-slate-100 dark:hover:border-slate-500"
            >
              Explore categories
            </button>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-4 text-xs text-slate-700 sm:text-sm dark:text-slate-300">
            <div>
              <dt className="text-slate-500 dark:text-slate-500">Products</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">10k+</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-500">Happy customers</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">120k+</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-500">Avg. rating</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">4.8/5</dd>
            </div>
          </dl>
        </div>

        <div className="relative ml-auto w-full max-w-sm">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_22px_60px_rgba(15,23,42,0.9)]">
            {/* Ambient glows behind the card */}
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-primary-400/15 blur-3xl" />
              <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl" />
            </div>

            <div className="relative flex h-full flex-col">
              {/* TOP: large product image on white */}
              <div className="relative flex-1 bg-white px-4 pt-4 pb-3 dark:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary-200 ring-1 ring-primary-500/40 backdrop-blur dark:bg-slate-900/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{heroBanner?.badgeText || 'Limited time offer'}</span>
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-600 dark:bg-slate-200 dark:text-slate-800">
                    {reviewLabel}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-center">
                  <div className="relative h-40 w-full max-w-[260px] rounded-2xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-3 shadow-inner dark:from-slate-100 dark:via-slate-200 dark:to-slate-300">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_60%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.18),transparent_55%)]" />
                    <div className="relative flex h-full w-full items-center justify-center">
                      {heroImageSrc ? (
                        <img
                          src={heroImageSrc}
                          alt={
                            heroBanner?.title ||
                            product?.name ||
                            'Featured product'
                          }
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col justify-center px-4">
                          <div className="mb-2 h-2 w-20 rounded-full bg-slate-300" />
                          <div className="mb-3 h-2 w-28 rounded-full bg-slate-300/90" />
                          <div className="h-6 w-16 rounded-xl bg-slate-300/80" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: deal section, theme-aware */}
              <div
                className={`relative flex flex-col gap-3 rounded-t-3xl px-4 py-4 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-sky-900 text-slate-50'
                    : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900'
                }`}
              >
                {/* Title */}
                <div className="space-y-1">
                  <p
                    className={`text-xs font-medium uppercase tracking-[0.16em] ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Today&apos;s deal
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      theme === 'dark' ? 'text-slate-50' : 'text-slate-900'
                    }`}
                  >
                    {heroBanner?.title || product?.name || "Today’s hand‑picked deals"}
                  </p>
                </div>

                {/* Price + rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-slate-50' : 'text-slate-900'
                        }`}
                      >
                        {salePriceLabel}
                      </span>
                      <span
                        className={`text-xs line-through ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {originalPriceLabel}
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-200">
                      {discountLabel}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-0.5 text-amber-300">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 3.5 14.6 9l5.4.4-4.1 3.4 1.3 5.3L12 15.8 6.8 18.1 8.1 12.8 4 9.4 9.4 9z" />
                        </svg>
                      ))}
                    </div>
                    <p
                      className={`text-[0.65rem] ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {reviewLabel}
                    </p>
                  </div>
                </div>

                {/* Stock / progress */}
                <div
                  className={`space-y-1.5 rounded-2xl p-3 ring-1 backdrop-blur ${
                    theme === 'dark'
                      ? 'bg-slate-900/60 ring-slate-800/70'
                      : 'bg-slate-100 ring-slate-200'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-[0.7rem] ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <span>Almost gone</span>
                    <span
                      className={
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }
                    >
                      {stockLabel}
                    </span>
                  </div>
                  <div
                    className={`h-1.5 w-full overflow-hidden rounded-full ${
                      theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                  >
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400" />
                  </div>
                </div>

                {/* CTA + shipping pill */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleShopNow}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-400 px-4 py-2 text-[0.8rem] font-semibold text-slate-950 transition hover:bg-primary-300"
                  >
                    Shop this deal
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </button>

                  <div
                    className={`flex items-center gap-1 rounded-2xl px-3 py-2 text-[0.7rem] ring-1 ${
                      theme === 'dark'
                        ? 'bg-slate-900/70 text-slate-100 ring-slate-700'
                        : 'bg-slate-100 text-slate-700 ring-slate-300'
                    }`}
                  >
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Free delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

