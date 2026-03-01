import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import productFiltersReducer from './productFiltersSlice';
import productDetailReducer from './productDetailSlice';
import wishlistReducer from './wishlistSlice';
import orderReducer from './orderSlice';
import userProfileReducer from './userProfileSlice';
import adminDashboardReducer from './adminDashboardSlice';
import adminProductReducer from './adminProductSlice';
import adminCategoryReducer from './adminCategorySlice';
import adminReviewReducer from './adminReviewSlice';
import adminCouponReducer from './adminCouponSlice';
import adminPaymentReducer from './adminPaymentSlice';
import adminRevenueReducer from './adminRevenueSlice';
import adminBannerReducer from './adminBannerSlice';
import adminOfferReducer from './adminOfferSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    order: orderReducer,
    userProfile: userProfileReducer,
    productFilters: productFiltersReducer,
    productDetail: productDetailReducer,
    adminDashboard: adminDashboardReducer,
    adminProducts: adminProductReducer,
    adminCategories: adminCategoryReducer,
    adminReviews: adminReviewReducer,
    adminCoupons: adminCouponReducer,
    adminPayments: adminPaymentReducer,
    adminRevenue: adminRevenueReducer,
    adminBanners: adminBannerReducer,
    adminOffers: adminOfferReducer,
  },
});

export default store;
