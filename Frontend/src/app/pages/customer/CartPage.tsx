import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus, Tag, ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../data/products";
import { useState } from "react";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, total, itemCount, promoCode, setPromoCode, discount } = useCart();
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState(promoCode);
  const [promoMsg, setPromoMsg] = useState<{ text: string; ok: boolean } | null>(
    promoCode ? { text: `Code "${promoCode.toUpperCase()}" applied — ${Math.round(discount * 100)}% off`, ok: true } : null
  );

  const subtotal = items.reduce((sum, i) => {
    const price = i.product.variants.find((v) => v.weight === i.selectedWeight)?.price || i.product.basePrice;
    return sum + price * i.quantity;
  }, 0);

  const handleApplyPromo = () => {
    setPromoCode(promoInput);
    const VALID: Record<string, number> = { ALEFARMS10: 10, WELCOME20: 20, SUMMER15: 15 };
    const upper = promoInput.toUpperCase();
    if (VALID[upper]) {
      setPromoMsg({ text: ` Code applied! ${VALID[upper]}% discount`, ok: true });
    } else if (promoInput === "") {
      setPromoMsg(null);
    } else {
      setPromoMsg({ text: " Invalid promo code. Try ALEFARMS10", ok: false });
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-[#7C2D12]/30" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#d35f1a] text-white rounded-xl font-semibold hover:bg-[#c05518] transition-all active:scale-95"
        >
          Continue Shopping <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
      <p className="text-gray-500 text-sm mb-8">{itemCount} item{itemCount !== 1 ? "s" : ""} in your cart</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.product.variants.find((v) => v.weight === item.selectedWeight)?.price || item.product.basePrice;
            return (
              <div
                key={`${item.product.id}-${item.selectedWeight}`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4"
              >
                <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/product/${item.product.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-[#7C2D12] transition-colors">{item.product.name}</h3>
                      </Link>
                      <span className="text-sm text-gray-500">{item.selectedWeight}</span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedWeight)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedWeight, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#7C2D12] hover:text-[#7C2D12] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedWeight, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#7C2D12] hover:text-[#7C2D12] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#7C2D12]">{formatPrice(price * item.quantity)}</div>
                      <div className="text-xs text-gray-400">{formatPrice(price)} each</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#7C2D12] hover:underline font-medium"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

            {/* Promo Code */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#D4A853]" /> Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="e.g. ALEFARMS10"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#7C2D12]"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-3 py-2 bg-[#D4A853] text-white rounded-xl text-sm font-medium hover:bg-[#C19442] transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoMsg && (
                <p className={`text-xs mt-1.5 ${promoMsg.ok ? "text-[#2D6A4F]" : "text-red-500"}`}>{promoMsg.text}</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-3 py-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#2D6A4F]">Discount ({Math.round(discount * 100)}%)</span>
                  <span className="text-[#2D6A4F] font-medium">-{formatPrice(subtotal * discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={subtotal >= 500000 ? "text-[#2D6A4F] font-medium" : "font-medium"}>
                  {subtotal >= 500000 ? "FREE" : formatPrice(30000)}
                </span>
              </div>
              {subtotal < 500000 && (
                <div className="text-xs text-gray-400 text-right">
                  Add {formatPrice(500000 - subtotal)} more for free shipping
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-[#7C2D12]">
                  {formatPrice(total + (subtotal < 500000 ? 30000 : 0))}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full py-4 bg-[#d35f1a] hover:bg-[#c05518] text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              Proceed to Checkout <ChevronRight className="w-5 h-5" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>🔒 Secure checkout</span>
              <span>•</span>
              <span>✅ VSATTP certified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}