const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Very small in-memory rate limiter dedicated to the webhook endpoint so
// third parties cannot easily flood this process. For production deployments
// this should be replaced with a distributed rate limiter (e.g. Redis).
const webhookRateBucket = new Map();

const isRateLimited = (key, limitPerMinute = 60) => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const bucket = webhookRateBucket.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  webhookRateBucket.set(key, bucket);
  return bucket.count > limitPerMinute;
};

// Compute an HMAC SHA-256 signature over the raw body using the given secret.
// In production you would typically delegate this to the official Stripe /
// Razorpay SDKs, but this implementation keeps the verification logic explicit
// and easily auditable.
const computeHmacSignature = (secret, payload) =>
  crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

// POST /api/webhooks/payment
// Handles asynchronous notifications from Stripe or Razorpay to keep local
// payment + order state in sync. The handler:
// - Verifies the webhook signature against a shared secret
// - Updates Payment.status and ProviderResponse based on the provider event
// - Updates the associated Order paymentStatus / isPaid flags
// - Appends a webhook log entry for auditability
exports.handlePaymentWebhook = async (req, res, next) => {
  try {
    const ipKey = `${req.ip || req.headers['x-forwarded-for'] || 'unknown'}:payment`;
    if (isRateLimited(ipKey)) {
      return res.status(429).json({ message: 'Too many webhook requests.' });
    }

    const provider =
      (req.headers['x-payment-provider'] || '').toString().toLowerCase() ||
      (req.body && req.body.provider && String(req.body.provider).toLowerCase()) ||
      'stripe';

    const rawPayload = JSON.stringify(req.body || {});

    let expectedSignatureHeader;
    let secret;

    if (provider === 'razorpay') {
      expectedSignatureHeader = req.headers['x-razorpay-signature'];
      secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    } else {
      expectedSignatureHeader = req.headers['stripe-signature'];
      secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    }

    if (!secret) {
      // Without a configured secret we refuse to trust the event.
      return res
        .status(500)
        .json({ message: 'Webhook secret is not configured on the server.' });
    }

    if (!expectedSignatureHeader) {
      return res.status(400).json({ message: 'Missing webhook signature header.' });
    }

    const computed = computeHmacSignature(secret, rawPayload);
    if (computed !== expectedSignatureHeader) {
      return res.status(400).json({ message: 'Invalid webhook signature.' });
    }

    // The following mapping is intentionally generic; you can adapt it to the
    // exact payload structure from Stripe / Razorpay (event types, object
    // shape, etc.) without changing the overall control flow.
    const event = req.body || {};
    const providerEventId = event.id || event.event || null;
    const eventType = event.type || event.event || 'unknown';

    let transactionId =
      (event.data &&
        event.data.object &&
        (event.data.object.id ||
          event.data.object.payment_intent ||
          event.data.object.charge)) ||
      event.payload?.payment?.entity?.id ||
      event.payload?.payment_id ||
      null;

    if (!transactionId && event.transactionId) {
      transactionId = event.transactionId;
    }

    if (!transactionId) {
      return res
        .status(400)
        .json({ message: 'Unable to resolve transaction id from webhook payload.' });
    }

    const payment = await Payment.findOne({ transactionId }).populate('order');
    if (!payment) {
      return res
        .status(404)
        .json({ message: 'No matching payment record for webhook event.' });
    }

    let nextStatus = payment.status;
    if (
      eventType === 'payment_intent.succeeded' ||
      eventType === 'charge.succeeded' ||
      eventType === 'payment.captured'
    ) {
      nextStatus = 'success';
    } else if (
      eventType === 'payment_intent.payment_failed' ||
      eventType === 'charge.failed' ||
      eventType === 'payment.failed'
    ) {
      nextStatus = 'failed';
    }

    payment.status = nextStatus;
    payment.providerResponse = event;
    payment.webhookEvents.push({
      providerEventId,
      type: eventType,
      payload: event,
    });

    if (payment.order) {
      const order = payment.order instanceof Order ? payment.order : await Order.findById(payment.order);
      if (order) {
        if (nextStatus === 'success') {
          order.paymentStatus = 'paid';
          order.isPaid = true;
          order.paidAt = new Date();
        } else if (nextStatus === 'failed') {
          order.paymentStatus = 'failed';
          order.isPaid = false;
        }
        await order.save();
      }
    }

    await payment.save();

    return res.status(200).json({ received: true });
  } catch (err) {
    return next(err);
  }
};

