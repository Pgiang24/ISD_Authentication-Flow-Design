import { createBrowserRouter, redirect } from "react-router";
import AuthPage from "./pages/AuthPage";
import CustomerLayout from "./pages/customer/CustomerLayout";
import HomePage from "./pages/customer/HomePage";
import ProductsPage from "./pages/customer/ProductsPage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import OrderManagementPage from "./pages/admin/OrderManagementPage";
import InventoryPage from "./pages/admin/InventoryPage";

function requireAdmin() {
  const stored = localStorage.getItem("ale_farms_user");
  if (!stored) return redirect("/login");
  const user = JSON.parse(stored);
  if (user.role !== "admin") return redirect("/");
  return null;
}

function requireAuth() {
  const stored = localStorage.getItem("ale_farms_user");
  if (!stored) return redirect("/login");
  return null;
}

export const router = createBrowserRouter([
  // Trang chủ — không cần đăng nhập
  {
    path: "/",
    Component: CustomerLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "products", Component: ProductsPage },
      { path: "product/:id", Component: ProductDetailPage },
      // Giỏ hàng và checkout — cần đăng nhập
      { path: "cart", Component: CartPage, loader: () => requireAuth() },
      { path: "checkout", Component: CheckoutPage, loader: () => requireAuth() },      { path: "order-confirmation", Component: OrderConfirmationPage, loader: () => requireAuth() },
    ],
  },
  // Trang login/register
  {
    path: "/login",
    Component: AuthPage,
    loader: () => {
      const stored = localStorage.getItem("ale_farms_user");
      if (stored) {
        const user = JSON.parse(stored);
        return user.role === "admin" ? redirect("/admin") : redirect("/");
      }
      return null;
    },
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