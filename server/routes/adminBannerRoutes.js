const express = require('express');
const {
  getBanners,
  getBannerById,
  getBannerActivity,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} = require('../controllers/adminBannerController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { parseBannerForm } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/', getBanners);
router.get('/:id/activity', getBannerActivity);
router.get('/:id', getBannerById);
router.post('/', parseBannerForm, createBanner);
router.put('/:id', parseBannerForm, updateBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/toggle', toggleBannerStatus);

module.exports = router;

