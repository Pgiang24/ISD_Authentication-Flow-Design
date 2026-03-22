import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ShoppingBag, TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { MOCK_ORDERS, REVENUE_DATA, CATEGORY_DATA } from "../../data/adminData";
import { formatPrice } from "../../data/products";

const COLORS = ["#7C2D12", "#D4A853", "#2D6A4F", "#64748b"];

const formatVND = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v.toString();
};

export default function DashboardPage() {
  const pendingOrders = MOCK_ORDERS.filter((o) => o.status === "pending").length;
  const confirmedToday = MOCK_ORDERS.filter((o) => o.status === "confirmed" && o.date === "2026-02-27").length;
  const lowStock = 3; // From inventory
  const totalRevenue = REVENUE_DATA.reduce((s, r) => s + r.revenue, 0);

  const recentOrders = MOCK_ORDERS.slice(0, 5);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const kpis = [
    {
      icon: ShoppingBag,
      label: "New Orders Today",
      value: MOCK_ORDERS.filter((o) => o.date === "2026-02-27").length,
      sub: "vs yesterday",
      change: "+23%",
      positive: true,
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Clock,
      label: "Pending Orders",
      value: pendingOrders,
      sub: "Awaiting confirmation",
      change: `${pendingOrders} orders`,
      positive: false,
      color: "bg-amber-50 text-amber-600",
      alert: true,
    },
    {
      icon: AlertTriangle,
      label: "Low Stock Alerts",
      value: lowStock,
      sub: "Products below threshold",
      change: "Action needed",
      positive: false,
      color: "bg-red-50 text-red-600",
      alert: true,
    },
    {
      icon: TrendingUp,
      label: "Total Revenue (6mo)",
      value: formatVND(totalRevenue),
      sub: "All time",
      change: "+18% vs prior period",
      positive: true,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${kpi.alert ? "border-amber-200" : "border-gray-100"}`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {kpi.alert && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Alert</span>
                )}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue Line Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-[#7C2D12]">{formatPrice(REVENUE_DATA[5].revenue)}</div>
              <div className="text-xs text-gray-400">This month</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatVND} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), "Revenue"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#7C2D12" strokeWidth={2.5} dot={{ r: 4, fill: "#7C2D12" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Sales by Category</h3>
          <p className="text-sm text-gray-500 mb-4">This month</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {CATEGORY_DATA.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Bar + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Orders Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Orders per Month</h3>
          <p className="text-sm text-gray-500 mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={REVENUE_DATA} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "12px" }} />
              <Bar dataKey="orders" fill="#D4A853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <a href="/admin/orders" className="text-sm text-[#7C2D12] hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{order.customer}</span>
                    <span className="text-xs text-gray-400">#{order.id.split("-").slice(-1)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {order.items.map((i) => i.name).join(", ")}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-sm text-gray-900">{formatPrice(order.total)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, label: "Paid Orders", count: MOCK_ORDERS.filter((o) => o.paymentStatus === "paid").length, color: "text-green-600 bg-green-50" },
          { icon: Clock, label: "Pending Payment", count: MOCK_ORDERS.filter((o) => o.paymentStatus === "pending").length, color: "text-amber-600 bg-amber-50" },
          { icon: XCircle, label: "Failed / Cancelled", count: MOCK_ORDERS.filter((o) => o.paymentStatus === "failed").length, color: "text-red-600 bg-red-50" },
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
