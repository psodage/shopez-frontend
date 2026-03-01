const express = require('express');
const {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} = require('../controllers/adminProductController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { uploadProductImages } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', protect, requireAdmin, getAdminProducts);
router.get('/:id', protect, requireAdmin, getAdminProductById);
router.post(
  '/',
  protect,
  requireAdmin,
  uploadProductImages,
  createAdminProduct
);
router.put(
  '/:id',
  protect,
  requireAdmin,
  uploadProductImages,
  updateAdminProduct
);
router.delete('/:id', protect, requireAdmin, deleteAdminProduct);

module.exports = router;

