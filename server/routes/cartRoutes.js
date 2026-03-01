const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require('../controllers/cartController');
const { protect, requireUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireUser, getCart);
router.post('/add', protect, requireUser, addToCart);
router.put('/update', protect, requireUser, updateCartItem);
router.delete('/remove', protect, requireUser, removeFromCart);

module.exports = router;

