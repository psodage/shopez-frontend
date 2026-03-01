const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'percentage',
        'fixed',
        'free_shipping',
        'buy_x_get_y',
        'category',
        'product',
        'automatic',
      ],
      required: true,
    },
    value: {
      type: Number,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    applicableCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    ],
    applicableProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    usageLimit: {
      type: Number,
      min: 0,
    },
    usageLimitPerUser: {
      type: Number,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    userEligibility: {
      type: String,
      enum: ['all', 'first_time', 'specific'],
      default: 'all',
    },
    eligibleUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ],
    description: {
      type: String,
      trim: true,
      default: '',
    },
    bannerImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coupon', couponSchema);

