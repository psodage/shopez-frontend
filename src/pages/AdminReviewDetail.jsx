import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  clearAdminReviewMessages,
  deleteReview,
  fetchReviewDetails,
  updateReviewStatus,
} from '../redux/adminReviewSlice';

const statusOptions = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'spam', label: 'Spam' },
];

const AdminReviewDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { reviewDetails, loading, error, success } = useSelector(
    (s) => s.adminReviews
  );

  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    dispatch(clearAdminReviewMessages());
    dispatch(fetchReviewDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (reviewDetails) {
      setStatus(reviewDetails.status || 'pending');
      setNote(reviewDetails.moderationNote || '');
    }
  }, [reviewDetails]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    await dispatch(
      updateReviewStatus({
        id,
        status,
        moderationNote: note,
      })
    );
  };

  const handleDelete = async () => {
    await dispatch(deleteReview(id));
    navigate('/admin/reviews');
  };

  const rating = reviewDetails?.rating || 0;
  const createdAt = reviewDetails?.createdAt
    ? new Date(reviewDetails.createdAt).toLocaleString()
    : '';
  const updatedAt = reviewDetails?.updatedAt
    ? new Date(reviewDetails.updatedAt).toLocaleString()
    : '';

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Review detail
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Inspect and moderate an individual customer review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/reviews')}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-primary-400 hover:text-primary-200"
          >
            Back to reviews
          </button>
        </header>

        <div className="space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </div>

        {loading && (
          <div className="flex min-h-[260px] items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {!loading && !reviewDetails && !error && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-sm text-slate-400">Review not found.</p>
          </div>
        )}

        {!loading && reviewDetails && (
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
              <div className="flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  {reviewDetails.product?.image && (
                    <img
                      src={reviewDetails.product.image}
                      alt={reviewDetails.product.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                      Product
                    </p>
                    <p className="text-sm font-semibold text-slate-50">
                      {reviewDetails.product?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {reviewDetails.product?.category}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/products/${reviewDetails.product?.id}/edit`
                        )
                      }
                      className="mt-1 text-[0.7rem] font-medium text-primary-300 hover:text-primary-200"
                    >
                      Open product
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <p>
                    Review ID:{' '}
                    <span className="font-mono text-[0.65rem] text-slate-300">
                      {String(reviewDetails.id).slice(-12)}
                    </span>
                  </p>
                  <p>Created: {createdAt || '—'}</p>
                  <p>Updated: {updatedAt || '—'}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                    User
                  </p>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
                    <p>{reviewDetails.user?.name || 'User'}</p>
                    {reviewDetails.user?.email && (
                      <p className="text-xs text-slate-400">
                        {reviewDetails.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Rating
                  </p>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-amber-300">
                        {Number(rating || 0).toFixed(1)}★
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Review
                </p>
                <div className="space-y-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
                  <p className="font-medium">
                    {reviewDetails.title || 'No title'}
                  </p>
                  <p className="whitespace-pre-wrap text-slate-300">
                    {reviewDetails.comment}
                  </p>
                </div>
              </div>

              {!!reviewDetails.images?.length && (
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Images
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {reviewDetails.images.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt="Review attachment"
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <form onSubmit={handleUpdateStatus} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Moderation note
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Optional internal note explaining why this review was approved, rejected, or flagged."
                    className="mt-1 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-primary-400"
                >
                  Save moderation
                </button>
              </form>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Dangerous actions
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                >
                  Delete review permanently
                </button>
                <p className="text-[0.65rem] text-slate-500">
                  Deleting will remove this review from customer views and rating
                  calculations. This cannot be undone from the admin UI.
                </p>
              </div>
            </div>
          </section>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <h2 className="text-sm font-semibold text-slate-50">
                Delete review permanently?
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                This will mark the review as deleted and remove it from product
                ratings and analytics. This action cannot be undone from the
                dashboard.
              </p>
              <div className="mt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-red-400"
                >
                  Confirm delete
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminReviewDetail;

