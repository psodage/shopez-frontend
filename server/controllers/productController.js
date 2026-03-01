const Product = require('../models/Product');
const Order = require('../models/Order');
const Banner = require('../models/Banner');

// Get banner discount prices for multiple products (from active banners)
const getBannerDiscountsForProducts = async (productIds) => {
  if (!productIds?.length) return new Map();
  const now = new Date();
  const banners = await Banner.find({
    product: { $in: productIds },
    isActive: true,
    discountPrice: { $ne: null, $gt: 0 },
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  })
    .sort({ priority: 1 })
    .select('product discountPrice')
    .lean();
  const map = new Map();
  for (const b of banners) {
    const pid = String(b.product);
    if (!map.has(pid)) map.set(pid, b.discountPrice);
  }
  return map;
};

const getBannerDiscountForProduct = async (productId) => {
  const map = await getBannerDiscountsForProducts([productId]);
  return map.get(String(productId)) ?? null;
};

exports.getProducts = async (req, res, next) => {
  try {
    const {
      featured,
      sort,
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      page = 1,
      limit = 24,
    } = req.query;

    const filter = {};

    if (featured) {
      filter.isFeatured = true;
    }

    if (category) {
      filter.category = String(category).toLowerCase();
    }

    if (search) {
      filter.name = { $regex: String(search), $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    const sortOptions = {};
    if (sort === 'price_asc') {
      sortOptions.price = 1;
    } else if (sort === 'price_desc') {
      sortOptions.price = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const numericLimit = Math.min(
      Math.max(parseInt(limit, 10) || 24, 1),
      100
    );
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Enrich with banner discount price for products in active banners
    const productIds = products.map((p) => p._id);
    const discountMap = await getBannerDiscountsForProducts(productIds);
    const enriched = products.map((p) => ({
      ...p,
      bannerDiscountPrice: discountMap.get(String(p._id)) ?? null,
    }));

    const totalPages = Math.ceil(total / numericLimit) || 1;

    return res.status(200).json({
      products: enriched,
      total,
      page: numericPage,
      totalPages,
      limit: numericLimit,
    });
  } catch (err) {
    return next(err);
  }
};

const computeRatingFromReviews = (reviews) => {
  // Treat all non-deleted, non-spam reviews as contributing to rating,
  // regardless of whether they are still "pending" or already "approved".
  const visible = reviews.filter(
    (r) =>
      !r.isDeleted &&
      (r.status !== 'spam' && r.status !== 'rejected')
  );
  if (!visible.length) {
    return { rating: 0, numReviews: 0 };
  }
  const numReviews = visible.length;
  const rating =
    visible.reduce((sum, r) => sum + Number(r.rating || 0), 0) / numReviews;
  return { rating, numReviews };
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const publicReviews = reviews.filter(
    (r) =>
      !r.isDeleted &&
      (r.status !== 'spam' && r.status !== 'rejected')
  );
    const { rating, numReviews } = computeRatingFromReviews(reviews);

    const bannerDiscountPrice = await getBannerDiscountForProduct(product._id);

    return res.status(200).json({
      product: {
        ...product,
        reviews: publicReviews,
        rating,
        numReviews,
        bannerDiscountPrice,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ message: 'Comment is required.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Only allow reviews from customers who have actually received this product.
    const hasDeliveredOrder = await Order.exists({
      user: req.user._id,
      isDeleted: false,
      'orderItems.product': product._id,
      $or: [{ status: 'delivered' }, { isDelivered: true }],
    });

    if (!hasDeliveredOrder) {
      return res.status(403).json({
        message:
          'You can only review this product after an order containing it has been delivered.',
      });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => String(r.user) === String(req.user._id)
    );
    if (alreadyReviewed) {
      return res.status(409).json({ message: 'You have already reviewed this product.' });
    }

    product.reviews.push({
      user: req.user._id,
      name: req.user.name || 'User',
      rating: numericRating,
      comment: String(comment).trim(),
      status: 'pending',
    });

    const {
      rating: computedRating,
      numReviews: computedNumReviews,
    } = computeRatingFromReviews(product.reviews);
    product.rating = computedRating;
    product.numReviews = computedNumReviews;

    await product.save();

    return res.status(201).json({
      message: 'Review added successfully.',
      reviews: product.reviews.filter(
        (r) =>
          !r.isDeleted &&
          (r.status !== 'spam' && r.status !== 'rejected')
      ),
      numReviews: product.numReviews,
      rating: product.rating,
    });
  } catch (err) {
    return next(err);
  }
};

