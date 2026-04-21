import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, CreditCard, Truck, CheckCircle, AlertTriangle, X, MapPin, Plus, Star } from "lucide-react";
import AddressFields from "../../components/AddressFields";
import { apiFetch } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../data/products";

// FIX BUG 1: đổi type PaymentMethod để khớp với backend
// Backend check: paymentMethod === 'bank' || === 'card' → 'Bank Transfer', else → 'COD'
// Dùng 'bank_transfer' để rõ ràng, và cập nhật logic gửi lên backend
type PaymentMethod = "cod" | "bank_transfer";

interface SavedAddress {
  address_id: number;
  label:      string;
  full_name:  string;
  phone:      string;
  address:    string;
  district:   string;
  city:       string;
  ward:       string | null;
  is_default: boolean;
}

export default function CheckoutPage() {
  const { items, total, discount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [step, setStep]                   = useState<1 | 2>(1);
  const [loading, setLoading]             = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddr, setLoadingAddr]       = useState(true);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress]   = useState(false);

  const [form, setForm] = useState({
    fullName: user?.name || "", phone: user?.phone || "", email: user?.email || "",
    address: "", city: "", district: "", ward: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved addresses
  useEffect(() => {
    apiFetch<SavedAddress[]>("/api/addresses")
      .then((data) => {
        setSavedAddresses(data);
        const def = data.find((a) => a.is_default);
        if (def) { setSelectedAddrId(def.address_id); setUseNewAddress(false); }
        else if (data.length === 0) setUseNewAddress(true);
      })
      .catch(() => setUseNewAddress(true))
      .finally(() => setLoadingAddr(false));
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: "" }));
  };

  const activeAddress = () => {
    if (!useNewAddress && selectedAddrId) {
      const a = savedAddresses.find((x) => x.address_id === selectedAddrId);
      if (a) return { name: a.full_name, phone: a.phone, addr: a.address, city: a.city, district: a.district };
    }
    if (useNewAddress) return { name: form.fullName, phone: form.phone, addr: form.address, city: form.city, district: form.district };
    return null;
  };

  const validate = () => {
    if (!useNewAddress && selectedAddrId) return true;
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (!form.phone.trim())    errs.phone    = "Vui lòng nhập số điện thoại";
    if (!form.address.trim())  errs.address  = "Vui lòng nhập số nhà, tên đường";
    if (!form.city.trim())     errs.city     = "Vui lòng chọn tỉnh/thành phố";
    if (!form.district.trim()) errs.district = "Vui lòng chọn quận/huyện";
    if (!form.ward.trim())     errs.ward     = "Vui lòng chọn phường/xã";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleContinue = () => { if (validate()) setStep(2); };

  const handlePlaceOrder = async () => {
    setLoading(true); setPlaceOrderError(null);
    try {
      const addr = activeAddress();
      if (!addr) throw new Error("Vui lòng chọn hoặc nhập địa chỉ giao hàng.");

      const orderItems = items.map((item) => ({
        productId: item.product.id,
        name:      item.product.name,
        weight:    item.selectedWeight,
        qty:       item.quantity,
        price:     item.product.variants.find((v) => v.weight === item.selectedWeight)?.price || item.product.basePrice,
      }));

      // FIX BUG 1: truyền paymentMethod đúng value lên backend
      // 'bank_transfer' → backend nhận và map sang 'Bank Transfer'
      // 'cod' → backend map sang 'COD'
      const data = await apiFetch<{ orderCode: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          userId: user?.id || null,
          customer: addr.name, phone: addr.phone,
          email: form.email || user?.email || "",
          address: `${addr.addr}, ${addr.district}, ${addr.city}`,
          city: addr.city, district: addr.district,
          deliveryNotes: form.notes,
          items: orderItems, total: grandTotal,
          paymentMethod, // 'cod' | 'bank_transfer'
          channelId: 1,
        }),
      });

      clearCart();
      navigate("/order-confirmation", {
        state: { orderCode: data.orderCode, paymentMethod, form: { ...form, ...addr }, total: grandTotal },
      });
    } catch (err: any) {
      setPlaceOrderError(err.message || "Không thể đặt hàng. Vui lòng thử lại.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const subtotal   = items.reduce((sum, i) => {
    const price = i.product.variants.find((v) => v.weight === i.selectedWeight)?.price || i.product.basePrice;
    return sum + price * i.quantity;
  }, 0);
  const shipping   = subtotal >= 500000 ? 0 : 30000;
  const grandTotal = subtotal * (1 - discount) + shipping;
  const sel        = activeAddress();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => step === 2 ? setStep(1) : navigate("/cart")}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ChevronLeft className="w-5 h-5" /> Quay lại
        </button>
        <div className="flex items-center gap-3">
          {[{ n: 1, label: "Giao hàng" }, { n: 2, label: "Thanh toán" }].map(({ n, label }) => (
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

      {/* Error banner */}
      {placeOrderError && (
        <div className="flex items-start justify-between gap-3 px-4 py-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Không thể đặt hàng</p>
              <p>{placeOrderError}</p>
            </div>
          </div>
          <button onClick={() => setPlaceOrderError(null)} className="p-1 hover:bg-red-100 rounded-lg flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {step === 1 ? (
            <div className="space-y-4">

              {/* ── Saved addresses ── */}
              {loadingAddr ? (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                  <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
                  {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl mb-3" />)}
                </div>
              ) : savedAddresses.length > 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#7C2D12]" /> Địa chỉ đã lưu
                  </h2>
                  <div className="space-y-3">
                    {savedAddresses.map((a) => (
                      <label key={a.address_id}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddrId === a.address_id && !useNewAddress
                            ? "border-[#7C2D12] bg-[#7C2D12]/5" : "border-gray-100 hover:border-gray-200"
                        }`}>
                        <input type="radio" name="addr" checked={selectedAddrId === a.address_id && !useNewAddress}
                          onChange={() => { setSelectedAddrId(a.address_id); setUseNewAddress(false); }}
                          className="mt-1 accent-[#7C2D12]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{a.label}</span>
                            {a.is_default && (
                              <span className="flex items-center gap-1 text-xs bg-[#7C2D12]/10 text-[#7C2D12] px-2 py-0.5 rounded-full font-medium">
                                <Star className="w-3 h-3 fill-current" /> Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 mt-0.5">{a.full_name} · {a.phone}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {[a.address, a.district, a.city].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </label>
                    ))}
                    {/* Nhập địa chỉ mới */}
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      useNewAddress ? "border-[#7C2D12] bg-[#7C2D12]/5" : "border-gray-100 hover:border-gray-200"
                    }`}>
                      <input type="radio" name="addr" checked={useNewAddress}
                        onChange={() => { setUseNewAddress(true); setSelectedAddrId(null); }}
                        className="accent-[#7C2D12]" />
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#7C2D12]" />
                        <span className="text-sm font-medium text-[#7C2D12]">Dùng địa chỉ khác</span>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Quản lý địa chỉ tại{" "}
                    <a href="/settings" className="text-[#7C2D12] underline">Cài đặt tài khoản</a>
                  </p>
                </div>
              ) : null}

              {/* ── Manual form ── */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#7C2D12]" />
                    {savedAddresses.length > 0 ? "Địa chỉ giao hàng mới" : "Thông tin giao hàng"}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { f: "fullName", lbl: "Họ và tên *", ph: "Nguyen Van A" },
                      { f: "phone",    lbl: "Số điện thoại *", ph: "09xxxxxxxx" },
                    ].map(({ f, lbl, ph }) => (
                      <div key={f}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{lbl}</label>
                        <input value={(form as any)[f]} onChange={set(f)} placeholder={ph}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${(errors as any)[f] ? "border-red-400" : "border-gray-200"}`} />
                        {(errors as any)[f] && <p className="text-xs text-red-500 mt-1">{(errors as any)[f]}</p>}
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input value={form.email} onChange={set("email")} type="email" placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Số nhà, tên đường <span className="text-red-500">*</span></label>
                      <input value={form.address} onChange={set("address")} placeholder="VD: 123 Đường Láng"
                        className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 ${errors.address ? "border-red-400" : "border-gray-200"}`} />
                      {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                    </div>
                    <div className="col-span-2">
                      <AddressFields
                        value={{ city: form.city, district: form.district, ward: form.ward, address: "" }}
                        onChange={(val) => setForm(f => ({ ...f, city: val.city, district: val.district, ward: val.ward }))}
                        errors={{ city: errors.city, district: errors.district, ward: errors.ward }}
                        showStreet={false}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú giao hàng (tuỳ chọn)</label>
                      <textarea value={form.notes} onChange={set("notes")} rows={2}
                        placeholder="Để trước cửa, gọi trước khi giao…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:bg-white focus:border-[#7C2D12] resize-none" />
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleContinue}
                className="w-full py-4 bg-[#d35f1a] hover:bg-[#c05518] text-white rounded-xl font-bold transition-all active:scale-95">
                Tiếp tục đến thanh toán
              </button>
            </div>

          ) : (
            /* ── Step 2: Payment ── */
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#7C2D12]" /> Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {/* FIX BUG 1: value 'cod' và 'bank_transfer' — khớp với type PaymentMethod */}
                {[
                  {
                    v: "cod" as const,
                    emoji: "💵",
                    title: "Thanh toán khi nhận hàng (COD)",
                    sub: "Trả tiền mặt khi nhận hàng",
                  },
                  {
                    v: "bank_transfer" as const,
                    emoji: "📱",
                    title: "Chuyển khoản / QR Code",
                    sub: "Quét mã QR — thanh toán ngay, xác nhận tức thì",
                  },
                ].map(({ v, emoji, title, sub }) => (
                  <label key={v} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === v ? "border-[#7C2D12] bg-[#7C2D12]/5" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" checked={paymentMethod === v} onChange={() => setPaymentMethod(v)} className="accent-[#7C2D12]" />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{title}</div>
                        <div className="text-xs text-gray-500">{sub}</div>
                      </div>
                    </div>
                  </label>
                ))}

                {paymentMethod === "bank_transfer" && (
                  <div className="ml-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm">
                    <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
                      📱 Thanh toán QR / Chuyển khoản
                    </div>
                    <p className="text-blue-700 text-xs">Mã QR sẽ hiển thị ngay sau khi đặt hàng. Quét để thanh toán tức thì và đơn hàng được xác nhận ngay.</p>
                  </div>
                )}
              </div>

              {sel && (
                <div className="mt-5 p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-700 mb-1">Giao đến:</div>
                  <div className="text-sm text-gray-600">{sel.name} · {sel.phone}</div>
                  <div className="text-sm text-gray-500">{[sel.addr, sel.district, sel.city].filter(Boolean).join(", ")}</div>
                </div>
              )}

              <button onClick={handlePlaceOrder} disabled={loading}
                className="mt-6 w-full py-4 bg-[#d35f1a] hover:bg-[#c05518] text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? "Đang đặt hàng…" : `Đặt hàng · ${formatPrice(grandTotal)}`}
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Đơn hàng của bạn ({items.length})</h3>
            <div className="space-y-3 max-h-56 overflow-y-auto">
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
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm text-[#2D6A4F]"><span>Giảm giá</span><span>-{formatPrice(subtotal * discount)}</span></div>}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vận chuyển</span>
                <span className={shipping === 0 ? "text-[#2D6A4F]" : ""}>{shipping === 0 ? "MIỄN PHÍ" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Tổng cộng</span><span className="text-[#7C2D12]">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}