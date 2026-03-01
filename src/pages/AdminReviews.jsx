import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  bulkActionReviews,
  clearAdminReviewMessages,
  fetchReviewAnalytics,
  fetchReviews,
  updateReviewStatus,
  deleteReview,
} from '../redux/adminReviewSlice';

const statusBadgeClasses = {
  pending: 'bg-amber-500/10 text-amber-200 ring-amber-500/40',
  approved: 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/40',
  rejected: 'bg-rose-500/10 text-rose-200 ring-rose-500/40',
  spam: 'bg-fuchsia-500/10 text-fuchsia-200 ring-fuchsia-500/40',
};

const AdminReviews = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { reviews, loading, error, success, page, totalPages, total, analytics } =
    useSelector((s) => s.adminReviews);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rating, setRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('date_desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    dispatch(clearAdminReviewMessages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchReviews({
        page: currentPage,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        rating: rating === 'all' ? undefined : rating,
        sort,
      })
    );
    dispatch(fetchReviewAnalytics());
  }, [dispatch, currentPage, search, status, rating, sort]);

  const pagination = useMemo(() => {
    const items = [];
    for (let i = 1; i <= totalPages; i += 1) {
      items.push(i);
    }
    return items;
  }, [totalPages]);

  const allSelectedOnPage =
    reviews.length > 0 &&
    reviews.every((r) => selectedIds.includes(String(r.reviewId)));

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) =>
        prev.filter(
          (id) => !reviews.some((r) => String(r.reviewId) === String(id))
        )
      );
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...reviews
          .map((r) => String(r.reviewId))
          .filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(String(id))
        ? prev.filter((x) => x !== String(id))
        : [...prev, String(id)]
    );
  };

  const applyBulkAction = (action) => {
    if (!selectedIds.length) return;
    dispatch(bulkActionReviews({ ids: selectedIds, action }));
    if (action === 'delete') {
      setSelectedIds([]);
    }
  };

  const handleStatusQuickChange = (id, nextStatus) => {
    dispatch(updateReviewStatus({ id, status: nextStatus }));
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await dispatch(deleteReview(confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const ratingDistribution = analytics?.ratingDistribution || [];
  const pendingCount = analytics?.pendingCount || 0;

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Reviews
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Moderate customer feedback, keep spam out, and protect product
              ratings.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-slate-500 dark:text-slate-400">
            <p>
              Total reviews:{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span>
            </p>
            <p>
              Pending moderation:{' '}
              <span className="font-semibold text-amber-700 dark:text-amber-300">{pendingCount}</span>
            </p>
          </div>
        </header>

        <div className="space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by product or user"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="spam">Spam</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                Rating
              </label>
              <select
                value={rating}
                onChange={(e) => {
                  setRating(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
              >
                <option value="all">All</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} star{r === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Selected:{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedIds.length}
                </span>
              </span>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={() => applyBulkAction('approve')}
                className="rounded-xl border border-emerald-500/70 bg-emerald-500/10 px-3 py-1 text-[0.7rem] font-medium text-emerald-700 disabled:opacity-40 dark:border-emerald-500/40 dark:text-emerald-200"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={() => applyBulkAction('reject')}
                className="rounded-xl border border-amber-500/70 bg-amber-500/10 px-3 py-1 text-[0.7rem] font-medium text-amber-700 disabled:opacity-40 dark:border-amber-500/40 dark:text-amber-200"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={() => applyBulkAction('spam')}
                className="rounded-xl border border-fuchsia-500/70 bg-fuchsia-500/10 px-3 py-1 text-[0.7rem] font-medium text-fuchsia-700 disabled:opacity-40 dark:border-fuchsia-500/40 dark:text-fuchsia-200"
              >
                Mark spam
              </button>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={() => applyBulkAction('delete')}
                className="rounded-xl border border-red-500/70 bg-red-500/10 px-3 py-1 text-[0.7rem] font-medium text-red-700 disabled:opacity-40 dark:border-red-500/40 dark:text-red-200"
              >
                Delete
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
              >
                <option value="date_desc">Newest</option>
                <option value="date_asc">Oldest</option>
                <option value="rating_desc">Rating high → low</option>
                <option value="rating_asc">Rating low → high</option>
              </select>
            </div>
          </div>

          {analytics && (
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-500">
                  Rating distribution
                </p>
                <div className="mt-2 space-y-1">
                  {ratingDistribution.length === 0 && (
                    <p className="text-slate-500">No reviews yet.</p>
                  )}
                  {ratingDistribution.map((bucket) => (
                    <div
                      key={bucket._id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-1">
                        <span>{bucket._id}★</span>
                      </span>
                      <span className="text-slate-400">{bucket.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-500">
                  Top reviewed products
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(analytics.topProducts || []).map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() =>
                        navigate(`/admin/products/${p._id}/edit`)
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[0.7rem] text-slate-800 hover:border-primary-500/60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200"
                    >
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-6 w-6 rounded-lg object-cover"
                        />
                      )}
                      <span className="line-clamp-1 max-w-[10rem]">
                        {p.name}
                      </span>
                      <span className="text-slate-500">
                        {p.totalReviews} reviews
                      </span>
                    </button>
                  ))}
                  {!analytics.topProducts?.length && (
                    <p className="text-slate-500">No products with reviews.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[0.75rem] text-slate-700 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-2">Review ID</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Rating</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Comment</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {reviews.map((r) => {
                    const createdAt = r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : '';
                    const lowRating = Number(r.rating || 0) <= 2;
                    return (
                      <tr key={r.reviewId} className="hover:bg-slate-100 dark:hover:bg-slate-900/70">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(String(r.reviewId))}
                            onChange={() => toggleSelectOne(r.reviewId)}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-[0.65rem] text-slate-500">
                          {String(r.reviewId).slice(-8)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/products/${r.productId}/edit`
                              )
                            }
                            className="line-clamp-2 text-[0.75rem] text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-primary-200"
                          >
                            {r.productName}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          <div className="flex flex-col">
                            <span>{r.userName || 'User'}</span>
                            {r.userEmail && (
                              <span className="text-[0.65rem] text-slate-500">
                                {r.userEmail}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={
                                lowRating ? 'text-rose-600 dark:text-rose-300' : 'text-amber-600 dark:text-amber-300'
                              }
                            >
                              {Number(r.rating || 0).toFixed(1)}★
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          {r.title || '—'}
                        </td>
                        <td className="px-3 py-2 text-[0.75rem] text-slate-500 dark:text-slate-400">
                          <span className="line-clamp-2 max-w-xs">
                            {r.comment}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1 ${
                              statusBadgeClasses[r.status] ||
                              'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                            }`}
                          >
                            {r.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          {createdAt || '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/reviews/${r.reviewId}`)
                              }
                              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
                            >
                              View
                            </button>
                            {r.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusQuickChange(
                                    r.reviewId,
                                    'approved'
                                  )
                                }
                                className="rounded-lg border border-emerald-500/70 bg-emerald-500/10 px-2 py-1 text-[0.7rem] text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-200"
                              >
                                Approve
                              </button>
                            )}
                            {r.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusQuickChange(
                                    r.reviewId,
                                    'rejected'
                                  )
                                }
                                className="rounded-lg border border-amber-500/70 bg-amber-500/10 px-2 py-1 text-[0.7rem] text-amber-700 hover:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-200"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(r.reviewId)}
                              className="rounded-lg border border-red-500/70 bg-red-500/10 px-2 py-1 text-[0.7rem] text-red-700 hover:bg-red-500/20 dark:border-red-500/40 dark:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!reviews.length && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-3 py-6 text-center text-[0.75rem] text-slate-500"
                      >
                        No reviews found. Try adjusting your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pagination.length > 1 && (
            <div className="flex items-center justify-between pt-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="inline-flex gap-1">
                {pagination.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`h-7 w-7 rounded-lg text-xs ${
                      p === page
                        ? 'bg-primary-500 text-slate-950'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {confirmDeleteId && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <h2 className="text-sm font-semibold text-slate-50">
                Delete review?
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                This will hide the review from customers and analytics. You can
                still see it in the database as a soft-deleted entry.
              </p>
              <div className="mt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
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

export default AdminReviews;

