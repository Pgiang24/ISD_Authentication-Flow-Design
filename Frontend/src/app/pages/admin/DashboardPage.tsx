import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  ShoppingBag, TrendingUp, AlertTriangle, Clock,
  CheckCircle, XCircle, RefreshCw,
} from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { formatPrice } from "../../data/products";

const COLORS = ["#7C2D12", "#D4A853", "#2D6A4F", "#64748b"];
const formatVND = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
};
// US1 business rule: negative values → 0
const safeNum = (v: any): number => Math.max(0, Number(v ?? 0));

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped:    "bg-indigo-100 text-indigo-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

interface KpiData {
  new_orders_today: number; pending_orders: number;
  low_stock_alerts: number; total_revenue_paid: number;
  paid_count: number; pending_pay_count: number; failed_count: number;
}

// Skeleton card — US1: không hiện 0 khi đang loading
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
      <div className="h-7 w-14 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-28 bg-gray-100 rounded" />
    </div>
  );
}

// Per-widget inline error + retry — US2/3/4/5
function WidgetError({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <AlertTriangle className="w-7 h-7 text-red-400" />
      <p className="text-sm text-gray-500 text-center max-w-xs">{msg}</p>
      <button onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [kpi,          setKpi]          = useState<KpiData | null>(null);
  const [revenue,      setRevenue]      = useState<any[]>([]);
  const [categories,   setCategories]   = useState<any[]>([]);
  const [ordersMonth,  setOrdersMonth]  = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Per-widget loading — US1: skeleton per card, không hiện "0" trong khi fetch
  const [loadKpi,  setLoadKpi]  = useState(true);
  const [loadRev,  setLoadRev]  = useState(true);
  const [loadCat,  setLoadCat]  = useState(true);
  const [loadOpm,  setLoadOpm]  = useState(true);
  const [loadRec,  setLoadRec]  = useState(true);

  // Per-widget errors — US2/3/4/5 error messages riêng từng widget
  const [errKpi,  setErrKpi]  = useState<string | null>(null);
  const [errRev,  setErrRev]  = useState<string | null>(null);
  const [errCat,  setErrCat]  = useState<string | null>(null);
  const [errOpm,  setErrOpm]  = useState<string | null>(null);
  const [errRec,  setErrRec]  = useState<string | null>(null);

  const fetchKpi = async () => {
    setLoadKpi(true); setErrKpi(null);
    try   { setKpi(await apiFetch<KpiData>("/api/dashboard/kpi")); }
    catch { setErrKpi("Unable to load new orders. Please try again."); setKpi(null); }
    finally { setLoadKpi(false); }
  };
  const fetchRev = async () => {
    setLoadRev(true); setErrRev(null);
    try   { const d = await apiFetch<any[]>("/api/dashboard/revenue"); setRevenue(Array.isArray(d) ? d : []); }
    catch { setErrRev("Unable to load Revenue Overview. Please try again."); setRevenue([]); }
    finally { setLoadRev(false); }
  };
  const fetchCat = async () => {
    setLoadCat(true); setErrCat(null);
    try   { const d = await apiFetch<any[]>("/api/dashboard/sales-by-category"); setCategories(Array.isArray(d) ? d : []); }
    catch { setErrCat("Sales by Category could not be loaded. Please try again."); setCategories([]); }
    finally { setLoadCat(false); }
  };
  const fetchOpm = async () => {
    setLoadOpm(true); setErrOpm(null);
    try   { const d = await apiFetch<any[]>("/api/dashboard/orders-per-month"); setOrdersMonth(Array.isArray(d) ? d : []); }
    catch { setErrOpm("Unable to load Orders per Month. Please try again."); setOrdersMonth([]); }
    finally { setLoadOpm(false); }
  };
  const fetchRec = async () => {
    setLoadRec(true); setErrRec(null);
    try   { const d = await apiFetch<any[]>("/api/dashboard/recent-orders"); setRecentOrders(Array.isArray(d) ? d : []); }
    catch { setErrRec("Can't load recent orders. Please try again."); setRecentOrders([]); }
    finally { setLoadRec(false); }
  };
  const fetchAll = () => { fetchKpi(); fetchRev(); fetchCat(); fetchOpm(); fetchRec(); };
  useEffect(() => { fetchAll(); }, []);

  // ── Data normalisation ──────────────────────────────────────────────────
  const kS = kpi ? {
    new_orders_today: safeNum(kpi.new_orders_today),
    pending_orders:   safeNum(kpi.pending_orders),
    low_stock_alerts: safeNum(kpi.low_stock_alerts),
    total_revenue:    safeNum(kpi.total_revenue_paid),
    paid_count:       safeNum(kpi.paid_count),
    pending_pay:      safeNum(kpi.pending_pay_count),
    failed:           safeNum(kpi.failed_count),
  } : null;

  // US2: negative revenue → 0
  const revData = revenue.map((r) => ({
    month:   r.month || r.month_label || "",
    revenue: safeNum(r.revenue || r.total_revenue),
  }));

  // US3: negative → 0, hide 0-value categories
  const catData = categories
    .map((c) => ({ name: c.name || c.category_name || c.name_vi || "Unknown", value: safeNum(c.value || c.order_count || c.sales_count) }))
    .filter((c) => c.value > 0);

  // US4: negative → 0
  const opmData = ordersMonth.map((r) => ({
    month:  r.month || r.month_label || "",
    orders: safeNum(r.orders || r.order_count),
  }));

  // US5: limit 5, de-duplicate by id, unknown status fallback
  const recentData = recentOrders
    .map((o) => ({
      id:       o.id || o.order_code || `ALE-ORDER-${String(o.order_id).padStart(3, "0")}`,
      customer: o.customer || o.recipient_name || o.full_name || "-",
      items:    o.items || [],
      total:    safeNum(o.total || o.total_amount),
      status:   (o.status || "").toLowerCase(),
    }))
    .filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i) // de-duplicate
    .slice(0, 5); // limit 5

  const currentRevenue = revData[revData.length - 1]?.revenue ?? 0;

  const kpiCards = [
    { icon: ShoppingBag, label: "New Orders Today",    value: kS?.new_orders_today, change: "vs yesterday",     pos: true,  color: "bg-blue-50 text-blue-600",   alert: false },
    { icon: Clock,       label: "Pending Orders",      value: kS?.pending_orders,   change: `${kS?.pending_orders ?? 0} awaiting`, pos: false, color: "bg-amber-50 text-amber-600", alert: (kS?.pending_orders ?? 0) > 0 },
    { icon: AlertTriangle, label: "Low Stock Alerts",  value: kS?.low_stock_alerts, change: "Action needed",   pos: false, color: "bg-red-50 text-red-600",     alert: (kS?.low_stock_alerts ?? 0) > 0 },
    { icon: TrendingUp,  label: "Total Revenue (paid)", value: kS ? formatVND(kS.total_revenue) : null, change: "Paid orders only", pos: true, color: "bg-green-50 text-green-600", alert: false },
  ];

  return (
    <div className="space-y-6">

      {/* ── KPI Cards: skeleton khi loading, per-card error khi fail ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((k) => {
          if (loadKpi) return <CardSkeleton key={k.label} />;
          if (errKpi) return (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.color} mb-3`}>
                <k.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-red-400">Data unavailable.</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
            </div>
          );
          const Icon = k.icon;
          return (
            <div key={k.label}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${k.alert ? "border-amber-200" : "border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.color}`}><Icon className="w-5 h-5" /></div>
                {k.alert && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Alert</span>}
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">{k.value ?? 0}</div>
                <div className="text-sm text-gray-500 mt-0.5">{k.label}</div>
              </div>
              <div className={`text-xs mt-2 ${k.pos ? "text-green-600" : k.alert ? "text-red-500" : "text-gray-500"}`}>{k.change}</div>
            </div>
          );
        })}
      </div>

      {/* ── Revenue + Category ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Revenue */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            {!loadRev && !errRev && (
              <div className="text-right">
                <div className="font-bold text-[#7C2D12]">{formatPrice(currentRevenue)}</div>
                <div className="text-xs text-gray-400">This month</div>
              </div>
            )}
          </div>
          {loadRev ? (
            <div className="h-[220px] bg-gray-50 rounded-xl animate-pulse" />
          ) : errRev ? (
            <WidgetError msg={errRev} onRetry={fetchRev} />
          ) : revData.length === 0 || revData.every((d) => d.revenue === 0) ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <TrendingUp className="w-8 h-8 opacity-30" />
              <span className="text-sm">No revenue data available for this period.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatVND} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Revenue"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                <Line type="monotone" dataKey="revenue" stroke="#7C2D12" strokeWidth={2.5} dot={{ r: 4, fill: "#7C2D12" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Sales by Category</h3>
          <p className="text-sm text-gray-500 mb-4">This month</p>
          {loadCat ? (
            <div className="h-[180px] bg-gray-50 rounded-xl animate-pulse" />
          ) : errCat ? (
            <WidgetError msg={errCat} onRetry={fetchCat} />
          ) : catData.length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <span className="text-sm">No category sales data available for this period.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Orders per Month + Recent Orders ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Orders per Month */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Orders per Month</h3>
          <p className="text-sm text-gray-500 mb-4">Last 6 months</p>
          {loadOpm ? (
            <div className="h-[180px] bg-gray-50 rounded-xl animate-pulse" />
          ) : errOpm ? (
            <WidgetError msg={errOpm} onRetry={fetchOpm} />
          ) : opmData.length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <ShoppingBag className="w-8 h-8 opacity-30" />
              <span className="text-sm">There is no order volume data for this time period.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={opmData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "12px" }} />
                <Bar dataKey="orders" fill="#D4A853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders: limit 5, de-dup, unknown status, missing field "-" */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-[#7C2D12] hover:underline font-medium">View all →</Link>
          </div>
          {loadRec ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : errRec ? (
            <WidgetError msg={errRec} onRetry={fetchRec} />
          ) : recentData.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <ShoppingBag className="w-8 h-8 opacity-30" />
              <span className="text-sm">No recent orders available.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {recentData.map((order) => {
                const badgeClass  = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500";
                const statusLabel = STATUS_COLORS[order.status]
                  ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                  : "Unknown Status";
                return (
                  <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">{order.customer}</span>
                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">#{String(order.id).split("-").pop()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {order.items?.map((i: any) => i.name || i.product_name).filter(Boolean).join(", ") || "-"}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-sm text-gray-900">{formatPrice(order.total)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Summary: skeleton khi loading ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loadKpi ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="space-y-2"><div className="h-5 w-10 bg-gray-200 rounded" /><div className="h-3 w-24 bg-gray-100 rounded" /></div>
            </div>
          ))
        ) : (
          [
            { icon: CheckCircle, label: "Paid Orders",      count: kS?.paid_count ?? 0, color: "text-green-600 bg-green-50" },
            { icon: Clock,       label: "Pending Payment",  count: kS?.pending_pay ?? 0, color: "text-amber-600 bg-amber-50" },
            { icon: XCircle,     label: "Failed/Cancelled", count: kS?.failed ?? 0,      color: "text-red-600 bg-red-50"    },
          ].map(({ icon: Icon, label, count, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
              <div>
                {errKpi
                  ? <p className="text-xs text-red-400">Data unavailable.</p>
                  : <div className="text-xl font-bold text-gray-900">{count}</div>
                }
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}