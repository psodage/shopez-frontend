const express = require('express');
const { getAdminDashboard } = require('../controllers/adminDashboardController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, requireAdmin, getAdminDashboard);

module.exports = router;

