import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import api from '../services/api';
import {
  clearAdminBannerMessages,
  createBanner,
} from '../redux/adminBannerSlice';

const AdminBannerCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((s) => s.adminBanners);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    badgeText: '',
    discountPrice: '',
    priority: 0,
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

  const selectedProductImage =
    (selectedProduct &&
      (selectedProduct.image ||
        (Array.isArray(selectedProduct.images) && selectedProduct.images[0]))) ||
    null;

  const displayImage = uploadedImagePreview || selectedProductImage;

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) {
      return 'Banner title is required.';
    }
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end <= start) {
        return 'End date must be after start date.';
      }
    }
    return null;
  };

  const handleSearchProducts = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const query = productQuery.trim();
    if (!query) {
      setProductResults([]);
      setSelectedProduct(null);
      return;
    }
    try {
      setProductLoading(true);
      const res = await api.get('/api/admin/products', {
        params: { keyword: query, page: 1, limit: 6 },
      });
      const items = Array.isArray(res.data?.products) ? res.data.products : [];
      setProductResults(items);
    } catch (err) {
      setProductResults([]);
      setLocalError(
        err?.response?.data?.message ||
          'Unable to search products. Please try again.'
      );
    } finally {
      setProductLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    dispatch(clearAdminBannerMessages());

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    // Hero banners are now always tied to the homepage hero placement.
    formData.append('placement', 'hero');
    formData.append('isActive', String(form.isActive));
    formData.append('priority', String(Number(form.priority) || 0));

    if (selectedProduct) {
      const productId = selectedProduct._id || selectedProduct.id;
      if (productId) {
        formData.append('productId', String(productId));
      }
    }

    if (uploadedImage) {
      formData.append('image', uploadedImage);
    }

    if (form.subtitle.trim()) formData.append('subtitle', form.subtitle.trim());
    if (form.badgeText.trim())
      formData.append('badgeText', form.badgeText.trim());
    if (form.discountPrice !== '' && form.discountPrice != null) {
      formData.append(
        'discountPrice',
        String(Number(form.discountPrice) || 0),
      );
    }
    if (form.startDate) formData.append('startDate', form.startDate);
    if (form.endDate) formData.append('endDate', form.endDate);

    setSubmitting(true);
    const action = await dispatch(createBanner(formData));
    setSubmitting(false);

    if (createBanner.fulfilled.match(action)) {
      navigate('/admin/banners');
      return;
    }

    setLocalError(
      typeof action.payload === 'string'
        ? action.payload
        : 'Unable to create banner.'
    );
  };

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Create banner
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Configure a banner for the homepage hero.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/banners')}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Back to banners
          </button>
        </header>

        <div className="space-y-3">
          {(localError || error) && (
            <Alert variant="error">{localError || error}</Alert>
          )}
          {success && <Alert variant="success">{success}</Alert>}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={handleChange('title')}
                  placeholder="Today’s hand‑picked deals"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={handleChange('subtitle')}
                  placeholder="Join thousands of shoppers getting the best prices…"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Badge text
                </label>
                <input
                  type="text"
                  value={form.badgeText}
                  onChange={handleChange('badgeText')}
                  placeholder="Up to 40% off"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Linked product (for hero card)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products by name"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleSearchProducts}
                    className="mt-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Search
                  </button>
                </div>
                {productLoading && (
                  <div className="flex items-center gap-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
                    <Spinner className="h-3 w-3" />
                    <span>Searching products…</span>
                  </div>
                )}
                {!productLoading && productResults.length > 0 && (
                  <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 text-[0.7rem] dark:border-slate-700 dark:bg-slate-900">
                    {productResults.map((p) => {
                      const productId = p._id || p.id;
                      return (
                        <li key={productId || p.name}>
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(p)}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left ${
                              selectedProduct && (selectedProduct._id === productId || selectedProduct.id === productId)
                                ? 'bg-primary-500/10 text-primary-700 dark:text-primary-200'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate">
                              {p.name}{' '}
                              {typeof p.brand === 'string' && p.brand
                                ? `• ${p.brand}`
                                : ''}
                            </span>
                            {p.price != null && (
                              <span className="shrink-0 text-[0.65rem] text-slate-500 dark:text-slate-400">
                                ₹{Number(p.price).toFixed(2)}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {selectedProduct && (
                  <div className="mt-1 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-[0.7rem] text-slate-800 dark:border-emerald-500/30 dark:text-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          Linked product:{' '}
                          <span className="font-normal">{selectedProduct.name}</span>
                        </span>
                        {selectedProduct.price != null && (
                          <span className="text-[0.65rem] text-slate-600 dark:text-slate-300">
                            Price: ₹{Number(selectedProduct.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          setProductQuery('');
                        }}
                        className="text-[0.65rem] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleChange('isActive')}
                />
                Active immediately
              </label>
            </div>

            <div className="space-y-3">
                {selectedProduct && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Hero banner preview
                  </p>
                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-medium text-slate-600 dark:text-slate-400">
                      Product image (optional override)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedImage(file);
                            setUploadedImagePreview(URL.createObjectURL(file));
                          } else {
                            setUploadedImage(null);
                            setUploadedImagePreview(null);
                          }
                        }}
                        className="block w-full text-[0.7rem] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-primary-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 file:hover:bg-primary-400 dark:text-slate-400"
                      />
                      {uploadedImagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImage(null);
                            setUploadedImagePreview(null);
                          }}
                          className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-[0.65rem] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                      Uploaded image takes priority over product image. Max 5MB.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={selectedProduct?.name || 'Banner'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[0.65rem] text-slate-500 dark:text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-50">
                        {form.title.trim() || selectedProduct.name}
                      </p>
                      <p className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                        {form.subtitle.trim() ||
                          selectedProduct.description ||
                          'Linked product'}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          ₹
                          {form.discountPrice !== ''
                            ? Number(form.discountPrice || 0).toFixed(2)
                            : Number(
                                selectedProduct.discountPrice ??
                                  selectedProduct.price ??
                                  0,
                              ).toFixed(2)}
                        </span>
                        {selectedProduct.price != null &&
                          (form.discountPrice !== '' ||
                            selectedProduct.discountPrice != null) && (
                            <span className="text-[0.65rem] text-slate-500 line-through dark:text-slate-500">
                              ₹{Number(selectedProduct.price).toFixed(2)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={handleChange('startDate')}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    End date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={handleChange('endDate')}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Priority
                </label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={handleChange('priority')}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                />
                <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Lower numbers appear first when multiple banners are active in
                  the same placement.
                </p>
              </div>

              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Banner discount price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={handleChange('discountPrice')}
                  placeholder="Override product price for hero badge"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                />
                <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                  Optional. If set, this value will be highlighted as the deal
                  price in the hero card.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => navigate('/admin/banners')}
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={submitting || loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 font-semibold text-slate-950 hover:bg-primary-400 disabled:opacity-60"
            >
              {(submitting || loading) && <Spinner className="h-4 w-4" />}
              <span>{submitting || loading ? 'Creating...' : 'Create banner'}</span>
            </button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
};

export default AdminBannerCreate;

