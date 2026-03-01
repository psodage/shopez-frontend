const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    refundedAt: {
      type: Date,
      default: Date.now,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const webhookEventSchema = new mongoose.Schema(
  {
    providerEventId: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    paymentProvider: {
      type: String,
      enum: ['stripe', 'razorpay'],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refunds: {
      type: [refundSchema],
      default: [],
    },
    settlementStatus: {
      type: String,
      enum: ['pending', 'settled', 'failed'],
      default: 'pending',
      index: true,
    },
    fraudRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },
    webhookEvents: {
      type: [webhookEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

