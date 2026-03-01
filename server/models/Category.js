const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [80, 'Category name must be at most 80 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: null,
    },
    // Banner for category landing page (optional)
    banner: {
      type: String,
      default: null,
    },
    // Parent/child hierarchy: null = root category, ObjectId = subcategory
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    // Denormalized path for efficient tree queries (e.g., "electronics/mobiles/smartphones")
    // Used for breadcrumb generation and descendant lookups
    path: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    // Display order within same level (lower = first)
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    // SEO metadata for category landing page
    seoTitle: {
      type: String,
      trim: true,
      default: '',
    },
    seoDescription: {
      type: String,
      trim: true,
      default: '',
    },
    // Denormalized product count (updated by aggregation; products reference category by slug)
    productCount: {
      type: Number,
      default: 0,
    },
    // Optional: category-specific filters (e.g., brand, color for Electronics)
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Optional: CMS content for category landing page
    landingContent: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance: name for search, slug for unique lookup, parent for tree queries
categorySchema.index({ name: 'text', description: 'text', seoTitle: 'text' });

module.exports = mongoose.model('Category', categorySchema);
