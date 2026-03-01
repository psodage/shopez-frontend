import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  clearAdminCategoryMessages,
  fetchCategoryDetails,
  fetchCategoryHierarchy,
  updateCategory,
} from '../redux/adminCategorySlice';

const buildSlug = (name) =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const AdminCategoryEdit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { categoryDetails, loading, error, success, hierarchy } = useSelector(
    (s) => s.adminCategories
  );

  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    isActive: true,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    position: '0',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    dispatch(clearAdminCategoryMessages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCategoryDetails(id));
    dispatch(fetchCategoryHierarchy());
  }, [dispatch, id]);

  useEffect(() => {
    if (categoryDetails && !initialized) {
      setInitialized(true);
      const parentId = categoryDetails.parent?._id || categoryDetails.parent || '';
      setForm({
        name: categoryDetails.name || '',
        slug: categoryDetails.slug || '',
        description: categoryDetails.description || '',
        parent: parentId,
        isActive:
          categoryDetails.isActive === undefined
            ? true
            : Boolean(categoryDetails.isActive),
        isFeatured: Boolean(categoryDetails.isFeatured),
        seoTitle: categoryDetails.seoTitle || '',
        seoDescription: categoryDetails.seoDescription || '',
        position:
          typeof categoryDetails.position === 'number'
            ? String(categoryDetails.position)
            : '0',
      });
      if (categoryDetails.image) {
        setImagePreview(categoryDetails.image);
      }
    }
  }, [categoryDetails, initialized]);

  const flattenHierarchy = useMemo(() => {
    const flat = [];
    const walk = (items, depth = 0) => {
      items.forEach((c) => {
        if (c._id !== id) flat.push({ ...c, depth });
        if (c.children?.length) walk(c.children, depth + 1);
      });
    };
    walk(hierarchy);
    return flat;
  }, [hierarchy, id]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.name.trim()) next.name = 'Category name is required.';
    const selectedParent = form.parent || '';
    const selectedPosition = parseInt(form.position, 10) || 0;
    const originalParent =
      categoryDetails?.parent?._id || categoryDetails?.parent || '';
    const originalPosition =
      parseInt(categoryDetails?.position, 10) || 0;
    const hasPositionContextChanged =
      String(selectedParent) !== String(originalParent) ||
      selectedPosition !== originalPosition;
    if (hasPositionContextChanged) {
      const positionTaken = flattenHierarchy.some((c) => {
        const parentId = c.parent?._id || c.parent || '';
        const position = parseInt(c.position, 10) || 0;
        return String(parentId) === String(selectedParent) && position === selectedPosition;
      });
      if (positionTaken) {
        next.position = 'Display order is already taken for this parent category.';
      }
    }
    return next;
  }, [form, flattenHierarchy, categoryDetails]);

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

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : categoryDetails?.image || null);
    setTouched((prev) => ({ ...prev, image: true }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, position: true });
    if (!canSubmit) return;

    const data = {
      name: form.name.trim(),
      slug: form.slug.trim() || buildSlug(form.name),
      description: form.description.trim(),
      parent: form.parent || '',
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      position: form.position || '0',
    };
    if (imagePreview && imagePreview.startsWith('http') && !imageFile) {
      data.image = imagePreview;
    }

    try {
      const body = imageFile
        ? (() => {
            const fd = new FormData();
            Object.entries(data).forEach(([k, v]) => fd.append(k, v));
            fd.append('image', imageFile);
            return fd;
          })()
        : data;
      await dispatch(updateCategory({ id, data: body })).unwrap();
      setTimeout(() => navigate('/admin/categories'), 800);
    } catch {
      // handled by slice
    }
  };

  if (!categoryDetails && !loading && !error) {
    return (
      <AdminLayout>
        <section className="space-y-5">
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        </section>
      </AdminLayout>
    );
  }

  if (error && !categoryDetails) {
    return (
      <AdminLayout>
        <section className="space-y-5">
          <Alert variant="error">{error}</Alert>
          <Link
            to="/admin/categories"
            className="text-primary-400 hover:text-primary-300"
          >
            ← Back to categories
          </Link>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Edit category
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Update &quot;{categoryDetails?.name}&quot; and its settings.
            </p>
          </div>
        </header>

        <div className="space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900/70"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Category name *
                </label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Electronics"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-300">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Slug
                </label>
                <input
                  name="slug"
                  type="text"
                  value={form.slug}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="electronics"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                />
                <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                  Must be unique. Changing affects product category links.
                </p>
              </div>

              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Parent category
                </label>
                <select
                  name="parent"
                  value={form.parent}
                  onChange={onChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                >
                  <option value="">None (root category)</option>
                  {flattenHierarchy.map((c) => (
                    <option key={c._id} value={c._id}>
                      {'—'.repeat(c.depth)} {c.name}
                      {c.path ? ` (${c.path})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                  Cannot select this category or its descendants.
                </p>
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
                  placeholder="Brief category description."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Display order
                </label>
                <input
                  name="position"
                  type="number"
                  min="0"
                  value={form.position}
                  onChange={onChange}
                  onBlur={onBlur}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                />
                {touched.position && errors.position && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-300">{errors.position}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 pt-1 text-xs">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={onChange}
                    className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-primary-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Active</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={onChange}
                    className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-primary-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Featured</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Category image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="mt-1 block w-full text-[0.75rem] text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[0.75rem] file:font-medium file:text-slate-800 hover:file:bg-slate-200 dark:text-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-[0.8rem] font-semibold text-slate-900 dark:text-slate-100">
                  SEO
                </h2>
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      SEO title
                    </label>
                    <input
                      name="seoTitle"
                      type="text"
                      value={form.seoTitle}
                      onChange={onChange}
                      placeholder="Title for search engines"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      SEO description
                    </label>
                    <textarea
                      name="seoDescription"
                      value={form.seoDescription}
                      onChange={onChange}
                      rows={2}
                      placeholder="Meta description"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {categoryDetails?.productCount !== undefined && (
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                  {categoryDetails.productCount} product(s) use this category.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 text-xs">
            <Link
              to="/admin/categories"
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
      </section>
    </AdminLayout>
  );
};

export default AdminCategoryEdit;
