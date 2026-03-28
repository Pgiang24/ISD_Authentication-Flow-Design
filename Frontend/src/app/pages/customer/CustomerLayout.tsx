import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Phone, X, LogOut, User, Menu, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.52V6.77a4.85 4.85 0 01-1.02-.08z"/>
  </svg>
);

const SOCIAL_LINKS = {
  facebook:  "https://www.facebook.com/share/1FrY7AXvcV/?mibextid=wwXIfr",
  instagram: "https://www.instagram.com/ale_farm.vn",
  tiktok:    "https://www.tiktok.com/@ale_farms_dayy",
};

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { itemCount, items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [trackingCode, setTrackingCode] = useState("");
  const [searchOpen, setSearchOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ name: string; image: string } | null>(null);
  const prevCountRef = useRef(itemCount);

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      const lastItem = items[items.length - 1];
      if (lastItem) {
        setToast({ name: lastItem.product.name, image: lastItem.product.image });
        setTimeout(() => setToast(null), 3000);
      }
    }
    prevCountRef.current = itemCount;
  }, [itemCount, items]);

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

        {/* HÀNG 1 */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                  <img src="/images/logo.jpg" alt="ALE Farm's" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-extrabold text-[#7C2D12] leading-tight text-base tracking-tight">ALE Farm's</div>
                  <div className="text-[10px] text-gray-400 leading-none">Đặc Sản Thịt Hun Khói</div>
                </div>
              </Link>

              <div className="hidden sm:flex items-center gap-1">
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" title="Facebook"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <FacebookIcon />
                </a>
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" title="Instagram"
                  className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                  <InstagramIcon />
                </a>
                <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok"
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <TiktokIcon />
                </a>
              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 hover:bg-gray-100 rounded-xl">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* HÀNG 2: cam */}
        <div className="bg-[#d35f1a] hidden sm:block">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              <nav className="flex items-center">
                {navLinks.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <Link key={link.label} to={link.to}
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

              <div className="flex items-center gap-1">
                {searchOpen ? (
                  <form onSubmit={handleTrack} className="flex items-center gap-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
                      <input autoFocus type="text" value={trackingCode}
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

                <a href="tel:1900xxxx" className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-white/90 hover:text-white transition-colors px-2">
                  <Phone className="w-3.5 h-3.5" />
                  1900-ALE-FARMS
                </a>

                <Link to="/cart" className="relative p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-[#d35f1a] text-[9px] rounded-full flex items-center justify-center font-bold">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  {user ? (
                    <>
                      <button onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className="flex items-center gap-1 p-1.5 hover:bg-white/15 rounded-lg transition-colors">
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
                          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4" /> Đăng xuất
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link to="/login" className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#d35f1a] rounded-lg text-xs font-bold hover:bg-white/90 transition-colors">
                      <User className="w-3.5 h-3.5" />
                      Đăng nhập
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} onClick={() => setMobileMenuOpen(false)}
                className={`block px-6 py-3 text-sm font-medium border-b border-gray-50 ${
                  isActive(link.to) ? "text-[#7C2D12] bg-[#7C2D12]/5" : "text-gray-700"
                }`}>
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-50">
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600"><FacebookIcon /></a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600"><InstagramIcon /></a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-900"><TiktokIcon /></a>
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
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-1.5 bg-[#d35f1a] text-white rounded-lg text-xs font-bold">
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
                <img src="/images/logo.jpg" alt="ALE Farm's" className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-bold text-[#D4A853]">ALE Farm's</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Đặc sản thịt hun khói từ núi rừng Tây Bắc. Chế biến theo phương pháp truyền thống, chất lượng không khoan nhượng.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors"><FacebookIcon /></a>
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-400 transition-colors"><InstagramIcon /></a>
                <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"><TiktokIcon /></a>
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
                <li><a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A853]">Facebook: ALE Farm's</a></li>
                <li><a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A853]">Instagram: @ale_farm.vn</a></li>
                <li><a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A853]">TikTok: @ale_farms_dayy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs text-gray-500">
            © 2026 ALE Farm's. Đạt chứng nhận An toàn Thực phẩm VSATTP. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>

      {/* Toast thêm giỏ hàng */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3 max-w-xs">
            <img
              src={toast.image}
              alt={toast.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-600">Đã thêm vào giỏ</span>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">{toast.name}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}