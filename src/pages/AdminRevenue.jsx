import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminLayout from '../layouts/AdminLayout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { fetchRevenueStats } from '../redux/adminRevenueSlice';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
const STATUS_COLORS = ['#22c55e', '#f97316', '#ef4444'];

const AdminRevenue = () => {
  const dispatch = useDispatch();
  const { revenueStats, loading, error } = useSelector(
    (s) => s.adminRevenue
  );

  useEffect(() => {
    dispatch(fetchRevenueStats());
  }, [dispatch]);

  const kpis = useMemo(() => {
    if (!revenueStats) return [];
    return [
      {
        key: 'totalRevenue',
        title: 'Total revenue',
        value: currency(revenueStats.totalRevenue),
        delta: percentage(revenueStats.revenueGrowthPercent || 0),
        hint: 'vs last month',
      },
      {
        key: 'todayRevenue',
        title: "Today's revenue",
        value: currency(revenueStats.todayRevenue),
        delta: '',
        hint: 'Collected since midnight',
      },
      {
        key: 'monthRevenue',
        title: 'Month-to-date',
        value: currency(revenueStats.monthRevenue),
        delta: '',
        hint: 'Current calendar month',
      },
      {
        key: 'netRevenue',
        title: 'Net revenue',
        value: currency(revenueStats.netRevenue),
        delta: percentage(-(revenueStats.refundRate || 0)),
        hint: 'After refunds',
      },
    ];
  }, [revenueStats]);

  const successPieData = useMemo(() => {
    if (!revenueStats) return [];
    return [
      {
        name: 'Successful',
        value: revenueStats.successRate || 0,
      },
      {
        name: 'Failed',
        value: revenueStats.failedPaymentRate || 0,
      },
      {
        name: 'Refunded',
        value: revenueStats.refundRate || 0,
      },
    ];
  }, [revenueStats]);

  const methodPieData = useMemo(() => {
    if (!revenueStats?.revenueByMethod) return [];
    return revenueStats.revenueByMethod.map((m) => ({
      name: m.method || 'UNKNOWN',
      value: m.revenue || 0,
    }));
  }, [revenueStats]);

  const categoryData = useMemo(() => {
    if (!revenueStats?.revenueByCategory) return [];
    return revenueStats.revenueByCategory.map((c) => ({
      category: c.category || 'uncategorized',
      revenue: c.revenue || 0,
    }));
  }, [revenueStats]);

  const trendData = useMemo(
    () => revenueStats?.monthlyRevenueTrend || [],
    [revenueStats]
  );

  return (
    <AdminLayout>
      <section className="space-y-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin • Revenue analytics
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              Financial performance, provider comparison, and refund-impact metrics.
            </p>
          </div>
        </header>

        {error && <Alert variant="error">{error}</Alert>}

        {loading && !revenueStats && (
          <div className="flex min-h-[260px] items-center justify-center">
            <Spinner className="h-7 w-7" />
          </div>
        )}

        {revenueStats && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((card, idx) => (
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
                      <span className="text-xs">₹</span>
                    </div>
                  </div>
                  {card.delta && (
                    <p className="text-[0.7rem] text-emerald-600 dark:text-emerald-300">
                      {card.delta} {card.hint}
                    </p>
                  )}
                  {!card.delta && (
                    <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">{card.hint}</p>
                  )}
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: '70%',
                        background:
                          KPI_COLORS[idx % KPI_COLORS.length] || KPI_COLORS[0],
                      }}
                    />
                  </div>
                </article>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Revenue trend
                    </h2>
                    <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                      Month-over-month revenue across the last year.
                    </p>
                  </div>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
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
              </article>

              <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Payment status distribution
                </h2>
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Success, failure, and refund ratios for all tracked payments.
                </p>
                <div className="mt-1 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={successPieData}
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {successPieData.map((_, index) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <Cell
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
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Revenue by category
                </h2>
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Which product categories generate the most revenue.
                </p>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-left text-[0.75rem] text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {categoryData.map((row) => (
                        <tr key={row.category}>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                            {row.category}
                          </td>
                          <td className="px-3 py-2 text-right text-primary-600 dark:text-primary-300">
                            {currency(row.revenue)}
                          </td>
                        </tr>
                      ))}
                      {!categoryData.length && (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-3 py-3 text-center text-[0.75rem] text-slate-500"
                          >
                            No category revenue data available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Provider comparison
                </h2>
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Revenue share and volume by payment provider.
                </p>
                <div className="mt-1 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={methodPieData}
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {methodPieData.map((_, index) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <Cell
                            key={`method-cell-${index}`}
                            fill={
                              KPI_COLORS[index % KPI_COLORS.length] ||
                              KPI_COLORS[0]
                            }
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
                <div className="mt-2 space-y-1 text-[0.75rem]">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Pending settlements</span>
                    <span className="font-medium text-amber-600 dark:text-amber-300">
                      {revenueStats.pendingSettlements || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Average order value</span>
                    <span className="font-medium text-sky-600 dark:text-sky-300">
                      {currency(revenueStats.averageOrderValue || 0)}
                    </span>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminRevenue;

