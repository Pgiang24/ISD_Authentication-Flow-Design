import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ShieldCheck, Leaf, Flame, MapPin, Award, Users, ArrowRight, Clock } from "lucide-react";

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const values = [
    {
      icon: Flame,
      title: isEn ? "12-Hour Slow Smoke" : "Hun khói 12 giờ",
      desc:  isEn ? "Every batch is smoked over natural wood fire for at least 12 hours. No shortcuts — real smoke, real flavor." : "Mỗi mẻ được hun khói bằng củi tự nhiên ít nhất 12 giờ liên tục. Không đường tắt — khói thật, vị thật.",
      color: "bg-[#7C2D12]/10 text-[#7C2D12]",
    },
    {
      icon: Leaf,
      title: isEn ? "Zero Preservatives" : "Không chất bảo quản",
      desc:  isEn ? "Pure ingredients from our highland farm — no MSG, no artificial preservatives, no shortcuts." : "Nguyên liệu thuần từ trang trại vùng cao — không bột ngọt, không phụ gia, không gian dối.",
      color: "bg-[#2D6A4F]/10 text-[#2D6A4F]",
    },
    {
      icon: MapPin,
      title: isEn ? "Northwest Origin" : "Nguồn gốc Tây Bắc",
      desc:  isEn ? "Our farm sits at 1,200m elevation in Vietnam's Northwest highlands. Fresh mountain air, free-range animals, traditional recipes passed down for generations." : "Trang trại ở độ cao 1.200m vùng Tây Bắc Việt Nam. Không khí núi rừng, thả nuôi tự nhiên, công thức truyền đời.",
      color: "bg-[#D4A853]/20 text-[#854F0B]",
    },
    {
      icon: ShieldCheck,
      title: isEn ? "VSATTP Certified" : "Chứng nhận VSATTP",
      desc:  isEn ? "Certified by Vietnam's Ministry of Health for food safety standards. Every product is tested before leaving our farm." : "Đạt chứng nhận An Toàn Thực Phẩm của Bộ Y Tế. Mỗi sản phẩm được kiểm tra trước khi rời trang trại.",
      color: "bg-blue-50 text-blue-700",
    },
  ];

  const milestones = [
    { year: "2010", event: isEn ? "ALE Farm's founded in Son La province" : "Thành lập ALE Farm's tại tỉnh Sơn La" },
    { year: "2014", event: isEn ? "First VSATTP food safety certification" : "Đạt chứng nhận VSATTP lần đầu" },
    { year: "2017", event: isEn ? "Expanded to serve customers nationwide" : "Mở rộng phục vụ khách hàng toàn quốc" },
    { year: "2020", event: isEn ? "Launched e-commerce & direct-to-door delivery" : "Ra mắt thương mại điện tử, giao hàng tận cửa" },
    { year: "2024", event: isEn ? "5,000+ happy customers across Vietnam" : "Hơn 5.000 khách hàng trên cả nước" },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <img
          src="/images/Taybac.jpeg"
          alt={isEn ? "ALE Farm's Northwest Vietnam" : "Trang trại ALE Farm's Tây Bắc"}
          className="w-full h-[420px] md:h-[500px] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C0A00]/90 via-[#1C0A00]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-lg">
              <span className="inline-block px-3 py-1 bg-[#D4A853]/20 text-[#D4A853] text-xs font-bold uppercase tracking-widest rounded-full mb-4 border border-[#D4A853]/30">
                {isEn ? "Est. 2010 · Northwest Vietnam" : "Thành lập 2010 · Tây Bắc Việt Nam"}
              </span>
              <h1 className="text-white font-black text-4xl md:text-5xl leading-tight mb-4">
                {isEn ? <>From the<br /><span className="text-[#D4A853]">Heart of the Mountains</span></> : <>Từ trái tim<br /><span className="text-[#D4A853]">núi rừng Tây Bắc</span></>}
              </h1>
              <p className="text-white/70 text-base leading-relaxed mb-6 max-w-md">
                {isEn
                  ? "Every piece of smoked meat we craft carries the soul of the Northwest highlands — the smoke, the spice, the story."
                  : "Mỗi miếng thịt hun khói chúng tôi làm ra đều mang theo linh hồn của núi rừng Tây Bắc — khói lửa, gia vị, câu chuyện."}
              </p>
              <Link to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A853] text-[#1C0A00] rounded-full font-bold text-sm hover:bg-[#C19442] transition-colors">
                {isEn ? "Shop Our Products" : "Xem sản phẩm"} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#1C0A00] py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "2010",    label: isEn ? "Founded" : "Năm thành lập" },
              { val: "5,000+", label: isEn ? "Happy customers" : "Khách hàng" },
              { val: "12h",    label: isEn ? "Slow smoke" : "Hun khói mỗi mẻ" },
              { val: "100%",   label: isEn ? "Natural ingredients" : "Nguyên liệu tự nhiên" },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="text-[#D4A853] font-black text-2xl md:text-3xl">{val}</div>
                <div className="text-white/50 text-xs mt-1 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our story ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#7C2D12] text-xs font-bold uppercase tracking-widest">
              {isEn ? "Our Story" : "Câu chuyện của chúng tôi"}
            </span>
            <h2 className="text-3xl font-black text-gray-900 mt-2 mb-5 leading-tight">
              {isEn ? "A family recipe, a mountain tradition" : "Công thức gia đình, truyền thống núi rừng"}
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
              {isEn ? (
                <>
                  <p>ALE Farm's was born in 2010 from a simple belief: the best smoked meats come from the best ingredients, treated with respect and time. Our founder grew up in the Northwest highlands, watching grandparents cure and smoke meat over kitchen fires during winter harvests.</p>
                  <p>What started as a family practice became our mission — to preserve the authentic flavors of Northwest Vietnam and share them with the whole country. Every product we make follows the same traditional process, enhanced only by modern food safety standards.</p>
                  <p>Today we raise free-range animals on our highland farm at 1,200m elevation, using the same spices — mac khen, hat doi, fresh ginger — that have been used in this region for hundreds of years.</p>
                </>
              ) : (
                <>
                  <p>ALE Farm's ra đời năm 2010 từ một niềm tin đơn giản: thịt hun khói ngon nhất đến từ nguyên liệu tốt nhất, được đối xử bằng sự trân trọng và thời gian. Người sáng lập lớn lên ở vùng Tây Bắc, nhìn ông bà ướp và hun khói thịt trên bếp củi mỗi mùa đông.</p>
                  <p>Điều bắt đầu như tập tục gia đình đã trở thành sứ mệnh của chúng tôi — gìn giữ hương vị đích thực của Tây Bắc Việt Nam và chia sẻ với cả nước. Mỗi sản phẩm tuân theo quy trình truyền thống, chỉ được nâng cấp bởi các tiêu chuẩn an toàn thực phẩm hiện đại.</p>
                  <p>Ngày nay chúng tôi nuôi thả tự nhiên trên trang trại vùng cao 1.200m, dùng chính những loại gia vị — mắc khén, hạt dổi, gừng tươi — đã gắn liền với vùng đất này hàng trăm năm.</p>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src="/images/aboutus1.jpeg"
              alt="" className="rounded-2xl w-full h-52 object-cover" />
            <img src="/images/aboutus2.jpeg"
              alt="" className="rounded-2xl w-full h-52 object-cover mt-6" />
            <img src="/images/aboutus3.jpeg"
              alt="" className="rounded-2xl w-full h-52 object-cover" />
            <img src="/images/aboutus4.jpeg"
              alt="" className="rounded-2xl w-full h-52 object-cover mt-6" />
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[#7C2D12] text-xs font-bold uppercase tracking-widest">
              {isEn ? "What We Stand For" : "Giá trị cốt lõi"}
            </span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">
              {isEn ? "Our commitments to you" : "Cam kết của chúng tôi"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-[#FAF7F2] rounded-2xl p-6 border border-gray-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-[#7C2D12] text-xs font-bold uppercase tracking-widest">
            {isEn ? "Our Journey" : "Hành trình"}
          </span>
          <h2 className="text-3xl font-black text-gray-900 mt-2">
            {isEn ? "15 years of craftsmanship" : "15 năm chắt chiu tay nghề"}
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-[28px] top-0 bottom-0 w-px bg-[#D4A853]/30" />
          <div className="space-y-8">
            {milestones.map(({ year, event }) => (
              <div key={year} className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-full bg-[#7C2D12] flex items-center justify-center flex-shrink-0 relative z-10 shadow-md">
                  <span className="text-white font-black text-xs leading-tight text-center">{year}</span>
                </div>
                <div className="flex-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm mt-1">
                  <p className="text-gray-800 text-sm font-medium">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team CTA ── */}
      <section className="bg-[#1C0A00] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users className="w-10 h-10 text-[#D4A853] mx-auto mb-4" />
          <h2 className="text-white font-black text-3xl mb-4">
            {isEn ? "Meet the people behind the smoke" : "Những người đứng sau làn khói"}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
            {isEn
              ? "Our team of 20+ artisans, farmers, and food safety specialists work every day to bring the Northwest highlands to your table."
              : "Đội ngũ hơn 20 nghệ nhân, nông dân và chuyên gia an toàn thực phẩm làm việc mỗi ngày để đưa Tây Bắc đến bàn ăn của bạn."}
          </p>
          <Link to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D4A853] text-[#1C0A00] rounded-full font-bold hover:bg-[#C19442] transition-colors">
            {isEn ? "Explore Our Products" : "Khám phá sản phẩm"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}