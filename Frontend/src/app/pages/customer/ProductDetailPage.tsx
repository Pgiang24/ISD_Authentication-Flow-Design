import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Star, ShoppingCart, Zap, Clock, Shield, Leaf, ChevronLeft, Check, Tag, Plus, Minus } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice, Product, ProductVariant } from "../../data/products";
import { apiFetch } from "../../lib/api";
import { useProduct } from "../../hooks/useProduct";
import { useProducts } from "../../hooks/useProducts";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const { product, loading, error } = useProduct(id);
  const { products } = useProducts();

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity]               = useState(1);
  const [selectedImage, setSelectedImage]     = useState(0);
  const [promoInput, setPromoInput]           = useState("");
  const [promoMsg, setPromoMsg]               = useState<{ text: string; ok: boolean } | null>(null);
  const [added, setAdded]                     = useState(false);

  // Reviews state
  const [reviews, setReviews]               = useState<any[]>([]);
  const [reviewLoading, setReviewLoading]   = useState(true);
  const [myRating, setMyRating]             = useState(5);
  const [myComment, setMyComment]           = useState("");
  const [submitting, setSubmitting]         = useState(false);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    apiFetch<any[]>(`/api/products/${id}/reviews`)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setReviewLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-[#d35f1a] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        {error || "Không tìm thấy sản phẩm"}
      </h2>
      <Link to="/products" className="text-[#7C2D12] hover:underline">
        Quay lại cửa hàng
      </Link>
    </div>
  );

  const variant = product.variants[selectedVariant];
  const inStock = variant.stock > 0;

  const relatedProducts = products
    .filter((p: Product) => p.id !== product.id && (p.category === product.category || p.featured))
    .slice(0, 3);

  const handleAddToCart = () => {
    addToCart(product, variant.weight, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, variant.weight, quantity);
    navigate("/cart");
  };

  const checkPromo = () => {
    const valid: Record<string, number> = { ALEFARMS10: 10, WELCOME20: 20, SUMMER15: 15 };
    const upper = promoInput.toUpperCase();
    if (valid[upper]) {
      setPromoMsg({ text: `Code applied! ${valid[upper]}% discount at checkout`, ok: true });
    } else {
      setPromoMsg({ text: "Invalid promo code. Try ALEFARMS10", ok: false });
    }
  };

  const handleSubmitReview = async () => {
    if (!myComment.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/products/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          userId:  user?.id || null,
          rating:  myRating,
          comment: myComment,
        }),
      });
      const updated = await apiFetch<any[]>(`/api/products/${id}/reviews`);
      setReviews(updated);
      setMyComment("");
      setMyRating(5);
    } catch {
      alert("Có lỗi xảy ra, thử lại nhé!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/products" className="hover:text-[#7C2D12] flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Tất cả sản phẩm
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square">
            <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-[#7C2D12]" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {product.tags.map((tag: string) => tag && (
                <span key={tag} className="px-2.5 py-0.5 bg-[#7C2D12]/10 text-[#7C2D12] text-xs rounded-full font-medium capitalize">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-200"}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
              <span className="text-sm text-gray-500">
                ({product.reviews > 0 ? `${product.reviews} đánh giá` : "Chưa có đánh giá"})
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="p-4 bg-[#FAF7F2] rounded-2xl">
            <div className="text-3xl font-bold text-[#7C2D12]">{formatPrice(variant.price)}</div>
            <div className="text-sm text-gray-500 mt-1">{variant.weight}</div>
          </div>

          {/* Weight Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Chọn khối lượng</label>
            <div className="flex gap-2 flex-wrap">
              {product.variants.map((v: ProductVariant, i: number) => (
                <button
                  key={v.weight}
                  onClick={() => setSelectedVariant(i)}
                  disabled={v.stock === 0}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selectedVariant === i
                      ? "border-[#7C2D12] bg-[#7C2D12] text-white"
                      : v.stock === 0
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 text-gray-700 hover:border-[#7C2D12] hover:text-[#7C2D12]"
                  }`}
                >
                  {v.weight}
                  {v.stock === 0 && <span className="ml-1 text-xs opacity-70">(Hết)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Số lượng</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-[#7C2D12] hover:text-[#7C2D12] transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(variant.stock, quantity + 1))}
                disabled={quantity >= variant.stock}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-[#7C2D12] hover:text-[#7C2D12] transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {inStock ? `Còn ${variant.stock} sản phẩm` : "Hết hàng"}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                added
                  ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                  : inStock
                  ? "bg-white border-[#7C2D12] text-[#7C2D12] hover:bg-[#7C2D12] hover:text-white"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? "Đã thêm!" : "Thêm vào giỏ"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                inStock ? "bg-[#7C2D12] text-white hover:bg-[#6B2510] active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Zap className="w-4 h-4" /> Mua ngay
            </button>
          </div>

          {/* Promo Code */}
          <div className="p-4 bg-[#D4A853]/10 border border-[#D4A853]/30 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-[#D4A853]" />
              <span className="text-sm font-semibold text-gray-700">Bạn có mã giảm giá?</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Nhập mã (vd: ALEFARMS10)"
                className="flex-1 px-3 py-2 rounded-xl border border-[#D4A853]/30 bg-white text-sm outline-none focus:border-[#D4A853]"
              />
              <button onClick={checkPromo} className="px-4 py-2 bg-[#D4A853] text-white rounded-xl text-sm font-medium hover:bg-[#C19442] transition-colors">
                Áp dụng
              </button>
            </div>
            {promoMsg && (
              <p className={`text-xs mt-2 ${promoMsg.ok ? "text-[#2D6A4F]" : "text-red-500"}`}>{promoMsg.text}</p>
            )}
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Clock,  label: "Chế biến",   value: product.preparationTime || "Thủ công" },
              { icon: Shield, label: "Chứng nhận", value: "VSATTP" },
              { icon: Leaf,   label: "Tự nhiên",   value: "Không phụ gia" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                <Icon className="w-5 h-5 text-[#7C2D12] mx-auto mb-1" />
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-xs font-medium text-gray-700 mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description + Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Về sản phẩm</h2>
          <p className="text-gray-600 leading-relaxed">{product.longDescription || product.description}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Chứng nhận</h2>
          <div className="space-y-2">
            {product.certifications.map((c: string) => (
              <div key={c} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#2D6A4F]" />
                </div>
                <span className="text-sm text-gray-700">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          Đánh giá ({reviews.length})
        </h2>

        {/* Form viết đánh giá */}
        {user ? (
          <div className="mb-6 p-4 bg-[#FAF7F2] rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-3">Viết đánh giá của bạn</p>
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map((star) => (
                <button key={star} onClick={() => setMyRating(star)}>
                  <Star className={`w-6 h-6 transition-colors ${star <= myRating ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-300 hover:text-[#D4A853]"}`} />
                </button>
              ))}
              <span className="text-sm text-gray-500 ml-2 self-center">{myRating}/5</span>
            </div>
            <textarea
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#7C2D12] resize-none"
            />
            <button
              onClick={handleSubmitReview}
              disabled={submitting || !myComment.trim()}
              className="mt-2 px-6 py-2.5 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center border border-dashed border-gray-200">
            <p className="text-sm text-gray-500">
              <Link to="/login" className="text-[#7C2D12] font-semibold hover:underline">Đăng nhập</Link>
              {" "}để viết đánh giá sản phẩm
            </p>
          </div>
        )}

        {/* Danh sách reviews */}
        {reviewLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            Chưa có đánh giá nào. Hãy là người đầu tiên! 🌟
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.review_id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-[#7C2D12]/10 flex items-center justify-center flex-shrink-0 font-bold text-[#7C2D12] text-sm">
                  {r.user_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{r.user_name || "Ẩn danh"}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex gap-0.5 my-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-200"}`} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{r.rating}/5</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Có thể bạn cũng thích</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedProducts.map((p: Product) => {
              const v   = p.variants[0];
              const inS = p.variants.some((pv: ProductVariant) => pv.stock > 0);
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                  <img src={p.image} alt={p.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#7C2D12] transition-colors">{p.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-[#7C2D12]">{formatPrice(v.price)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${inS ? "bg-[#2D6A4F]/10 text-[#2D6A4F]" : "bg-gray-100 text-gray-500"}`}>
                        {inS ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}