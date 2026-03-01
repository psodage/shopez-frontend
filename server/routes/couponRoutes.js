const express = require('express');
const { validateCouponPublic } = require('../controllers/couponController');

const router = express.Router();

// Public coupon validation endpoint used by the storefront cart.
router.post('/validate', validateCouponPublic);

module.exports = router;

