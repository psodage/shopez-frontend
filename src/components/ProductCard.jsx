import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import {
  addWishlistItem,
  removeWishlistItem,
  selectIsInWishlist,
} from '../redux/wishlistSlice';

const ProductCard = React.memo(function ProductCard({ product }) {
  const dispatch = useDispatch();

  const productId = product.id || product._id;
  const countInStock = product?.countInStock ?? 0;
  const inStock = countInStock > 0;

  const isInWishlist = useSelector((state) =>
    selectIsInWishlist(state, productId)
  );
  const [heartAnimating, setHeartAnimating] = useState(false);

  const price = Number(product?.price || 0);
  const productDiscountPrice =
    product?.discountPrice != null ? Number(product.discountPrice) : null;
  const bannerDiscountPrice =
    product?.bannerDiscountPrice != null
      ? Number(product.bannerDiscountPrice)
      : null;
  const discountPercent = Number(product?.discountPercent || 0);
  const percentDiscountPrice =
    discountPercent > 0
      ? Math.max(price - price * (discountPercent / 100), 0)
      : null;
  const effectivePrice =
    bannerDiscountPrice ?? productDiscountPrice ?? percentDiscountPrice ?? price;

  const hasDiscount = effectivePrice < price && price > 0;
  const displayDiscountPercent =
    hasDiscount && price > 0
      ? Math.round(((price - effectivePrice) / price) * 100)
      : 0;

  const handleAdd = () => {
    if (!inStock) return;

    dispatch(
      addToCart({
        id: productId,
        name: product.name,
        price: effectivePrice,
        image: product.image,
        stock: countInStock,
      })
    );
  };

  const handleToggleWishlist = useCallback(() => {
    if (!productId) return;
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 180);

    if (isInWishlist) {
      dispatch(removeWishlistItem(productId));
      return;
    }

    dispatch(
      addWishlistItem({
        id: productId,
        name: product.name,
        price: effectivePrice,
        image: product.image,
        stock: countInStock,
      })
    );
  }, [dispatch, isInWishlist, productId, product?.name, effectivePrice, product?.image, countInStock]);

  const primaryImage = useMemo(
    () =>
      product.image || (product.images && product.images[0]) || null,
    [product.image, product.images]
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary-500/60 hover:shadow-[0_25px_65px_rgba(8,47,73,0.18)] dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-[0_18px_45px_rgba(15,23,42,0.8)] dark:hover:shadow-[0_25px_65px_rgba(8,47,73,0.9)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
        {hasDiscount && displayDiscountPercent > 0 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-primary-500 px-2.5 py-0.5 text-[0.7rem] font-semibold text-slate-950">
            -{displayDiscountPercent}%
          </div>
        )}
        <Link
          to={productId ? `/product/${productId}` : '/products'}
          className="block h-full w-full"
          aria-label={`View details for ${product.name}`}
        >
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
              No image
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 ring-1 ring-slate-200 backdrop-blur transition dark:bg-slate-950/70 dark:text-slate-300 dark:ring-slate-700 ${
            isInWishlist
              ? 'text-rose-600 ring-rose-400/80 dark:text-rose-300'
              : 'hover:text-rose-600 hover:ring-rose-400/80 dark:hover:text-rose-300'
          } ${heartAnimating ? 'scale-110' : ''}`}
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
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div className="space-y-1">
          <Link
            to={productId ? `/product/${productId}` : '/products'}
            className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-primary-700 dark:text-slate-50 dark:hover:text-primary-200"
          >
            {product.name}
          </Link>
          <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
            {product.category || 'Featured'}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                ₹{effectivePrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-[0.7rem] text-slate-500 line-through dark:text-slate-400">
                  ₹{price.toFixed(2)}
                </span>
              )}
            </div>
            {product.rating != null && (
              <div className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-amber-600 dark:text-amber-300">
                <svg
                  className="h-3 w-3 fill-amber-500 dark:fill-amber-400"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m12 2 2.4 6.9 7.1.3-5.6 4.2 1.9 6.8L12 16.8 6.2 20.2 8.1 13.4 2.5 9.2l7.1-.3L12 2Z" />
                </svg>
                <span>{Number(product.rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className={`inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition sm:w-auto ${
              inStock
                ? 'bg-primary-500 text-slate-950 hover:bg-primary-400'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-60 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {inStock && (
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
            {inStock ? 'Add to cart' : 'Out of stock'}
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductCard;

