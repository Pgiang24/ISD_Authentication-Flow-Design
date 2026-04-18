import { createBrowserRouter, redirect } from "react-router";
import AuthPage from "./pages/AuthPage";
import CustomerLayout from "./pages/customer/CustomerLayout";
import HomePage from "./pages/customer/HomePage";
import ProductsPage from "./pages/customer/ProductsPage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage";
import SettingsPage from "./pages/customer/SettingsPage";
import AboutPage from "./pages/customer/AboutPage";
import ContactPage from "./pages/customer/ContactPage";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import OrderManagementPage from "./pages/admin/OrderManagementPage";
import InventoryPage from "./pages/admin/InventoryPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function requireAdmin() {
  const stored = localStorage.getItem("ale_farms_user");
  if (!stored) return redirect("/login");
  try {
    const user = JSON.parse(stored);
    if (user.role !== "admin") return redirect("/unauthorized");
  } catch {
    return redirect("/login");
  }
  return null;
}

function requireAuth() {
  const stored = localStorage.getItem("ale_farms_user");
  if (!stored) return redirect("/login");
  return null;
}

// US1: "Page not found." cho invalid routes
function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found.</h1>
        <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
        <a href="/" className="inline-flex items-center gap-2 px-5 py-3 bg-[#7C2D12] text-white rounded-xl font-semibold hover:bg-[#6B2510] transition-colors">
          Back to Home
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  // Customer routes — không cần đăng nhập
  {
    path: "/",
    Component: CustomerLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "products", Component: ProductsPage },
      { path: "product/:id", Component: ProductDetailPage },
      { path: "cart", Component: CartPage, loader: () => requireAuth() },
      { path: "checkout", Component: CheckoutPage, loader: () => requireAuth() },
      { path: "order-confirmation", Component: OrderConfirmationPage, loader: () => requireAuth() },
      { path: "settings", Component: SettingsPage, loader: () => requireAuth() },
      { path: "about", Component: AboutPage },
      { path: "contact", Component: ContactPage },
      // US1: Trang báo lỗi permission — nằm trong CustomerLayout để có header/footer
      { path: "unauthorized", Component: UnauthorizedPage },
    ],
  },
  // Login/register
  {
    path: "/login",
    Component: AuthPage,
    loader: () => {
      const stored = localStorage.getItem("ale_farms_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          return user.role === "admin" ? redirect("/admin") : redirect("/");
        } catch {
          return null;
        }
      }
      return null;
    },
  },
  // 404 catch-all cho invalid routes — US1 "Page not found."
  {
    path: "*",
    Component: CustomerLayout,
    children: [{ index: true, Component: NotFoundPage }],
  },
  // Admin — cần đăng nhập + role admin
  {
    path: "/admin",
    Component: AdminLayout,
    loader: () => requireAdmin(),
    children: [
      { index: true, Component: DashboardPage },
      { path: "orders", Component: OrderManagementPage },
      { path: "inventory", Component: InventoryPage },
    ],
  },
]);