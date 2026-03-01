const Category = require('../models/Category');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    return res.status(200).json({ categories });
  } catch (err) {
    return next(err);
  }
};

