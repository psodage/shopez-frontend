import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './redux/store';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
const LoginPage = React.lazy(() => import('./pages/Login'));
const RegisterPage = React.lazy(() => import('./pages/Register'));
const HomePage = React.lazy(() => import('./pages/Home'));
const ProductsPage = React.lazy(() => import('./pages/Products'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetail'));
const CartPage = React.lazy(() => import('./pages/Cart'));
const WishlistPage = React.lazy(() => import('./pages/Wishlist'));
const CheckoutPage = React.lazy(() => import('./pages/Checkout'));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccess'));
const MyOrdersPage = React.lazy(() => import('./pages/MyOrders'));
const AdminOrdersPage = React.lazy(() => import('./pages/AdminOrders'));
const AdminOrderDetailPage = React.lazy(() => import('./pages/AdminOrderDetail'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboard'));
const AdminProductsPage = React.lazy(() => import('./pages/AdminProducts'));
const AdminProductCreatePage = React.lazy(() => import('./pages/AdminProductCreate'));
const AdminProductEditPage = React.lazy(() => import('./pages/AdminProductEdit'));
const AdminCategoriesPage = React.lazy(() => import('./pages/AdminCategories'));
const AdminCategoryCreatePage = React.lazy(() => import('./pages/AdminCategoryCreate'));
const AdminCategoryEditPage = React.lazy(() => import('./pages/AdminCategoryEdit'));
const AdminCouponsPage = React.lazy(() => import('./pages/AdminCoupons'));
const AdminReviewsPage = React.lazy(() => import('./pages/AdminReviews'));
const AdminReviewDetailPage = React.lazy(() => import('./pages/AdminReviewDetail'));
const AdminPaymentsPage = React.lazy(() => import('./pages/AdminPayments'));
const AdminPaymentDetailPage = React.lazy(() => import('./pages/AdminPaymentDetail'));
const AdminRevenuePage = React.lazy(() => import('./pages/AdminRevenue'));
const AdminBannersPage = React.lazy(() => import('./pages/AdminBanners'));
const AdminBannerCreatePage = React.lazy(() => import('./pages/AdminBannerCreate'));
const AdminBannerEditPage = React.lazy(() => import('./pages/AdminBannerEdit'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const ProfileEditPage = React.lazy(() => import('./pages/ProfileEdit'));
const ProfileAddressPage = React.lazy(() => import('./pages/ProfileAddress'));
const AdminLoginPage = React.lazy(() => import('./pages/AdminLogin'));
const AdminRegisterPage = React.lazy(() => import('./pages/AdminRegister'));
const NotFound404 = React.lazy(() => import('./pages/NotFound404'));
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { fetchWishlist } from './redux/wishlistSlice';
import { fetchCurrentUser, logout } from './redux/authSlice';
import Spinner from './components/Spinner';

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/admin/login', '/admin/register'];

const AuthSync = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, restoring } = useSelector((s) => s.auth);
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.includes(location.pathname);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    if (token && user && user.role === 'user') {
      dispatch(fetchWishlist());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(logout());
      const isAdminRoute = location.pathname.startsWith('/admin');
      if (isAdminRoute) {
        navigate('/admin/login', { replace: true, state: { from: location.pathname } });
      } else {
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [dispatch, navigate, location.pathname]);

  // Show spinner only when restoring AND not on a public auth page.
  // Public auth pages (login, register) can render and handle redirect when user loads.
  if (restoring && !isPublicAuthPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <ErrorBoundary>
            <AuthSync>
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                    <Spinner className="h-8 w-8" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin/register" element={<AdminRegisterPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route
                      path="/order-success/:id"
                      element={<OrderSuccessPage />}
                    />
                    <Route path="/order/:id" element={<OrderSuccessPage />} />
                    <Route path="/my-orders" element={<MyOrdersPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/edit" element={<ProfileEditPage />} />
                    <Route path="/profile/address" element={<ProfileAddressPage />} />
                  </Route>

                  <Route element={<AdminRoute />}>
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    <Route
                      path="/admin/orders/:id"
                      element={<AdminOrderDetailPage />}
                    />
                    <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                    <Route
                      path="/admin/payments/:id"
                      element={<AdminPaymentDetailPage />}
                    />
                    <Route path="/admin/revenue" element={<AdminRevenuePage />} />
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route
                      path="/admin/products/create"
                      element={<AdminProductCreatePage />}
                    />
                    <Route
                      path="/admin/products/:id/edit"
                      element={<AdminProductEditPage />}
                    />
                    <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                    <Route
                      path="/admin/categories/create"
                      element={<AdminCategoryCreatePage />}
                    />
                    <Route
                      path="/admin/categories/:id/edit"
                      element={<AdminCategoryEditPage />}
                    />
                    <Route path="/admin/coupons" element={<AdminCouponsPage />} />
                    <Route path="/admin/reviews" element={<AdminReviewsPage />} />
                    <Route
                      path="/admin/reviews/:id"
                      element={<AdminReviewDetailPage />}
                    />
                    <Route path="/admin/banners" element={<AdminBannersPage />} />
                    <Route
                      path="/admin/banners/create"
                      element={<AdminBannerCreatePage />}
                    />
                    <Route
                      path="/admin/banners/:id/edit"
                      element={<AdminBannerEditPage />}
                    />
                  </Route>

                  {/* Fallback for undefined routes - must be last */}
                  <Route path="*" element={<NotFound404 />} />
                </Routes>
              </Suspense>
            </AuthSync>
          </ErrorBoundary>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
