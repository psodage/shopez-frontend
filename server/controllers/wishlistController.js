const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const buildWishlistPayload = async (wishlist) => {
  if (!wishlist) {
    return { items: [], totalItems: 0 };
  }
  const populated = await wishlist.populate('items.product');
  const items = populated.items.map((entry) => ({
    id: entry.product._id,
    name: entry.product.name,
    image: entry.product.image,
    price: entry.product.price,
    stock: entry.product.countInStock,
  }));
  return {
    items,
    totalItems: items.length,
  };
};

exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const payload = await buildWishlistPayload(wishlist);
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: [{ product: product._id }],
      });
    } else {
      const exists = wishlist.items.some(
        (entry) => String(entry.product) === String(product._id)
      );
      if (!exists) {
        wishlist.items.unshift({ product: product._id });
        await wishlist.save();
      }
    }

    const payload = await buildWishlistPayload(wishlist);
    return res.status(201).json({
      ...payload,
      lastAddedId: product._id,
    });
  } catch (err) {
    return next(err);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found.' });
    }

    wishlist.items = wishlist.items.filter(
      (entry) => String(entry.product) !== String(id)
    );
    await wishlist.save();

    const payload = await buildWishlistPayload(wishlist);
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
};

