const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');
const { protect, requireUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireUser, getWishlist);
router.post('/add', protect, requireUser, addToWishlist);
router.delete('/remove/:id', protect, requireUser, removeFromWishlist);

module.exports = router;

