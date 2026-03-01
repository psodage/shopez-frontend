const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (_) {
    return null;
  }
};

const recomputeProductRating = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) return;
  const approved = product.reviews.filter(
    (r) => !r.isDeleted && (r.status === 'approved' || !r.status)
  );
  if (!approved.length) {
    product.rating = 0;
    product.numReviews = 0;
  } else {
    product.numReviews = approved.length;
    product.rating =
      approved.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
      product.numReviews;
  }
  await product.save();
};

// GET /api/admin/reviews
exports.getAdminReviews = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      rating,
      status,
      product,
      search,
      sort = 'date_desc',
    } = req.query;

    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const match = {
      'reviews.isDeleted': { $ne: true },
    };

    if (status && status !== 'all') {
      match['reviews.status'] = status;
    }

    if (rating) {
      match['reviews.rating'] = Number(rating);
    }

    if (product) {
      const productId = toObjectId(product);
      if (productId) {
        match._id = productId;
      }
    }

    if (search) {
      const regex = new RegExp(String(search), 'i');
      match.$or = [{ name: regex }, { 'reviews.name': regex }];
    }

    const sortStage = {};
    if (sort === 'rating_asc') {
      sortStage['reviews.rating'] = 1;
    } else if (sort === 'rating_desc') {
      sortStage['reviews.rating'] = -1;
    } else if (sort === 'date_asc') {
      sortStage['reviews.createdAt'] = 1;
    } else {
      sortStage['reviews.createdAt'] = -1;
    }

    const pipeline = [
      { $unwind: '$reviews' },
      { $match: match },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          reviewId: '$reviews._id',
          productId: '$_id',
          productName: '$name',
          productImage: '$image',
          rating: '$reviews.rating',
          title: '$reviews.title',
          comment: '$reviews.comment',
          status: '$reviews.status',
          isDeleted: '$reviews.isDeleted',
          createdAt: '$reviews.createdAt',
          userId: '$user._id',
          userName: '$reviews.name',
          userEmail: '$user.email',
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: numericLimit }],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await Product.aggregate(pipeline);
    const items = result.items || [];
    const total = result.total[0]?.count || 0;
    const totalPages = Math.ceil(total / numericLimit) || 1;

    return res.status(200).json({
      reviews: items,
      page: numericPage,
      totalPages,
      total,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/reviews/:id
exports.getAdminReviewById = async (req, res, next) => {
  try {
    const reviewId = toObjectId(req.params.id);
    if (!reviewId) {
      return res.status(400).json({ message: 'Invalid review id.' });
    }

    const product = await Product.findOne({ 'reviews._id': reviewId })
      .populate('reviews.user', 'name email')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    const review = (product.reviews || []).find(
      (r) => String(r._id) === String(reviewId)
    );
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    return res.status(200).json({
      review: {
        id: review._id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images || [],
        status: review.status,
        isDeleted: review.isDeleted,
        moderationNote: review.moderationNote || '',
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        product: {
          id: product._id,
          name: product.name,
          image: product.image,
          category: product.category,
        },
        user: review.user
          ? {
              id: review.user._id,
              name: review.user.name,
              email: review.user.email,
            }
          : {
              id: null,
              name: review.name,
              email: null,
            },
      },
    });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/admin/reviews/:id/status
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const reviewId = toObjectId(req.params.id);
    const { status, moderationNote } = req.body;

    if (!reviewId) {
      return res.status(400).json({ message: 'Invalid review id.' });
    }

    const allowed = ['pending', 'approved', 'rejected', 'spam'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const product = await Product.findOne({ 'reviews._id': reviewId });
    if (!product) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    review.status = status;
    if (typeof moderationNote === 'string') {
      review.moderationNote = moderationNote.trim();
    }

    await product.save();
    await recomputeProductRating(product._id);

    return res.status(200).json({ message: 'Review updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/admin/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const reviewId = toObjectId(req.params.id);
    if (!reviewId) {
      return res.status(400).json({ message: 'Invalid review id.' });
    }

    const product = await Product.findOne({ 'reviews._id': reviewId });
    if (!product) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    review.isDeleted = true;

    await product.save();
    await recomputeProductRating(product._id);

    return res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/reviews/bulk
exports.bulkActionReviews = async (req, res, next) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: 'No review ids provided.' });
    }

    const validIds = ids.map(toObjectId).filter(Boolean);
    if (!validIds.length) {
      return res.status(400).json({ message: 'No valid review ids provided.' });
    }

    const allowedActions = ['approve', 'reject', 'spam', 'delete'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid bulk action.' });
    }

    const products = await Product.find({ 'reviews._id': { $in: validIds } });
    const touchedProducts = new Set();

    products.forEach((product) => {
      product.reviews.forEach((review) => {
        if (!validIds.some((id) => String(id) === String(review._id))) return;
        if (action === 'delete') {
          review.isDeleted = true;
        } else if (action === 'approve') {
          review.status = 'approved';
        } else if (action === 'reject') {
          review.status = 'rejected';
        } else if (action === 'spam') {
          review.status = 'spam';
        }
        touchedProducts.add(String(product._id));
      });
    });

    await Promise.all(products.map((p) => p.save()));
    await Promise.all(
      Array.from(touchedProducts).map((id) => recomputeProductRating(id))
    );

    return res.status(200).json({ message: 'Bulk action applied.' });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/reviews/analytics
exports.getReviewAnalytics = async (req, res, next) => {
  try {
    const pipeline = [
      { $unwind: '$reviews' },
      {
        $match: {
          'reviews.isDeleted': { $ne: true },
        },
      },
      {
        $facet: {
          ratingDistribution: [
            {
              $group: {
                _id: '$reviews.rating',
                count: { $sum: 1 },
              },
            },
          ],
          topProducts: [
            {
              $group: {
                _id: '$_id',
                name: { $first: '$name' },
                image: { $first: '$image' },
                totalReviews: { $sum: 1 },
              },
            },
            { $sort: { totalReviews: -1 } },
            { $limit: 10 },
          ],
          pendingCount: [
            {
              $match: {
                'reviews.status': 'pending',
              },
            },
            {
              $count: 'count',
            },
          ],
        },
      },
    ];

    const [result] = await Product.aggregate(pipeline);

    return res.status(200).json({
      ratingDistribution: result.ratingDistribution || [],
      topProducts: result.topProducts || [],
      pendingCount: result.pendingCount?.[0]?.count || 0,
    });
  } catch (err) {
    return next(err);
  }
};

