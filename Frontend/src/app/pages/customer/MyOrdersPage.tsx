import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ShoppingBag, ChevronLeft, ChevronRight, X, AlertTriangle,
  RefreshCw, Package, Truck, Home, CheckCircle, Clock,
  XCircle, MapPin, CreditCard, Phone, FileText, ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import { formatPrice } from "../../data/products";

// ── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  name:      string;
  name_en?:  string;
  qty:       number;
  price:     number;
  weight:    string;
  image?:    string;
  product_id?: number;
}

interface Order {
  id:             string;
  order_id:       number;
  status:         string;
  total:          number;
  orderDate:      string;
  updatedAt:      string;
  recipient:      string;
  phone:          string;
  address:        string;
  deliveryNotes?: string;
  paymentMethod:  string;
  paymentStatus:  string;
  items:          OrderItem[];
}

// ── Config ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { label: string; labelVi: string; classes: string; icon: any }> = {
  Pending:    { label: "Pending",    labelVi: "Chờ xác nhận", classes: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock       },
  Confirmed:  { label: "Confirmed",  labelVi: "Đã xác nhận",  classes: "bg-blue-100 text-blue-700 border-blue-200",      icon: CheckCircle },
  Processing: { label: "Processing", labelVi: "Đang xử lý",   classes: "bg-purple-100 text-purple-700 border-purple-200",icon: Package     },
  Shipped:    { label: "Shipped",    labelVi: "Đang giao",     classes: "bg-indigo-100 text-indigo-700 border-indigo-200",icon: Truck       },
  Delivered:  { label: "Delivered",  labelVi: "Đã giao",       classes: "bg-green-100 text-green-700 border-green-200",   icon: Home        },
  Cancelled:  { label: "Cancelled",  labelVi: "Đã hủy",        classes: "bg-red-100 text-red-700 border-red-200",         icon: XCircle     },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  Pending:  { label: "Chờ thanh toán", classes: "text-amber-600 bg-amber-50"  },
  Paid:     { label: "Đã thanh toán",  classes: "text-green-600 bg-green-50"  },
  Failed:   { label: "Thất bại",       classes: "text-red-600 bg-red-50"      },
  Refunded: { label: "Đã hoàn tiền",   classes: "text-blue-600 bg-blue-50"    },
};

function normalizePaymentMethod(raw: string): string {
  const v = raw?.toLowerCase().trim();
  if (v === "bank transfer" || v === "bank_transfer" || v === "bank") return "Chuyển khoản/QR";
  if (v === "momo") return "MoMo";
  if (v === "zalopay") return "ZaloPay";
  if (v === "vnpay") return "VNPay";
  return "COD";
}

