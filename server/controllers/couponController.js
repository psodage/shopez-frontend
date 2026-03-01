const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

const computeDiscountAmount = (coupon, subtotal) => {
  const amount = Number(subtotal || 0);
  if (!amount || amount <= 0) return 0;

  if (coupon.type === 'percentage') {
    const percent = Number(coupon.value || 0);
    if (!percent || percent <= 0) return 0;
    return (amount * percent) / 100;
  }

  if (coupon.type === 'fixed') {
    const value = Number(coupon.value || 0);
    if (!value || value <= 0) return 0;
    return value;
  }

  // Other coupon types (free_shipping, product-specific, etc.) are
  // not handled by this simple public validator for now.
  return 0;
};

// POST /api/coupons/validate
// Public endpoint: validate a coupon code against the current cart subtotal.
exports.validateCouponPublic = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body || {};

    if (!code || String(code).trim().length === 0) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    const numericSubtotal = Number(subtotal);
    if (!Number.isFinite(numericSubtotal) || numericSubtotal <= 0) {
      return res
        .status(400)
        .json({ message: 'Subtotal must be a positive number.' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: normalizedCode,
      isActive: true,
    }).lean();

    if (!coupon) {
      return res
        .status(404)
        .json({ message: 'Coupon not found or inactive.' });
    }

    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ message: 'Coupon is not active yet.' });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      return res.status(400).json({ message: 'Coupon has expired.' });
    }

    // Enforce global usage limit based on actual orders.
    if (coupon.usageLimit != null) {
      const maxGlobalUses = Number(coupon.usageLimit);
      if (Number.isFinite(maxGlobalUses) && maxGlobalUses >= 0) {
        const globalUsageCount = await Order.countDocuments({
          couponCode: coupon.code,
          isDeleted: false,
          status: { $ne: 'cancelled' },
        });

        if (globalUsageCount >= maxGlobalUses) {
          return res
            .status(400)
            .json({ message: 'Coupon usage limit has been reached.' });
        }
      }
    }

    // Enforce per-user usage limit if we have an authenticated user.
    if (req.user && coupon.usageLimitPerUser != null) {
      const maxPerUserUses = Number(coupon.usageLimitPerUser);
      if (Number.isFinite(maxPerUserUses) && maxPerUserUses >= 0) {
        const perUserUsageCount = await Order.countDocuments({
          couponCode: coupon.code,
          user: req.user._id,
          isDeleted: false,
          status: { $ne: 'cancelled' },
        });

        if (perUserUsageCount >= maxPerUserUses) {
          return res.status(400).json({
            message:
              'You have already used this coupon the maximum number of times.',
          });
        }
      }
    }

    if (
      coupon.minOrderAmount != null &&
      numericSubtotal < Number(coupon.minOrderAmount || 0)
    ) {
      return res.status(400).json({
        message: `Minimum order amount for this coupon is ₹${Number(
          coupon.minOrderAmount
        ).toFixed(2)}.`,
      });
    }

    let discount = computeDiscountAmount(coupon, numericSubtotal);

    if (coupon.maxDiscountAmount != null) {
      const max = Number(coupon.maxDiscountAmount || 0);
      if (max > 0) {
        discount = Math.min(discount, max);
      }
    }

    // Safety clamp
    discount = Math.max(
      0,
      Math.min(discount, numericSubtotal),
    );

    if (!discount) {
      return res
        .status(400)
        .json({ message: 'Coupon does not apply to this order.' });
    }

    return res.status(200).json({
      code: coupon.code,
      discount,
      message: 'Coupon applied successfully.',
    });
  } catch (err) {
    return next(err);
  }
};

