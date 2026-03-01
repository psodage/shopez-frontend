const path = require('path');
const mongoose = require('mongoose');
const Banner = require('../models/Banner');
const { BannerActivity } = require('../models/Banner');
const Product = require('../models/Product');

const logBannerActivity = (bannerId, action, opts = {}) => {
  const { user, changes, note, req } = opts;
  const doc = {
    banner: bannerId,
    action,
    user: user || null,
    changes: changes || null,
    note: note || '',
    ip: req?.ip || req?.headers?.['x-forwarded-for'] || null,
    userAgent: req?.headers?.['user-agent'] || null,
  };
  return BannerActivity.create(doc).catch(() => {});
};

const addEmbeddedLog = (banner, action, opts = {}) => {
  const { user, changes, note, req } = opts;
  banner.activityLogs.push({
    action,
    user: user || null,
    changes: changes || null,
    note: note || '',
    ip: req?.ip || req?.headers?.['x-forwarded-for'] || null,
    userAgent: req?.headers?.['user-agent'] || null,
  });
};

const buildBannerFilters = (query) => {
  const { search, placement, status } = query || {};
  const filter = {};

  if (search) {
    const regex = new RegExp(String(search).trim(), 'i');
    filter.title = regex;
  }

  if (placement && placement !== 'all') {
    filter.placement = placement;
  }

  if (status && status !== 'all') {
    const now = new Date();
    if (status === 'active') {
      filter.isActive = true;
      filter.$and = [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ];
    } else if (status === 'scheduled') {
      filter.isActive = true;
      filter.startDate = { $gt: now };
    } else if (status === 'expired') {
      filter.endDate = { $lt: now };
    } else if (status === 'disabled') {
      filter.isActive = false;
    }
  }

  return filter;
};

// GET /api/admin/banners
exports.getBanners = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'priority_asc' } = req.query || {};
    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = buildBannerFilters(req.query || {});

    const sortOptions = {};
    if (sort === 'start_asc') {
      sortOptions.startDate = 1;
    } else if (sort === 'end_asc') {
      sortOptions.endDate = 1;
    } else {
      sortOptions.priority = 1;
      sortOptions.createdAt = -1;
    }

    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .populate('product', 'name image images price discountPrice')
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Banner.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / numericLimit) || 1;

    return res.status(200).json({
      banners,
      total,
      page: numericPage,
      totalPages,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/banners/:id
exports.getBannerById = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id)
      .populate('product')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' });
    }
    return res.status(200).json({ banner });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/banners/:id/activity
exports.getBannerActivity = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' });
    }
    const { page = 1, limit = 50 } = req.query || {};
    const skip = Math.max(0, (parseInt(page, 10) || 1) - 1) * Math.min(100, parseInt(limit, 10) || 50);
    const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const [activities, total] = await Promise.all([
      BannerActivity.find({ banner: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .populate('user', 'name email')
        .lean(),
      BannerActivity.countDocuments({ banner: req.params.id }),
    ]);

    return res.status(200).json({
      activities,
      total,
      page: Math.floor(skip / numericLimit) + 1,
      totalPages: Math.ceil(total / numericLimit) || 1,
    });
  } catch (err) {
    return next(err);
  }
};

const validateBannerPayload = (payload) => {
  const errors = [];
  if (!payload.title || !String(payload.title).trim()) {
    errors.push('Banner title is required.');
  }
  if (!payload.placement) {
    errors.push('Banner placement is required.');
  }
  if (payload.endDate && payload.startDate) {
    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    if (end <= start) {
      errors.push('End date must be after start date.');
    }
  }
  return errors;
};

