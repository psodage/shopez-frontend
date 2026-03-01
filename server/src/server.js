const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('../routes/authRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const productRoutes = require('../routes/productRoutes');
const cartRoutes = require('../routes/cartRoutes');
const wishlistRoutes = require('../routes/wishlistRoutes');
const orderRoutes = require('../routes/orderRoutes');
const adminOrderRoutes = require('../routes/adminOrderRoutes');
const adminProductRoutes = require('../routes/adminProductRoutes');
const adminReviewRoutes = require('../routes/adminReviewRoutes');
const adminCategoryRoutes = require('../routes/adminCategoryRoutes');
const adminDashboardRoutes = require('../routes/adminDashboardRoutes');
const adminCouponRoutes = require('../routes/adminCouponRoutes');
const adminBannerRoutes = require('../routes/adminBannerRoutes');
const couponRoutes = require('../routes/couponRoutes');
const adminPaymentRoutes = require('../routes/adminPaymentRoutes');
const adminRevenueRoutes = require('../routes/adminRevenueRoutes');
const webhookRoutes = require('../routes/webhookRoutes');
const userRoutes = require('../routes/userRoutes');
const bannerRoutes = require('../routes/bannerRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/revenue', adminRevenueRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopez';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`ShopEZ API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

