const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        'Order must contain at least one item.',
      ],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'RAZORPAY', 'STRIPE'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
      index: true,
    },
    // orderStatus mirrors status for easier querying / compatibility.
    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    isDelivered: {
      type: Boolean,
      default: false,
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cartSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('save', function preSave(next) {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{ status: this.status, changedAt: new Date() }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

