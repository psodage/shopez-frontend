const express = require('express');
const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} = require('../controllers/adminCouponController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireAdmin, getCoupons);
router.get('/:id', protect, requireAdmin, getCouponById);
router.post('/', protect, requireAdmin, createCoupon);
router.put('/:id', protect, requireAdmin, updateCoupon);
router.delete('/:id', protect, requireAdmin, deleteCoupon);
router.patch('/:id/toggle', protect, requireAdmin, toggleCouponStatus);

module.exports = router;

