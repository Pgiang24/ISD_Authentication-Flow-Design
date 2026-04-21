import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Star, ShoppingCart, Zap, Clock, Shield, Leaf, ChevronLeft, Check, Tag, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice, Product, ProductVariant } from "../../data/products";
import { apiFetch } from "../../lib/api";
import { useProduct } from "../../hooks/useProduct";
import { useProducts } from "../../hooks/useProducts";
import { useProductLang } from "../../hooks/useProductLang";

// FIX BUG 2: type cho can-review response
interface CanReviewResponse {
  canReview: boolean;
  reason?: 'not_logged_in' | 'not_purchased' | 'already_reviewed';
  alreadyReviewed: boolean;
}

export default function ProductDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { t, i18n } = useTranslation();
  const { addToCart }= useCart();
  const { user }     = useAuth();

  const { product, loading, error } = useProduct(id);
  const { products } = useProducts();
  const { pName, pDesc, pLongDesc } = useProductLang(product);

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity]               = useState(1);
  const [selectedImage, setSelectedImage]     = useState(0);
  const [promoInput, setPromoInput]           = useState("");
  const [promoMsg, setPromoMsg]               = useState<{ text: string; ok: boolean } | null>(null);
  const [added, setAdded]                     = useState(false);

  const [reviews, setReviews]             = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [myRating, setMyRating]           = useState(5);
  const [myComment, setMyComment]         = useState("");
  const [submitting, setSubmitting]       = useState(false);

  // FIX BUG 2: state cho purchased verification
  const [canReviewInfo, setCanReviewInfo] = useState<CanReviewResponse | null>(null);
  const [canReviewLoading, setCanReviewLoading] = useState(false);

  // Load reviews
  useEffect(() => {
    if (!id) return;
    apiFetch<any[]>(`/api/products/${id}/reviews`)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setReviewLoading(false));
  }, [id]);

  // FIX BUG 2: load can-review status khi user đã đăng nhập
  useEffect(() => {
    if (!id || !user) {
      setCanReviewInfo(null);
      return;
    }
    setCanReviewLoading(true);
    apiFetch<CanReviewResponse>(`/api/products/${id}/reviews/can-review`)
      .then(setCanReviewInfo)
      .catch(() => setCanReviewInfo({ canReview: false, reason: 'not_purchased', alreadyReviewed: false }))
      .finally(() => setCanReviewLoading(false));
  }, [id, user]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-[#d35f1a] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        {error || t("product.notFound")}
      </h2>
      <Link to="/products" className="text-[#7C2D12] hover:underline">
        {t("product.backToStore")}
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
    navigate("/checkout");
  };

  const checkPromo = () => {
    const valid: Record<string, number> = { ALEFARMS10: 10, WELCOME20: 20, SUMMER15: 15 };
    const upper = promoInput.trim().toUpperCase();
    if (!upper) { setPromoMsg({ text: "Vui lòng nhập mã giảm giá.", ok: false }); return; }
    if (valid[upper]) {
      setPromoMsg({ text: `Áp dụng thành công! Giảm ${valid[upper]}% khi thanh toán`, ok: true });
    } else {
      setPromoMsg({ text: "Mã giảm giá không hợp lệ.", ok: false });
    }
  };

  const handleSubmitReview = async () => {
    if (!myComment.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/products/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: myRating, comment: myComment }),
      });
      const updated = await apiFetch<any[]>(`/api/products/${id}/reviews`);
      setReviews(updated);
      setMyComment(""); setMyRating(5);
      // Cập nhật lại can-review sau khi submit thành công
      setCanReviewInfo({ canReview: false, reason: 'already_reviewed', alreadyReviewed: true });
    } catch (err: any) {
      alert(err.message || t("product.reviewError"));
    } finally {
      setSubmitting(false);
    }
  };

  const formatReviewDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "en" ? "en-US" : "vi-VN"
    );
  };

  // FIX BUG 2: render đúng UI cho phần review dựa trên canReviewInfo
  const renderReviewForm = () => {
    // Chưa đăng nhập
    if (!user) {
      return (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">
            <Link to="/login" className="text-[#7C2D12] font-semibold hover:underline">
              {t("product.loginToReview")}
            </Link>
            {t("product.loginToReviewSuffix")}
          </p>
        </div>
      );
    }

    // Đang kiểm tra quyền
    if (canReviewLoading) {
      return (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#d35f1a] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Đang kiểm tra...</span>
          </div>
        </div>
      );
    }

    // Đã review rồi
    if (canReviewInfo?.alreadyReviewed) {
      return (
        <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">Bạn đã đánh giá sản phẩm này. Cảm ơn bạn!</p>
          </div>
        </div>
      );
    }

    // Chưa mua sản phẩm này
    if (canReviewInfo?.reason === 'not_purchased') {
      return (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Chỉ khách hàng đã mua mới có thể đánh giá</p>
              <p className="text-xs text-amber-700 mt-1">
                Đánh giá chỉ dành cho những người đã mua và nhận sản phẩm này.
              </p>
              <Link to="/products"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#7C2D12] font-semibold hover:underline">
                <ShoppingCart className="w-3.5 h-3.5" /> Mua sản phẩm này
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // canReview === true → hiện form
    if (canReviewInfo?.canReview) {
      return (
        <div className="mb-6 p-4 bg-[#FAF7F2] rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-3">{t("product.writeReview")}</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setMyRating(star)}>
                <Star className={`w-6 h-6 transition-colors ${star <= myRating ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-300 hover:text-[#D4A853]"}`} />
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-2 self-center">{myRating}/5</span>
          </div>
          <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)}
            placeholder={t("product.reviewPlaceholder")} rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#7C2D12] resize-none" />
          <button onClick={handleSubmitReview} disabled={submitting || !myComment.trim()}
            className="mt-2 px-6 py-2.5 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510] disabled:opacity-50 transition-colors">
            {submitting ? t("product.submitting") : t("product.submitReview")}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/products" className="hover:text-[#7C2D12] flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> {t("product.breadcrumbAll")}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{pName}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square">
            <img src={product.images[selectedImage]} alt={pName} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img: string, i: number) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-[#7C2D12]" : "border-transparent"}`}>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{pName}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-[#D4A853] text-[#D4A853]" : "text-gray-200"}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
              <span className="text-sm text-gray-500">
                ({product.reviews > 0
                  ? `${product.reviews} ${t("product.reviews")}`
                  : t("product.noReview")
                })
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
            <label className="text-sm font-semibold text-gray-700 mb-2 block">{t("product.selectWeight")}</label>
            <div className="flex gap-2 flex-wrap">
              {product.variants.map((v: ProductVariant, i: number) => (
                <button key={v.weight} onClick={() => setSelectedVariant(i)} disabled={v.stock === 0}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selectedVariant === i ? "border-[#7C2D12] bg-[#7C2D12] text-white"
                    : v.stock === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-200 text-gray-700 hover:border-[#7C2D12] hover:text-[#7C2D12]"
                  }`}>
                  {v.weight}
                  {v.stock === 0 && <span className="ml-1 text-xs opacity-70">{t("product.outOfStockVariant")}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">{t("product.quantity")}</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-[#7C2D12] hover:text-[#7C2D12] transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-gray-900">{quantity}</span>
              <button onClick={() => { if (quantity < variant.stock) setQuantity(quantity + 1); }}
                disabled={quantity >= variant.stock}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-[#7C2D12] hover:text-[#7C2D12] transition-colors disabled:opacity-40">
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {inStock
                  ? t("product.stockLeft", { count: variant.stock })
                  : t("product.outOfStock")
                }
              </span>
            </div>
            {quantity >= variant.stock && inStock && (
              <p className="text-xs text-red-500 mt-1.5">{t("product.maxStockError")}</p>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button onClick={handleAddToCart} disabled={!inStock}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                added ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                : inStock ? "bg-white border-[#7C2D12] text-[#7C2D12] hover:bg-[#7C2D12] hover:text-white"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}>
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? t("product.added") : t("product.addToCartFull")}
            </button>
            <button onClick={handleBuyNow} disabled={!inStock}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                inStock ? "bg-[#7C2D12] text-white hover:bg-[#6B2510] active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}>
              <Zap className="w-4 h-4" /> {t("product.buyNow")}
            </button>
          </div>

          {/* Promo Code */}
          <div className="p-4 bg-[#D4A853]/10 border border-[#D4A853]/30 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-[#D4A853]" />
              <span className="text-sm font-semibold text-gray-700">{t("product.promoTitle")}</span>
            </div>
            <div className="flex gap-2">
              <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value)}
                placeholder={t("product.promoPlaceholder")}
                className="flex-1 px-3 py-2 rounded-xl border border-[#D4A853]/30 bg-white text-sm outline-none focus:border-[#D4A853]" />
              <button onClick={checkPromo} className="px-4 py-2 bg-[#D4A853] text-white rounded-xl text-sm font-medium hover:bg-[#C19442] transition-colors">
                {t("product.promoApply")}
              </button>
            </div>
            {promoMsg && (
              <p className={`text-xs mt-2 ${promoMsg.ok ? "text-[#2D6A4F]" : "text-red-500"}`}>{promoMsg.text}</p>
            )}
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Clock,  label: t("product.preparation"), value: product.preparationTime || t("product.natural") },
              { icon: Shield, label: t("product.certifications"), value: "VSATTP" },
              { icon: Leaf,   label: t("product.natural"),  value: t("product.naturalVal") },
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

      {/* ── Description + Certifications ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t("product.aboutProduct")}</h2>
          <p className="text-gray-600 leading-relaxed">{pLongDesc}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t("product.certifications")}</h2>
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

      {/* ── Reviews ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {t("product.reviewsTitle", { count: reviews.length })}
        </h2>

        {/* FIX BUG 2: form review được render bởi renderReviewForm() với đầy đủ logic */}
        {renderReviewForm()}

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
          <p className="text-gray-400 text-sm text-center py-8">{t("product.noReviews")}</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.review_id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-[#7C2D12]/10 flex items-center justify-center flex-shrink-0 font-bold text-[#7C2D12] text-sm">
                  {r.user_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {r.user_name || t("product.anonymous")}
                    </span>
                    <span className="text-xs text-gray-400">{formatReviewDate(r.created_at)}</span>
                  </div>
                  <div className="flex gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
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

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5">{t("product.relatedProducts")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedProducts.map((p: Product) => {
              const v   = p.variants[0];
              const inS = p.variants.some((pv: ProductVariant) => pv.stock > 0);
              const rName = i18n.language === "en"
                ? ((p as any).nameEn || p.name)
                : p.name;
              return (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                  <img src={p.image} alt={rName} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#7C2D12] transition-colors">{rName}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-[#7C2D12]">{formatPrice(v.price)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${inS ? "bg-[#2D6A4F]/10 text-[#2D6A4F]" : "bg-gray-100 text-gray-500"}`}>
                        {inS ? t("product.inStock") : t("product.outOfStock")}
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