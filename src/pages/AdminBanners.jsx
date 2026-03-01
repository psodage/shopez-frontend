import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  clearAdminBannerMessages,
  deleteBanner,
  fetchBanners,
  toggleBannerStatus,
} from '../redux/adminBannerSlice';

const AdminBanners = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { banners, loading, error, success, page, totalPages, total } =
    useSelector((s) => s.adminBanners);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('priority_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    dispatch(clearAdminBannerMessages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchBanners({
        page: currentPage,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        sort,
      })
    );
  }, [dispatch, currentPage, search, status, sort]);

  const pagination = useMemo(() => {
    const items = [];
    for (let i = 1; i <= totalPages; i += 1) {
      items.push(i);
    }
    return items;
  }, [totalPages]);

  const allSelectedOnPage =
    banners.length > 0 &&
    banners.every((b) => selectedIds.includes(String(b._id)));

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) =>
        prev.filter((id) => !banners.some((b) => String(b._id) === id))
      );
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...banners
          .map((b) => String(b._id))
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

  const handleToggleStatus = (id) => {
    dispatch(toggleBannerStatus(id));
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await dispatch(deleteBanner(confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const bulkDelete = async () => {
    // simple loop like we did for coupons
    // eslint-disable-next-line no-restricted-syntax
    for (const id of selectedIds) {
      // eslint-disable-next-line no-await-in-loop
      await dispatch(deleteBanner(id));
    }
    setSelectedIds([]);
  };

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Banners
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Manage homepage and campaign banners for ShopEZ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/banners/create')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-primary-400"
          >
            <span className="text-base">＋</span>
            New banner
          </button>
        </header>

        <div className="space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
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
                placeholder="Search by banner title"
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
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
              <span>
                Selected:{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedIds.length}
                </span>
              </span>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={bulkDelete}
                className="rounded-xl border border-red-500/70 bg-red-500/10 px-3 py-1 text-[0.7rem] font-medium text-red-700 disabled:opacity-40 dark:border-red-500/40 dark:text-red-200"
              >
                Bulk delete
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
                <option value="priority_asc">Priority</option>
                <option value="start_asc">Start date</option>
                <option value="end_asc">End date</option>
              </select>
            </div>
          </div>

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
                    <th className="px-3 py-2">Banner</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Start</th>
                    <th className="px-3 py-2">End</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Clicks</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {banners.map((b) => {
                    const start = b.startDate
                      ? new Date(b.startDate).toLocaleDateString()
                      : '—';
                    const end = b.endDate
                      ? new Date(b.endDate).toLocaleDateString()
                      : '—';
                    const now = new Date();
                    const isExpired = b.endDate
                      ? new Date(b.endDate) < now
                      : false;
                    const isScheduled = b.startDate
                      ? new Date(b.startDate) > now
                      : false;
                    const isActive = b.isActive && !isExpired && !isScheduled;
                    const statusLabel = !b.isActive
                      ? 'Disabled'
                      : isExpired
                      ? 'Expired'
                      : isScheduled
                      ? 'Scheduled'
                      : 'Active';

                    return (
                      <tr key={b._id} className="hover:bg-slate-100 dark:hover:bg-slate-900/70">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(String(b._id))}
                            onChange={() => toggleSelectOne(b._id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="h-10 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                            {(b.image ||
                              b.product?.image ||
                              (Array.isArray(b.product?.images) &&
                                b.product.images[0])) ? (
                              <img
                                src={
                                  b.image ||
                                  b.product?.image ||
                                  b.product?.images?.[0]
                                }
                                alt={b.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[0.65rem] text-slate-500">
                                No image
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem] text-slate-900 dark:text-slate-100">
                          {b.title}
                        </td>
                        <td className="px-3 py-2 text-[0.7rem] text-slate-600 max-w-[10rem] truncate dark:text-slate-300">
                          {b.product?.name ||
                            b.productName ||
                            (b.productId ? `#${b.productId}` : '—')}
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">{start}</td>
                        <td className="px-3 py-2 text-[0.75rem]">{end}</td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          {b.priority ?? 0}
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1 ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/40 dark:text-emerald-200'
                                : isExpired
                                ? 'bg-amber-500/10 text-amber-700 ring-amber-500/40 dark:text-amber-200'
                                : isScheduled
                                ? 'bg-sky-500/10 text-sky-700 ring-sky-500/40 dark:text-sky-200'
                                : 'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[0.75rem]">
                          {b.clickCount ?? 0}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/banners/${b._id}/edit`)
                              }
                              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(b._id)}
                              className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-primary-200"
                            >
                              {b.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(b._id)}
                              className="rounded-lg border border-red-500/70 bg-red-500/10 px-2 py-1 text-[0.7rem] text-red-700 hover:bg-red-500/20 dark:border-red-500/40 dark:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!banners.length && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-6 text-center text-[0.75rem] text-slate-500"
                      >
                        No banners found. Try adjusting your filters.
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
                Delete banner?
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                This will remove the banner from all placements. Existing
                sessions may still see cached copies briefly.
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

export default AdminBanners;

