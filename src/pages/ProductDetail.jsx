import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AdminLayout from '../layouts/AdminLayout';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import ProductDetailSkeleton from '../components/ProductDetailSkeleton';
import {
  clearReviewStatus,
  resetProductDetail,
  fetchProductById,
  fetchRelatedProducts,
  submitReview,
} from '../redux/productDetailSlice';
import { addToCart } from '../redux/cartSlice';
import {
  addWishlistItem,
  removeFromWishlistLocal,
  selectIsInWishlist,
} from '../redux/wishlistSlice';

const formatDate = (dateLike) => {
  try {
    const d = new Date(dateLike);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { token, user } = useSelector((s) => s.auth);
  const {
    product,
    related,
    loading,
    error,
    reviewSubmitting,
    reviewSuccess,
    reviewError,
    relatedLoading,
    relatedError,
  } = useSelector((s) => s.productDetail);
  const isInWishlist = useSelector((s) =>
    selectIsInWishlist(s, s.productDetail.product?.id || s.productDetail.product?._id || id)
  );

  const [activeImage, setActiveImage] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState(() =>
    searchParams.get('tab') === 'reviews' ? 'reviews' : 'description'
  );
  const [toast, setToast] = useState(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const isAdmin = user?.role === 'admin';

  const stickyRef = useRef(null);

  useEffect(() => {
    dispatch(resetProductDetail());
    dispatch(fetchProductById(id));
    dispatch(clearReviewStatus());
    setActiveImage(0);
    setQty(1);
    setTab(
      searchParams.get('tab') === 'reviews' ? 'reviews' : 'description'
    );
  }, [dispatch, id, searchParams]);

  useEffect(() => {
    if (!product?.category) return;
    dispatch(
      fetchRelatedProducts({
        category: product.category,
        excludeId: product.id || product._id || id,
      })
    );
  }, [dispatch, id, product?.category, product?.id, product?._id]);

  const images = useMemo(() => {
    const list = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
    if (list.length) return list;
    if (product?.image) return [product.image];
    return [];
  }, [product]);

  const mainImage = images[activeImage] || images[0] || null;
  const goToPrevImage = () => setActiveImage((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goToNextImage = () => setActiveImage((i) => (i >= images.length - 1 ? 0 : i + 1));

  const countInStock = product?.countInStock ?? 0;
  const inStock = countInStock > 0;
  const price = Number(product?.price || 0);
  const bannerDiscountPrice =
    product?.bannerDiscountPrice != null
      ? Number(product.bannerDiscountPrice)
      : null;
  const productDiscountPrice =
    product?.discountPrice != null ? Number(product.discountPrice) : null;
  const discountPercent = Number(product?.discountPercent || 0);
  const percentDiscountPrice =
    discountPercent > 0
      ? Math.max(price - price * (discountPercent / 100), 0)
      : null;
  const discountedPrice =
    bannerDiscountPrice ??
    productDiscountPrice ??
    percentDiscountPrice ??
    price;
  const hasDiscount = discountedPrice < price && price > 0;
  const displayDiscountPercent =
    hasDiscount && price > 0
      ? Math.round(((price - discountedPrice) / price) * 100)
      : discountPercent;

  const deliveryEstimate = useMemo(() => {
    const now = new Date();
    const min = new Date(now);
    min.setDate(min.getDate() + 3);
    const max = new Date(now);
    max.setDate(max.getDate() + 5);
    return `${min.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${max.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }, []);

  const canAdd = inStock && product;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${clamp(x, 0, 100)}% ${clamp(y, 0, 100)}%`);
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCart({
        id: product.id || product._id,
        name: product.name,
        price: discountedPrice,
        image: product.image,
        quantity: qty,
        stock: countInStock,
      })
    );
    setToast('Added to cart');
    setTimeout(() => setToast(null), 1200);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast('Link copied');
      setTimeout(() => setToast(null), 1200);
    } catch {
      setToast('Unable to copy link');
      setTimeout(() => setToast(null), 1200);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    setWishlistBusy(true);
    const basePayload = {
      id: product.id || product._id || id,
      name: product.name,
      price: discountedPrice,
      image: product.image,
      stock: countInStock,
    };
    if (isInWishlist) {
      dispatch(removeFromWishlistLocal(basePayload.id));
      setToast('Removed from wishlist');
    } else {
      try {
        await dispatch(addWishlistItem(basePayload));
        setToast('Added to wishlist');
      } catch {
        setToast('Unable to update wishlist');
      }
    }
    setTimeout(() => setToast(null), 1400);
    setWishlistBusy(false);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(
        submitReview({
          id,
          rating: reviewRating,
          comment: reviewComment,
        })
      ).unwrap();
      setReviewComment('');
      setReviewRating(5);
      setTab('reviews');
      setTimeout(() => dispatch(clearReviewStatus()), 1500);
    } catch (_) {
      // handled by slice
    }
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') goToPrevImage();
      if (e.key === 'ArrowRight') goToNextImage();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, activeImage, images.length]);

  useEffect(() => {
    const onScroll = () => {
      if (!stickyRef.current) return;
      const shouldShow = window.scrollY > 420;
      stickyRef.current.dataset.show = shouldShow ? '1' : '0';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const breadcrumbCategory = product?.category || '';

  if (isAdmin) {
    return (
      <AdminLayout>
        <section className="space-y-5">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Admin • Product detail
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Internal view of a single product. Use the edit screen to change pricing, stock, or visibility.
              </p>
            </div>
            {product && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/products/${product.id || product._id}/edit`)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-primary-400"
              >
                Edit product
              </button>
            )}
          </header>

          {error && <Alert variant="error">{error}</Alert>}

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : !product ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-sm text-slate-600 dark:text-slate-400">Product not found.</p>
            </div>
          ) : (
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="space-y-3">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Product image
                  </p>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                        No image
                      </div>
                    )}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={goToPrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 p-2 text-slate-100 opacity-80 hover:opacity-100"
                          aria-label="Previous image"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={goToNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 p-2 text-slate-100 opacity-80 hover:opacity-100"
                          aria-label="Next image"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-200">
                          {activeImage + 1} / {images.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {images.slice(0, 10).map((src, idx) => (
                      <button
                        key={src + idx}
                        type="button"
                        onClick={() => setActiveImage(idx)}
                        className={`aspect-square overflow-hidden rounded-2xl border bg-slate-100 transition ${
                          idx === activeImage
                            ? 'border-primary-500/70 ring-2 ring-primary-500/20'
                            : 'border-slate-200 hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-900/60'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${product.name} ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                      Product
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {product.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {product.category || 'Uncategorized'} •{' '}
                      {product.brand || 'No brand'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <p>
                      ID:{' '}
                      <span className="font-mono text-[0.7rem] text-slate-300">
                        {product.id || product._id}
                      </span>
                    </p>
                    {product.createdAt && (
                      <p>
                        Created:{' '}
                        {new Date(product.createdAt).toLocaleString()}
                      </p>
                    )}
                    {product.updatedAt && (
                      <p>
                        Updated:{' '}
                        {new Date(product.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                      Pricing
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-700 dark:text-slate-300">
                        Base:{' '}
                        <span className="font-semibold text-primary-300">
                          ₹{price.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        Discount:{' '}
                        {hasDiscount
                          ? `${bannerDiscountPrice != null ? 'Banner' : displayDiscountPercent > 0 ? `${displayDiscountPercent}%` : 'Price'} • Final ₹${discountedPrice.toFixed(2)}`
                          : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                      Inventory
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-700 dark:text-slate-300">
                        Status:{' '}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                            inStock
                              ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-200'
                              : 'bg-red-500/10 text-red-700 ring-1 ring-red-500/40 dark:text-red-200'
                          }`}
                        >
                          {inStock ? 'In stock' : 'Out of stock'}
                        </span>
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        Qty on hand: {countInStock}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Rating: {Number(product.rating || 0).toFixed(1)}★ •{' '}
                        {product.numReviews || 0} reviews
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Description
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {product.fullDescription ||
                      product.description ||
                      'No description available.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Quick actions
                </p>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p>
                    • Use <span className="font-mono">Admin &gt; Products &gt; Edit</span>{' '}
                    to update pricing, stock, and metadata.
                  </p>
                  <p>
                    • Customer-facing wishlist, cart, and review actions are
                    hidden in this admin view.
                  </p>
                </div>
              </div>
            </section>
          )}
        </section>
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <nav className="text-xs text-slate-500 dark:text-slate-400">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="hover:text-primary-300">
                Home
              </Link>
            </li>
            <li className="text-slate-400 dark:text-slate-600">/</li>
            <li>
              <Link
                to={`/products?category=${encodeURIComponent(breadcrumbCategory)}`}
                className="hover:text-primary-300"
              >
                {breadcrumbCategory || 'Products'}
              </Link>
            </li>
            <li className="text-slate-400 dark:text-slate-600">/</li>
            <li className="line-clamp-1 text-slate-700 dark:text-slate-300">{product?.name || 'Product'}</li>
          </ol>
        </nav>

        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <ProductDetailSkeleton />
        ) : !product ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm text-slate-600 dark:text-slate-400">Product not found.</p>
          </div>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-3">
                <div
                  onMouseMove={handleMouseMove}
                  className="group relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70"
                >
                  {mainImage ? (
                    <button
                      type="button"
                      onClick={() => images.length > 0 && setLightboxOpen(true)}
                      className="block h-full w-full text-left"
                    >
                      <img
                        src={mainImage}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110 cursor-zoom-in"
                        style={{ transformOrigin: zoomOrigin }}
                      />
                    </button>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      No image
                    </div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-900 opacity-90 backdrop-blur-sm transition hover:bg-slate-100 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
                        aria-label="Previous image"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-900 opacity-90 backdrop-blur-sm transition hover:bg-slate-100 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
                        aria-label="Next image"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs text-slate-700 backdrop-blur-sm dark:bg-slate-900/80 dark:text-slate-200">
                        {activeImage + 1} / {images.length}
                      </span>
                    </>
                  )}

                  {hasDiscount && displayDiscountPercent > 0 && (
                    <div className="absolute left-4 top-4 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-slate-950">
                      -{displayDiscountPercent}%
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {images.slice(0, 10).map((src, idx) => (
                      <button
                        key={src + idx}
                        type="button"
                        onClick={() => setActiveImage(idx)}
                        className={`aspect-square overflow-hidden rounded-2xl border bg-slate-50 transition dark:bg-slate-900/60 ${
                          idx === activeImage
                            ? 'border-primary-500/70 ring-2 ring-primary-500/20'
                            : 'border-slate-200 hover:border-primary-500/60 dark:border-slate-800'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${product.name} ${idx + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {lightboxOpen && images.length > 0 && (
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image gallery"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(false)}
                      className="absolute right-4 top-4 rounded-full bg-slate-800/80 p-2 text-slate-100 hover:bg-slate-700"
                      aria-label="Close"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={goToPrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-3 text-slate-100 hover:bg-slate-700"
                      aria-label="Previous"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <img
                      src={images[activeImage]}
                      alt={`${product.name} - Image ${activeImage + 1}`}
                      className="max-h-[85vh] max-w-[90vw] object-contain"
                    />
                    <button
                      type="button"
                      onClick={goToNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-3 text-slate-100 hover:bg-slate-700"
                      aria-label="Next"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-slate-300">
                      {activeImage + 1} of {images.length}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {product.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                        <svg className="h-4 w-4 fill-amber-500 dark:fill-amber-400" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m12 2 2.4 6.9 7.1.3-5.6 4.2 1.9 6.8L12 16.8 6.2 20.2 8.1 13.4 2.5 9.2l7.1-.3L12 2Z" />
                      </svg>
                        <span className="text-slate-900 dark:text-slate-200">
                        {Number(product.rating || 0).toFixed(1)}
                      </span>
                        <span className="text-slate-500 dark:text-slate-500">
                        ({product.numReviews || 0} reviews)
                      </span>
                    </div>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                        inStock
                          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-200'
                          : 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-200'
                      }`}
                    >
                      {inStock ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Price
                      </p>
                      <div className="flex items-end gap-3">
                        <span className="text-2xl font-semibold text-primary-700 dark:text-primary-300">
                          ₹{discountedPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-slate-500 line-through">
                            ₹{price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-600 dark:text-slate-400">
                      <p className="font-medium text-slate-700 dark:text-slate-300">Delivery</p>
                      <p>Estimated: {deliveryEstimate}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {product.shortDescription || product.description || '—'}
                </p>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Quantity
                    </p>
                    <p className="text-xs text-slate-500">
                      Stock: {countInStock}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 text-slate-700 hover:text-primary-700 disabled:opacity-50 dark:text-slate-200 dark:hover:text-primary-300"
                        disabled={qty <= 1}
                      >
                        −
                      </button>
                      <div className="min-w-[3rem] text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {qty}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setQty((q) => Math.min(Math.max(1, countInStock), q + 1))
                        }
                        className="px-3 py-2 text-slate-700 hover:text-primary-700 disabled:opacity-50 dark:text-slate-200 dark:hover:text-primary-300"
                        disabled={!inStock || qty >= countInStock}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-1 gap-2">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!canAdd}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={!canAdd}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-primary-400/70 hover:text-primary-700 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:text-primary-200"
                      >
                        Buy now
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      disabled={wishlistBusy}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                        isInWishlist
                          ? 'border-rose-400/80 bg-rose-500/15 text-rose-200'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-rose-400/70 hover:text-rose-600 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:text-rose-200'
                      }`}
                    >
                      <span className="sr-only">
                        {isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      </span>
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill={isInWishlist ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      >
                        <path d="M12 20.5s-5.5-3.2-8.4-6.1A4.7 4.7 0 0 1 7 5.2 4.9 4.9 0 0 1 12 7a4.9 4.9 0 0 1 5-1.8 4.7 4.7 0 0 1 3.4 9.2c-2.9 2.9-8.4 6.1-8.4 6.1Z" />
                      </svg>
                      {isInWishlist ? 'Wishlisted' : 'Wishlist'}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-emerald-400/70 hover:text-emerald-600 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:text-emerald-200"
                    >
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-primary-400/70 hover:text-primary-700 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:text-primary-200"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'specs', label: 'Specifications' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                      tab === t.id
                        ? 'border-primary-500 text-primary-700 dark:text-primary-200'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'description' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  <p className="whitespace-pre-wrap">
                    {product.fullDescription || product.description || 'No description available.'}
                  </p>
                </div>
              )}

              {tab === 'specs' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  {product.specifications && Object.keys(product.specifications).length ? (
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(product.specifications).map(([k, v]) => (
                        <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {k}
                          </dt>
                          <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">
                            {String(v)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No specifications available.</p>
                  )}
                </div>
              )}

              {tab === 'reviews' && (
                <div className="grid gap-6 lg:grid-cols-5">
                  <div className="lg:col-span-3 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Customer reviews
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {product.numReviews || 0} reviews • Avg {Number(product.rating || 0).toFixed(1)}★
                      </p>

                      <div className="mt-4 space-y-4">
                        {(product.reviews || []).length === 0 ? (
                          <p className="text-sm text-slate-600 dark:text-slate-400">No reviews yet. Be the first to review this product.</p>
                        ) : (
                          (product.reviews || [])
                            .slice()
                            .reverse()
                            .map((r) => (
                              <div key={r._id || `${r.name}-${r.createdAt}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {formatDate(r.createdAt)}
                                  </p>
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-amber-300">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`h-3.5 w-3.5 ${i < (r.rating || 0) ? 'fill-amber-400' : 'fill-slate-300 dark:fill-slate-700'}`}
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                    >
                                      <path d="m12 2 2.4 6.9 7.1.3-5.6 4.2 1.9 6.8L12 16.8 6.2 20.2 8.1 13.4 2.5 9.2l7.1-.3L12 2Z" />
                                    </svg>
                                  ))}
                                </div>
                                <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap dark:text-slate-300">{r.comment}</p>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Write a review
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {token ? 'Share your experience with other shoppers.' : 'Please login to write a review.'}
                      </p>

                      <div className="mt-3 space-y-2">
                        {reviewError && <Alert variant="error">{reviewError}</Alert>}
                        {reviewSuccess && <Alert variant="success">{reviewSuccess}</Alert>}
                      </div>

                      <form onSubmit={handleSubmitReview} className={`mt-4 space-y-3 transition ${reviewSubmitting ? 'opacity-90' : ''}`}>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Rating
                          </label>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const starValue = index + 1;
                              const active = starValue <= reviewRating;
                              return (
                                <button
                                  key={starValue}
                                  type="button"
                                  onClick={() =>
                                    !(!token || reviewSubmitting) &&
                                    setReviewRating(starValue)
                                  }
                                  disabled={!token || reviewSubmitting}
                                  className={`p-1 ${
                                    active
                                      ? 'text-amber-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  } disabled:cursor-not-allowed`}
                                  aria-label={`${starValue} star${
                                    starValue === 1 ? '' : 's'
                                  }`}
                                >
                                  <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path d="m12 2 2.4 6.9 7.1.3-5.6 4.2 1.9 6.8L12 16.8 6.2 20.2 8.1 13.4 2.5 9.2l7.1-.3L12 2Z" />
                                  </svg>
                                </button>
                              );
                            })}
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              {reviewRating} / 5
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Comment
                          </label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            disabled={!token || reviewSubmitting}
                            rows={4}
                            placeholder="What did you like or dislike?"
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-600"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!token || reviewSubmitting || !reviewComment.trim()}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {reviewSubmitting ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Submitting...
                            </>
                          ) : (
                            'Submit review'
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Related products
                </h2>
                <Link
                  to={`/products?category=${encodeURIComponent(product.category || '')}`}
                  className="text-xs font-medium text-primary-700 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-200"
                >
                  View more
                </Link>
              </div>

              {relatedError && <Alert variant="error">{relatedError}</Alert>}

              {relatedLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                  Loading related products...
                </div>
              ) : related.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">No related products found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {related.map((p) => (
                    <ProductCard key={p.id || p._id} product={p} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <div
        ref={stickyRef}
        data-show="0"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden transition-transform duration-300 data-[show='0']:translate-y-full data-[show='1']:translate-y-0 dark:border-slate-800 dark:bg-slate-950/90"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
              {product?.name || 'Product'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ₹{discountedPrice.toFixed(2)} • {inStock ? 'In stock' : 'Out of stock'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="rounded-2xl bg-primary-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-xs text-slate-200 ring-1 ring-slate-700 backdrop-blur">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;

