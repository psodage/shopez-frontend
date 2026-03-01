const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [160, 'Review title must be at most 160 characters'],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1200, 'Review comment must be at most 1200 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'spam'],
      default: 'pending',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    moderationNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Variant-level inventory for admin product management (size / color / storage).
const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    size: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    storage: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: true }
);

// Lightweight activity log so admins can audit product changes.
const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [160, 'Product name must be at most 160 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [280, 'Short description must be at most 280 characters'],
      default: '',
    },
    fullDescription: {
      type: String,
      trim: true,
      maxlength: [6000, 'Full description must be at most 6000 characters'],
      default: '',
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    // Optional absolute discount price for admin UI.
    discountPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 90,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    // Primary stock used by storefront; can be derived from variants.
    countInStock: {
      type: Number,
      min: 0,
      default: 0,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Admin toggle for visibility on storefront.
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Archive instead of hard delete.
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    // SEO and discovery metadata.
    seo: {
      metaTitle: {
        type: String,
        trim: true,
        default: '',
      },
      metaDescription: {
        type: String,
        trim: true,
        default: '',
      },
      metaKeywords: {
        type: [String],
        default: [],
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    // Simple analytics fields.
    views: {
      type: Number,
      default: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Product approval workflow.
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    activityLogs: {
      type: [activityLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Text search and common filters for admin queries.
productSchema.index({ name: 'text', description: 'text', 'seo.metaTitle': 'text' });
productSchema.index({ name: 1 });

module.exports = mongoose.model('Product', productSchema);

