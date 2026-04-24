import { useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Search, X, Star, ShoppingCart, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useCart } from "../../context/CartContext";
import { useProductLang } from "../../hooks/useProductLang";
import { formatPrice, Product, ProductVariant } from "../../data/products";

// ── Categories (dùng slug từ DB) ─────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "all",              label: "Tất cả",          labelEn: "All" },
  { value: "dried-smoked-meat",label: "Thịt gác bếp",    labelEn: "Dried Smoked Meat" },
  { value: "smoked-meat",      label: "Thịt hun khói",   labelEn: "Smoked Meat" },
  { value: "sausage",          label: "Lạp xưởng",      labelEn: "Sausage" },
  { value: "spices-sauces",    label: "Gia vị",          labelEn: "Spices & Sauces" },
  { value: "combo-sets",       label: "Combo",           labelEn: "Combo Sets" },
];

const SORT_OPTIONS = [
  { value: "featured",   labelVi: "Nổi bật",          labelEn: "Featured"     },
  { value: "rating",     labelVi: "Đánh giá cao nhất", labelEn: "Top Rated"    },
  { value: "price-asc",  labelVi: "Giá: Thấp → Cao",  labelEn: "Price: Low → High" },
  { value: "price-desc", labelVi: "Giá: Cao → Thấp",  labelEn: "Price: High → Low" },
];

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const { i18n, t }  = useTranslation();
  const { addToCart }= useCart();
  const { pName }    = useProductLang(product);
  const [added,      setAdded] = useState(false);

  const variant = product.variants[0];
  const inStock = product.variants.some((v: ProductVariant) => v.stock > 0);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    addToCart(product, variant.weight, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link to={`/product/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col">
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <img src={product.image} alt={pName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.tag && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#7C2D12] text-white text-xs font-bold rounded-full">
            {product.tag}
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
              {t("product.outOfStock")}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-[#7C2D12] transition-colors leading-snug line-clamp-2">
          {pName}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-200"}`} />
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <div className="font-bold text-[#7C2D12] text-lg">{formatPrice(variant.price)}</div>
            <div className="text-xs text-gray-400">{variant.weight}</div>
          </div>
          <button onClick={handleAdd} disabled={!inStock}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              added    ? "bg-[#2D6A4F] text-white scale-110" :
              inStock  ? "bg-[#7C2D12]/10 text-[#7C2D12] hover:bg-[#7C2D12] hover:text-white" :
                         "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}>
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { t, i18n }               = useTranslation();
  const { products, loading, error, refetch } = useProducts();

  // Search state (US22)
  const [searchKeyword, setSearchKeyword] = useState("");
  const [category,      setCategory]      = useState("all");
  const [sortBy,        setSortBy]        = useState("featured");
  const [showFilters,   setShowFilters]   = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // BR02: maxlength 100
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 100); // AC10
    setSearchKeyword(val);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchKeyword("");
    searchRef.current?.focus(); // AC07: cursor back to input
  }, []);

  // ── Filter + Search + Sort (client-side, AC04 real-time) ─────────────────
  const filtered = useMemo(() => {
    let list = [...products];

    // BR05: chỉ active products (API đã filter, nhưng double-check)
    list = list.filter((p: Product) => p.is_active !== false);

    // Category filter (AC05: kết hợp với search)
    if (category !== "all") {
      list = list.filter((p: Product) =>
        p.category === category ||
        (p as any).categorySlug === category ||
        (p as any).category_slug === category
      );
    }

    // Search filter (BR03: case-insensitive, BR04: có dấu)
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      list = list.filter((p: Product) => {
        const nameVi = (p.name || "").toLowerCase();
        const nameEn = ((p as any).nameEn || (p as any).name_en || "").toLowerCase();
        return nameVi.includes(q) || nameEn.includes(q);
      });
    }

    // Sort
    switch (sortBy) {
      case "rating":     list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "price-asc":  list.sort((a, b) => a.variants[0].price - b.variants[0].price); break;
      case "price-desc": list.sort((a, b) => b.variants[0].price - a.variants[0].price); break;
      default:           list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }, [products, searchKeyword, category, sortBy]);

  const isVi = i18n.language !== "en";

  // ── Error state (AC11, BR11) ─────────────────────────────────────────────
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <p className="text-gray-700 font-medium mb-4">Không thể tải danh sách sản phẩm. Vui lòng thử lại.</p>
      <button onClick={refetch}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#7C2D12] text-white rounded-xl font-semibold hover:bg-[#6B2510]">
        <RefreshCw className="w-4 h-4" /> Thử lại
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isVi ? "Đặc sản Tây Bắc" : "Northwest Specialties"}
        </h1>
        {/* AC09: số lượng kết quả real-time */}
        <p className="text-sm text-gray-500 mt-1">
          {loading ? "Đang tải..." : `${filtered.length} sản phẩm`}
        </p>
      </div>

      {/* ── Search + Filter Bar ── */}
      {!loading && (
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            {/* Search input (US22) */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchKeyword}
                onChange={handleSearchChange}
                maxLength={100} // AC10
                placeholder={isVi ? "Tìm sản phẩm..." : "Search products..."}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/10 transition-all"
              />
              {/* AC07: clear button */}
              {searchKeyword && (
                <button onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle (mobile) */}
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showFilters ? "bg-[#7C2D12] text-white border-[#7C2D12]" : "bg-white text-gray-600 border-gray-200 hover:border-[#7C2D12]"
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Bộ lọc</span>
            </button>
          </div>

          {/* Filters row */}
          {(showFilters || window.innerWidth >= 640) && (
            <div className="flex flex-wrap gap-2">
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setCategory(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      category === opt.value
                        ? "bg-[#7C2D12] text-white border-[#7C2D12]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#7C2D12]"
                    }`}>
                    {isVi ? opt.label : opt.labelEn}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="ml-auto">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-600 outline-none focus:border-[#7C2D12] cursor-pointer">
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {isVi ? opt.labelVi : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* ── AC06: Empty state khi không có kết quả ── */}
      {!loading && filtered.length === 0 && products.length > 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm nào phù hợp.</h3>
          <p className="text-sm text-gray-500 mb-6">Vui lòng thử từ khóa khác hoặc xóa bớt bộ lọc.</p>
          <button
            onClick={() => { setSearchKeyword(""); setCategory("all"); }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510] transition-colors">
            <X className="w-4 h-4" /> Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}