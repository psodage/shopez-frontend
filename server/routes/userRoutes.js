const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/userController');
const { protect, requireUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, requireUser, getProfile);
router.put('/profile', protect, requireUser, updateProfile);
router.put('/change-password', protect, requireUser, changePassword);

router.post('/address', protect, requireUser, addAddress);
router.put('/address/:id', protect, requireUser, updateAddress);
router.delete('/address/:id', protect, requireUser, deleteAddress);

module.exports = router;

