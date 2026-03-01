const express = require('express');
const { getProducts, getProductById, addReview } = require('../controllers/productController');
const { protect, requireUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, requireUser, addReview);

module.exports = router;

