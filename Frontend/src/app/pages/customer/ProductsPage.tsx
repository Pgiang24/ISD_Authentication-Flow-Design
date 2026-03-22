import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { Star, ShoppingCart, Filter, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { formatPrice, Product } from "../../data/products";
import { useCart } from "../../context/CartContext";

type Category = "all" | "pork" | "buffalo" | "poultry" | "sausage";

const CATEGORIES = [
  { key: "all",     label: "Tất cả" },
  { key: "buffalo", label: "Thịt gác bếp" },
  { key: "pork",    label: "Thịt hun khói" },
  { key: "sausage", label: "Gia vị" },
  { key: "poultry", label: "Gia cầm" },
];

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const defaultVariant = product.variants[0];
  const inStock = product.variants.some((v) => v.stock > 0);
  const [comboOpen, setComboOpen] = useState(false);

  if (!defaultVariant) return null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col">
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden flex-shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
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

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-[#d35f1a] transition-colors leading-snug text-sm">
            {product.name}
          </h3>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        </Link>

        {/* Rating + số đánh giá */}
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-200"}`}
            />
          ))}
          <span className="text-xs font-semibold text-gray-700 ml-0.5">{product.rating}</span>
          <span className="text-xs text-gray-400">
            ({product.reviews > 0 ? `${product.reviews} đánh giá` : "Chưa có"})
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="font-bold text-[#d35f1a]">{formatPrice(defaultVariant.price)}</div>
            <div className="text-xs text-gray-400">{defaultVariant.weight}</div>
          </div>
          <button
            onClick={() => inStock && addToCart(product, defaultVariant.weight)}
            disabled={!inStock}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              inStock
                ? "bg-[#d35f1a] text-white hover:bg-[#c05518] active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Thêm
          </button>
        </div>

        {/* Accordion combo */}
        {product.isCombo && product.comboItems && product.comboItems.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setComboOpen((prev) => !prev);
              }}
              className="w-full flex items-center justify-between text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
            >
              <span>Xem {product.comboItems.length} món trong combo</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${comboOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${comboOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
              <div className="space-y-1.5">
                {product.comboItems.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-gray-800 leading-snug">{item.name}</span>
                        {item.price > 0 && (
                          <span className="text-[10px] font-bold text-[#d35f1a] flex-shrink-0">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>
                      {item.weight && (
                        <div className="text-[10px] text-purple-600 font-medium mt-0.5">{item.weight}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {product.comboItems.some((c) => c.price > 0) && (
                <div className="mt-1.5 p-1.5 bg-[#d35f1a]/10 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 line-through">
                    {formatPrice(product.comboItems.reduce((s, c) => s + c.price, 0))}
                  </span>
                  <span className="text-xs font-bold text-[#d35f1a]">
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

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = (searchParams.get("category") as Category) || "all";
  const [category, setCategory]           = useState<Category>(initialCategory);
  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [sortBy, setSortBy]               = useState("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { products, loading, error } = useProducts();

  const allWeights = useMemo(() => {
    const weights = new Set<string>();
    products.forEach((p) => p.variants.forEach((v) => weights.add(v.weight)));
    return Array.from(weights);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => category === "all" || p.category === category);
    if (selectedWeights.length > 0)
      list = list.filter((p) => p.variants.some((v) => selectedWeights.includes(v.weight)));
    if (sortBy === "price-asc")       list = [...list].sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.basePrice - a.basePrice);
    else if (sortBy === "rating")     list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [products, category, selectedWeights, sortBy]);

  const toggleWeight = (w: string) =>
    setSelectedWeights((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]);

  const clearAll = () => { setCategory("all"); setSelectedWeights([]); };
  const hasFilter = category !== "all" || selectedWeights.length > 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-10 h-10 border-4 border-[#d35f1a] border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Đang tải sản phẩm...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="text-4xl">⚠️</div>
      <p className="font-semibold text-gray-700">Không thể tải sản phẩm</p>
      <p className="text-sm text-red-500">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-2 px-5 py-2 bg-[#7C2D12] text-white rounded-full text-sm font-semibold hover:bg-[#6B2510]">
        Thử lại
      </button>
    </div>
  );

  const FilterPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4" /> Bộ lọc
        </h3>
        {hasFilter && (
          <button onClick={clearAll} className="text-xs text-[#7C2D12] hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Xoá lọc
          </button>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Danh mục</h4>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key as Category)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                category === cat.key ? "bg-[#7C2D12] text-white font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-xs ${category === cat.key ? "text-white/70" : "text-gray-400"}`}>
                {cat.key === "all" ? products.length : products.filter((p) => p.category === cat.key).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      {allWeights.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Khối lượng</h4>
          <div className="flex flex-wrap gap-2">
            {allWeights.map((w) => (
              <button
                key={w}
                onClick={() => toggleWeight(w)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedWeights.includes(w)
                    ? "bg-[#7C2D12] text-white border-[#7C2D12]"
                    : "border-gray-200 text-gray-600 hover:border-[#7C2D12] hover:text-[#7C2D12]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-[#D4A853] italic text-sm font-medium mb-1">Khám phá & Mua sắm</p>
          <h1 className="text-3xl font-black text-gray-900">Tất cả sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} sản phẩm đặc sản Tây Bắc</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-0">
          <div className="flex gap-2 overflow-x-auto pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key as Category)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  category === cat.key ? "bg-[#d35f1a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.label}
                <span className={`ml-1.5 text-xs ${category === cat.key ? "text-white/75" : "text-gray-400"}`}>
                  ({cat.key === "all" ? products.length : products.filter((p) => p.category === cat.key).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#7C2D12] transition-all"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
                  {hasFilter && <span className="w-2 h-2 bg-[#7C2D12] rounded-full" />}
                </button>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{filtered.length}</span> sản phẩm
                  {hasFilter && (
                    <button onClick={clearAll} className="ml-2 text-[#7C2D12] hover:underline text-xs">Xoá lọc</button>
                  )}
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-[#7C2D12] flex-shrink-0"
              >
                <option value="featured">Nổi bật</option>
                <option value="rating">Đánh giá cao</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
              </select>
            </div>

            {hasFilter && (
              <div className="flex flex-wrap gap-2 mb-4">
                {category !== "all" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-[#7C2D12]/10 text-[#7C2D12] text-xs font-medium rounded-full">
                    {CATEGORIES.find((c) => c.key === category)?.label}
                    <button onClick={() => setCategory("all")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedWeights.map((w) => (
                  <span key={w} className="flex items-center gap-1.5 px-3 py-1 bg-[#7C2D12]/10 text-[#7C2D12] text-xs font-medium rounded-full">
                    {w}
                    <button onClick={() => toggleWeight(w)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-500">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-semibold text-gray-700 text-lg mb-1">Không có sản phẩm phù hợp</p>
                <p className="text-sm text-gray-400 mb-4">Thử thay đổi bộ lọc hoặc danh mục khác</p>
                <button onClick={clearAll} className="px-6 py-2.5 bg-[#7C2D12] text-white rounded-full text-sm font-semibold hover:bg-[#6B2510] transition-colors">
                  Xoá bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <span className="font-bold text-gray-900 text-lg">Bộ lọc</span>
              <button onClick={() => setMobileFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full mt-6 py-3.5 bg-[#7C2D12] text-white rounded-xl font-semibold hover:bg-[#6B2510] transition-colors"
            >
              Xem {filtered.length} sản phẩm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}