const express = require('express');
const {
  getAdminReviews,
  getAdminReviewById,
  updateReviewStatus,
  deleteReview,
  bulkActionReviews,
  getReviewAnalytics,
} = require('../controllers/adminReviewController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireAdmin, getAdminReviews);
router.get('/analytics', protect, requireAdmin, getReviewAnalytics);
router.get('/:id', protect, requireAdmin, getAdminReviewById);
router.put('/:id/status', protect, requireAdmin, updateReviewStatus);
router.delete('/:id', protect, requireAdmin, deleteReview);
router.post('/bulk', protect, requireAdmin, bulkActionReviews);

module.exports = router;

