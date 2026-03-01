const mongoose = require('mongoose');

// Embedded log for create/edit/display/click events on a banner
const bannerActivityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['create', 'edit', 'display', 'click', 'toggle', 'delete'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: [160, 'Banner title must be at most 160 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    badgeText: {
      type: String,
      trim: true,
      default: '',
    },
    placement: {
      type: String,
      enum: ['hero', 'category', 'sidebar', 'popup', 'flash', 'app'],
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    redirectUrl: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    impressionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    activityLogs: {
      type: [bannerActivityLogSchema],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Separate collection for detailed banner activity (create, edit, display, click)
const bannerActivitySchema = new mongoose.Schema(
  {
    banner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Banner',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['create', 'edit', 'display', 'click', 'toggle', 'delete'],
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    note: { type: String, trim: true, default: '' },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

bannerActivitySchema.index({ banner: 1, createdAt: -1 });
bannerActivitySchema.index({ action: 1, createdAt: -1 });

const Banner = mongoose.model('Banner', bannerSchema);
const BannerActivity = mongoose.model('BannerActivity', bannerActivitySchema);

module.exports = Banner;
module.exports.BannerActivity = BannerActivity;

