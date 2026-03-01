import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  clearAdminProductMessages,
  fetchProductDetails,
  updateProduct,
} from '../redux/adminProductSlice';
import api from '../services/api';

const AdminProductEdit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { productDetails, loading, error, success } = useSelector(
    (s) => s.adminProducts
  );
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    discountPrice: '',
    stock: '',
    isFeatured: false,
    isActive: true,
    tags: '',
    metaTitle: '',
    metaDescription: '',
  });
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [keptExistingImages, setKeptExistingImages] = useState([]);
  const [replaceMode, setReplaceMode] = useState(true);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    dispatch(clearAdminProductMessages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProductDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        if (Array.isArray(res.data.categories)) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!productDetails) return;

    setForm({
      name: productDetails.name || '',
      description: productDetails.description || '',
      category: productDetails.category || '',
      brand: productDetails.brand || '',
      price:
        typeof productDetails.price === 'number'
          ? String(productDetails.price)
          : '',
      discountPrice:
        typeof productDetails.discountPrice === 'number'
          ? String(productDetails.discountPrice)
          : '',
      stock:
        typeof productDetails.countInStock === 'number'
          ? String(productDetails.countInStock)
          : '',
      isFeatured: Boolean(productDetails.isFeatured),
      isActive:
        productDetails.isActive === undefined
          ? true
          : Boolean(productDetails.isActive),
      tags: Array.isArray(productDetails.tags)
        ? productDetails.tags.join(', ')
        : '',
      metaTitle: productDetails.seo?.metaTitle || '',
      metaDescription: productDetails.seo?.metaDescription || '',
    });
    setVariants(productDetails.variants || []);
    setKeptExistingImages(
      Array.isArray(productDetails.images) ? [...productDetails.images] : []
    );
    setTouched({});
  }, [productDetails, id]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required.';
    if (!form.category.trim()) next.category = 'Category is required.';
    const price = Number(form.price);
    if (!form.price) next.price = 'Price is required.';
    else if (Number.isNaN(price) || price < 0)
      next.price = 'Price must be a positive number.';
    const stock = Number(form.stock || 0);
    if (Number.isNaN(stock) || stock < 0)
      next.stock = 'Stock must be greater than or equal to 0.';
    return next;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0 && !loading;

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const onImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const maxNew = 8 - keptExistingImages.length;
    const merged = [...newImages, ...files].slice(0, Math.min(maxNew, 8));
    setNewImages(merged);
    setNewImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return merged.map((f) => URL.createObjectURL(f));
    });
    e.target.value = '';
  };

  const removeExistingImage = (index) => {
    setKeptExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { sku: '', size: '', color: '', storage: '', price: '', discountPrice: '', stock: '' },
    ]);
  };

  const updateVariant = (index, key, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: value } : v))
    );
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      category: true,
      price: true,
      stock: true,
    });
    if (!canSubmit) return;

    const fd = new FormData();

    fd.append('name', form.name.trim());
    fd.append('category', form.category.trim());
    fd.append('isFeatured', form.isFeatured ? 'true' : 'false');
    fd.append('isActive', form.isActive ? 'true' : 'false');

    if (form.description) fd.append('description', form.description.trim());
    if (form.brand) fd.append('brand', form.brand.trim());
    if (form.price) fd.append('price', form.price);
    if (form.discountPrice) fd.append('discountPrice', form.discountPrice);
    if (form.stock) fd.append('stock', form.stock);
    if (form.tags) fd.append('tags', form.tags);
    if (form.metaTitle) fd.append('metaTitle', form.metaTitle);
    if (form.metaDescription) fd.append('metaDescription', form.metaDescription);

    if (variants.length) {
      const cleaned = variants.map((v) => ({
        ...v,
        price: v.price || undefined,
        discountPrice: v.discountPrice || undefined,
        stock: v.stock || 0,
      }));
      fd.append('variants', JSON.stringify(cleaned));
    }

    newImages.forEach((file) => {
      fd.append('images', file);
    });
    fd.append('replaceImages', replaceMode ? 'true' : 'false');
    if (keptExistingImages.length !== (productDetails?.images?.length ?? 0) || (!replaceMode && keptExistingImages.length > 0)) {
      fd.append('existingImages', JSON.stringify(keptExistingImages));
    }

    try {
      await dispatch(updateProduct({ id, data: fd })).unwrap();
      setTimeout(() => navigate('/admin/products'), 800);
    } catch {
      // handled in slice
    }
  };

  return (
    <AdminLayout>
      <section className="space-y-5">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Edit product
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Update pricing, stock, images, and variants. Only changed fields will be saved.
              </p>
            </div>
          </header>

          <div className="space-y-3">
            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
          </div>

          {!productDetails && loading && (
            <div className="flex min-h-[260px] items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {productDetails && (
            <form
              onSubmit={onSubmit}
              className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Product name
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={onChange}
                      onBlur={onBlur}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                    />
                    {touched.name && errors.name && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-300">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={onChange}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Category
                      </label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={onChange}
                        onBlur={onBlur}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c.slug || c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {touched.category && errors.category && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-300">
                          {errors.category}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Brand
                      </label>
                      <input
                        name="brand"
                        type="text"
                        value={form.brand}
                        onChange={onChange}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Price
                      </label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={onChange}
                        onBlur={onBlur}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                      />
                      {touched.price && errors.price && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-300">
                          {errors.price}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Discount price
                      </label>
                      <input
                        name="discountPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discountPrice}
                        onChange={onChange}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Stock quantity
                      </label>
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock}
                        onChange={onChange}
                        onBlur={onBlur}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                      />
                      {touched.stock && errors.stock && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-300">
                          {errors.stock}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1 text-xs">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={form.isFeatured}
                        onChange={onChange}
                        className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-primary-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Featured product</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={onChange}
                        className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-primary-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Active (visible)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Product images (multiple)
                    </label>
                    <p className="mt-0.5 text-[0.65rem] text-slate-500 dark:text-slate-400">
                      Manage product photos. You can add more, replace all, or remove individual images.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {keptExistingImages.length > 0 ? (
                        keptExistingImages.map((src, idx) => (
                          <div key={`${src}-${idx}`} className="relative group">
                            <img
                              src={src}
                              alt={`Existing ${idx + 1}`}
                              className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[0.65rem] font-bold text-white opacity-90 hover:opacity-100"
                              title="Remove image"
                            >
                              ×
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/60 py-0.5 text-center text-[0.6rem] text-slate-200">
                                Main
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          No images yet. Add below.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      New images
                    </label>
                    <div className="flex flex-wrap gap-3 text-[0.7rem]">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="imageMode"
                          checked={replaceMode}
                          onChange={() => setReplaceMode(true)}
                          className="border-slate-300 bg-white text-primary-600 dark:border-slate-700 dark:bg-slate-950 dark:text-primary-500"
                        />
                        Replace all with new
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="imageMode"
                          checked={!replaceMode}
                          onChange={() => setReplaceMode(false)}
                          className="border-slate-300 bg-white text-primary-600 dark:border-slate-700 dark:bg-slate-950 dark:text-primary-500"
                        />
                        Add to existing
                      </label>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={onImagesChange}
                      className="mt-1 block w-full text-[0.75rem] text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[0.75rem] file:font-medium file:text-slate-800 hover:file:bg-slate-200 dark:text-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
                    />
                    {newImagePreviews.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {newImagePreviews.map((src, idx) => (
                          <div key={src} className="relative group">
                            <img
                              src={src}
                              alt={`New ${idx + 1}`}
                              className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[0.65rem] font-bold text-white opacity-90 hover:opacity-100"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {keptExistingImages.length + newImages.length < 8 && (
                          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-primary-500/50 hover:text-primary-500 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:text-primary-400">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-[0.6rem]">Add more</span>
                            <input type="file" multiple accept="image/*" onChange={onImagesChange} className="hidden" />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[0.8rem] font-semibold text-slate-900 dark:text-slate-100">
                          Variants
                        </h2>
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          Update size / color / storage and per-variant stock.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Add variant
                      </button>
                    </div>
                    {variants.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {variants.map((v, index) => (
                          <div
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/60"
                          >
                            <input
                              type="text"
                              placeholder="SKU"
                              value={v.sku || ''}
                              onChange={(e) =>
                                updateVariant(index, 'sku', e.target.value)
                              }
                              className="w-20 flex-1 min-w-[70px] rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-[0.7rem] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-600"
                            />
                            <input
                              type="text"
                              placeholder="Size"
                              value={v.size || ''}
                              onChange={(e) =>
                                updateVariant(index, 'size', e.target.value)
                              }
                              className="w-20 flex-1 min-w-[70px] rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-[0.7rem] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-600"
                            />
                            <input
                              type="text"
                              placeholder="Color"
                              value={v.color || ''}
                              onChange={(e) =>
                                updateVariant(index, 'color', e.target.value)
                              }
                              className="w-20 flex-1 min-w-[70px] rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-[0.7rem] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-600"
                            />
                            <input
                              type="text"
                              placeholder="Storage"
                              value={v.storage || ''}
                              onChange={(e) =>
                                updateVariant(index, 'storage', e.target.value)
                              }
                              className="w-24 flex-1 min-w-[80px] rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-[0.7rem] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-600"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Price"
                              value={v.price || ''}
                              onChange={(e) =>
                                updateVariant(index, 'price', e.target.value)
                              }
                              className="w-20 flex-1 min-w-[70px] rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-[0.7rem] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-600"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Discount"
                              value={v.discountPrice || ''}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  'discountPrice',
                                  e.target.value
                                )
                              }
                              className="w-24 flex-1 min-w-[80px] rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-[0.7rem] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-600"
                            />
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Stock"
                              value={v.stock || ''}
                              onChange={(e) =>
                                updateVariant(index, 'stock', e.target.value)
                              }
                              className="w-20 flex-1 min-w-[70px] rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-[0.7rem] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-600"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="rounded-lg bg-red-500/5 px-2 py-1 text-[0.7rem] text-red-600 hover:bg-red-500/10 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-[0.8rem] font-semibold text-slate-900 dark:text-slate-100">
                      SEO & tags
                    </h2>
                    <div className="mt-2 space-y-3">
                      <div>
                        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                          SEO title
                        </label>
                        <input
                          name="metaTitle"
                          type="text"
                          value={form.metaTitle}
                          onChange={onChange}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                          SEO description
                        </label>
                        <textarea
                          name="metaDescription"
                          value={form.metaDescription}
                          onChange={onChange}
                          rows={2}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Tags
                        </label>
                        <input
                          name="tags"
                          type="text"
                          value={form.tags}
                          onChange={onChange}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                        />
                        <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                          Comma-separated tags used for search and SEO keywords.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 text-xs">
                <Link
                  to="/admin/products"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          )}
      </section>
    </AdminLayout>
  );
};

export default AdminProductEdit;

