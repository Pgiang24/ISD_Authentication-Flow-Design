import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../data/products";
import { useState } from "react";

const PROMO_CODES: Record<string, number> = {
  ALEFARMS10: 10,
  WELCOME20:  20,
  SUMMER15:   15,
};

const FREE_SHIP_THRESHOLD = 500000;

export default function CartPage() {
  const { t } = useTranslation();
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [promoInput, setPromoInput]   = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; percent: number } | null>(null);
  const [promoMsg, setPromoMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  const applyPromo = () => {
    const upper = promoInput.trim().toUpperCase();
    if (PROMO_CODES[upper]) {
      setPromoApplied({ code: upper, percent: PROMO_CODES[upper] });
      setPromoMsg({ text: `Áp dụng thành công! Giảm ${PROMO_CODES[upper]}%`, ok: true });
    } else {
      setPromoMsg({ text: "Mã không hợp lệ. Thử ALEFARMS10", ok: false });
      setPromoApplied(null);
    }
  };

  const discount     = promoApplied ? Math.round(total * promoApplied.percent / 100) : 0;
  const afterDiscount = total - discount;
  const isFreeShip   = afterDiscount >= FREE_SHIP_THRESHOLD;
  const finalTotal   = afterDiscount;

  const handleCheckout = () => {
    if (!user) { navigate("/login"); return; }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("cart.empty")}</h2>
        <p className="text-gray-500 mb-8">{t("cart.emptyDesc")}</p>
        <Link to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#7C2D12] text-white rounded-full font-semibold hover:bg-[#6B2510] transition-colors">
          {t("cart.continueShopping")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("cart.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} {t("cart.items")}</p>
        </div>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 hover:underline transition-colors">
          Xoá tất cả
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Danh sách sản phẩm */}
        <div className="flex-1 space-y-4">
          {items.map((item) => {
            const variant = item.product.variants.find((v) => v.weight === item.selectedWeight) || item.product.variants[0];
            return (
              <div key={`${item.product.id}-${item.selectedWeight}`}
                className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100">
                <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                  <img src={item.product.image} alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/product/${item.product.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-[#7C2D12] transition-colors leading-snug">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{item.selectedWeight}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id, item.selectedWeight)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedWeight, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedWeight, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#d35f1a]">
                        {formatPrice(variant.price * item.quantity)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-gray-400">{formatPrice(variant.price)} / sp</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tiếp tục mua */}
          <div className="pt-2">
            <Link to="/products" className="inline-flex items-center gap-2 text-sm text-[#7C2D12] hover:underline font-medium">
              ← {t("cart.continueShopping")}
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24 space-y-4">

            {/* Promo code */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-[#D4A853]" />
                <span className="text-sm font-semibold text-gray-700">{t("cart.promo")}</span>
              </div>
              {promoApplied ? (
                <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-sm font-semibold text-green-700">{promoApplied.code} (-{promoApplied.percent}%)</span>
                  <button onClick={() => { setPromoApplied(null); setPromoMsg(null); setPromoInput(""); }}
                    className="text-xs text-red-500 hover:underline">Xoá</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    placeholder="Nhập mã giảm giá..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#D4A853]"
                  />
                  <button onClick={applyPromo}
                    className="px-3 py-2 bg-[#D4A853] text-white rounded-xl text-sm font-medium hover:bg-[#C19442] transition-colors">
                    {t("cart.apply")}
                  </button>
                </div>
              )}
              {promoMsg && (
                <p className={`text-xs mt-1.5 ${promoMsg.ok ? "text-green-600" : "text-red-500"}`}>{promoMsg.text}</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("cart.subtotal")}</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá ({promoApplied?.percent}%)</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("cart.shipping")}</span>
                <span className={isFreeShip ? "text-green-600 font-semibold" : "font-medium"}>
                  {isFreeShip ? t("cart.freeShip") : formatPrice(30000)}
                </span>
              </div>

              {!isFreeShip && (
                <div className="p-2.5 bg-[#FAF7F2] rounded-xl">
                  <p className="text-xs text-gray-500 text-center">
                    {t("cart.addMore")} — còn {formatPrice(FREE_SHIP_THRESHOLD - afterDiscount)}
                  </p>
                  <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#d35f1a] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (afterDiscount / FREE_SHIP_THRESHOLD) * 100)}%` }} />
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">{t("cart.total")}</span>
                <span className="font-bold text-[#d35f1a] text-lg">
                  {formatPrice(isFreeShip ? finalTotal : finalTotal + 30000)}
                </span>
              </div>
            </div>

            <button onClick={handleCheckout}
              className="w-full py-3.5 bg-[#7C2D12] hover:bg-[#6B2510] text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
              {t("cart.checkout")} <ArrowRight className="w-4 h-4" />
            </button>

            {!user && (
              <p className="text-xs text-center text-gray-400">
                Bạn cần <Link to="/login" className="text-[#7C2D12] font-semibold hover:underline">đăng nhập</Link> để thanh toán
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}