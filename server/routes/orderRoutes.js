const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderPayment,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, requireUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, requireUser, createOrder);
router.get('/my', protect, requireUser, getMyOrders);
router.get('/:id', protect, requireUser, getOrderById);
router.put('/:id/pay', protect, requireUser, updateOrderPayment);
router.put('/:id/cancel', protect, requireUser, cancelOrder);

module.exports = router;

