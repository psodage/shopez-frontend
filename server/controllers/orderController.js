const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');

const buildOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1e5)
    .toString(36)
    .toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const normalizeItemsFromBody = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      productId: it.product || it.productId || it.id,
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0),
      name: it.name,
      image: it.image || null,
    }))
    .filter((it) => it.productId && it.quantity > 0);
};

exports.createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, prices, couponCode, cartSnapshot } =
      req.body || {};

    const normalizedItems = normalizeItemsFromBody(orderItems);

    if (!normalizedItems.length) {
      return res.status(400).json({ message: 'Order items are required.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1) {
      return res.status(400).json({ message: 'Shipping address is incomplete.' });
    }

    const productIds = normalizedItems.map((it) => it.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products no longer exist.' });
    }

    let itemsPrice = 0;
    const orderItemDocs = normalizedItems.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new Error('Product not found during order creation.');
      }
      if (product.countInStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}.`);
      }
      const price = item.price || product.price;
      const lineTotal = price * item.quantity;
      itemsPrice += lineTotal;
      return {
        product: product._id,
        name: product.name,
        image: product.image,
        quantity: item.quantity,
        price,
      };
    });

    const taxRate = 0.05;
    const taxPrice = Math.round(itemsPrice * taxRate * 100) / 100;

    const shippingThreshold = 999;
    const shippingPrice =
      itemsPrice >= shippingThreshold || itemsPrice === 0 ? 0 : 79;

    const discountAmount =
      couponCode && couponCode.toUpperCase() === 'SAVE10'
        ? Math.round(itemsPrice * 0.1 * 100) / 100
        : 0;

    const serverTotal = Math.max(
      itemsPrice + taxPrice + shippingPrice - discountAmount,
      0
    );

    let totalPrice = serverTotal;
    if (prices && typeof prices.totalPrice === 'number') {
      totalPrice = serverTotal;
    }

    for (const item of normalizedItems) {
      const product = productMap.get(String(item.productId));
      product.countInStock -= item.quantity;
      if (product.countInStock < 0) {
        throw new Error(`Insufficient stock for ${product.name}.`);
      }
    }

    await Promise.all(products.map((p) => p.save()));

    const orderNumber = buildOrderNumber();

    const order = await Order.create({
      user: req.user._id,
      orderItems: orderItemDocs,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      couponCode: couponCode ? couponCode.toUpperCase() : '',
      status: 'processing',
      orderStatus: 'processing',
      orderNumber,
      cartSnapshot: cartSnapshot || null,
    });

    // For online payment methods, create a pending Payment record that can be
    // reconciled later via the payment provider or webhooks.
    const normalizedMethod = String(paymentMethod || 'COD').toUpperCase();
    if (normalizedMethod === 'RAZORPAY' || normalizedMethod === 'STRIPE') {
      const paymentProvider =
        normalizedMethod === 'RAZORPAY' ? 'razorpay' : 'stripe';
      const transactionId = `${paymentProvider}_${orderNumber}`;

      await Payment.create({
        user: req.user._id,
        order: order._id,
        paymentProvider,
        transactionId,
        amount: totalPrice,
        currency: 'INR',
        status: 'pending',
      });
    }

    const plain = await order.populate('user', 'name email role');

    return res.status(201).json(plain);
  } catch (err) {
    if (err.message && err.message.startsWith('Insufficient stock')) {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .select('-__v');
    return res.status(200).json({ orders });
  } catch (err) {
    return next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email role'
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (String(order.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allowed to view this order.' });
    }
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
};

exports.updateOrderPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allowed to update this order.' });
    }

    const { paymentStatus, paymentMethod } = req.body || {};
    if (paymentStatus && ['pending', 'paid', 'failed'].includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
      order.isPaid = paymentStatus === 'paid';
      if (paymentStatus === 'paid') {
        order.paidAt = new Date();
      }
    }
    if (paymentMethod && ['COD', 'RAZORPAY', 'STRIPE'].includes(paymentMethod)) {
      order.paymentMethod = paymentMethod;
    }

    await order.save();
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
};

// Allow a user to cancel their own order if it has not shipped yet.
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.isDeleted) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You are not allowed to cancel this order.' });
    }
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ message: 'Order cannot be cancelled after it has shipped.' });
    }

    // Restore inventory when an order is cancelled before shipment.
    const productIds = order.orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    order.orderItems.forEach((item) => {
      const product = productMap.get(String(item.product));
      if (product) {
        product.countInStock += item.quantity;
      }
    });

    await Promise.all(products.map((p) => p.save()));

    order.status = 'cancelled';
    order.orderStatus = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', changedAt: new Date() });
    await order.save();

    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
};

// Admin: list all orders with basic filters and pagination.
exports.getAdminOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      paid,
      delivered,
      from,
      to,
      search,
    } = req.query;

    const query = { isDeleted: false };

    if (paid === 'true') query.isPaid = true;
    if (paid === 'false') query.isPaid = false;
    if (delivered === 'true') query.isDelivered = true;
    if (delivered === 'false') query.isDelivered = false;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    if (search) {
      query.orderNumber = new RegExp(search.trim(), 'i');
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('user', 'name email'),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      orders,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    return next(err);
  }
};

// Admin: update order status and delivery/payment flags.
exports.updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.isDeleted) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const { status, paymentStatus } = req.body || {};

    // First, apply payment changes so a single request can both mark paid and delivered.
    if (paymentStatus && ['pending', 'paid', 'failed'].includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
      order.isPaid = paymentStatus === 'paid';
      if (paymentStatus === 'paid') {
        order.paidAt = new Date();
      }
    }

    if (status && ['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      if (order.status === 'delivered' && status !== 'delivered') {
        return res
          .status(400)
          .json({ message: 'Delivered orders cannot be moved back to a previous status.' });
      }

      // Prevent unpaid orders from being marked delivered.
      if (status === 'delivered' && !order.isPaid && order.paymentStatus !== 'paid') {
        return res.status(400).json({
          message: 'Order cannot be marked as delivered until payment is completed.',
        });
      }

      order.status = status;
      order.orderStatus = status;
      order.statusHistory.push({ status, changedAt: new Date() });

      if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
    }

    await order.save();
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
};

// Admin: soft delete an order so it no longer appears in listings.
exports.deleteOrderAdmin = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.isDeleted) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    order.isDeleted = true;
    await order.save();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};


