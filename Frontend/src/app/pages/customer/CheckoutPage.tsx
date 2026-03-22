import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, CreditCard, Truck, CheckCircle } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../data/products";

type PaymentMethod = "bank" | "cod";

export default function CheckoutPage() {
  const { items, total, discount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    city: "",
    district: "",
    ward: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.address.trim()) errs.address = "Address is required";
    if (!form.city.trim()) errs.city = "City is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (validate()) setStep(2);
  };

  const handlePlaceOrder = async () => {
  setLoading(true);
  try {
    const orderItems = items.map((item) => ({
      productId: item.product.id,
      name:      item.product.name,
      weight:    item.selectedWeight,
      qty:       item.quantity,
      price:     item.product.variants.find((v) => v.weight === item.selectedWeight)?.price
                 || item.product.basePrice,
    }));

    const data = await apiFetch<{ orderCode: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        userId:        JSON.parse(localStorage.getItem("ale_farms_user") || "{}").id || null,
        customer:      form.fullName,
        phone:         form.phone,
        email:         form.email,
        address:       `${form.address}, ${form.district}, ${form.city}`,
        items:         orderItems,
        total:         grandTotal,
        paymentMethod,
        channelId:     1,
      }),
    });

    clearCart();
    navigate("/order-confirmation", {
      state: {
        orderCode: data.orderCode,
        paymentMethod,
        form,
        total: grandTotal,
      },
    });
  } catch (err: any) {
    alert(`Lỗi: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const subtotal = items.reduce((sum, i) => {
    const price = i.product.variants.find((v) => v.weight === i.selectedWeight)?.price || i.product.basePrice;
    return sum + price * i.quantity;
  }, 0);
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const grandTotal = subtotal * (1 - discount) + shipping;

  const InputField = ({
    label, field, type = "text", placeholder, required = false, half = false
  }: {
    label: string; field: string; type?: string; placeholder?: string; required?: boolean; half?: boolean;
  }) => (
    <div className={half ? "" : "col-span-2"}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={set(field)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${
          errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => step === 2 ? setStep(1) : navigate("/customer/cart")} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-3">
          {[{ n: 1, label: "Delivery" }, { n: 2, label: "Payment" }].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= n ? "bg-[#7C2D12] text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > n ? <CheckCircle className="w-4 h-4" /> : n}
              </div>
              <span className={`text-sm ${step >= n ? "text-gray-900 font-medium" : "text-gray-400"}`}>{label}</span>
              {n < 2 && <div className={`w-8 h-px ${step > n ? "bg-[#7C2D12]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {step === 1 ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#7C2D12]" /> Delivery Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Full Name" field="fullName" placeholder="Nguyen Van A" required />
                <InputField label="Phone Number" field="phone" type="tel" placeholder="09xx xxx xxx" required half />
                <InputField label="Email" field="email" type="email" placeholder="you@example.com" half />
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={set("address")}
                    placeholder="123 Main Street, Apt 4B"
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${errors.address ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  {["city", "district", "ward"].map((f, i) => (
                    <div key={f}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                        {f} {i === 0 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={(form as any)[f]}
                        onChange={set(f)}
                        placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                        className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${errors[f] ? "border-red-400" : "border-gray-200"}`}
                      />
                      {errors[f] && <p className="text-xs text-red-500 mt-1">{errors[f]}</p>}
                    </div>
                  ))}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={set("notes")}
                    rows={3}
                    placeholder="E.g. Leave at door, call before delivery..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] resize-none"
                  />
                </div>
              </div>
              <button
                onClick={handleContinue}
                className="mt-6 w-full py-4 bg-[#d35f1a] hover:bg-[#c05518] text-white rounded-xl font-bold transition-all active:scale-95"
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#7C2D12]" /> Payment Method
              </h2>

              <div className="space-y-3">
                {/* COD */}
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cod" ? "border-[#7C2D12] bg-[#7C2D12]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="accent-[#7C2D12]" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💵</span>
                    <div>
                      <div className="font-semibold text-gray-900">Cash on Delivery (COD)</div>
                      <div className="text-sm text-gray-500">Pay when you receive your order</div>
                    </div>
                  </div>
                </label>

                {/* Bank Transfer */}
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "bank" ? "border-[#7C2D12] bg-[#7C2D12]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="payment" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} className="accent-[#7C2D12]" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏦</span>
                    <div>
                      <div className="font-semibold text-gray-900">Bank Transfer</div>
                      <div className="text-sm text-gray-500">Transfer to our account — manual confirmation</div>
                    </div>
                  </div>
                </label>

                {paymentMethod === "bank" && (
                  <div className="ml-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm space-y-1">
                    <div className="font-semibold text-blue-800 mb-2">Bank Transfer Details</div>
                    <div><span className="text-gray-500">Bank:</span> <span className="font-medium">Vietcombank</span></div>
                    <div><span className="text-gray-500">Account:</span> <span className="font-medium">1234 5678 9012</span></div>
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">ALE FARMS JSC</span></div>
                    <div className="text-blue-600 text-xs mt-2">⚠ Include your order code as reference. We'll confirm within 2 hours.</div>
                  </div>
                )}
              </div>

              {/* Delivery summary */}
              <div className="mt-5 p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-700 mb-2">Delivery to:</div>
                <div className="text-sm text-gray-600">{form.fullName} • {form.phone}</div>
                <div className="text-sm text-gray-600">{form.address}, {form.district}, {form.city}</div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-6 w-full py-4 bg-[#d35f1a] hover:bg-[#c05518] text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {loading ? "Placing Order..." : `Place Order • ${formatPrice(grandTotal)}`}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Your Order ({items.length})</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map((item) => {
                const price = item.product.variants.find((v) => v.weight === item.selectedWeight)?.price || item.product.basePrice;
                return (
                  <div key={`${item.product.id}-${item.selectedWeight}`} className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-14 h-14 object-cover rounded-xl" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#7C2D12] text-white text-xs rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.product.name}</div>
                      <div className="text-xs text-gray-500">{item.selectedWeight}</div>
                      <div className="text-sm font-bold text-[#7C2D12]">{formatPrice(price * item.quantity)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-[#2D6A4F]">
                  <span>Discount</span>
                  <span>-{formatPrice(subtotal * discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={shipping === 0 ? "text-[#2D6A4F]" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-[#7C2D12]">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}