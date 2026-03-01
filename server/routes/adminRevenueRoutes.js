const express = require('express');
const { getRevenueStats } = require('../controllers/adminRevenueController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireAdmin, getRevenueStats);

module.exports = router;

