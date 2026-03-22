import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Star, ShoppingCart, ChevronRight, ArrowRight,
  ChevronDown, Flame, MapPin, ShieldCheck, Clock,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../hooks/useProducts";
import { formatPrice, Product, ComboItem } from "../../data/products";

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const defaultVariant = product.variants[0];
  const inStock = product.variants.some((v) => v.stock > 0);
  const [comboOpen, setComboOpen] = useState(false);

  if (!defaultVariant) return null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100">
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {!inStock && (
            <span className="px-2.5 py-1 bg-gray-800/80 text-white text-xs rounded-full font-medium">Hết hàng</span>
          )}
          {product.isCombo && (
            <span className="px-2.5 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">Combo</span>
          )}
          {product.tags.includes("bestseller") && inStock && !product.isCombo && (
            <span className="px-2.5 py-1 bg-[#d35f1a] text-white text-xs rounded-full font-medium">Bán chạy</span>
          )}
          {product.tags.includes("premium") && inStock && !product.isCombo && (
            <span className="px-2.5 py-1 bg-[#D4A853] text-white text-xs rounded-full font-medium">Cao cấp</span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-[#d35f1a] transition-colors leading-snug">
            {product.name}
          </h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        </Link>

        {/* Rating + số đánh giá */}
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-200"}`}
            />
          ))}
          <span className="text-xs font-semibold text-gray-700 ml-0.5">{product.rating}</span>
          <span className="text-xs text-gray-400">
            ({product.reviews > 0 ? `${product.reviews} đánh giá` : "Chưa có"})
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="font-bold text-[#d35f1a] text-lg">{formatPrice(defaultVariant.price)}</div>
            <div className="text-xs text-gray-400">{defaultVariant.weight}</div>
          </div>
          <button
            onClick={() => inStock && addToCart(product, defaultVariant.weight)}
            disabled={!inStock}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              inStock
                ? "bg-[#d35f1a] text-white hover:bg-[#c05518] active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm</span>
          </button>
        </div>

        {product.isCombo && product.comboItems && product.comboItems.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <button
              onClick={() => setComboOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors"
            >
              <span>Xem {product.comboItems.length} món trong combo</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${comboOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${comboOpen ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
              <div className="space-y-2">
                {product.comboItems.map((item: ComboItem, idx: number) => (
                  <div key={item.id} className="flex items-start gap-3 p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                    <img
                      src={item.image || product.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                        {item.price > 0 && (
                          <span className="text-xs font-bold text-[#d35f1a] flex-shrink-0">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>
                      {item.weight && (
                        <div className="text-xs text-purple-600 font-medium mt-0.5">{item.weight}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {product.comboItems.some((c: ComboItem) => c.price > 0) && (
                <div className="mt-2 p-2 bg-[#d35f1a]/10 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">
                    Tổng:{" "}
                    <span className="line-through text-gray-400">
                      {formatPrice(product.comboItems.reduce((s: number, c: ComboItem) => s + c.price, 0))}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-[#d35f1a]">
                    Combo: {formatPrice(defaultVariant.price)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const featuredProducts = products.filter((p: Product) => p.featured).slice(0, 3);

  return (
    <div>

      {/* 1. HERO */}
      <section className="relative overflow-hidden min-h-[520px] flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1750512705099-9273d6d50df8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600"
          alt="Thịt hun khói ALE Farm's"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div
          className="relative z-10 mx-4 my-12 px-8 py-8 rounded-2xl text-center max-w-md"
          style={{ background: "rgba(211, 95, 26, 0.80)" }}
        >
          <p className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-2">Đặc sản Tây Bắc</p>
          <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3 uppercase tracking-tight">
            <span className="text-[#ffe0c8]">Thịt hun khói<br />đích thực,</span><br />
            <span className="text-white">bạn sẽ mê ngay</span>
          </h1>
          <p className="text-white/80 text-sm leading-relaxed mb-6">
            Chế biến thủ công, hun khói chậm bằng củi tự nhiên.<br />Không chất bảo quản, không cắt xén.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/products")}
              className="px-8 py-3 bg-white text-[#d35f1a] rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:bg-[#fff5ee] active:scale-95"
            >
              Mua ngay
            </button>
            <a
              href="#featured"
              className="px-8 py-3 border-2 border-white/70 text-white rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:bg-white/15 active:scale-95"
            >
              Xem nổi bật
            </a>
          </div>
        </div>
      </section>

      {/* 2. 4 THÔNG SỐ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            {[
              { icon: Flame,       label: "Hun khói chậm", value: "12 giờ",      sub: "Giữ trọn hương vị tự nhiên", color: "text-orange-500 bg-orange-50" },
              { icon: MapPin,      label: "Nguồn gốc",      value: "Tây Bắc",    sub: "Thịt tươi từ vùng núi cao",  color: "text-[#2D6A4F] bg-emerald-50" },
              { icon: ShieldCheck, label: "Chứng nhận",     value: "VSATTP",     sub: "An toàn thực phẩm đảm bảo", color: "text-blue-600 bg-blue-50"      },
              { icon: Clock,       label: "Giao hàng",      value: "2 – 4 ngày", sub: "Miễn phí đơn từ 500K",       color: "text-[#D4A853] bg-amber-50"   },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="flex items-center gap-4 px-6 py-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</div>
                  <div className="font-black text-gray-900 text-base leading-tight">{value}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. VỀ CHÚNG TÔI */}
      <section id="about" className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1761054522074-1055ffd67616?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
          alt="Trang trại ALE"
          className="w-full h-56 md:h-64 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C0A00]/88 via-[#1C0A00]/55 to-transparent flex items-center">
          <div className="max-w-6xl mx-auto px-6 md:px-10 w-full">
            <div className="max-w-xs md:max-w-sm">
              <p className="text-[#D4A853] text-[10px] font-bold uppercase tracking-widest mb-2">Thành lập 2010</p>
              <h2 className="text-white font-black text-2xl md:text-3xl mb-2 leading-tight">
                Từ núi rừng Tây Bắc<br />đến bàn ăn của bạn
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                Trang trại thả vườn trên vùng cao, chế biến thủ công — mỗi sản phẩm là câu chuyện chân thực của núi rừng.
              </p>
              <button className="px-5 py-2 bg-white text-[#1C0A00] rounded-full text-xs font-bold hover:bg-gray-100 transition-colors uppercase tracking-wide">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 3 BANNER */}
      <section className="bg-[#FAF7F2] py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
              <img src="https://images.unsplash.com/photo-1757967708227-c67e37e7c96a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div className="self-end w-11 h-11 bg-[#D4A853] rounded-full flex flex-col items-center justify-center text-white font-black leading-tight shadow-lg text-center">
                  <span className="text-[6px] leading-none">MUA 2</span>
                  <span className="text-[9px] leading-none">TẶNG</span>
                  <span className="text-[6px] leading-none">1 FREE</span>
                </div>
                <div>
                  <h3 className="text-white text-xl font-black leading-tight mb-1">Đặc Sản<br />Tây Bắc</h3>
                  <p className="text-white/70 text-xs mb-3">Thịt hun khói truyền thống</p>
                  <Link to="/products" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#7C2D12] rounded-full text-xs font-bold uppercase tracking-wide hover:bg-[#fff5ee] transition-colors">
                    Đặt ngay <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
              <img src="https://images.unsplash.com/photo-1674066620885-6220ec2857f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <span className="inline-block mb-2 px-2.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full w-fit uppercase tracking-wide">Combo đặc biệt</span>
                <h3 className="text-white text-xl font-black leading-tight mb-1">Mỹ Vị<br />Nhân Gian</h3>
                <p className="text-white/70 text-xs mb-3">Trọn bộ 5 vị tinh tuyển</p>
                <Link to="/products?category=sausage" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#7C2D12] rounded-full text-xs font-bold uppercase tracking-wide hover:bg-[#fff5ee] transition-colors w-fit">
                  Xem combo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
              <img src="https://images.unsplash.com/photo-1586816001966-79b736744398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <span className="inline-block mb-2 px-2.5 py-0.5 bg-[#2D6A4F] text-white text-[10px] font-bold rounded-full w-fit uppercase tracking-wide">Miễn phí vận chuyển</span>
                <h3 className="text-white text-xl font-black leading-tight mb-1">Free Ship<br />Toàn Quốc</h3>
                <p className="text-white/70 text-xs mb-3">Đơn hàng từ 500.000đ</p>
                <Link to="/products" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#7C2D12] rounded-full text-xs font-bold uppercase tracking-wide hover:bg-[#fff5ee] transition-colors w-fit">
                  Mua ngay <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SẢN PHẨM NỔI BẬT */}
      <section id="featured" className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[#d35f1a] italic text-sm font-medium mb-1">Đặc sản của chúng tôi</p>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">SẢN PHẨM NỔI BẬT</h2>
          </div>
          <Link to="/products" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#7C2D12] hover:text-[#6B2510] transition-colors">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="w-full h-52 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-8 bg-gray-200 rounded-xl w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {featuredProducts.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#7C2D12] hover:bg-[#6B2510] text-white rounded-full font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-[#7C2D12]/20"
          >
            Xem tất cả sản phẩm <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}