// POST /api/admin/banners
exports.createBanner = async (req, res, next) => {
  try {
    const payload = req.body || {};

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      payload.image = `${baseUrl}/uploads/${path.basename(req.file.filename)}`;
    }

    payload.title = String(payload.title || '').trim();
    if (payload.subtitle != null) {
      payload.subtitle = String(payload.subtitle || '').trim();
    }
    if (payload.badgeText != null) {
      payload.badgeText = String(payload.badgeText || '').trim();
    }
    const errors = validateBannerPayload(payload);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    if (payload.priority != null) {
      // eslint-disable-next-line no-restricted-globals
      const num = Number(payload.priority);
      payload.priority = Number.isFinite(num) ? num : 0;
    }

    if (payload.discountPrice != null && payload.discountPrice !== '') {
      const num = Number(payload.discountPrice);
      payload.discountPrice = Number.isFinite(num) && num >= 0 ? num : null;
    }

    // Map productId (from form) to product (ObjectId ref)
    const productId = payload.productId || payload.product;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      const productExists = await Product.exists({ _id: productId });
      if (productExists) {
        payload.product = productId;
        payload.redirectUrl = `/product/${productId}`;
      }
    }
    delete payload.productId;

    if (payload.redirectUrl != null && payload.redirectUrl !== '') {
      payload.redirectUrl = String(payload.redirectUrl).trim();
    }

    payload.createdBy = req.user?._id || null;
    payload.activityLogs = [
      {
        action: 'create',
        user: req.user?._id || null,
        changes: { title: payload.title, placement: payload.placement },
        note: 'Banner created',
        ip: req.ip || req.headers?.['x-forwarded-for'] || null,
        userAgent: req.headers?.['user-agent'] || null,
        createdAt: new Date(),
      },
    ];

    const banner = await Banner.create(payload);

    logBannerActivity(banner._id, 'create', {
      user: req.user?._id,
      changes: { title: payload.title, placement: payload.placement },
      note: 'Banner created',
      req,
    });

    return res
      .status(201)
      .json({ message: 'Banner created successfully.', banner });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/admin/banners/:id
exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' });
    }

    const payload = req.body || {};

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      payload.image = `${baseUrl}/uploads/${path.basename(req.file.filename)}`;
    } else if (payload.removeImage === 'true' || payload.removeImage === true) {
      payload.image = '';
    }

    if (payload.title != null) {
      payload.title = String(payload.title || '').trim();
    }
    if (payload.subtitle != null) {
      payload.subtitle = String(payload.subtitle || '').trim();
    }
    if (payload.badgeText != null) {
      payload.badgeText = String(payload.badgeText || '').trim();
    }
    const errors = validateBannerPayload({
      ...banner.toObject(),
      ...payload,
    });
    if (errors.length) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    if (payload.priority != null) {
      // eslint-disable-next-line no-restricted-globals
      const num = Number(payload.priority);
      payload.priority = Number.isFinite(num) ? num : banner.priority;
    }

    // Product cannot be changed on edit - keep existing. Ensure redirectUrl points to product.
    delete payload.productId;
    delete payload.product;
    const productRef = banner.product?._id || banner.product;
    if (productRef) {
      payload.redirectUrl = `/product/${productRef}`;
    }

    if (payload.discountPrice != null && payload.discountPrice !== '') {
      const num = Number(payload.discountPrice);
      payload.discountPrice = Number.isFinite(num) && num >= 0 ? num : null;
    }

    const prevDoc = banner.toObject();
    payload.updatedBy = req.user?._id || null;

    const changes = {};
    const tracked = [
      'title',
      'subtitle',
      'badgeText',
      'placement',
      'discountPrice',
      'redirectUrl',
      'priority',
      'startDate',
      'endDate',
      'isActive',
      'image',
    ];
    for (const key of tracked) {
      if (payload[key] !== undefined && String(prevDoc[key]) !== String(payload[key])) {
        changes[key] = { from: prevDoc[key], to: payload[key] };
      }
    }

    if (Object.keys(changes).length) {
      addEmbeddedLog(banner, 'edit', {
        user: req.user?._id,
        changes,
        note: 'Banner updated',
        req,
      });
      logBannerActivity(banner._id, 'edit', {
        user: req.user?._id,
        changes,
        note: 'Banner updated',
        req,
      });
    }

    Object.assign(banner, payload);

    await banner.save();

    return res
      .status(200)
      .json({ message: 'Banner updated successfully.', banner });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/admin/banners/:id
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' });
    }
    const bannerId = banner._id;
    await banner.deleteOne();
    logBannerActivity(bannerId, 'delete', {
      user: req.user?._id,
      changes: { title: banner.title },
      note: 'Banner deleted',
      req,
    });
    return res.status(200).json({ message: 'Banner deleted successfully.' });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/admin/banners/:id/toggle
exports.toggleBannerStatus = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' });
    }
    const prevActive = banner.isActive;
    banner.isActive = !banner.isActive;
    addEmbeddedLog(banner, 'toggle', {
      user: req.user?._id,
      changes: { isActive: { from: prevActive, to: banner.isActive } },
      note: banner.isActive ? 'Banner enabled' : 'Banner disabled',
      req,
    });
    await banner.save();
    logBannerActivity(banner._id, 'toggle', {
      user: req.user?._id,
      changes: { isActive: { from: prevActive, to: banner.isActive } },
      note: banner.isActive ? 'Banner enabled' : 'Banner disabled',
      req,
    });
    return res.status(200).json({
      message: banner.isActive ? 'Banner enabled.' : 'Banner disabled.',
      isActive: banner.isActive,
    });
  } catch (err) {
    return next(err);
  }
};

