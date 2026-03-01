const express = require('express');
const {
  getAdminPayments,
  getAdminPaymentById,
  refundPaymentAdmin,
  retryPaymentAdmin,
  markPaymentReviewedAdmin,
} = require('../controllers/adminPaymentController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireAdmin, getAdminPayments);
router.get('/:id', protect, requireAdmin, getAdminPaymentById);
router.post('/:id/refund', protect, requireAdmin, refundPaymentAdmin);
router.post('/:id/retry', protect, requireAdmin, retryPaymentAdmin);
router.post('/:id/review', protect, requireAdmin, markPaymentReviewedAdmin);

module.exports = router;

