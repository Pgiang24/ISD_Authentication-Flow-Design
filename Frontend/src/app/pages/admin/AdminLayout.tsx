import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ShoppingBag, Package,
  ChevronLeft, ChevronRight, Menu,
  LogOut, Bell, CheckCheck,
  ShoppingCart, AlertTriangle, XCircle, CreditCard, Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",  to: "/admin" },
  { icon: ShoppingBag,     label: "Orders",     to: "/admin/orders" },
  { icon: Package,         label: "Inventory",  to: "/admin/inventory" },
];

// Icon theo loại thông báo
function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { icon: any; color: string }> = {
    new_order:        { icon: ShoppingCart,   color: "text-blue-500 bg-blue-50" },
    low_stock:        { icon: AlertTriangle,  color: "text-amber-500 bg-amber-50" },
    order_cancelled:  { icon: XCircle,        color: "text-red-500 bg-red-50" },
    payment_received: { icon: CreditCard,     color: "text-green-500 bg-green-50" },
    system:           { icon: Settings,       color: "text-gray-500 bg-gray-100" },
  };
  const cfg = map[type] || map.system;
  const Icon = cfg.icon;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  // Notification
  const [notifs,       setNotifs]       = useState<any[]>([]);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef  = useRef<HTMLDivElement>(null);

  // Avatar dropdown
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const fetchNotifs = async () => {
    setNotifLoading(true);
    try {
      const data = await apiFetch<any[]>("/api/notifications");
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      setNotifs([]);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: number) => {
    setNotifs((p) => p.map((n) => n.notification_id === id ? { ...n, is_read: true } : n));
    try { await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }); } catch {}
  };

  const markAllRead = async () => {
    setNotifs((p) => p.map((n) => ({ ...n, is_read: true })));
    try { await apiFetch("/api/notifications/read-all", { method: "PATCH" }); } catch {}
  };

  const handleLogout = () => { logout("user_action"); navigate("/login"); };

  // Initials từ tên (2 chữ cái cuối trong tên đầy đủ)
  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((w: string) => w[0]).slice(-2).join("").toUpperCase()
    : "AD";

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
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

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ icon: Icon, label, to }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active ? "bg-[#D4A853] text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-[#D4A853] flex items-center justify-center flex-shrink-0">
            <span className="text-[#1C0A00] text-xs font-black">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name || "Admin User"}</div>
              <div className="text-xs text-white/40 truncate">{user?.email || "—"}</div>
            </div>
          )}
        </div>
        <button onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden">
      <aside className={`hidden lg:flex flex-col bg-[#1C0A00] transition-all duration-300 flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 bg-[#1C0A00] flex flex-col"><SidebarContent /></div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 z-30 relative">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 text-base">
              {navItems.find((n) => n.to === location.pathname)?.label || "Admin"}
            </h1>
          </div>

          <Link to="/" className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-[#7C2D12] border border-gray-200 rounded-lg hover:border-[#7C2D12] transition-all">
            View Store →
          </Link>

          {/* ── Bell ── */}
          <div ref={notifRef} className="relative">
            <button onClick={() => { setNotifOpen((v) => !v); setAvatarOpen(false); if (!notifOpen) fetchNotifs(); }}
              className={`relative p-2 rounded-lg transition-colors ${notifOpen ? "bg-[#7C2D12]/10 text-[#7C2D12]" : "hover:bg-gray-100 text-gray-600"}`}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-[#7C2D12] hover:underline font-medium">
                      <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifLoading ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-[#7C2D12] rounded-full animate-spin" />
                      <span className="text-xs">Đang tải...</span>
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                      <Bell className="w-8 h-8 opacity-30" />
                      <p className="text-sm">Chưa có thông báo</p>
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.notification_id} onClick={() => markRead(n.notification_id)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!n.is_read ? "bg-[#7C2D12]/5" : ""}`}>
                        <NotifIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm text-gray-900 leading-snug ${!n.is_read ? "font-semibold" : "font-medium"}`}>
                              {n.title}
                            </p>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#7C2D12] flex-shrink-0 mt-1.5" />}
                          </div>
                          {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifs.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                    <button onClick={fetchNotifs} className="text-xs text-gray-400 hover:text-gray-600">
                      Làm mới
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Avatar ── */}
          <div ref={avatarRef} className="relative">
            <button onClick={() => { setAvatarOpen((v) => !v); setNotifOpen(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all select-none ${
                avatarOpen
                  ? "bg-[#7C2D12] text-white ring-2 ring-[#7C2D12]/30"
                  : "bg-[#7C2D12]/10 text-[#7C2D12] hover:bg-[#7C2D12] hover:text-white"
              }`}>
              {initials}
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                {/* Profile header */}
                <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-[#FAF7F2] to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#7C2D12] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-black">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{user?.name || "Admin User"}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email || "—"}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#7C2D12]/10 text-[#7C2D12] text-[10px] font-bold rounded-full uppercase tracking-wide">
                        Admin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="py-1.5">
                  <Link to="/" onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <span>View Store</span>
                  </Link>
                </div>

                <div className="border-t border-gray-100 py-1.5">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}