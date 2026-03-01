const express = require('express');
const {
  getAdminCategories,
  getAdminCategoryById,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getCategoryHierarchy,
} = require('../controllers/adminCategoryController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { uploadCategoryImage } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/', getAdminCategories);
router.get('/hierarchy', getCategoryHierarchy);
router.get('/:id', getAdminCategoryById);
router.post('/', uploadCategoryImage, createAdminCategory);
router.put('/:id', uploadCategoryImage, updateAdminCategory);
router.delete('/:id', deleteAdminCategory);

module.exports = router;
