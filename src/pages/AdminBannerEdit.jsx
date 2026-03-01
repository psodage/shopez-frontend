import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  clearAdminBannerMessages,
  fetchBannerDetails,
  updateBanner,
} from '../redux/adminBannerSlice';

const AdminBannerEdit = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bannerDetails, loading, error, success } = useSelector(
    (s) => s.adminBanners,
  );

  const [form, setForm] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const linkedProduct =
    bannerDetails?.product || bannerDetails?.linkedProduct || null;

  const productImage =
    linkedProduct &&
    (linkedProduct.image ||
      (Array.isArray(linkedProduct.images) && linkedProduct.images[0]));

  const displayImage =
    uploadedImagePreview ||
    (removeImage ? null : bannerDetails?.image) ||
    productImage;

  useEffect(() => {
    if (!id) return;
    dispatch(clearAdminBannerMessages());
    dispatch(fetchBannerDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!bannerDetails) return;
    setForm({
      title: bannerDetails.title || '',
      subtitle: bannerDetails.subtitle || '',
      badgeText: bannerDetails.badgeText || '',
      discountPrice:
        bannerDetails.discountPrice != null
          ? String(bannerDetails.discountPrice)
          : '',
      priority:
        bannerDetails.priority !== undefined ? bannerDetails.priority : 0,
      startDate: bannerDetails.startDate
        ? new Date(bannerDetails.startDate).toISOString().slice(0, 10)
        : '',
      endDate: bannerDetails.endDate
        ? new Date(bannerDetails.endDate).toISOString().slice(0, 10)
        : '',
      isActive: bannerDetails.isActive ?? true,
    });
  }, [bannerDetails]);

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const validate = () => {
    if (!form) return 'Form not ready yet.';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form || !id) return;
    setLocalError(null);
    dispatch(clearAdminBannerMessages());

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('isActive', String(form.isActive));
    formData.append('priority', String(Number(form.priority) || 0));

    if (form.subtitle?.trim()) formData.append('subtitle', form.subtitle.trim());
    if (form.badgeText?.trim())
      formData.append('badgeText', form.badgeText.trim());
    if (form.discountPrice !== '' && form.discountPrice != null) {
      formData.append(
        'discountPrice',
        String(Number(form.discountPrice) || 0),
      );
    }
    if (form.startDate) formData.append('startDate', form.startDate);
    if (form.endDate) formData.append('endDate', form.endDate);

    if (uploadedImage) {
      formData.append('image', uploadedImage);
    } else if (removeImage) {
      formData.append('removeImage', 'true');
    }

    setSubmitting(true);
    const action = await dispatch(updateBanner({ id, data: formData }));
    setSubmitting(false);

    if (updateBanner.fulfilled.match(action)) {
      navigate('/admin/banners');
      return;
    }

    setLocalError(
      typeof action.payload === 'string'
        ? action.payload
        : 'Unable to update banner.',
    );
  };

  const isBusy = loading && !form;

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Edit banner
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Update the content and scheduling for this banner.
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

        {isBusy || !form ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
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
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                  />
                </div>

                {linkedProduct && (
                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Linked product (read-only)
                    </label>
                    <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[0.7rem] text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      <span className="font-medium">{linkedProduct.name}</span>
                      {linkedProduct.price != null && (
                        <span className="ml-2 text-[0.65rem] text-slate-500 dark:text-slate-400">
                          ₹{Number(linkedProduct.price).toFixed(2)}
                        </span>
                      )}
                      <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                        Redirects to /product/{linkedProduct._id || linkedProduct.id}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
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
                          setRemoveImage(false);
                        } else {
                          setUploadedImage(null);
                          setUploadedImagePreview(null);
                        }
                      }}
                      className="block w-full text-[0.7rem] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-primary-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 file:hover:bg-primary-400 dark:text-slate-400"
                    />
                    {removeImage && bannerDetails?.image ? (
                      <button
                        type="button"
                        onClick={() => setRemoveImage(false)}
                        className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-[0.65rem] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        Revert to custom image
                      </button>
                    ) : (uploadedImagePreview || bannerDetails?.image) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage(null);
                          setUploadedImagePreview(null);
                          setRemoveImage(true);
                        }}
                        className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-[0.65rem] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        Use product image
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                    Uploaded image takes priority. Clear to use product image.
                  </p>
                  {displayImage && (
                    <div className="mt-2 h-20 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                      <img
                        src={displayImage}
                        alt="Banner"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Banner discount price
                  </label>
                  {bannerDetails?.discountPrice != null && (
                    <p className="mt-1 text-[0.7rem] text-slate-600 dark:text-slate-300">
                      Current: ₹{Number(bannerDetails.discountPrice).toFixed(2)}
                    </p>
                  )}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountPrice ?? ''}
                    onChange={handleChange('discountPrice')}
                    placeholder="Override product price for hero badge"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                  />
                  <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                    Optional. If set, this value will be highlighted as the deal
                    price in the hero card.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange('isActive')}
                  />
                  Active
                </label>
              </div>

              <div className="space-y-3">
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
                    Lower numbers appear first when multiple banners are active
                    in the same placement.
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
                <span>
                  {submitting || loading ? 'Saving changes...' : 'Save changes'}
                </span>
              </button>
            </div>
          </form>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminBannerEdit;

