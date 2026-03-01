import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { CategorySkeleton, ProductGridSkeleton } from '../components/SectionSkeleton';
import Alert from '../components/Alert';

const Home = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState(null);

  const [latest, setLatest] = useState([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestError, setLatestError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const res = await api.get('/api/categories');
        setCategories(res.data?.categories || res.data || []);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          'Failed to load categories. Please try again.';
        setCategoriesError(message);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      setFeaturedLoading(true);
      setFeaturedError(null);
      try {
        const res = await api.get('/api/products', {
          params: { featured: true },
        });
        setFeatured(res.data?.products || res.data || []);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          'Failed to load featured products. Please try again.';
        setFeaturedError(message);
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  useEffect(() => {
    const fetchLatest = async () => {
      setLatestLoading(true);
      setLatestError(null);
      try {
        const res = await api.get('/api/products', {
          params: { sort: 'latest' },
        });
        setLatest(res.data?.products || res.data || []);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          'Failed to load new arrivals. Please try again.';
        setLatestError(message);
      } finally {
        setLatestLoading(false);
      }
    };

    fetchLatest();
  }, []);

  const featuredSlice = useMemo(() => featured.slice(0, 8), [featured]);
  const latestSlice = useMemo(() => latest.slice(0, 10), [latest]);

  const displayCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return [];
    // Only show top-level categories (no parent / parentCategory in DB)
    return categories.filter((cat) => {
      if (!cat) return false;
      const noParentField =
        cat.parent === null ||
        cat.parent === undefined ||
        cat.parent === '';
      const noParentCategoryField =
        cat.parentCategory === null ||
        cat.parentCategory === undefined ||
        cat.parentCategory === '';
      return noParentField && noParentCategoryField;
    });
  }, [categories]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 space-y-10">
        <Hero />

        <section aria-labelledby="categories-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="categories-heading"
                className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
              >
                Shop by category
              </h2>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Browse curated collections to find what fits your style.
              </p>
            </div>
          </div>

          {categoriesError && (
            <Alert variant="error">{categoriesError}</Alert>
          )}

          {categoriesLoading ? (
            <CategorySkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {displayCategories.map((cat) => (
                <button
                  key={cat.id || cat._id || cat.name}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/products?category=${encodeURIComponent(
                        cat.slug || cat.name
                      )}`
                    )
                  }
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 group-hover:ring-primary-400/70 dark:bg-slate-900 dark:ring-slate-800">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                        {cat.name?.[0] || '?'}
                      </span>
                    )}
                  </div>
                  <span className="line-clamp-1 text-xs font-medium">
                    {cat.name}
                  </span>
                </button>
              ))}
              {!categoriesLoading && !categoriesError && displayCategories.length === 0 && (
                <p className="text-xs text-slate-500">
                  No categories available yet.
                </p>
              )}
            </div>
          )}
        </section>

        <section
          id="featured-products"
          aria-labelledby="featured-heading"
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="featured-heading"
                className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
              >
                Featured picks
              </h2>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Our most loved products, updated daily.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/products?featured=true')}
              className="text-xs font-medium text-primary-700 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-200"
            >
              View all
            </button>
          </div>

          {featuredError && <Alert variant="error">{featuredError}</Alert>}

          {featuredLoading ? (
            <ProductGridSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {featuredSlice.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
              {!featuredLoading && !featuredError && featuredSlice.length === 0 && (
                <p className="text-xs text-slate-500">
                  No featured products at the moment.
                </p>
              )}
            </div>
          )}
        </section>

        <section
          aria-labelledby="new-arrivals-heading"
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="new-arrivals-heading"
              className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
              >
                New arrivals
              </h2>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Fresh drops you don&apos;t want to miss.
              </p>
            </div>
          </div>

          {latestError && <Alert variant="error">{latestError}</Alert>}

          <div className="overflow-x-auto">
            {latestLoading ? (
              <div className="min-w-[640px]">
                <ProductGridSkeleton count={6} />
              </div>
            ) : (
              <div className="flex gap-3 pb-1 sm:grid sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                {latestSlice.map((product) => (
                  <div
                    key={product.id || product._id}
                    className="min-w-[220px] max-w-[260px] flex-1 sm:min-w-0"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
                {!latestLoading && !latestError && latestSlice.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No new arrivals have been added yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="orders-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="orders-heading"
              className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
              >
                Your orders
              </h2>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Quickly jump to your order history and live order status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/my-orders')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
            >
              View order history
            </button>
          </div>
        </section>

        <section aria-labelledby="why-heading" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="why-heading"
              className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
              >
                Why shop with ShopEZ?
              </h2>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Everything you need for a smooth, modern shopping experience.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Free delivery',
                body: 'Fast, tracked delivery on all eligible orders with no hidden fees.',
                icon: (
                  <path d="M3 7h10v10H3zM13 9h4l3 3v5h-7V9zM6 17h2M16 17h2" />
                ),
              },
              {
                title: 'Secure payment',
                body: 'Bank‑grade encryption and multiple trusted payment options.',
                icon: (
                  <>
                    <rect x="3" y="7" width="18" height="11" rx="2" />
                    <path d="M3 11h18" />
                  </>
                ),
              },
              {
                title: 'Easy returns',
                body: 'Hassle‑free returns with instant status tracking for your orders.',
                icon: (
                  <>
                    <path d="M4 4v6h6" />
                    <path d="M4 10a8 8 0 1 0 2.3-5.7L4 4" />
                  </>
                ),
              },
              {
                title: '24/7 support',
                body: 'Real humans on chat and email, around the clock, every day.',
                icon: (
                  <>
                    <circle cx="12" cy="12" r="7" />
                    <path d="M8.5 15.5c.7.7 1.7 1.1 3.5 1.1s2.8-.4 3.5-1.1" />
                    <path d="M9 10h.01M15 10h.01" />
                  </>
                ),
              },
            ].map((item) => (
              <article
                key={item.title}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-900"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-700 ring-1 ring-primary-500/40 dark:text-primary-300">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  >
                    {item.icon}
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
