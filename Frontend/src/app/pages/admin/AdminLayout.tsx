import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Bell,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
  { icon: ShoppingBag, label: "Orders", to: "/admin/orders" },
  { icon: Package, label: "Inventory", to: "/admin/inventory" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications] = useState(3);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-5 border-b border-[#7C2D12]/20 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
          <img src="/images/logo.jpg" alt="ALE Farm's" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-white">ALE Farm's</div>
            <div className="text-xs text-white/50">Admin Panel</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ icon: Icon, label, to }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? "bg-[#D4A853] text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={`p-3 border-t border-white/10`}>
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-white/40 truncate">{user?.email}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#1C0A00] transition-all duration-300 flex-shrink-0 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 bg-[#1C0A00] flex flex-col">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-4 z-30">
          {/* Mobile Menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Page Title */}
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 text-base">
              {navItems.find((n) => n.to === location.pathname)?.label || "Admin"}
            </h1>
          </div>

          {/* Customer View Link */}
          <Link
            to="/"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-[#7C2D12] border border-gray-200 rounded-lg hover:border-[#7C2D12] transition-all"
          >
            View Store →
          </Link>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#7C2D12]/10 flex items-center justify-center">
            <User className="w-4 h-4 text-[#7C2D12]" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
