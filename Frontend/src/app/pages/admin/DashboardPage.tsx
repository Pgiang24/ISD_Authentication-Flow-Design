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

const statusColors: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped:    "bg-indigo-100 text-indigo-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

interface KpiData {
  new_orders_today:   number;
  pending_orders:     number;
  low_stock_alerts:   number;
  total_revenue_paid: number;
  paid_count:         number;
  pending_pay_count:  number;
  failed_count:       number;
}

export default function DashboardPage() {
  const [kpi, setKpi]               = useState<KpiData | null>(null);
  const [revenue, setRevenue]       = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ordersMonth, setOrdersMonth] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, revRes, catRes, omRes, roRes] = await Promise.allSettled([
        apiFetch<any>("/api/dashboard/kpi"),
        apiFetch<any[]>("/api/dashboard/revenue"),
        apiFetch<any[]>("/api/dashboard/sales-by-category"),
        apiFetch<any[]>("/api/dashboard/orders-per-month"),
        apiFetch<any[]>("/api/dashboard/recent-orders"),
      ]);

      if (kpiRes.status === "fulfilled") setKpi(kpiRes.value);
      if (revRes.status === "fulfilled") setRevenue(revRes.value || []);
      if (catRes.status === "fulfilled") setCategories(catRes.value || []);
      if (omRes.status  === "fulfilled") setOrdersMonth(omRes.value || []);
      if (roRes.status  === "fulfilled") setRecentOrders(roRes.value || []);

      // Nếu tất cả đều fail
      if ([kpiRes, revRes, catRes, omRes, roRes].every((r) => r.status === "rejected")) {
        setError("Could not load dashboard data from server.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-10 h-10 border-4 border-[#7C2D12] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading dashboard…</p>
    </div>
  );

  const kpis = [
    {
      icon: ShoppingBag, label: "New Orders Today",
      value: kpi?.new_orders_today ?? 0,
      change: "vs yesterday", positive: true,
      color: "bg-blue-50 text-blue-600", alert: false,
    },
    {
      icon: Clock, label: "Pending Orders",
      value: kpi?.pending_orders ?? 0,
      change: `${kpi?.pending_orders ?? 0} awaiting`, positive: false,
      color: "bg-amber-50 text-amber-600", alert: (kpi?.pending_orders ?? 0) > 0,
    },
    {
      icon: AlertTriangle, label: "Low Stock Alerts",
      value: kpi?.low_stock_alerts ?? 0,
      change: "Action needed", positive: false,
      color: "bg-red-50 text-red-600", alert: (kpi?.low_stock_alerts ?? 0) > 0,
    },
    {
      icon: TrendingUp, label: "Total Revenue (paid)",
      value: formatVND(kpi?.total_revenue_paid ?? 0),
      change: "Paid orders only", positive: true,
      color: "bg-green-50 text-green-600", alert: false,
    },
  ];

  // Normalise revenue data từ view
  const revenueData = revenue.map((r) => ({
    month:   r.month || r.month_label || "",
    revenue: Number(r.revenue || r.total_revenue || 0),
  }));

  // Normalise category data
  const categoryData = categories.map((c) => ({
    name:  c.name || c.category_name || c.name_vi || "",
    value: Number(c.value || c.order_count || c.sales_count || 0),
  }));

  // Normalise orders per month
  const ordersMonthData = ordersMonth.map((r) => ({
    month:  r.month || r.month_label || "",
    orders: Number(r.orders || r.order_count || 0),
  }));

  // Normalise recent orders
  const recentNorm = recentOrders.map((o) => ({
    id:       o.id || o.order_code || `ALE-ORDER-${String(o.order_id).padStart(3,"0")}`,
    customer: o.customer || o.recipient_name || o.full_name || "",
    items:    o.items || [],
    total:    Number(o.total || o.total_amount || 0),
    status:   (o.status || "pending").toLowerCase(),
  }));

  const currentRevenue = revenueData[revenueData.length - 1]?.revenue ?? 0;

  return (
    <div className="space-y-6">

      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Could not load some dashboard data. Showing partial results.</span>
          </div>
          <button onClick={fetchAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg font-medium transition-colors whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${kpi.alert ? "border-amber-200" : "border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {kpi.alert && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Alert</span>}
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{kpi.label}</div>
              </div>
              <div className={`text-xs mt-2 ${kpi.positive ? "text-green-600" : kpi.alert ? "text-red-500" : "text-gray-500"}`}>
                {kpi.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue + Category */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-[#7C2D12]">{formatPrice(currentRevenue)}</div>
              <div className="text-xs text-gray-400">This month</div>
            </div>
          </div>
          {revenueData.length === 0 || revenueData.every((d) => d.revenue === 0) ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <TrendingUp className="w-8 h-8 opacity-30" />
              <span className="text-sm">No revenue data available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatVND} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Revenue"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                <Line type="monotone" dataKey="revenue" stroke="#7C2D12" strokeWidth={2.5} dot={{ r: 4, fill: "#7C2D12" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Sales by Category</h3>
          <p className="text-sm text-gray-500 mb-4">This month</p>
          {categoryData.length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <span className="text-sm">No category data</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Orders per Month + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Orders per Month</h3>
          <p className="text-sm text-gray-500 mb-4">Last 6 months</p>
          {ordersMonthData.length === 0 || ordersMonthData.every((d) => d.orders === 0) ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <ShoppingBag className="w-8 h-8 opacity-30" />
              <span className="text-sm">No order data</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ordersMonthData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "12px" }} />
                <Bar dataKey="orders" fill="#D4A853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-[#7C2D12] hover:underline font-medium">View all →</Link>
          </div>
          {recentNorm.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <ShoppingBag className="w-8 h-8 opacity-30" />
              <span className="text-sm">No orders yet</span>
            </div>
          ) : (
            <div className="space-y-2">
              {recentNorm.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{order.customer}</span>
                      <span className="text-xs text-gray-400 font-mono">#{String(order.id).split("-").pop()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {order.items?.map((i: any) => i.name || i.product_name).join(", ") || "—"}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-sm text-gray-900">{formatPrice(order.total)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, label: "Paid Orders",      count: kpi?.paid_count      ?? 0, color: "text-green-600 bg-green-50" },
          { icon: Clock,       label: "Pending Payment",  count: kpi?.pending_pay_count ?? 0, color: "text-amber-600 bg-amber-50" },
          { icon: XCircle,     label: "Failed/Cancelled", count: kpi?.failed_count    ?? 0, color: "text-red-600 bg-red-50"    },
        ].map(({ icon: Icon, label, count, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}