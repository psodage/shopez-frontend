const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// Build a simple YYYY-MM label from a Date.
const formatMonthLabel = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1
    );

    const baseMatch = { isDeleted: false };
    const nonCancelledMatch = { ...baseMatch, status: { $ne: 'cancelled' } };

    const [
      revenueAgg,
      ordersAgg,
      usersCount,
      productsCount,
      monthlySalesAgg,
      monthlyOrdersAgg,
      paymentStatusAgg,
      deliveryStatusAgg,
      recentOrdersRaw,
      lowStockProducts,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { ...nonCancelledMatch, isPaid: true } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
          },
        },
      ]),
      Order.countDocuments(nonCancelledMatch),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments({}),
      Order.aggregate([
        {
          $match: {
            ...nonCancelledMatch,
            isPaid: true,
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
      Order.aggregate([
        {
          $match: {
            ...nonCancelledMatch,
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            orders: { $sum: 1 },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]),
      Order.aggregate([
        { $match: nonCancelledMatch },
        {
          $group: {
            _id: '$isPaid',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
      ]),
      Order.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.find(baseMatch)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email')
        .lean(),
      Product.find({ countInStock: { $lt: 10 } })
        .sort({ countInStock: 1 })
        .limit(10)
        .select('name slug price countInStock category image')
        .lean(),
    ]);

    const totalRevenue =
      (revenueAgg && revenueAgg[0] && revenueAgg[0].totalRevenue) || 0;

    const monthlySales = monthlySalesAgg.map((entry) => ({
      month: formatMonthLabel(
        new Date(entry._id.year, entry._id.month - 1, 1)
      ),
      revenue: entry.revenue,
    }));

    const monthlyOrders = monthlyOrdersAgg.map((entry) => ({
      month: formatMonthLabel(
        new Date(entry._id.year, entry._id.month - 1, 1)
      ),
      orders: entry.orders,
    }));

    const paidBucket =
      paymentStatusAgg.find((b) => b._id === true) || {};
    const unpaidBucket =
      paymentStatusAgg.find((b) => b._id === false) || {};

    const deliveredBucket =
      deliveryStatusAgg.find((b) => b._id === 'delivered') || {};
    const processingBucket =
      deliveryStatusAgg.find((b) => b._id === 'processing') || {};

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber,
      userName: o.user?.name || '—',
      userEmail: o.user?.email || '',
      createdAt: o.createdAt,
      totalPrice: o.totalPrice,
      paymentStatus: o.paymentStatus,
      isPaid: o.isPaid,
      status: o.status,
      isDelivered: o.isDelivered,
    }));

    return res.status(200).json({
      totalRevenue,
      totalOrders: ordersAgg,
      totalUsers: usersCount,
      totalProducts: productsCount,
      monthlySales,
      monthlyOrders,
      revenueDistribution: {
        paid: {
          count: paidBucket.count || 0,
          revenue: paidBucket.revenue || 0,
        },
        unpaid: {
          count: unpaidBucket.count || 0,
          revenue: unpaidBucket.revenue || 0,
        },
        delivered: {
          count: deliveredBucket.count || 0,
        },
        processing: {
          count: processingBucket.count || 0,
        },
      },
      recentOrders,
      lowStockProducts,
    });
  } catch (err) {
    return next(err);
  }
};

