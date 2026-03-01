const express = require('express');
const { register, login, registerAdmin } = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Admin-only endpoint to create additional admin accounts.
router.post('/register-admin', protect, requireAdmin, registerAdmin);

router.get('/me', protect, (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = router;


