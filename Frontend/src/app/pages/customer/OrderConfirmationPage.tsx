import { useLocation, Link } from "react-router";
import { CheckCircle, Copy, Package, Truck, Home, Clock, RefreshCw, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatPrice } from "../../data/products";

// ── Config thanh toán ────────────────────────────────────────────────────────
// Thay các giá trị này bằng thông tin tài khoản thật của bạn
const BANK_CONFIG = {
  bankId:      "970436",   // Vietcombank bank code (VietQR)
  accountNo:   "0965303994",
  accountName: "CONG TY ALE FARMS",
};

// Tạo URL QR VietQR (miễn phí, không cần API key)
function makeQrUrl(amount: number, orderCode: string): string {
  const info = encodeURIComponent(`Thanh toan ${orderCode}`);
  const name = encodeURIComponent(BANK_CONFIG.accountName);
  return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${Math.round(amount)}&addInfo=${info}&accountName=${name}`;
}

// ── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) { clearInterval(timer.current!); onExpire(); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current!);
  }, []);

  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  const pct = (left / seconds) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Ring progress */}
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <circle cx="28" cy="28" r="24" fill="none"
            stroke={left < 60 ? "#ef4444" : "#7C2D12"} strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-black tabular-nums ${left < 60 ? "text-red-500" : "text-[#7C2D12]"}`}>
            {m}:{s}
          </span>
        </div>
      </div>
      <p className={`text-xs font-medium ${left < 60 ? "text-red-500" : "text-gray-500"}`}>
        {left < 60 ? "Sắp hết thời gian!" : "Thời gian thanh toán"}
      </p>
    </div>
  );
}

