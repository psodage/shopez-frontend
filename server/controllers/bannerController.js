const Banner = require('../models/Banner');
const { BannerActivity } = require('../models/Banner');

// GET /api/banners/hero
// Public endpoint used by the homepage hero section.
exports.getHeroBanner = async (req, res, next) => {
  try {
    const now = new Date();

    const banner = await Banner.findOne({
      placement: 'hero',
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .populate('product')
      .sort({ priority: 1, createdAt: -1 })
      .lean();

    // Record display (impression) in background
    if (banner) {
      Banner.findByIdAndUpdate(banner._id, { $inc: { impressionCount: 1 } })
        .exec()
        .catch(() => {});

      BannerActivity.create({
        banner: banner._id,
        action: 'display',
        user: null,
        note: 'Banner displayed',
        ip: req.ip || req.headers?.['x-forwarded-for'] || null,
        userAgent: req.headers?.['user-agent'] || null,
      }).catch(() => {});
    }

    return res.status(200).json({ banner: banner || null });
  } catch (err) {
    return next(err);
  }
};

// POST /api/banners/:id/click
// Records a click on a banner (e.g. when user clicks "Shop this deal").
exports.recordBannerClick = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' });
    }
    await Banner.findByIdAndUpdate(banner._id, { $inc: { clickCount: 1 } });
    BannerActivity.create({
      banner: banner._id,
      action: 'click',
      user: req.user?._id || null,
      note: 'Banner clicked',
      ip: req.ip || req.headers?.['x-forwarded-for'] || null,
      userAgent: req.headers?.['user-agent'] || null,
    }).catch(() => {});
    return res.status(200).json({ message: 'Click recorded.' });
  } catch (err) {
    return next(err);
  }
};

