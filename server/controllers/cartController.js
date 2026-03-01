const Cart = require('../models/Cart');
const Product = require('../models/Product');

const buildResponseCart = async (cart) => {
  if (!cart) {
    return { items: [], totalItems: 0, subtotal: 0 };
  }
  const populated = await cart.populate('items.product');
  const items = populated.items.map((it) => ({
    productId: it.product._id,
    name: it.product.name,
    image: it.product.image,
    price: it.product.price,
    stock: it.product.countInStock,
    quantity: it.quantity,
  }));
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  return { items, totalItems, subtotal };
};

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const payload = await buildResponseCart(cart);
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    if (product.countInStock <= 0) {
      return res.status(400).json({ message: 'Product is out of stock.' });
    }

    const qty = Math.min(Number(quantity) || 1, product.countInStock);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: product._id, quantity: qty }],
      });
    } else {
      const item = cart.items.find(
        (it) => String(it.product) === String(product._id)
      );
      if (item) {
        item.quantity = Math.min(
          item.quantity + qty,
          product.countInStock
        );
      } else {
        cart.items.push({ product: product._id, quantity: qty });
      }
      await cart.save();
    }

    const payload = await buildResponseCart(cart);
    return res.status(201).json(payload);
  } catch (err) {
    return next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const desired = Math.max(1, Number(quantity) || 1);
    const allowed = Math.min(desired, product.countInStock);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const item = cart.items.find(
      (it) => String(it.product) === String(product._id)
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not in cart.' });
    }

    item.quantity = allowed;
    await cart.save();

    const payload = await buildResponseCart(cart);
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }
    cart.items = cart.items.filter(
      (it) => String(it.product) !== String(productId)
    );
    await cart.save();
    const payload = await buildResponseCart(cart);
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
};

