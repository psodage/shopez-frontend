import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import {
  deleteCategory,
  fetchCategories,
  fetchCategoryHierarchy,
  clearAdminCategoryMessages,
} from '../redux/adminCategorySlice';

/**
 * Renders a single category row; recursively renders children in tree view.
 */
const CategoryRow = ({
  category,
  level = 0,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  parentOptions,
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category._id);
  const indent = level * 20;
  const parentName = category.parent?.name || (parentOptions.find((p) => p._id === category.parent)?.name) || '—';

  return (
    <>
      <tr className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-900/70">
        <td className="px-3 py-2" style={{ paddingLeft: `${12 + indent}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(category._id)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                {isExpanded ? '−' : '+'}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 dark:bg-slate-800">
                —
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[0.8rem] font-medium text-slate-900 dark:text-slate-100">
                {category.name}
              </span>
              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                {category.path || category.slug}
              </span>
            </div>
          </div>
        </td>
        <td className="px-3 py-2 text-[0.7rem] font-mono text-slate-500 dark:text-slate-400">
          {category.slug}
        </td>
        <td className="px-3 py-2 text-[0.75rem] text-slate-500 dark:text-slate-400">
          {parentName}
        </td>
        <td className="px-3 py-2 text-[0.75rem]">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {category.productCount ?? 0} products
          </span>
        </td>
        <td className="px-3 py-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1 ${
              category.isActive
                ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/40 dark:text-emerald-200'
                : 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-600'
            }`}
          >
            {category.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-3 py-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
          {category.createdAt
            ? new Date(category.createdAt).toLocaleDateString()
            : '—'}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(category._id)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[0.7rem] text-slate-800 hover:border-primary-400 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-200"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="rounded-lg border border-red-500/40 bg-red-500/5 px-2 py-1 text-[0.7rem] text-red-600 hover:bg-red-500/10 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {hasChildren && isExpanded &&
        category.children.map((child) => (
          <CategoryRow
            key={child._id}
            category={child}
            level={level + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            parentOptions={parentOptions}
          />
        ))}
    </>
  );
};

const AdminCategories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    categories,
    hierarchy,
    loading,
    error,
    success,
    page,
    totalPages,
    total,
    tree,
  } = useSelector((s) => s.adminCategories);

  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'flat'
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [confirmingCategory, setConfirmingCategory] = useState(null);

  useEffect(() => {
    dispatch(clearAdminCategoryMessages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCategoryHierarchy());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      page: viewMode === 'flat' ? currentPage : 1,
      limit: viewMode === 'flat' ? 10 : 200,
      keyword: search || undefined,
      parent: parentFilter || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    };
    if (viewMode === 'tree') {
      params.tree = 'true';
    }
    dispatch(fetchCategories(params));
  }, [dispatch, currentPage, search, parentFilter, statusFilter, viewMode]);

  const onToggle = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const collectIds = (list) => {
      const ids = new Set();
      const walk = (items) => {
        items.forEach((c) => {
          ids.add(c._id);
          if (c.children?.length) walk(c.children);
        });
      };
      walk(list);
      return ids;
    };
    setExpandedIds(collectIds(categories));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const onDelete = async (cat) => {
    if (!cat) return;
    setConfirmingCategory(cat);
  };

  const confirmDelete = async () => {
    if (!confirmingCategory) return;
    try {
      await dispatch(
        deleteCategory({ id: confirmingCategory._id, hard: true })
      ).unwrap();
      setConfirmingCategory(null);
      const params = {
        page: viewMode === 'flat' ? currentPage : 1,
        keyword: search || undefined,
        parent: parentFilter || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      };
      if (viewMode === 'tree') params.tree = 'true';
      dispatch(fetchCategories(params));
    } catch {
      setConfirmingCategory(null);
    }
  };

  const parentOptions = useMemo(() => {
    const flat = [];
    const walk = (items) => {
      items.forEach((c) => {
        flat.push(c);
        if (c.children?.length) walk(c.children);
      });
    };
    walk(hierarchy);
    return flat;
  }, [hierarchy]);

  const pagination = useMemo(() => {
    const items = [];
    for (let i = 1; i <= totalPages; i += 1) items.push(i);
    return items;
  }, [totalPages]);

  return (
    <AdminLayout>
      <section className="space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Categories
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Manage category hierarchy, slugs, and visibility for ShopEZ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/categories/create')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-primary-400"
          >
            <span className="text-base">＋</span>
            New category
          </button>
        </header>

        <div className="space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-wrap gap-3">
              <div className="flex-1 min-w-[140px]">
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
                  placeholder="Name or slug"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-600"
                />
              </div>
              <div className="w-36">
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Parent
                </label>
                <select
                  value={parentFilter}
                  onChange={(e) => {
                    setParentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                >
                  <option value="">All</option>
                  <option value="root">Root only</option>
                  {parentOptions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.path ? `${p.path}` : p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-50"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'tree' ? 'flat' : 'tree')}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[0.75rem] text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {viewMode === 'tree' ? 'Tree' : 'Flat'}
                </button>
                {viewMode === 'tree' && (
                  <>
                    <button
                      type="button"
                      onClick={expandAll}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[0.75rem] text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Expand all
                    </button>
                    <button
                      type="button"
                      onClick={collapseAll}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[0.75rem] text-slate-300 hover:bg-slate-800"
                    >
                      Collapse all
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">{total} categories</p>
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
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Slug</th>
                    <th className="px-3 py-2">Parent</th>
                    <th className="px-3 py-2">Products</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tree && Array.isArray(categories) ? (
                    categories.map((cat) => (
                      <CategoryRow
                        key={cat._id}
                        category={cat}
                        expandedIds={expandedIds}
                        onToggle={onToggle}
                        onEdit={(id) => navigate(`/admin/categories/${id}/edit`)}
                        onDelete={onDelete}
                        parentOptions={parentOptions}
                      />
                    ))
                  ) : (
                    categories.map((cat) => (
                      <CategoryRow
                        key={cat._id}
                        category={cat}
                        expandedIds={new Set()}
                        onToggle={() => {}}
                        onEdit={(id) => navigate(`/admin/categories/${id}/edit`)}
                        onDelete={onDelete}
                        parentOptions={parentOptions}
                      />
                    ))
                  )}
                  {(!categories || categories.length === 0) && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-[0.75rem] text-slate-500"
                      >
                        No categories found. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'flat' && pagination.length > 1 && (
            <div className="flex items-center justify-between pt-2 text-[0.7rem] text-slate-400">
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
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {confirmingCategory && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Delete category permanently?
              </h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                This will permanently delete &quot;{confirmingCategory.name}&quot;.
                If this category has products or subcategories, deletion will be blocked.
              </p>
              <div className="mt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setConfirmingCategory(null)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-xl bg-red-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminCategories;
