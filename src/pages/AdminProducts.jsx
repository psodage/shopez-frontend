import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  deleteProduct,
  fetchProducts,
  clearAdminProductMessages,
} from '../redux/adminProductSlice';
import api from '../services/api';

const AdminProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, loading, error, success, page, totalPages, total } =
    useSelector((s) => s.adminProducts);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [status, setStatus] = useState('all');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState(null);
  const getProductId = (product) => product?._id || product?.id;

  useEffect(() => {
    dispatch(clearAdminProductMessages());
  }, [dispatch]);

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
    dispatch(
      fetchProducts({
        page: currentPage,
        keyword: search || undefined,
        category: category || undefined,
        sort,
        status: status === 'all' ? undefined : status,
      })
    );
  }, [dispatch, currentPage, search, category, sort, status]);

  const onDelete = async (id) => {
    try {
      await dispatch(deleteProduct(id)).unwrap();
      setConfirmingId(null);
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        dispatch(
          fetchProducts({
            page: currentPage,
            keyword: search || undefined,
            category: category || undefined,
            sort,
            status: status === 'all' ? undefined : status,
          })
        );
      }
    } catch {
      setConfirmingId(null);
    }
  };

  const lowStockIds = useMemo(
    () =>
      new Set(
        products
          .filter((p) => typeof p.countInStock === 'number' && p.countInStock < 5)
          .map((p) => getProductId(p))
          .filter(Boolean)
      ),
    [products]
  );

  const pagination = useMemo(() => {
    const items = [];
    for (let i = 1; i <= totalPages; i += 1) {
      items.push(i);
    }
    return items;
  }, [totalPages]);

  return (
    <AdminLayout>
      <section className="space-y-5">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Admin • Products
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Manage inventory, pricing, and visibility for ShopEZ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/products/create')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-primary-400"
            >
              <span className="text-base">＋</span>
              New product
            </button>
          </header>

          <div className="space-y-3">
            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="flex-1">
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
                    placeholder="Search by product name"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                  >
                    <option value="">All</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Sort
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                  >
                    <option value="date_desc">Newest</option>
                    <option value="date_asc">Oldest</option>
                    <option value="price_asc">Price: Low to high</option>
                    <option value="price_desc">Price: High to low</option>
                  </select>
                </div>
                <p className="text-[0.7rem] text-slate-400">
                  {total} products
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex min-h-[220px] items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            )}

            {!loading && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[0.75rem] text-slate-700 dark:text-slate-300">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Rating</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {products.map((p) => {
                      const productId = getProductId(p);
                      const createdAt = p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString()
                        : '';
                      const isLowStock = productId ? lowStockIds.has(productId) : false;
                      return (
                        <tr key={productId || p.name} className="hover:bg-slate-100 dark:hover:bg-slate-900/70">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-3">
                              {p.image && (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-9 w-9 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex flex-col">
                                <span className="text-[0.8rem] text-slate-900 dark:text-slate-100">
                                  {p.name}
                                </span>
                                <span className="text-[0.65rem] text-slate-500">
                                  {p.brand}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[0.75rem]">
                            {p.category}
                          </td>
                          <td className="px-3 py-2 text-[0.75rem] text-primary-600 dark:text-primary-300">
                            ₹{Number(p.price || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-[0.75rem]">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                                isLowStock
                                  ? 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300'
                                  : 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-300'
                              }`}
                            >
                              {p.countInStock ?? 0}{' '}
                              {isLowStock ? '• Low' : 'in stock'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[0.75rem]">
                            {typeof p.rating === 'number'
                              ? `${p.rating.toFixed(1)} ★`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 text-[0.75rem]">
                            {createdAt || '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!productId) return;
                                  navigate(`/admin/products/${productId}/edit`);
                                }}
                                disabled={!productId}
                                className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!productId) return;
                                  setConfirmingId(productId);
                                }}
                                disabled={!productId}
                                className="rounded-lg border border-red-500/70 bg-red-500/10 px-2 py-1 text-[0.7rem] text-red-700 hover:bg-red-500/20 dark:border-red-500/40 dark:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!products.length && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-[0.75rem] text-slate-500"
                        >
                          No products found. Try adjusting your filters.
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

          {confirmingId && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 px-4">
              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h2 className="text-sm font-semibold text-slate-50">
                  Delete product?
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  This will permanently remove the product.
                </p>
                <div className="mt-4 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(confirmingId)}
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

export default AdminProducts;