// ── QR Payment Panel ──────────────────────────────────────────────────────────
function QrPaymentPanel({ orderCode, total }: { orderCode: string; total: number }) {
  const [paid,    setPaid]    = useState(false);
  const [expired, setExpired] = useState(false);
  const [imgError,setImgError]= useState(false);
  const qrUrl = makeQrUrl(total, orderCode);

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center">
          <CheckCheck className="w-8 h-8 text-[#2D6A4F]" />
        </div>
        <p className="font-bold text-[#2D6A4F]">Đã xác nhận thanh toán!</p>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Chúng tôi sẽ xác nhận và bắt đầu xử lý đơn hàng của bạn trong vòng 30 phút.
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Clock className="w-7 h-7 text-red-500" />
        </div>
        <p className="font-bold text-gray-900">Mã QR đã hết hạn</p>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Vui lòng tải lại trang hoặc chuyển sang thanh toán chuyển khoản thủ công.
        </p>
        <button onClick={() => setExpired(false)} className="flex items-center gap-2 px-4 py-2 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510]">
          <RefreshCw className="w-4 h-4" /> Tạo lại QR
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Quét QR để thanh toán</h3>
          <p className="text-xs text-gray-500 mt-0.5">Hỗ trợ: MOMO, ZaloPay, Banking App</p>
        </div>
        <Countdown seconds={15 * 60} onExpire={() => setExpired(true)} />
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="relative bg-white p-3 rounded-2xl border-2 border-[#7C2D12]/20 shadow-md inline-block">
          {imgError ? (
            /* Fallback khi không load được VietQR (domain bị block...) */
            <div className="w-52 h-52 flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-xl">
              <div className="text-4xl">💳</div>
              <p className="text-xs text-gray-500 text-center px-4">
                Không load được QR.<br/>Dùng thông tin chuyển khoản bên dưới.
              </p>
            </div>
          ) : (
            <img
              src={qrUrl}
              alt="QR thanh toán"
              className="w-52 h-52 object-contain"
              onError={() => setImgError(true)}
            />
          )}
          {/* ALE logo overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#7C2D12]/20 overflow-hidden shadow-sm">
              <img src="/images/logo.jpg" alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin tài khoản */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 border border-gray-100">
        <div className="flex justify-between"><span className="text-gray-500">Ngân hàng</span><span className="font-medium">Vietcombank</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Số tài khoản</span><span className="font-medium font-mono">{BANK_CONFIG.accountNo}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tên TK</span><span className="font-medium">{BANK_CONFIG.accountName}</span></div>
        <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
          <span className="text-gray-500">Số tiền</span>
          <span className="font-black text-[#7C2D12] text-base">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Nội dung CK</span>
          <span className="font-mono font-semibold text-[#7C2D12]">{orderCode}</span>
        </div>
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">
        ⚠ Nhập <strong>đúng nội dung chuyển khoản</strong> là mã đơn hàng để hệ thống tự động xác nhận. Đơn hàng sẽ được xử lý trong vòng <strong>30 phút</strong> sau khi nhận thanh toán.
      </p>

      {/* Nút xác nhận đã thanh toán (manual confirm) */}
      <button onClick={() => setPaid(true)}
        className="w-full py-3 bg-[#2D6A4F] hover:bg-[#245a42] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
        <CheckCheck className="w-4 h-4" /> Tôi đã thanh toán xong
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const [copied, setCopied] = useState(false);

  const orderCode     = state?.orderCode     || "ALE-ORDER-001";
  const paymentMethod = state?.paymentMethod || "cod";
  const total         = state?.total         || 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCard = paymentMethod === "card";
  const isCod  = paymentMethod === "cod";

  const steps = [
    {
      icon: CheckCircle,
      label: "Đặt hàng thành công",
      status: "done",
      time: "Vừa xong",
    },
    {
      icon: Package,
      label: isCard ? "Chờ xác nhận thanh toán" : "Đang xử lý",
      status: isCard ? "current" : "done",
      time:  isCard ? "Tự động sau khi nhận tiền" : "Đang xác nhận...",
    },
    {
      icon: Truck,
      label: "Đang giao hàng",
      status: "pending",
      time: "1–2 ngày làm việc",
    },
    {
      icon: Home,
      label: "Đã giao hàng",
      status: "pending",
      time: "2–4 ngày làm việc",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Success header ── */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-[#2D6A4F]" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Đặt hàng thành công! 🎉</h1>
        <p className="text-gray-500 text-sm">
          {isCard
            ? "Vui lòng thanh toán trong 15 phút để xác nhận đơn hàng."
            : "Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ trước khi giao."}
        </p>
      </div>

      {/* ── Order code ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Mã đơn hàng</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl font-black text-[#7C2D12] tracking-wider font-mono">{orderCode}</span>
          <button onClick={handleCopy}
            className={`p-2 rounded-lg transition-all ${copied ? "bg-[#2D6A4F]/10 text-[#2D6A4F]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {copied && <p className="text-xs text-[#2D6A4F] mt-1">Đã sao chép!</p>}
        <p className="text-xs text-gray-400 mt-2">Dùng mã này để theo dõi đơn hàng</p>
      </div>

      {/* ── QR Payment (chỉ hiện khi chọn card) ── */}
      {isCard && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-[#7C2D12]/20 mb-5">
          <QrPaymentPanel orderCode={orderCode} total={total} />
        </div>
      )}

      {/* ── COD info ── */}
      {isCod && (
        <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#D4A853]/30 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💵</span>
            <h3 className="font-semibold text-gray-900">Thanh toán khi nhận hàng (COD)</h3>
          </div>
          <p className="text-sm text-gray-600">
            Chuẩn bị <strong className="text-[#7C2D12]">{formatPrice(total)}</strong> khi nhận hàng. Shipper sẽ liên hệ trước khi giao.
          </p>
        </div>
      )}

      {/* ── Order timeline ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
        <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wide">Trạng thái đơn hàng</h3>
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === "done"    ? "bg-[#2D6A4F] text-white" :
                    step.status === "current" ? "bg-[#7C2D12] text-white ring-4 ring-[#7C2D12]/20" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px h-8 mt-1 ${step.status === "done" ? "bg-[#2D6A4F]" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pt-1.5">
                  <p className={`text-sm font-medium ${
                    step.status === "done"    ? "text-[#2D6A4F]" :
                    step.status === "current" ? "text-[#7C2D12]" :
                    "text-gray-400"
                  }`}>{step.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── What's next ── */}
      <div className="bg-[#FAF7F2] rounded-2xl p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Điều gì xảy ra tiếp theo?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>📦 Chúng tôi sẽ đóng gói đơn hàng cẩn thận bằng vật liệu an toàn thực phẩm</li>
          <li>📞 Shipper sẽ gọi điện trước khi giao hàng</li>
          <li>🚚 Thời gian giao hàng thường 2–4 ngày làm việc</li>
          {isCard && <li>✅ Đơn hàng sẽ được xử lý ngay sau khi xác nhận thanh toán</li>}
        </ul>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/"
          className="flex-1 py-3.5 bg-[#d35f1a] hover:bg-[#c05518] text-white rounded-xl font-semibold text-center transition-all active:scale-95">
          Tiếp tục mua sắm
        </Link>
        <Link to="/my-orders"
          className="flex-1 py-3.5 border-2 border-[#7C2D12] text-[#7C2D12] hover:bg-[#7C2D12]/5 rounded-xl font-semibold text-center transition-colors">
          Xem đơn hàng của tôi
        </Link>
      </div>
    </div>
  );
}