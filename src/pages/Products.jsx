import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SectionSkeleton';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { resetFilters, setFilters } from '../redux/productFiltersSlice';

const parseNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? String(n) : '';
};

const Products = () => {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.productFilters);
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [, setCategoriesLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pageMeta, setPageMeta] = useState({ page: 1, totalPages: 1 });

  const [isApplying, setIsApplying] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const paramsFromUrl = {
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      rating: searchParams.get('rating') || '',
      sort: searchParams.get('sort') || 'latest',
      page: Number(searchParams.get('page') || 1),
    };
    dispatch(setFilters(paramsFromUrl));
  }, [dispatch, searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await api.get('/api/categories');
        setCategories(res.data?.categories || res.data || []);
      } catch {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const effectiveParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.sort && filters.sort !== 'latest')
      params.set('sort', filters.sort);
    params.set('page', String(filters.page || 1));
    return params;
  }, [filters]);

  useEffect(() => {
    setSearchParams(effectiveParams);
  }, [effectiveParams, setSearchParams]);

  const fetchProducts = useCallback(
    async ({ append = false } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/products', {
          params: {
            category: filters.category || undefined,
            minPrice: filters.minPrice || undefined,
            maxPrice: filters.maxPrice || undefined,
            rating: filters.rating || undefined,
            sort: filters.sort || 'latest',
            page: filters.page || 1,
          },
        });
        const body = res.data || {};
        const nextProducts = body.products || [];

        setProducts((prev) => (append ? [...prev, ...nextProducts] : nextProducts));
        setTotal(body.total || 0);
        setPageMeta({
          page: body.page || filters.page || 1,
          totalPages: body.totalPages || 1,
        });
      } catch (err) {
        const message =
          err.response?.data?.message ||
          'Failed to load products. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
        setIsApplying(false);
      }
    },
    [filters, setProducts]
  );

  useEffect(() => {
    fetchProducts({ append: false });
  }, [fetchProducts]);

  useEffect(() => {
    if (!filters.infiniteScroll) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          !loading &&
          pageMeta.page < pageMeta.totalPages
        ) {
          const nextPage = pageMeta.page + 1;
          dispatch(setFilters({ page: nextPage }));
          fetchProducts({ append: true });
        }
      },
      {
        rootMargin: '200px',
      }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [dispatch, fetchProducts, filters.infiniteScroll, loading, pageMeta]);

  const handleFieldChange = (field, value) => {
    dispatch(
      setFilters({
        ...filters,
        [field]: value,
        page: 1,
      })
    );
  };

  const handleApply = (e) => {
    e?.preventDefault();
    setIsApplying(true);
    dispatch(setFilters({ ...filters, page: 1 }));
    fetchProducts({ append: false });
  };

  const handleClear = () => {
    dispatch(resetFilters());
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pageMeta.totalPages) return;
    dispatch(setFilters({ ...filters, page: nextPage }));
  };

  const totalPagesArray = useMemo(() => {
    return Array.from({ length: pageMeta.totalPages }, (_, i) => i + 1);
  }, [pageMeta.totalPages]);

  const resultsLabel = useMemo(() => {
    if (total === 0) return 'No products found';
    if (total === 1) return '1 product';
    return `${total} products`;
  }, [total]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-6xl gap-6 px-4 pb-12 pt-6">
        <aside className="hidden w-64 shrink-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg md:block dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Filters
            </h2>
            <button
              type="button"
              onClick={handleClear}
              className="text-[0.7rem] font-medium text-slate-400 hover:text-primary-300"
            >
              Clear all
            </button>
          </div>

          <form onSubmit={handleApply} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  handleFieldChange('category', e.target.value || '')
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-50"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option
                    key={cat.id || cat._id || cat.slug || cat.name}
                    value={cat.slug || cat.name?.toLowerCase()}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                Price range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFieldChange('minPrice', parseNumber(e.target.value))
                  }
                  placeholder="Min"
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-50"
                />
                <span className="text-slate-500">—</span>
                <input
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFieldChange('maxPrice', parseNumber(e.target.value))
                  }
                  placeholder="Max"
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                Minimum rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => handleFieldChange('rating', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-50"
              >
                <option value="">Any rating</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r}★ &amp; up
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                Sort by
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFieldChange('sort', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-50"
              >
                <option value="latest">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-primary-400 disabled:opacity-60"
              >
                {isApplying || loading ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    Applying...
                  </>
                ) : (
                  'Apply filters'
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch(
                    setFilters({
                      ...filters,
                      infiniteScroll: !filters.infiniteScroll,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-[0.7rem] font-medium text-slate-700 hover:border-primary-400/70 hover:text-primary-600 dark:border-slate-700/80 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:text-primary-200"
              >
                {filters.infiniteScroll
                  ? 'Disable infinite scroll'
                  : 'Enable infinite scroll'}
              </button>
            </div>
          </form>
        </aside>

        <section className="flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                All products
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {resultsLabel}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <details className="group rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 list-none">
                    Filters
                    <span className="text-slate-500 group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <div className="mt-2 space-y-3 border-t border-slate-800 pt-3">
                    <p className="text-[0.7rem] text-slate-400">
                      Use the filters sidebar on larger screens for more
                      control.
                    </p>
                  </div>
                </details>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/80">
                <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
                  Sort by
                </span>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFieldChange('sort', e.target.value)}
                  className="bg-transparent text-slate-900 outline-none dark:text-slate-100"
                >
                  <option value="latest">Newest first</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
              </div>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {loading && products.length === 0 ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No products match your filters yet. Try adjusting them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          )}

          {!filters.infiniteScroll && pageMeta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
              >
                ‹ Previous
              </button>
              <div className="flex flex-wrap items-center gap-1">
                {totalPagesArray.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg border px-2 text-[0.7rem] ${
                      p === filters.page
                        ? 'border-primary-500/80 bg-primary-500/20 text-primary-700 dark:text-primary-200'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-primary-400/70 hover:text-primary-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-primary-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={
                  filters.page >= pageMeta.totalPages || loading
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Next ›
              </button>
            </div>
          )}

          {filters.infiniteScroll && (
            <div
              ref={loadMoreRef}
              className="flex items-center justify-center py-6 text-xs text-slate-500 dark:text-slate-400"
            >
              {loading && products.length > 0 ? (
                <div className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Loading more products...
                </div>
              ) : pageMeta.page >= pageMeta.totalPages ? (
                <span>End of results</span>
              ) : null}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Products;

