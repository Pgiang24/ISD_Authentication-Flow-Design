import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Package, Truck, Home, CheckCircle, Clock, XCircle,
  ChevronDown, ChevronUp, MapPin, CreditCard, Copy,
  RefreshCw, ShoppingBag, AlertTriangle, Search,
} from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../data/products";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem { name: string; name_en?: string; qty: number; price: number; weight: string; image?: string; }
interface Order {
  id: string; order_id: number; status: string; total: number;
  orderDate: string; updatedAt: string;
  recipient: string; phone: string; address: string; deliveryNotes?: string;
  paymentMethod: string; paymentStatus: string;
  tracking?: string; shippingCompany?: string; shippingStatus?: string;
  shipDate?: string; estimatedDelivery?: string;
  items: OrderItem[];
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  Pending:    { label: { vi: "Chờ xác nhận",  en: "Pending" },       color: "bg-amber-100 text-amber-700",   dot: "bg-amber-400"  },
  Confirmed:  { label: { vi: "Đã xác nhận",   en: "Confirmed" },     color: "bg-blue-100 text-blue-700",     dot: "bg-blue-400"   },
  Processing: { label: { vi: "Đang xử lý",    en: "Processing" },    color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  Shipped:    { label: { vi: "Đang giao",      en: "Shipped" },       color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
  Delivered:  { label: { vi: "Đã giao",        en: "Delivered" },     color: "bg-green-100 text-green-700",   dot: "bg-green-400"  },
  Cancelled:  { label: { vi: "Đã huỷ",         en: "Cancelled" },     color: "bg-red-100 text-red-700",       dot: "bg-red-400"    },
};

type StatusKey = keyof typeof STATUS;
const TIMELINE_STEPS: StatusKey[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
const STATUS_ORDER: Record<StatusKey, number> = { Pending: 0, Confirmed: 1, Processing: 2, Shipped: 3, Delivered: 4, Cancelled: -1 };

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const cfg = STATUS[status as StatusKey] || STATUS.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label[lang as "vi" | "en"] || status}
    </span>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
function OrderTimeline({ order, lang }: { order: Order; lang: string }) {
  if (order.status === "Cancelled") {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-600 font-medium">
          {lang === "vi" ? "Đơn hàng đã bị huỷ" : "This order has been cancelled"}
        </p>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[order.status as StatusKey] ?? 0;

  const steps = [
    { key: "Pending",    icon: Clock,        vi: "Đặt hàng",       en: "Order Placed" },
    { key: "Confirmed",  icon: CheckCircle,  vi: "Xác nhận",       en: "Confirmed" },
    { key: "Processing", icon: Package,      vi: "Đóng gói",       en: "Packing" },
    { key: "Shipped",    icon: Truck,        vi: "Đang giao",      en: "Shipped" },
    { key: "Delivered",  icon: Home,         vi: "Đã giao",        en: "Delivered" },
  ];

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-200" />
      <div className="space-y-4">
        {steps.map((step, i) => {
          const done    = i <= currentIdx;
          const current = i === currentIdx;
          const Icon    = step.icon;
          return (
            <div key={step.key} className="flex items-center gap-4 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                done    ? current ? "bg-[#7C2D12] text-white ring-4 ring-[#7C2D12]/20" : "bg-[#2D6A4F] text-white"
                : "bg-white border-2 border-gray-200 text-gray-300"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${done ? current ? "text-[#7C2D12]" : "text-[#2D6A4F]" : "text-gray-400"}`}>
                  {lang === "vi" ? step.vi : step.en}
                </p>
                {/* Hiện thông tin shipping khi đang giao */}
                {step.key === "Shipped" && done && order.tracking && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.shippingCompany} · {lang === "vi" ? "Mã vận đơn:" : "Tracking:"} <span className="font-mono font-semibold">{order.tracking}</span>
                  </p>
                )}
                {step.key === "Shipped" && done && order.estimatedDelivery && (
                  <p className="text-xs text-gray-400">
                    {lang === "vi" ? "Dự kiến:" : "Est."} {new Date(order.estimatedDelivery).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, lang }: { order: Order; lang: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dateStr = new Date(order.orderDate).toLocaleDateString(
    lang === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "short", year: "numeric" }
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={copy} className="flex items-center gap-1.5 group">
              <span className="font-bold text-gray-900 text-sm font-mono">{order.id}</span>
              <Copy className={`w-3.5 h-3.5 transition-colors ${copied ? "text-[#2D6A4F]" : "text-gray-300 group-hover:text-gray-500"}`} />
            </button>
            <StatusBadge status={order.status} lang={lang} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{dateStr}</p>
          {/* Items preview */}
          <p className="text-xs text-gray-500 mt-1 truncate">
            {order.items.slice(0, 2).map(i => `${lang === "vi" ? i.name : (i.name_en || i.name)} x${i.qty}`).join(", ")}
            {order.items.length > 2 && ` +${order.items.length - 2} ${lang === "vi" ? "khác" : "more"}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-[#7C2D12]">{formatPrice(order.total)}</div>
          <button onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto">
            {expanded ? (lang === "vi" ? "Thu gọn" : "Collapse") : (lang === "vi" ? "Chi tiết" : "Details")}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left: Timeline */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                {lang === "vi" ? "Trạng thái đơn hàng" : "Order Status"}
              </h4>
              <OrderTimeline order={order} lang={lang} />
            </div>

            {/* Right: Info */}
            <div className="space-y-4">
              {/* Delivery info */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {lang === "vi" ? "Thông tin giao hàng" : "Delivery Info"}
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0">👤</div>
                    <span className="text-gray-700">{order.recipient} · {order.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{order.address}</span>
                  </div>
                  {order.deliveryNotes && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0">📝</div>
                      <span className="text-gray-500 italic">{order.deliveryNotes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {lang === "vi" ? "Thanh toán" : "Payment"}
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{order.paymentMethod}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    order.paymentStatus === "Paid" ? "bg-green-100 text-green-700" :
                    order.paymentStatus === "Failed" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{order.paymentStatus}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {lang === "vi" ? "Sản phẩm" : "Items"}
                </h4>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.image ? (
                        <img src={`/images/${item.image}`} alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {lang === "vi" ? item.name : (item.name_en || item.name)}
                        </p>
                        <p className="text-xs text-gray-400">{item.weight} · x{item.qty}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#7C2D12] flex-shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{lang === "vi" ? "Tổng cộng" : "Total"}</span>
                  <span className="font-bold text-[#7C2D12]">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Track by code (guest + logged-in) ────────────────────────────────────────
function TrackForm({ lang }: { lang: string }) {
  const [code,    setCode]    = useState("");
  const [result,  setResult]  = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await apiFetch<Order>(`/api/orders/track/${code.trim().toUpperCase()}`);
      setResult(data);
    } catch (err: any) {
      setError(lang === "vi" ? "Không tìm thấy đơn hàng. Kiểm tra lại mã đơn." : "Order not found. Please check your order code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-900 mb-3 text-sm">
        {lang === "vi" ? "Tra cứu theo mã đơn" : "Track by order code"}
      </h3>
      <form onSubmit={handleTrack} className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)}
          placeholder={lang === "vi" ? "VD: ALE-ORDER-021" : "e.g. ALE-ORDER-021"}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all font-mono" />
        <button type="submit" disabled={loading || !code.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510] disabled:opacity-60 transition-colors">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
          {lang === "vi" ? "Tìm" : "Search"}
        </button>
      </form>
      {error && (
        <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {result && (
        <div className="mt-4">
          <OrderCard order={result} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language === "en" ? "en" : "vi";

  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("all");

  const TABS = [
    { key: "all",       vi: "Tất cả",         en: "All" },
    { key: "Pending",   vi: "Chờ xác nhận",   en: "Pending" },
    { key: "Shipped",   vi: "Đang giao",       en: "In Transit" },
    { key: "Delivered", vi: "Đã giao",         en: "Delivered" },
    { key: "Cancelled", vi: "Đã huỷ",          en: "Cancelled" },
  ];

  const fetchOrders = async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<Order[]>("/api/orders/my");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(lang === "vi" ? "Không thể tải đơn hàng. Vui lòng thử lại." : "Could not load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchOrders(); else setLoading(false); }, [user]);

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {lang === "vi" ? "Đơn hàng của tôi" : "My Orders"}
          </h1>
          {user && (
            <p className="text-gray-500 text-sm mt-1">
              {lang === "vi" ? `Xin chào, ${user.name}` : `Hello, ${user.name}`}
            </p>
          )}
        </div>
        {user && (
          <button onClick={fetchOrders} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {lang === "vi" ? "Làm mới" : "Refresh"}
          </button>
        )}
      </div>

      {/* Track box — luôn hiện */}
      <div className="mb-6">
        <TrackForm lang={lang} />
      </div>

      {/* Order list — chỉ khi đã đăng nhập */}
      {!user ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">
            {lang === "vi" ? "Đăng nhập để xem lịch sử đơn hàng của bạn" : "Log in to view your order history"}
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510] transition-colors">
            {lang === "vi" ? "Đăng nhập" : "Log In"}
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
            {TABS.map((tab) => {
              const count = tab.key === "all" ? orders.length : orders.filter((o) => o.status === tab.key).length;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    activeTab === tab.key
                      ? "bg-[#7C2D12] text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-[#7C2D12] hover:text-[#7C2D12]"
                  }`}>
                  {lang === "vi" ? tab.vi : tab.en}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-48 bg-gray-100 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
              <button onClick={fetchOrders} className="ml-auto underline font-medium">{lang === "vi" ? "Thử lại" : "Retry"}</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">
                {lang === "vi" ? "Chưa có đơn hàng nào" : "No orders yet"}
              </p>
              <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d35f1a] text-white rounded-xl text-sm font-semibold hover:bg-[#c05518] transition-colors">
                {lang === "vi" ? "Mua ngay" : "Shop Now"}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} lang={lang} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}