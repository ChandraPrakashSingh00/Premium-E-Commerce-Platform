import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { PageLoader } from '@/components/ui';
import PublicLayout from '@/layouts/PublicLayout';
import RouteErrorPage from '@/pages/RouteErrorPage';
import { GuestOnly, RequireAdmin, RequireAuth } from './guards';

/** Code-split page element with a suspense fallback. */
const page = (importer, fallback = <PageLoader />) => {
  const Component = lazy(importer);
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

const HomePage = page(() => import('@/pages/HomePage'));
const ShopPage = page(() => import('@/pages/ShopPage'));
const CategoryPage = page(() => import('@/pages/CategoryPage'));
const ProductPage = page(() => import('@/pages/ProductPage'));
const SearchPage = page(() => import('@/pages/SearchPage'));
const WishlistPage = page(() => import('@/pages/WishlistPage'));
const CartPage = page(() => import('@/pages/CartPage'));
const NotFoundPage = page(() => import('@/pages/NotFoundPage'));

const AboutPage = page(() => import('@/pages/info/AboutPage'));
const ContactPage = page(() => import('@/pages/info/ContactPage'));
const FaqPage = page(() => import('@/pages/info/FaqPage'));
const PolicyPage = page(() => import('@/pages/info/PolicyPage'));

const AuthLayout = page(() => import('@/layouts/AuthLayout'));
const LoginPage = page(() => import('@/pages/auth/LoginPage'));
const RegisterPage = page(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = page(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = page(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = page(() => import('@/pages/auth/VerifyEmailPage'));

const AccountLayout = page(() => import('@/layouts/AccountLayout'));
const AccountOverviewPage = page(() => import('@/pages/account/AccountOverviewPage'));
const ProfilePage = page(() => import('@/pages/account/ProfilePage'));
const AddressesPage = page(() => import('@/pages/account/AddressesPage'));
const OrdersPage = page(() => import('@/pages/account/OrdersPage'));
const OrderDetailPage = page(() => import('@/pages/account/OrderDetailPage'));
const AccountWishlistPage = page(() => import('@/pages/account/AccountWishlistPage'));
const MyReviewsPage = page(() => import('@/pages/account/ReviewsPage'));
const AccountSettingsPage = page(() => import('@/pages/account/SettingsPage'));

const CheckoutPage = page(() => import('@/pages/checkout/CheckoutPage'));
const CheckoutSuccessPage = page(() => import('@/pages/checkout/CheckoutSuccessPage'));
const CheckoutFailurePage = page(() => import('@/pages/checkout/CheckoutFailurePage'));

const AdminLoginPage = page(() => import('@/pages/admin/AdminLoginPage'));
const AdminLayout = page(() => import('@/layouts/AdminLayout'));
const AdminDashboardPage = page(() => import('@/pages/admin/DashboardPage'));
const AdminProductsPage = page(() => import('@/pages/admin/ProductsPage'));
const AdminProductFormPage = page(() => import('@/pages/admin/ProductFormPage'));
const AdminCategoriesPage = page(() => import('@/pages/admin/CategoriesPage'));
const AdminBrandsPage = page(() => import('@/pages/admin/BrandsPage'));
const AdminInventoryPage = page(() => import('@/pages/admin/InventoryPage'));
const AdminOrdersPage = page(() => import('@/pages/admin/OrdersPage'));
const AdminOrderDetailPage = page(() => import('@/pages/admin/OrderDetailPage'));
const AdminCustomersPage = page(() => import('@/pages/admin/CustomersPage'));
const AdminReviewsPage = page(() => import('@/pages/admin/ReviewsPage'));
const AdminCouponsPage = page(() => import('@/pages/admin/CouponsPage'));
const AdminPaymentsPage = page(() => import('@/pages/admin/PaymentsPage'));
const AdminAnalyticsPage = page(() => import('@/pages/admin/AnalyticsPage'));
const AdminSettingsPage = page(() => import('@/pages/admin/SettingsPage'));

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'category/:slug', element: <CategoryPage /> },
      { path: 'product/:slug', element: <ProductPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'privacy-policy', element: <PolicyPage policy="privacy" /> },
      { path: 'terms', element: <PolicyPage policy="terms" /> },
      { path: 'refund-policy', element: <PolicyPage policy="refund" /> },
      { path: 'shipping-policy', element: <PolicyPage policy="shipping" /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'checkout/success', element: <CheckoutSuccessPage /> },
          { path: 'checkout/failure', element: <CheckoutFailurePage /> },
          {
            path: 'account',
            element: <AccountLayout />,
            children: [
              { index: true, element: <AccountOverviewPage /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'addresses', element: <AddressesPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'orders/:id', element: <OrderDetailPage /> },
              { path: 'wishlist', element: <AccountWishlistPage /> },
              { path: 'reviews', element: <MyReviewsPage /> },
              { path: 'settings', element: <AccountSettingsPage /> },
            ],
          },
        ],
      },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <GuestOnly />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password/:token', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    path: 'admin/login',
    element: <GuestOnly admin />,
    errorElement: <RouteErrorPage />,
    children: [{ index: true, element: <AdminLoginPage /> }],
  },
  {
    path: 'admin',
    element: <RequireAdmin />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'products/new', element: <AdminProductFormPage /> },
          { path: 'products/:id/edit', element: <AdminProductFormPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'brands', element: <AdminBrandsPage /> },
          { path: 'inventory', element: <AdminInventoryPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'orders/:id', element: <AdminOrderDetailPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
          { path: 'reviews', element: <AdminReviewsPage /> },
          { path: 'coupons', element: <AdminCouponsPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'analytics', element: <AdminAnalyticsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },
    ],
  },
]);
