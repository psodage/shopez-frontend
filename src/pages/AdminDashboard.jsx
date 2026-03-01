import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { fetchDashboardStats } from '../redux/adminDashboardSlice';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const currency = (value) =>
  typeof value === 'number'
    ? `₹${value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : '₹0';

const percentage = (value) =>
  typeof value === 'number' ? `${value.toFixed(1)}%` : '0%';

const KPI_COLORS = ['#38bdf8', '#22c55e', '#f97316', '#a855f7'];
const STATUS_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((s) => s.adminDashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const summaryCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        key: 'revenue',
        title: 'Total Revenue',
        value: currency(stats.totalRevenue),
        delta: '+5.2% this month',
        icon: (
          <path d="M5 12h7.5a2.5 2.5 0 0 0 0-5H9m3.5 10H7a2.5 2.5 0 0 1 0-5h7.5" />
        ),
      },
      {
        key: 'orders',
        title: 'Total Orders',
        value: stats.totalOrders?.toLocaleString() || '0',
        delta: '+3.1% this month',
        icon: (
          <>
            <path d="M4 7h16l-1.5 10H5.5L4 7Z" />
            <path d="M9 11h6" />
          </>
        ),
      },
      {
        key: 'users',
        title: 'Total Users',
        value: stats.totalUsers?.toLocaleString() || '0',
        delta: '+8.4% this month',
        icon: (
          <>
            <circle cx="9" cy="8" r="3" />
            <circle cx="17" cy="9" r="2.6" />
            <path d="M4.5 17.5C4.9 15 6.7 13.5 9 13.5s4.1 1.5 4.5 4" />
            <path d="M14.5 17c.4-1.7 1.6-2.8 3.5-2.8 1.9 0 3.1 1.1 3.5 2.8" />
          </>
        ),
      },
      {
        key: 'products',
        title: 'Total Products',
        value: stats.totalProducts?.toLocaleString() || '0',
        delta: '+1.9% this month',
        icon: (
          <>
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
          </>
        ),
      },
    ];
  }, [stats]);

  const salesData = useMemo(
    () =>
      stats?.monthlySales?.map((m) => ({
        month: m.month,
        revenue: m.revenue,
      })) || [],
    [stats]
  );

  const ordersData = useMemo(
    () =>
      stats?.monthlyOrders?.map((m) => ({
        month: m.month,
        orders: m.orders,
      })) || [],
    [stats]
  );

  const revenuePieData = useMemo(() => {
    if (!stats?.revenueDistribution) return [];
    const { paid, unpaid } = stats.revenueDistribution;
    return [
      {
        name: 'Paid',
        value: paid?.revenue || 0,
      },
      {
        name: 'Unpaid',
        value: unpaid?.revenue || 0,
      },
    ];
  }, [stats]);

  const statusPieData = useMemo(() => {
    if (!stats?.revenueDistribution) return [];
    const { delivered, processing } = stats.revenueDistribution;
    return [
      { name: 'Delivered', value: delivered?.count || 0 },
      { name: 'Processing', value: processing?.count || 0 },
    ];
  }, [stats]);

  const recentOrders = stats?.recentOrders || [];
  const lowStockProducts = stats?.lowStockProducts || [];

  return (
    <AdminLayout>
      <section className="space-y-6">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Admin • Dashboard
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                High-level view of ShopEZ performance, orders, and inventory.
              </p>
            </div>
            
          </header>

          {error && <Alert variant="error">{error}</Alert>}

          {loading && !stats && (
            <div className="flex min-h-[260px] items-center justify-center">
              <Spinner className="h-7 w-7" />
            </div>
          )}

          {stats && (
            <>
              {/* Summary cards */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card, idx) => (
                  <article
                    key={card.key}
                    className="group flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500/50 hover:bg-primary-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
                          {card.title}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                          {card.value}
                        </p>
                      </div>
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-200 group-hover:ring-primary-400 dark:bg-slate-900 dark:text-primary-300 dark:ring-slate-700">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        >
                          {card.icon}
                        </svg>
                      </div>
                    </div>
                    <p className="text-[0.7rem] text-emerald-600 dark:text-emerald-300">
                      {card.delta}
                    </p>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: '65%',
                          background:
                            KPI_COLORS[idx % KPI_COLORS.length] || KPI_COLORS[0],
                        }}
                      />
                    </div>
                  </article>
                ))}
              </section>

              {/* Charts */}
              <section className="grid gap-4 lg:grid-cols-5">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Sales overview
                      </h2>
                      <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                        Monthly revenue for the last year.
                      </p>
                    </div>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <XAxis
                          dataKey="month"
                          stroke="#64748b"
                          tickLine={false}
                          tickMargin={8}
                          fontSize={11}
                        />
                        <YAxis
                          stroke="#64748b"
                          tickLine={false}
                          tickMargin={8}
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            border: '1px solid #1e293b',
                            borderRadius: '0.75rem',
                            fontSize: '0.7rem',
                          }}
                          formatter={(v) => currency(v)}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Orders overview
                      </h2>
                      <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                        Orders placed per month.
                      </p>
                    </div>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ordersData}>
                        <XAxis
                          dataKey="month"
                          stroke="#64748b"
                          tickLine={false}
                          tickMargin={8}
                          fontSize={11}
                        />
                        <YAxis
                          stroke="#64748b"
                          tickLine={false}
                          tickMargin={8}
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            border: '1px solid #1e293b',
                            borderRadius: '0.75rem',
                            fontSize: '0.7rem',
                          }}
                        />
                        <Bar dataKey="orders" radius={[4, 4, 0, 0]} fill="#a855f7" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Distribution charts */}
              <section className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Revenue distribution
                  </h2>
                  <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                    Paid vs unpaid revenue share.
                  </p>
                  <div className="mt-1 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={revenuePieData}
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                        >
                          {revenuePieData.map((_, index) => (
                            <Cell
                              // eslint-disable-next-line react/no-array-index-key
                              key={`rev-cell-${index}`}
                              fill={KPI_COLORS[index % KPI_COLORS.length]}
                            />
                          ))}
                        </Pie>
                          <Legend
                          verticalAlign="bottom"
                          height={32}
                          iconSize={10}
                          formatter={(value) => (
                            <span className="text-[0.7rem] text-slate-600 dark:text-slate-300">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Order status
                  </h2>
                  <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                    Delivered vs in-progress orders.
                  </p>
                  <div className="mt-1 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={statusPieData}
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                        >
                          {statusPieData.map((_, index) => (
                            <Cell
                              // eslint-disable-next-line react/no-array-index-key
                              key={`status-cell-${index}`}
                              fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Legend
                          verticalAlign="bottom"
                          height={32}
                          iconSize={10}
                          formatter={(value) => (
                            <span className="text-[0.7rem] text-slate-600 dark:text-slate-300">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    KPI snapshot
                  </h2>
                  <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                    Quick comparison of key metrics.
                  </p>
                  <ul className="mt-1 space-y-2 text-[0.75rem]">
                    <li className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">
                        Revenue per order
                      </span>
                      <span className="font-medium text-primary-300">
                        {stats.totalOrders
                          ? currency(stats.totalRevenue / stats.totalOrders)
                          : '₹0'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-300">
                        Orders per user
                      </span>
                      <span className="font-medium text-sky-300">
                        {stats.totalUsers
                          ? (stats.totalOrders / stats.totalUsers).toFixed(2)
                          : '0.00'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-300">
                        Inventory health
                      </span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-300">
                        {lowStockProducts.length > 0
                          ? `${lowStockProducts.length} low stock`
                          : 'Healthy'}
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Recent orders & low stock */}
              <section className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Recent orders
                      </h2>
                      <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                        Latest activity across the store.
                      </p>
                    </div>
                    <Link
                      to="/admin/orders"
                      className="text-[0.7rem] font-medium text-primary-300 hover:text-primary-200"
                    >
                      View all orders
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-[0.75rem] text-slate-700 dark:text-slate-300">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                        <tr>
                          <th className="px-3 py-2">Order ID</th>
                          <th className="px-3 py-2">User</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Total</th>
                          <th className="px-3 py-2">Payment</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {recentOrders.map((order) => {
                          const createdAt = order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : '';
                          const isPaid =
                            order.paymentStatus === 'paid' || order.isPaid;
                          const isDelivered =
                            order.status === 'delivered' || order.isDelivered;
                          return (
                            <tr
                              key={order.id}
                              className="hover:bg-slate-100 dark:hover:bg-slate-900/70"
                            >
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-[0.7rem] text-slate-800 dark:text-slate-200">
                                {order.orderNumber || order.id}
                              </td>
                              <td className="px-3 py-2 text-[0.7rem]">
                                <div className="flex flex-col">
                                  <span>{order.userName}</span>
                                  <span className="text-[0.65rem] text-slate-500">
                                    {order.userEmail}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-[0.7rem]">
                                {createdAt || '—'}
                              </td>
                              <td className="px-3 py-2 text-[0.7rem] text-primary-600 dark:text-primary-300">
                                ₹{Number(order.totalPrice || 0).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-[0.7rem]">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                                    isPaid
                                      ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-200'
                                      : 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-200'
                                  }`}
                                >
                                  {isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[0.7rem]">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                                    isDelivered
                                      ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-200'
                                      : 'bg-slate-200 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                                  }`}
                                >
                                  {order.status || 'processing'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {!recentOrders.length && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-3 py-4 text-center text-[0.75rem] text-slate-500"
                            >
                              No recent orders yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Low stock products
                  </h2>
                  <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                    Items with fewer than 10 units left.
                  </p>
                  <div className="mt-1 space-y-2 text-[0.75rem]">
                    {lowStockProducts.map((p) => (
                      <Link
                        key={p._id}
                        to={`/product/${p._id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:border-amber-400/70 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-950"
                      >
                        <div className="flex items-center gap-3">
                          {p.image && (
                            // eslint-disable-next-line jsx-a11y/img-redundant-alt
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="text-[0.75rem] text-slate-900 dark:text-slate-100">
                              {p.name}
                            </span>
                            <span className="text-[0.65rem] text-slate-500">
                              {p.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[0.75rem] text-primary-600 dark:text-primary-300">
                            {currency(p.price)}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300">
                            Low stock: {p.countInStock}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {!lowStockProducts.length && (
                      <p className="text-[0.75rem] text-slate-500">
                        No low stock products. Inventory looks good.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
      </section>
    </AdminLayout>
  );
};

export default AdminDashboard;

