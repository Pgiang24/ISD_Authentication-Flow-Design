import { useLocation, Link } from "react-router";
import { CheckCircle, Copy, Package, Truck, Home } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "../../data/products";

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const [copied, setCopied] = useState(false);

  const orderCode = state?.orderCode || "ALE-DEMO123";
  const paymentMethod = state?.paymentMethod || "cod";
  const total = state?.total || 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { icon: CheckCircle, label: "Order Placed", status: "done", time: "Just now" },
    { icon: Package, label: paymentMethod === "bank" ? "Awaiting Payment Confirmation" : "Processing", status: paymentMethod === "bank" ? "current" : "done", time: paymentMethod === "bank" ? "Within 2 hours" : "Confirming..." },
    { icon: Truck, label: "Shipped", status: "pending", time: "1-2 business days" },
    { icon: Home, label: "Delivered", status: "pending", time: "2-4 business days" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-[#2D6A4F]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500">Thank you for your order. We're preparing your smoked meats with love 🔥</p>
      </div>

      {/* Order Code Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
        <p className="text-sm text-gray-500 mb-2">Your Order Tracking Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl font-bold text-[#7C2D12] tracking-wider font-mono">{orderCode}</span>
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-all ${copied ? "bg-[#2D6A4F]/10 text-[#2D6A4F]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        {copied && <p className="text-xs text-[#2D6A4F] mt-1">Copied to clipboard!</p>}
        <p className="text-xs text-gray-400 mt-3">
          Use this code to track your order in the search bar
        </p>
      </div>

      {/* Payment Info */}
      {paymentMethod === "bank" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            🏦 Complete Your Payment
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Please transfer <strong>{formatPrice(total)}</strong> to the following account:
          </p>
          <div className="bg-white rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">Vietcombank</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Account Number</span><span className="font-medium font-mono">1234 5678 9012</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Account Name</span><span className="font-medium">ALE FARMS JSC</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-medium text-[#7C2D12] font-mono">{orderCode}</span></div>
          </div>
          <p className="text-xs text-amber-600 mt-3">⚠ Your order will be confirmed within 2 hours after payment is received.</p>
        </div>
      )}

      {/* Order Status Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-900 mb-5">Order Status</h3>
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    step.status === "done"
                      ? "bg-[#2D6A4F] text-white"
                      : step.status === "current"
                      ? "bg-[#D4A853] text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px h-8 mt-1 ${step.status === "done" ? "bg-[#2D6A4F]" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pb-4">
                  <div className={`font-medium text-sm ${
                    step.status === "done" ? "text-[#2D6A4F]" : step.status === "current" ? "text-[#D4A853]" : "text-gray-400"
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{step.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-[#FAF7F2] rounded-2xl p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>📧 You'll receive a confirmation email/SMS shortly</li>
          <li>📦 We'll carefully pack your order with food-safe materials</li>
          <li>🚚 Delivery typically takes 2-4 business days</li>
          <li>📞 Our team will call before delivery</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="flex-1 py-3.5 bg-[#d35f1a] hover:bg-[#c05518] text-white rounded-xl font-semibold text-center transition-all active:scale-95"
        >
          Continue Shopping
        </Link>
        <button
          onClick={() => alert(`Tracking: ${orderCode}\n\nYour order is being processed. You'll receive updates via SMS.`)}
          className="flex-1 py-3.5 border-2 border-[#7C2D12] text-[#7C2D12] hover:bg-[#7C2D12]/5 rounded-xl font-semibold transition-colors"
        >
          Track My Order
        </button>
      </div>
    </div>
  );
}