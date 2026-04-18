import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin, Clock, Send, Facebook, Instagram, CheckCircle, ChevronDown } from "lucide-react";

const SOCIAL_LINKS = {
  facebook:  "https://www.facebook.com/share/1FrY7AXvcV/?mibextid=wwXIfr",
  instagram: "https://www.instagram.com/ale_farm.vn",
  tiktok:    "https://www.tiktok.com/@ale_farms_dayy",
};

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
    </svg>
  );
}

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [form, setForm]       = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return;
    setSending(true);
    // Simulate send (no real endpoint for contact form)
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setSending(false);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const faqs = isEn ? [
    { q: "How long does delivery take?", a: "We deliver nationwide in 2–4 business days. Free shipping on orders over 500,000 VND." },
    { q: "Are your products preservative-free?", a: "Yes. All our smoked meats use only natural spices and wood smoke — no MSG, no artificial preservatives." },
    { q: "How should I store the products?", a: "Keep refrigerated at 0–5°C. Sealed products last up to 30 days. Once opened, consume within 3–5 days." },
    { q: "Do you ship internationally?", a: "Currently we only ship within Vietnam. International shipping is planned for 2025." },
    { q: "Can I return a product?", a: "Yes, within 24 hours of receipt if the product is damaged or incorrect. Contact us via hotline or Facebook." },
  ] : [
    { q: "Thời gian giao hàng bao lâu?", a: "Chúng tôi giao hàng toàn quốc trong 2–4 ngày làm việc. Miễn phí vận chuyển đơn từ 500.000đ." },
    { q: "Sản phẩm có chất bảo quản không?", a: "Không. Tất cả sản phẩm hun khói chỉ dùng gia vị tự nhiên và khói củi — không bột ngọt, không phụ gia hóa học." },
    { q: "Bảo quản sản phẩm như thế nào?", a: "Giữ lạnh 0–5°C. Sản phẩm còn nguyên seal dùng được 30 ngày. Sau khi mở, dùng trong 3–5 ngày." },
    { q: "Có giao hàng quốc tế không?", a: "Hiện tại chúng tôi chỉ giao trong Việt Nam. Giao quốc tế đang được lên kế hoạch cho năm 2025." },
    { q: "Tôi có thể đổi trả hàng không?", a: "Có, trong vòng 24 giờ kể từ khi nhận hàng nếu sản phẩm bị hỏng hoặc giao sai. Liên hệ qua hotline hoặc Facebook." },
  ];

  const contactInfo = [
    {
      icon: Phone,
      title: isEn ? "Hotline" : "Điện thoại",
      lines: ["1900-ALE-FARMS", isEn ? "Mon–Sat, 8am–6pm" : "Thứ 2–7, 8:00–18:00"],
      color: "bg-[#7C2D12]/10 text-[#7C2D12]",
    },
    {
      icon: Mail,
      title: "Email",
      lines: ["hello@alefarms.vn", isEn ? "Reply within 24 hours" : "Phản hồi trong 24 giờ"],
      color: "bg-blue-50 text-blue-700",
    },
    {
      icon: MapPin,
      title: isEn ? "Farm Address" : "Địa chỉ trang trại",
      lines: [isEn ? "Son La Province, Northwest Vietnam" : "Tỉnh Sơn La, Tây Bắc Việt Nam", "Elevation 1,200m"],
      color: "bg-[#2D6A4F]/10 text-[#2D6A4F]",
    },
    {
      icon: Clock,
      title: isEn ? "Business Hours" : "Giờ làm việc",
      lines: [isEn ? "Monday – Saturday" : "Thứ 2 – Thứ 7", "8:00 – 18:00"],
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-[#1C0A00] py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="inline-block px-3 py-1 bg-[#D4A853]/20 text-[#D4A853] text-xs font-bold uppercase tracking-widest rounded-full mb-4 border border-[#D4A853]/30">
            {isEn ? "Get in Touch" : "Liên hệ với chúng tôi"}
          </span>
          <h1 className="text-white font-black text-4xl md:text-5xl mb-4">
            {isEn ? "We'd love to hear from you" : "Chúng tôi rất muốn nghe từ bạn"}
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-base leading-relaxed">
            {isEn
              ? "Questions, orders, partnerships, or just want to talk about smoked meat — we're here."
              : "Câu hỏi, đơn hàng, hợp tác, hay chỉ muốn nói về thịt hun khói — chúng tôi luôn ở đây."}
          </p>
        </div>
      </section>

      {/* ── Contact cards ── */}
      <section className="max-w-6xl mx-auto px-6 -mt-6 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactInfo.map(({ icon: Icon, title, lines, color }) => (
            <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
              {lines.map((l, i) => (
                <p key={i} className={`text-sm ${i === 0 ? "text-gray-800 font-medium" : "text-gray-400"}`}>{l}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Form + Social ── */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Contact form */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="font-black text-gray-900 text-xl mb-6">
              {isEn ? "Send us a message" : "Gửi tin nhắn cho chúng tôi"}
            </h2>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <CheckCircle className="w-12 h-12 text-[#2D6A4F]" />
                <h3 className="font-bold text-gray-900 text-lg">
                  {isEn ? "Message sent!" : "Đã gửi tin nhắn!"}
                </h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  {isEn ? "Thank you for reaching out. We'll get back to you within 24 hours." : "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ."}
                </p>
                <button onClick={() => setSent(false)}
                  className="mt-2 text-sm text-[#7C2D12] hover:underline font-medium">
                  {isEn ? "Send another message" : "Gửi thêm tin nhắn"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {isEn ? "Full Name" : "Họ và tên"} <span className="text-red-500">*</span>
                    </label>
                    <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={isEn ? "Nguyen Van A" : "Nguyễn Văn A"}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {isEn ? "Phone" : "Số điện thoại"}
                    </label>
                    <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="09xxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {isEn ? "Subject" : "Chủ đề"}
                  </label>
                  <select value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all appearance-none">
                    <option value="">{isEn ? "— Select a topic —" : "— Chọn chủ đề —"}</option>
                    <option value="order">{isEn ? "Order inquiry" : "Hỏi về đơn hàng"}</option>
                    <option value="product">{isEn ? "Product question" : "Câu hỏi về sản phẩm"}</option>
                    <option value="partner">{isEn ? "Partnership / Wholesale" : "Hợp tác / Mua sỉ"}</option>
                    <option value="other">{isEn ? "Other" : "Khác"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {isEn ? "Message" : "Tin nhắn"} <span className="text-red-500">*</span>
                  </label>
                  <textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={4} placeholder={isEn ? "How can we help you?" : "Chúng tôi có thể giúp gì cho bạn?"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all resize-none" />
                </div>
                <button type="submit" disabled={sending || !form.name || !form.message}
                  className="w-full py-3.5 bg-[#7C2D12] hover:bg-[#6B2510] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {sending
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                  {sending ? (isEn ? "Sending…" : "Đang gửi…") : (isEn ? "Send Message" : "Gửi tin nhắn")}
                </button>
              </form>
            )}
          </div>

          {/* Social + Map placeholder */}
          <div className="lg:col-span-2 space-y-6">

            {/* Follow us */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                {isEn ? "Follow Us" : "Theo dõi chúng tôi"}
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Facebook, label: "Facebook", handle: "ALE Farm's", href: SOCIAL_LINKS.facebook, color: "text-blue-600 bg-blue-50" },
                  { icon: Instagram, label: "Instagram", handle: "@ale_farm.vn", href: SOCIAL_LINKS.instagram, color: "text-pink-600 bg-pink-50" },
                  { icon: TiktokIcon, label: "TikTok", handle: "@ale_farms_dayy", href: SOCIAL_LINKS.tiktok, color: "text-gray-900 bg-gray-100" },
                ].map(({ icon: Icon, label, handle, href, color }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{label}</div>
                      <div className="text-xs text-gray-400">{handle}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Farm map placeholder */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                  alt="Northwest Vietnam highlands" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="w-4 h-4 text-[#D4A853]" />
                    <span className="text-sm font-medium">
                      {isEn ? "Son La Province, Northwest Vietnam" : "Tỉnh Sơn La, Tây Bắc Việt Nam"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500">
                  {isEn ? "Our farm is located at 1,200m elevation in Son La Province, Northwest Vietnam." : "Trang trại tọa lạc ở độ cao 1.200m tại tỉnh Sơn La, vùng Tây Bắc Việt Nam."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-[#7C2D12] text-xs font-bold uppercase tracking-widest">
              {isEn ? "FAQ" : "Câu hỏi thường gặp"}
            </span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">
              {isEn ? "Quick answers" : "Giải đáp nhanh"}
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900 text-sm pr-4">{q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 pt-0">
                    <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}