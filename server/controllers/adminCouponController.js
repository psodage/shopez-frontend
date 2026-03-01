const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

const buildQueryFilters = (query) => {
  const { search, type, status } = query;
  const filter = {};

  if (search) {
    const regex = new RegExp(String(search).trim(), 'i');
    filter.code = regex;
  }

  if (type && type !== 'all') {
    filter.type = type;
  }

  if (status && status !== 'all') {
    const now = new Date();
    if (status === 'active') {
      filter.isActive = true;
      filter.$and = [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] },
      ];
    } else if (status === 'expired') {
      filter.expiryDate = { $lt: now };
    } else if (status === 'disabled') {
      filter.isActive = false;
    }
  }

  return filter;
};

// GET /api/admin/coupons
exports.getCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'created_desc' } = req.query;
    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = buildQueryFilters(req.query);

    const sortOptions = {};
    if (sort === 'expiry_asc') {
      sortOptions.expiryDate = 1;
    } else if (sort === 'expiry_desc') {
      sortOptions.expiryDate = -1;
    } else if (sort === 'usage_desc') {
      // We'll sort by dynamic usage counts after computing them.
      sortOptions.createdAt = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [rawCoupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    let coupons = rawCoupons;

    // Attach real-time usage counts based on non-cancelled, non-deleted orders
    // so the admin UI reflects how many times each coupon has actually been used.
    if (coupons.length > 0) {
      const codes = coupons.map((c) => c.code);

      const usageStats = await Order.aggregate([
        {
          $match: {
            couponCode: { $in: codes },
            isDeleted: false,
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: '$couponCode',
            count: { $sum: 1 },
          },
        },
      ]);

      const usageMap = {};
      usageStats.forEach((row) => {
        usageMap[row._id] = row.count;
      });

      coupons = coupons.map((coupon) => ({
        ...coupon,
        usedCount: usageMap[coupon.code] || 0,
      }));

      if (sort === 'usage_desc') {
        coupons.sort(
          (a, b) => (b.usedCount || 0) - (a.usedCount || 0),
        );
      }
    }

    const totalPages = Math.ceil(total / numericLimit) || 1;

    return res.status(200).json({
      coupons,
      total,
      page: numericPage,
      totalPages,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/coupons/:id
exports.getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name image')
      .populate('eligibleUsers', 'name email')
      .lean();
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }
    return res.status(200).json({ coupon });
  } catch (err) {
    return next(err);
  }
};

const validateCouponPayload = (payload) => {
  const errors = [];
  if (!payload.code || !String(payload.code).trim()) {
    errors.push('Coupon code is required.');
  }
  if (!payload.type) {
    errors.push('Coupon type is required.');
  }
  if (payload.expiryDate && payload.startDate) {
    const start = new Date(payload.startDate);
    const end = new Date(payload.expiryDate);
    if (end <= start) {
      errors.push('Expiry date must be after start date.');
    }
  }
  if (payload.usageLimit != null && Number(payload.usageLimit) < 0) {
    errors.push('Usage limit must be positive.');
  }
  if (
    payload.usageLimitPerUser != null &&
    Number(payload.usageLimitPerUser) < 0
  ) {
    errors.push('Usage limit per user must be positive.');
  }
  return errors;
};

// POST /api/admin/coupons
exports.createCoupon = async (req, res, next) => {
  try {
    const payload = req.body || {};
    payload.code = String(payload.code || '').trim().toUpperCase();

    const errors = validateCouponPayload(payload);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    const existing = await Coupon.findOne({ code: payload.code });
    if (existing) {
      return res.status(409).json({ message: 'Coupon code already exists.' });
    }

    const coupon = await Coupon.create(payload);
    return res
      .status(201)
      .json({ message: 'Coupon created successfully.', coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Coupon code already exists.' });
    }
    return next(err);
  }
};

// PUT /api/admin/coupons/:id
exports.updateCoupon = async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (payload.code) {
      payload.code = String(payload.code).trim().toUpperCase();
    }

    const errors = validateCouponPayload({
      ...payload,
      code: payload.code || 'TEMP',
    });
    if (errors.length) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    if (payload.code && payload.code !== coupon.code) {
      const existing = await Coupon.findOne({ code: payload.code });
      if (existing) {
        return res.status(409).json({ message: 'Coupon code already exists.' });
      }
      coupon.code = payload.code;
    }

    Object.assign(coupon, {
      type: payload.type ?? coupon.type,
      value: payload.value ?? coupon.value,
      minOrderAmount:
        payload.minOrderAmount != null
          ? payload.minOrderAmount
          : coupon.minOrderAmount,
      maxDiscountAmount:
        payload.maxDiscountAmount != null
          ? payload.maxDiscountAmount
          : coupon.maxDiscountAmount,
      applicableCategories:
        payload.applicableCategories ?? coupon.applicableCategories,
      applicableProducts:
        payload.applicableProducts ?? coupon.applicableProducts,
      usageLimit:
        payload.usageLimit != null ? payload.usageLimit : coupon.usageLimit,
      usageLimitPerUser:
        payload.usageLimitPerUser != null
          ? payload.usageLimitPerUser
          : coupon.usageLimitPerUser,
      startDate: payload.startDate ?? coupon.startDate,
      expiryDate: payload.expiryDate ?? coupon.expiryDate,
      isActive:
        payload.isActive != null ? payload.isActive : coupon.isActive,
      userEligibility:
        payload.userEligibility ?? coupon.userEligibility,
      eligibleUsers: payload.eligibleUsers ?? coupon.eligibleUsers,
      description: payload.description ?? coupon.description,
      bannerImage: payload.bannerImage ?? coupon.bannerImage,
    });

    await coupon.save();

    return res
      .status(200)
      .json({ message: 'Coupon updated successfully.', coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Coupon code already exists.' });
    }
    return next(err);
  }
};

// DELETE /api/admin/coupons/:id
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }
    await coupon.deleteOne();
    return res.status(200).json({ message: 'Coupon deleted successfully.' });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/admin/coupons/:id/toggle
exports.toggleCouponStatus = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return res.status(200).json({
      message: coupon.isActive ? 'Coupon enabled.' : 'Coupon disabled.',
      isActive: coupon.isActive,
    });
  } catch (err) {
    return next(err);
  }
};

