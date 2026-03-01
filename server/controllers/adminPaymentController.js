const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Helper to build list filters safely for the admin payments list.
const buildPaymentQuery = (query) => {
  const filter = {};

  if (query.status && ['pending', 'success', 'failed', 'refunded'].includes(query.status)) {
    filter.status = query.status;
  }

  if (query.paymentProvider && ['stripe', 'razorpay'].includes(query.paymentProvider)) {
    filter.paymentProvider = query.paymentProvider;
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  if (query.transactionId) {
    filter.transactionId = new RegExp(String(query.transactionId).trim(), 'i');
  }

  return filter;
};

// GET /api/admin/payments
// Admin: list payments with filters, pagination, and sorting.
exports.getAdminPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentProvider,
      from,
      to,
      transactionId,
      sort = 'date_desc',
    } = req.query;

    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = buildPaymentQuery({
      status,
      paymentProvider,
      from,
      to,
      transactionId,
    });

    let sortOptions = { createdAt: -1 };
    if (sort === 'date_asc') sortOptions = { createdAt: 1 };
    if (sort === 'amount_asc') sortOptions = { amount: 1 };
    if (sort === 'amount_desc') sortOptions = { amount: -1 };

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'name email')
        .populate('order', 'orderNumber paymentMethod paymentStatus')
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      payments,
      total,
      page: numericPage,
      totalPages: Math.ceil(total / numericLimit) || 1,
      limit: numericLimit,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/payments/:id
// Admin: full payment details with related order and user.
exports.getAdminPaymentById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid payment id.' });
    }

    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email role')
      .populate({
        path: 'order',
        populate: {
          path: 'orderItems.product',
          select: 'name category price',
        },
      })
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Basic fraud risk heuristic (for display only).
    const riskScore = payment.fraudRiskScore || 0;

    return res.status(200).json({
      payment,
      fraudRiskScore: riskScore,
      refundHistory: payment.refunds || [],
      webhookLogs: payment.webhookEvents || [],
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/payments/:id/refund
// Admin: process full or partial refund, updating related order & payment.
exports.refundPaymentAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid payment id.' });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Refund amount must be greater than 0.' });
    }

    const payment = await Payment.findById(id).populate('order');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status === 'failed') {
      return res
        .status(400)
        .json({ message: 'Cannot refund a failed payment.' });
    }

    const refundableAmount = payment.amount - payment.refundAmount;
    if (numericAmount > refundableAmount) {
      return res.status(400).json({
        message: `Refund exceeds remaining refundable amount (${refundableAmount}).`,
      });
    }

    // In a real integration you would call Stripe/Razorpay refund APIs here and
    // verify the provider response before mutating local state.

    payment.refundAmount += numericAmount;
    const fullyRefunded = payment.refundAmount >= payment.amount;
    payment.isRefunded = fullyRefunded;
    if (fullyRefunded) {
      payment.status = 'refunded';
    }

    payment.refunds.push({
      amount: numericAmount,
      reason: reason || '',
      refundedBy: req.user?._id || null,
    });

    if (payment.order) {
      // Keep order & payment flags consistent. Full refunds can optionally mark
      // the order as cancelled in this simplified implementation.
      if (fullyRefunded) {
        payment.order.paymentStatus = 'failed';
        payment.order.isPaid = false;
        payment.order.status = 'cancelled';
        payment.order.orderStatus = 'cancelled';
        payment.order.statusHistory.push({
          status: 'cancelled',
          changedAt: new Date(),
        });
      }
      await payment.order.save();
    }

    await payment.save();

    return res.status(200).json({
      message: fullyRefunded
        ? 'Payment fully refunded.'
        : 'Partial refund processed.',
      payment,
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/payments/:id/retry
// Admin: mark a failed payment as being retried (metadata only).
exports.retryPaymentAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid payment id.' });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status !== 'failed') {
      return res
        .status(400)
        .json({ message: 'Only failed payments can be retried from the admin panel.' });
    }

    payment.status = 'pending';
    payment.isReviewed = true;
    await payment.save();

    return res.status(200).json({
      message: 'Payment marked for retry. Trigger a new attempt on the client or via provider API.',
      payment,
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/payments/:id/review
// Admin: mark a payment as reviewed after investigating.
exports.markPaymentReviewedAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid payment id.' });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    payment.isReviewed = true;
    await payment.save();

    return res.status(200).json({
      message: 'Payment marked as reviewed.',
      payment,
    });
  } catch (err) {
    return next(err);
  }
};

