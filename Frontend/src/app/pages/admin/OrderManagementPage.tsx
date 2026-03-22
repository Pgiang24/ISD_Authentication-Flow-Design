import { useState } from "react";
import { Search, X, ChevronLeft, ChevronRight, Eye, ChevronDown } from "lucide-react";
import { OrderStatus } from "../../data/adminData";
import { formatPrice } from "../../data/products";
import { useOrders } from "../../hooks/useOrders";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const statusConfig: Record<OrderStatus, { label: string; classes: string }> = {
  pending:    { label: "Pending",    classes: "bg-amber-100 text-amber-700 border-amber-200"   },
  confirmed:  { label: "Confirmed",  classes: "bg-blue-100 text-blue-700 border-blue-200"     },
  processing: { label: "Processing", classes: "bg-purple-100 text-purple-700 border-purple-200" },
  shipped:    { label: "Shipped",    classes: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  delivered:  { label: "Delivered",  classes: "bg-green-100 text-green-700 border-green-200"  },
  cancelled:  { label: "Cancelled",  classes: "bg-red-100 text-red-700 border-red-200"        },
};

const paymentConfig: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed:  "bg-red-100 text-red-700",
};

interface MappedOrder {
  id:            string;
  customer:      string;
  phone:         string;
  email:         string;
  address:       string;
  date:          string;
  total:         number;
  status:        OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  items:         { name: string; qty: number; price: number; weight: string }[];
}

const PAGE_SIZE = 5;

function mapOrder(o: any): MappedOrder {
  return {
    id:            o.id || `ALE-ORDER-${String(o.order_id).padStart(3, "0")}`,
    customer:      o.customer      || o.full_name      || "",
    phone:         o.phone         || "",
    email:         o.email         || "",
    address:       o.address       || "",
    date:          o.date          || (o.order_date ? String(o.order_date).split("T")[0] : ""),
    total:         Number(o.total  || o.total_amount   || 0),
    status:        (o.status       || "pending")       as OrderStatus,
    paymentMethod: o.paymentMethod || o.payment_method || "cod",
    paymentStatus: o.paymentStatus || o.payment_status || "pending",
    items:         (o.items || []).map((i: any) => ({
      name:   i.name     || i.product_name || "",
      qty:    i.qty      || i.quantity     || 1,
      price:  Number(i.price)              || 0,
      weight: i.weight                     || "",
    })),
  };
}

function OrderDrawer({ order, onClose, onStatusChange }: {
  order: MappedOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [localStatus, setLocalStatus] = useState<OrderStatus>(order.status);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Order Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-[#FAF7F2] rounded-xl p-4">
            <div className="font-mono font-bold text-[#7C2D12] text-lg">{order.id}</div>
            <div className="text-sm text-gray-500 mt-1">{order.date}</div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-1">
              <div className="font-semibold text-gray-900">{order.customer}</div>
              <div className="text-sm text-gray-600">{order.phone}</div>
              <div className="text-sm text-gray-600">{order.email}</div>
              <div className="text-sm text-gray-500 mt-2">{order.address}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.weight} × {item.qty}</div>
                  </div>
                  <div className="font-semibold text-gray-900">{formatPrice(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-[#7C2D12] text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</h3>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg">{order.paymentMethod === "bank" ? "🏦" : "💵"}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {order.paymentMethod === "bank" ? "Bank Transfer" : "Cash on Delivery"}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${paymentConfig[order.paymentStatus] || paymentConfig.pending}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</h3>
            <div className="relative">
              <select
                value={localStatus}
                onChange={(e) => setLocalStatus(e.target.value as OrderStatus)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#7C2D12] appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{statusConfig[s].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {localStatus !== order.status && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                Đổi từ "{statusConfig[order.status].label}" → "{statusConfig[localStatus].label}"
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => { onStatusChange(order.id, localStatus); onClose(); }}
              className="flex-1 py-3 bg-[#7C2D12] text-white rounded-xl font-medium hover:bg-[#6B2510] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderManagementPage() {
  const { orders: rawOrders, loading, updateStatus } = useOrders();
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<MappedOrder | null>(null);
  const [page, setPage]                 = useState(1);
  const [sortField, setSortField]       = useState<"date" | "total">("date");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");

  // Map toàn bộ orders từ API một lần
  const orders: MappedOrder[] = rawOrders.map(mapOrder);

  const filtered = orders
    .filter((o) => {
      const q = search.toLowerCase();
      return (
        (statusFilter === "all" || o.status === statusFilter) &&
        (o.id?.toLowerCase().includes(q) ||
          o.customer?.toLowerCase().includes(q) ||
          o.phone?.includes(q))
      );
    })
    .sort((a, b) => {
      if (sortField === "date") return sortDir === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
      return sortDir === "desc" ? b.total - a.total : a.total - b.total;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    await updateStatus(Number(id.replace("ALE-ORDER-", "")), status);
  };

  const toggleSort = (field: "date" | "total") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-[#7C2D12] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
          <p className="text-sm text-gray-500">{orders.length} total orders</p>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setStatusFilter("all"); setPage(1); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusFilter === "all" ? "bg-[#7C2D12] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#7C2D12]"}`}
        >
          All ({orders.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              statusFilter === s ? `${statusConfig[s].classes} border-current` : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {statusConfig[s].label} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by ID, name, or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#7C2D12]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort("date")}>
                  Date {sortField === "date" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort("total")}>
                  Total {sortField === "total" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : (
                paginated.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-[#7C2D12]">{order.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                      <div className="text-xs text-gray-500">{order.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.date}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">{order.paymentMethod === "bank" ? "Bank Transfer" : "COD"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize w-fit ${paymentConfig[order.paymentStatus] || paymentConfig.pending}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize ${statusConfig[order.status]?.classes}`}>
                        {statusConfig[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-[#7C2D12] hover:bg-[#7C2D12]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#7C2D12] disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? "bg-[#7C2D12] text-white" : "border border-gray-200 text-gray-600 hover:border-[#7C2D12]"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#7C2D12] disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}