// ── Order Detail Drawer ──────────────────────────────────────────────────────
function OrderDrawer({
  order,
  onClose,
  onCancelled,
}: {
  order: Order;
  onClose: () => void;
  onCancelled: (id: number) => void;
}) {
  const [cancelling,    setCancelling]    = useState(false);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [cancelError,   setCancelError]   = useState<string | null>(null);

  const canCancel  = ["Pending", "Confirmed"].includes(order.status);
  const isShipping = ["Processing", "Shipped"].includes(order.status);

  const subtotal    = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping    = subtotal >= 500000 ? 0 : 30000;

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await apiFetch(`/api/orders/${order.order_id}/cancel`, { method: "PATCH" });
      onCancelled(order.order_id);
      setConfirmOpen(false);
      onClose();
    } catch (e: any) {
      setCancelError(e.message || "Không thể hủy đơn hàng lúc này. Vui lòng thử lại hoặc liên hệ CSKH.");
    } finally {
      setCancelling(false);
    }
  };

  // Timeline steps
  const steps = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
  const currentIdx = order.status === "Cancelled"
    ? -1
    : steps.indexOf(order.status);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <p className="text-sm text-[#7C2D12] font-mono font-semibold">{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Status + Date */}
          <div className="flex items-center justify-between">
            {(() => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
              const Icon = cfg.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.classes}`}>
                  <Icon className="w-3.5 h-3.5" /> {cfg.labelVi}
                </span>
              );
            })()}
            <span className="text-xs text-gray-400">
              {new Date(order.orderDate).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" })}
            </span>
          </div>

          {/* Timeline */}
          {order.status !== "Cancelled" ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Tiến trình đơn hàng</p>
              <div className="flex items-center gap-0">
                {steps.map((s, i) => {
                  const done    = i <= currentIdx;
                  const current = i === currentIdx;
                  const cfg     = STATUS_CONFIG[s];
                  const Icon    = cfg.icon;
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          current ? "bg-[#7C2D12] text-white ring-4 ring-[#7C2D12]/20" :
                          done    ? "bg-[#2D6A4F] text-white" : "bg-gray-200 text-gray-400"
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[9px] font-medium text-center leading-tight w-12 ${
                          current ? "text-[#7C2D12]" : done ? "text-[#2D6A4F]" : "text-gray-400"
                        }`}>{cfg.labelVi}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-5 mx-0.5 ${i < currentIdx ? "bg-[#2D6A4F]" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Bank Transfer pending payment note */}
              {normalizePaymentMethod(order.paymentMethod) === "Chuyển khoản/QR" &&
               (order.paymentStatus === "Pending" || order.paymentStatus === "pending") &&
               order.status === "Pending" && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">⏳ Chờ xác nhận thanh toán</p>
                  <p className="text-xs text-amber-600 mt-0.5">Đơn sẽ được xử lý sau khi nhận được thanh toán.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Đơn hàng đã bị hủy</p>
                <p className="text-xs text-red-500 mt-0.5">Đơn hàng này đã được hủy và không thể thay đổi trạng thái.</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sản phẩm</h3>
            {order.items.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Không có thông tin chi tiết sản phẩm.</p>
            ) : (
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.weight} × {item.qty}</p>
                    </div>
                    <div className="text-sm font-bold text-[#7C2D12] flex-shrink-0">
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Totals */}
            <div className="mt-3 border-t border-gray-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển</span>
                <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                  {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
                <span>Tổng thanh toán</span>
                <span className="text-[#7C2D12]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Địa chỉ giao hàng</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{order.recipient || "—"} · {order.phone || "—"}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{order.address || "—"}</span>
              </div>
              {order.deliveryNotes && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500 italic">{order.deliveryNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thanh toán</h3>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{normalizePaymentMethod(order.paymentMethod)}</span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                PAYMENT_STATUS_CONFIG[order.paymentStatus]?.classes || "text-gray-600 bg-gray-100"
              }`}>
                {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Cancel error */}
          {cancelError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{cancelError}</span>
            </div>
          )}

          {/* Can't cancel note */}
          {isShipping && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              Đơn hàng đang được xử lý. Nếu muốn hủy, vui lòng liên hệ hotline: <strong>1900-ALE-FARMS</strong>.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-gray-100 flex-shrink-0 space-y-3">
          {canCancel && !confirmOpen && (
            <button onClick={() => setConfirmOpen(true)}
              className="w-full py-3 border-2 border-red-400 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors text-sm">
              Hủy đơn hàng
            </button>
          )}

          {/* Confirm cancel dialog */}
          {confirmOpen && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-red-800">
                Bạn có chắc chắn muốn hủy đơn hàng <span className="font-mono">{order.id}</span> không?
              </p>
              <p className="text-xs text-red-600">Hành động này không thể hoàn tác.</p>
              <div className="flex gap-2">
                <button onClick={() => { setConfirmOpen(false); setCancelError(null); }}
                  disabled={cancelling}
                  className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Không, giữ lại
                </button>
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2">
                  {cancelling && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
                </button>
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 text-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedOrder,setSelectedOrder]= useState<Order | null>(null);
  const [page,         setPage]         = useState(1);

  // AC01: chờ auth load xong rồi mới redirect nếu chưa đăng nhập
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { navigate("/login"); return; }
    fetchOrders();
  }, [user, isAuthLoading]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Order[]>("/api/orders/my");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      // AC13: session expired
      if (e.message?.includes("401") || e.message?.includes("Session")) {
        navigate("/login");
        return;
      }
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancelled = (orderId: number) => {
    setOrders(prev => prev.map(o =>
      o.order_id === orderId ? { ...o, status: "Cancelled" } : o
    ));
  };

  // Pagination
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paginated  = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Auth Loading ─────────────────────────────────────────────────────────
  if (isAuthLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-[#7C2D12] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-[#7C2D12] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Đang tải đơn hàng...</p>
    </div>
  );

  // ── API Error ────────────────────────────────────────────────────────────
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
      <p className="text-gray-700 font-medium mb-2">{error}</p>
      <button onClick={fetchOrders}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510]">
        <RefreshCw className="w-4 h-4" /> Thử lại
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.length} đơn hàng</p>
      </div>

      {/* AC04: Empty state */}
      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Bạn chưa có đơn hàng nào.</h2>
          <p className="text-gray-500 text-sm mb-6">Hãy khám phá các sản phẩm đặc sản Tây Bắc của chúng tôi!</p>
          <Link to="/products"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#7C2D12] text-white rounded-xl font-semibold hover:bg-[#6B2510] transition-colors">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          {/* Order list */}
          <div className="space-y-3">
            {paginated.map((order) => {
              const cfg  = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
              const Icon = cfg.icon;
              const pm   = normalizePaymentMethod(order.paymentMethod);
              return (
                <div key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-5 py-3 bg-[#FAF7F2] border-b border-gray-100">
                    <span className="font-mono text-sm font-bold text-[#7C2D12]">{order.id}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.classes}`}>
                      <Icon className="w-3 h-3" /> {cfg.labelVi}
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Date + item count */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(order.orderDate).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" })}</span>
                          <span>·</span>
                          <span>{order.items.length} sản phẩm</span>
                          <span>·</span>
                          <span>{pm}</span>
                        </div>

                        {/* Item preview */}
                        <p className="text-sm text-gray-700 truncate">
                          {order.items.map(i => i.name).join(", ")}
                        </p>

                        {/* Payment status */}
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          PAYMENT_STATUS_CONFIG[order.paymentStatus]?.classes || "text-gray-600 bg-gray-100"
                        }`}>
                          {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-[#7C2D12] text-base">{formatPrice(order.total)}</div>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-[#7C2D12] hover:underline font-medium">
                          Xem chi tiết <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination — AC11 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:border-[#7C2D12] disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === p ? "bg-[#7C2D12] text-white" : "border border-gray-200 text-gray-600 hover:border-[#7C2D12]"
                    }`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:border-[#7C2D12] disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}