const express = require('express');
const {
  getAdminOrders,
  updateOrderStatusAdmin,
  deleteOrderAdmin,
} = require('../controllers/orderController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireAdmin, getAdminOrders);
router.put('/:id/status', protect, requireAdmin, updateOrderStatusAdmin);
router.delete('/:id', protect, requireAdmin, deleteOrderAdmin);

module.exports = router;

