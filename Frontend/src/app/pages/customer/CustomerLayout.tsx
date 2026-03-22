import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { useState } from "react";
import { Search, ShoppingCart, Phone, X, LogOut, User, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const ZaloIcon = () => (
  <svg viewBox="0 0 32 32" className="w-4 h-4" fill="currentColor">
    <path d="M16 3C8.82 3 3 8.82 3 16c0 2.82.88 5.44 2.38 7.6L3 29l5.6-2.32A12.9 12.9 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.5a10.4 10.4 0 01-5.3-1.44l-.38-.23-3.94 1.38 1.24-3.82-.25-.4A10.42 10.42 0 015.5 16C5.5 9.6 10.1 5 16 5s10.5 4.6 10.5 11-4.6 10.5-10.5 10.5z"/>
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.52V6.77a4.85 4.85 0 01-1.02-.08z"/>
  </svg>
);

const ShopeeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2a5 5 0 00-5 5H5a2 2 0 00-2 2l1 11a2 2 0 002 2h12a2 2 0 002-2l1-11a2 2 0 00-2-2h-2a5 5 0 00-5-5zm0 2a3 3 0 013 3H9a3 3 0 013-3zm-5 7a1 1 0 110 2 1 1 0 010-2zm10 0a1 1 0 110 2 1 1 0 010-2z"/>
  </svg>
);

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [trackingCode, setTrackingCode] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setProfileMenuOpen(false);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      alert(`Theo dõi đơn hàng: ${trackingCode}\n\nTrạng thái: Đang vận chuyển → Dự kiến giao: 2-3 ngày`);
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: "Trang chủ",    to: "/" },
    { label: "Sản phẩm",     to: "/products" },
    { label: "Về chúng tôi", to: "/#about" },
    { label: "Liên hệ",      to: "/#contact" },
  ];

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    if (to === "/products") return location.pathname === "/products";
    return false;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      <header className="sticky top-0 z-50 shadow-md">

        {/* HÀNG 1: trắng — Logo trái | Social icons phải */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                  <img src="/images/logo.jpg" alt="ALE Farm's" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-extrabold text-[#7C2D12] leading-tight text-base tracking-tight">ALE Farm's</div>
                  <div className="text-[10px] text-gray-400 leading-none">Đặc Sản Thịt Hun Khói</div>
                </div>
              </Link>

              {/* Social icons */}
              <div className="hidden sm:flex items-center gap-1">
                <a href="#" title="Facebook" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><FacebookIcon /></a>
                <a href="#" title="Zalo"     className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><ZaloIcon /></a>
                <a href="#" title="TikTok"   className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><TiktokIcon /></a>
                <a href="#" title="Shopee"   className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"><ShopeeIcon /></a>
              </div>

              {/* Mobile toggle */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 hover:bg-gray-100 rounded-xl">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* HÀNG 2: cam — Nav + Search + Phone + Cart + Profile */}
        <div className="bg-[#d35f1a] hidden sm:block">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">

              {/* Nav links */}
              <nav className="flex items-center">
                {navLinks.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.label}
                      to={link.to}
                      className={`flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                        active ? "text-white" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {link.label}
                      {active && <span className="text-white text-[10px] leading-none">▾</span>}
                    </Link>
                  );
                })}
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-1">

                {/* Search */}
                {searchOpen ? (
                  <form onSubmit={handleTrack} className="flex items-center gap-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
                      <input
                        autoFocus
                        type="text"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        placeholder="Nhập mã đơn hàng..."
                        className="w-40 pl-8 pr-3 py-1.5 rounded-lg border border-white/40 bg-white/20 text-white placeholder-white/60 text-xs outline-none focus:bg-white/30"
                      />
                    </div>
                    <button type="submit" className="px-2.5 py-1.5 bg-white text-[#d35f1a] text-xs rounded-lg hover:bg-white/90 font-bold">Tìm</button>
                    <button type="button" onClick={() => { setSearchOpen(false); setTrackingCode(""); }} className="p-1.5 text-white/70 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <button onClick={() => setSearchOpen(true)} className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors">
                    <Search className="w-4 h-4" />
                  </button>
                )}

                {/* Phone */}
                <a href="tel:1900xxxx" className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-white/90 hover:text-white transition-colors px-2">
                  <Phone className="w-3.5 h-3.5" />
                  1900-ALE-FARMS
                </a>

                {/* Cart */}
                <Link to="/cart" className="relative p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-[#d35f1a] text-[9px] rounded-full flex items-center justify-center font-bold">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </Link>

                {/* Profile — đã đăng nhập / chưa đăng nhập */}
                <div className="relative">
                  {user ? (
                    <>
                      <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className="flex items-center gap-1 p-1.5 hover:bg-white/15 rounded-lg transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="hidden lg:block text-xs font-medium text-white/90 max-w-[60px] truncate">
                          {user?.name?.split(" ").slice(-1)[0]}
                        </span>
                      </button>
                      {profileMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                            <div className="text-xs text-gray-500">{user?.email}</div>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4" /> Đăng xuất
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#d35f1a] rounded-lg text-xs font-bold hover:bg-white/90 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      Đăng nhập
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-6 py-3 text-sm font-medium border-b border-gray-50 ${
                  isActive(link.to) ? "text-[#7C2D12] bg-[#7C2D12]/5" : "text-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-50">
              <a href="#" className="text-blue-600"><FacebookIcon /></a>
              <a href="#" className="text-blue-500"><ZaloIcon /></a>
              <a href="#" className="text-gray-900"><TiktokIcon /></a>
              <a href="#" className="text-orange-500"><ShopeeIcon /></a>
            </div>
            <div className="flex items-center justify-between px-6 py-3">
              <a href="tel:1900xxxx" className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-[#d35f1a]" /> 1900-ALE-FARMS
              </a>
              <div className="flex items-center gap-2">
                <Link to="/cart" className="relative p-2">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#d35f1a] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {itemCount}
                    </span>
                  )}
                </Link>
                {user ? (
                  <button onClick={handleLogout} className="p-2 text-red-500">
                    <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 bg-[#d35f1a] text-white rounded-lg text-xs font-bold"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main><Outlet /></main>

      {/* Footer */}
      <footer id="contact" className="bg-[#1C0A00] text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.png" alt="ALE Farm's" className="w-8 h-8 rounded-lg object-cover" />                <span className="font-bold text-[#D4A853]">ALE Farm's</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Đặc sản thịt hun khói từ núi rừng Tây Bắc. Chế biến theo phương pháp truyền thống, chất lượng không khoan nhượng.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors"><FacebookIcon /></a>
                <a href="#" className="text-gray-400 hover:text-blue-300 transition-colors"><ZaloIcon /></a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><TiktokIcon /></a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors"><ShopeeIcon /></a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/products?category=buffalo" className="hover:text-[#D4A853]">Thịt gác bếp</Link></li>
                <li><Link to="/products?category=pork"    className="hover:text-[#D4A853]">Thịt hun khói</Link></li>
                <li><Link to="/products?category=sausage" className="hover:text-[#D4A853]">Gia vị</Link></li>
                <li><Link to="/products?category=poultry" className="hover:text-[#D4A853]">Gia cầm</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#D4A853]">Theo dõi đơn hàng</a></li>
                <li><a href="#" className="hover:text-[#D4A853]">Chính sách vận chuyển</a></li>
                <li><a href="#" className="hover:text-[#D4A853]">Đổi trả hàng</a></li>
                <li><a href="#" className="hover:text-[#D4A853]">Câu hỏi thường gặp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Phone className="w-3 h-3" /> 1900-ALE-FARMS</li>
                <li>Zalo: 0901234567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs text-gray-500">
            © 2026 ALE Farm's. Đạt chứng nhận An toàn Thực phẩm VSATTP. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
}