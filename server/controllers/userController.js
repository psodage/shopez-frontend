const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');

// Helper to compute order stats for a user.
const computeOrderStats = async (userId) => {
  const match = { user: userId, isDeleted: false, status: { $ne: 'cancelled' } };
  const [result] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' },
      },
    },
  ]);
  return {
    totalOrders: result?.totalOrders || 0,
    totalSpent: result?.totalSpent || 0,
  };
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const stats = await computeOrderStats(user._id);

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      profileImage: user.profileImage || '',
      addresses: user.addresses || [],
      role: user.role,
      createdAt: user.createdAt,
      ...stats,
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage } = req.body || {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof profileImage === 'string') user.profileImage = profileImage.trim();

    await user.save();

    const stats = await computeOrderStats(user._id);

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      profileImage: user.profileImage || '',
      addresses: user.addresses || [],
      role: user.role,
      createdAt: user.createdAt,
      ...stats,
    });
  } catch (err) {
    return next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required.',
      });
    }

    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = req.body || {};

    const newAddress = {
      fullName: address.fullName || user.name,
      phone: address.phone || user.phone || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      isDefault: Boolean(address.isDefault),
    };

    if (!newAddress.address1 || !newAddress.city || !newAddress.state || !newAddress.pincode || !newAddress.country) {
      return res.status(400).json({ message: 'Required address fields are missing.' });
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    if (newAddress.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();

    return res.status(201).json({ addresses: user.addresses });
  } catch (err) {
    return next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const address = (user.addresses || []).id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    Object.assign(address, {
      fullName: updates.fullName ?? address.fullName,
      phone: updates.phone ?? address.phone,
      address1: updates.address1 ?? address.address1,
      address2: updates.address2 ?? address.address2,
      city: updates.city ?? address.city,
      state: updates.state ?? address.state,
      pincode: updates.pincode ?? address.pincode,
      country: updates.country ?? address.country,
    });

    if (updates.isDefault === true) {
      user.addresses.forEach((a) => {
        a.isDefault = String(a._id) === String(address._id);
      });
    }

    await user.save();

    return res.status(200).json({ addresses: user.addresses });
  } catch (err) {
    return next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!Array.isArray(user.addresses) || user.addresses.length === 0) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    user.addresses = user.addresses.filter(
      (addr) => String(addr._id) !== String(id)
    );
    await user.save();

    return res.status(200).json({ addresses: user.addresses });
  } catch (err) {
    return next(err);
  }
};

