const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Helper to build a YYYY-MM label; used for monthly revenue trend.
const formatMonthLabel = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

// GET /api/admin/revenue
// Aggregates payment + order data into a single analytics payload for the
// revenue dashboard. All critical monetary calculations are performed on the
// server using MongoDB's aggregation pipeline so the client cannot tamper with
// business metrics.
exports.getRevenueStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const paymentMatchBase = {};

    const [
      totalAgg,
      todayAgg,
      monthAgg,
      refundAgg,
      methodAgg,
      statusAgg,
      monthlyAgg,
      providerAgg,
      orderCount,
      avgOrderValueAgg,
      categoryAgg,
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { ...paymentMatchBase, status: 'success' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            ...paymentMatchBase,
            status: 'success',
            createdAt: { $gte: startOfToday },
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$amount' },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            ...paymentMatchBase,
            status: 'success',
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            monthRevenue: { $sum: '$amount' },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            ...paymentMatchBase,
            refundAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: '$refundAmount' },
            refundCount: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            ...paymentMatchBase,
            status: { $in: ['success', 'failed', 'pending'] },
          },
        },
        {
          $group: {
            _id: '$paymentProvider',
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        { $match: paymentMatchBase },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            ...paymentMatchBase,
            status: 'success',
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            ...paymentMatchBase,
          },
        },
        {
          $group: {
            _id: '$paymentProvider',
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.countDocuments({ isDeleted: false }),
      Order.aggregate([
        {
          $match: {
            isDeleted: false,
            isPaid: true,
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            totalPaidOrders: { $sum: 1 },
            totalPaidRevenue: { $sum: '$totalPrice' },
          },
        },
      ]),
      // Category revenue is derived from paid, non-cancelled orders so it
      // reflects what actually converted into revenue, not cancelled carts.
      Order.aggregate([
        {
          $match: {
            isDeleted: false,
            isPaid: true,
            status: { $ne: 'cancelled' },
          },
        },
        { $unwind: '$orderItems' },
        {
          $lookup: {
            from: Product.collection.name,
            localField: 'orderItems.product',
            foreignField: '_id',
            as: 'productDocs',
          },
        },
        { $unwind: '$productDocs' },
        {
          $group: {
            _id: '$productDocs.category',
            revenue: {
              $sum: {
                $multiply: ['$orderItems.price', '$orderItems.quantity'],
              },
            },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    let totalRevenue =
      (totalAgg && totalAgg[0] && totalAgg[0].totalRevenue) || 0;
    let todayRevenue =
      (todayAgg && todayAgg[0] && todayAgg[0].todayRevenue) || 0;
    let monthRevenue =
      (monthAgg && monthAgg[0] && monthAgg[0].monthRevenue) || 0;
    const totalRefunds =
      (refundAgg && refundAgg[0] && refundAgg[0].totalRefunds) || 0;
    const refundCount =
      (refundAgg && refundAgg[0] && refundAgg[0].refundCount) || 0;

    let netRevenue = totalRevenue - totalRefunds;

    const statusCountMap = new Map(
      (statusAgg || []).map((b) => [b._id, b.count])
    );
    const successCount = statusCountMap.get('success') || 0;
    const failedCount = statusCountMap.get('failed') || 0;
    const pendingCount = statusCountMap.get('pending') || 0;

    const totalTracked = successCount + failedCount + pendingCount;
    const successRate =
      totalTracked > 0 ? (successCount / totalTracked) * 100 : 0;
    const failedPaymentRate =
      totalTracked > 0 ? (failedCount / totalTracked) * 100 : 0;
    const refundRate =
      successCount > 0 ? (refundCount / successCount) * 100 : 0;

    let monthlyRevenueTrend = (monthlyAgg || []).map((m) => ({
      month: formatMonthLabel(
        new Date(m._id.year, m._id.month - 1, 1)
      ),
      revenue: m.revenue,
    }));

    // Fallback: if there are no successful payment records yet (e.g. only COD
    // orders have been placed and no online gateway has been used), derive
    // revenue metrics directly from paid orders so the dashboard still shows
    // meaningful, dynamic data.
    if (totalRevenue === 0 && todayRevenue === 0 && monthRevenue === 0) {
      const [orderTotalAgg, orderTodayAgg, orderMonthAgg, orderMonthlyAgg] =
        await Promise.all([
          Order.aggregate([
            {
              $match: {
                isDeleted: false,
                isPaid: true,
                status: { $ne: 'cancelled' },
              },
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' },
              },
            },
          ]),
          Order.aggregate([
            {
              $match: {
                isDeleted: false,
                isPaid: true,
                status: { $ne: 'cancelled' },
                createdAt: { $gte: startOfToday },
              },
            },
            {
              $group: {
                _id: null,
                todayRevenue: { $sum: '$totalPrice' },
              },
            },
          ]),
          Order.aggregate([
            {
              $match: {
                isDeleted: false,
                isPaid: true,
                status: { $ne: 'cancelled' },
                createdAt: { $gte: startOfMonth },
              },
            },
            {
              $group: {
                _id: null,
                monthRevenue: { $sum: '$totalPrice' },
              },
            },
          ]),
          Order.aggregate([
            {
              $match: {
                isDeleted: false,
                isPaid: true,
                status: { $ne: 'cancelled' },
                createdAt: { $gte: twelveMonthsAgo },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                },
                revenue: { $sum: '$totalPrice' },
              },
            },
            {
              $sort: {
                '_id.year': 1,
                '_id.month': 1,
              },
            },
          ]),
        ]);

      totalRevenue =
        (orderTotalAgg &&
          orderTotalAgg[0] &&
          orderTotalAgg[0].totalRevenue) ||
        totalRevenue;
      todayRevenue =
        (orderTodayAgg &&
          orderTodayAgg[0] &&
          orderTodayAgg[0].todayRevenue) ||
        todayRevenue;
      monthRevenue =
        (orderMonthAgg &&
          orderMonthAgg[0] &&
          orderMonthAgg[0].monthRevenue) ||
        monthRevenue;

      netRevenue = totalRevenue - totalRefunds;

      monthlyRevenueTrend =
        orderMonthlyAgg && orderMonthlyAgg.length
          ? orderMonthlyAgg.map((m) => ({
              month: formatMonthLabel(
                new Date(m._id.year, m._id.month - 1, 1)
              ),
              revenue: m.revenue,
            }))
          : monthlyRevenueTrend;
    }

    const revenueByMethod = (methodAgg || []).map((m) => ({
      method: (m._id || '').toUpperCase(),
      revenue: m.revenue,
      count: m.count,
    }));

    const providerComparison = (providerAgg || []).map((p) => ({
      provider: (p._id || '').toUpperCase(),
      revenue: p.revenue,
      count: p.count,
    }));

    const revenueByCategory = (categoryAgg || []).map((c) => ({
      category: c._id || 'uncategorized',
      revenue: c.revenue,
    }));

    let averageOrderValue = 0;
    if (avgOrderValueAgg && avgOrderValueAgg[0]) {
      const { totalPaidOrders, totalPaidRevenue } = avgOrderValueAgg[0];
      if (totalPaidOrders > 0) {
        averageOrderValue = totalPaidRevenue / totalPaidOrders;
      }
    }

    // A simple month-over-month revenue growth metric using the last two
    // points in the monthly trend.
    let revenueGrowthPercent = 0;
    if (monthlyRevenueTrend.length >= 2) {
      const last = monthlyRevenueTrend[monthlyRevenueTrend.length - 1];
      const prev = monthlyRevenueTrend[monthlyRevenueTrend.length - 2];
      if (prev.revenue > 0) {
        revenueGrowthPercent =
          ((last.revenue - prev.revenue) / prev.revenue) * 100;
      }
    }

    const pendingSettlements = await Payment.countDocuments({
      settlementStatus: 'pending',
      status: 'success',
    });

    return res.status(200).json({
      totalRevenue,
      todayRevenue,
      monthRevenue,
      netRevenue,
      totalRefunds,
      successRate,
      failedPaymentRate,
      refundRate,
      averageOrderValue,
      revenueGrowthPercent,
      totalOrders: orderCount,
      revenueByMethod,
      revenueByCategory,
      monthlyRevenueTrend,
      providerComparison,
      pendingSettlements,
    });
  } catch (err) {
    return next(err);
  }
};

