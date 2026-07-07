"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/* ── Constants ── */
const EFFECTIVE_DATE = "01/07/2026";

const FEATURES = [
  {
    icon: "dictionary",
    title: "Từ điển đa ngôn ngữ",
    desc: "Tra cứu Trung-Việt, Anh-Việt với giải nghĩa chi tiết, bính âm pinyin, stroke order và ví dụ thực tế từ cơ sở dữ liệu khổng lồ.",
    gradient: "from-blue-500 to-cyan-400",
    bgGlow: "bg-blue-500/10",
  },
  {
    icon: "record_voice_over",
    title: "Luyện nói & Chấm phát âm",
    desc: "Ghi âm và nhận phản hồi chi tiết về phát âm từng từ, từng âm tiết. Chấm điểm bằng công nghệ nhận dạng giọng nói AI tiên tiến.",
    gradient: "from-emerald-500 to-teal-400",
    bgGlow: "bg-emerald-500/10",
  },
  {
    icon: "edit_note",
    title: "Luyện viết & Chữa lỗi AI",
    desc: "Viết câu tự do, nhận phản hồi ngữ pháp chi tiết từ AI. Phân tích lỗi, gợi ý sửa và giải thích quy tắc ngôn ngữ.",
    gradient: "from-violet-500 to-purple-400",
    bgGlow: "bg-violet-500/10",
  },
  {
    icon: "style",
    title: "Flashcard thông minh",
    desc: "Hệ thống flashcard kết hợp bài tập reading/listening được sinh tự động bởi AI, cá nhân hóa theo lộ trình học của bạn.",
    gradient: "from-amber-500 to-orange-400",
    bgGlow: "bg-amber-500/10",
  },
  {
    icon: "school",
    title: "Luyện thi HSK & IELTS",
    desc: "Kho đề thi phong phú với bộ đếm thời gian, chấm điểm tự động, phân tích chi tiết từng câu hỏi và theo dõi tiến trình.",
    gradient: "from-rose-500 to-pink-400",
    bgGlow: "bg-rose-500/10",
  },
  {
    icon: "translate",
    title: "Dịch thuật thông minh",
    desc: "Dịch văn bản Trung-Việt, Anh-Việt song song. Khi không tìm thấy trong kho dữ liệu, AI sẽ tự động dịch và lưu kết quả.",
    gradient: "from-indigo-500 to-blue-400",
    bgGlow: "bg-indigo-500/10",
  },
];

const AI_TECH = [
  {
    icon: "neurology",
    name: "Google Gemini",
    role: "Dịch thuật, sinh bài tập, chấm chữa ngữ pháp",
  },
  {
    icon: "graphic_eq",
    name: "Azure Speech",
    role: "Chấm phát âm, chuyển văn bản thành giọng nói",
  },
  {
    icon: "image",
    name: "AI Image",
    role: "Sinh hình minh họa từ vựng tự động",
  },
];

/* ── Intersection Observer Hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Page Component ── */
export default function AboutPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  const featuresSection = useInView(0.1);
  const aiSection = useInView(0.2);
  const commitSection = useInView(0.2);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 relative overflow-hidden">

      {/* ══════ HERO SECTION ══════ */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(107,144,128,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 50% 80%, rgba(59,130,246,0.2) 0%, transparent 50%)`,
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-10 left-[10%] w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-10 right-[15%] w-56 h-56 bg-sage/20 rounded-full blur-[80px] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-[1200px] mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-xs mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Phiên bản mới nhất — Cập nhật liên tục
          </div>

          {/* Logo + Title */}
          <div className="animate-slide-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="material-symbols-outlined text-white text-[40px]">auto_stories</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Cnen<span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Dict</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-lg mx-auto leading-relaxed font-light">
              Hệ thống từ điển và luyện tập ngôn ngữ thông minh — đồng hành cùng bạn chinh phục tiếng Trung & tiếng Anh.
            </p>
          </div>

          {/* Effective Date */}
          <p className="mt-6 text-xs text-slate-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Ngày hiệu lực: {EFFECTIVE_DATE}
          </p>
        </div>
      </section>

      {/* ══════ VISION & MISSION ══════ */}
      <section className="py-16 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-white border border-outline rounded-[1.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-sage to-blue-500" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-600 text-[24px]">visibility</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">Tầm nhìn & Sứ mệnh</h2>
                <p className="text-xs text-secondary mt-0.5">Vì sao CnenDict ra đời?</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-secondary leading-relaxed">
              <p>
                <strong className="text-primary">CnenDict</strong> được xây dựng với sứ mệnh mang lại giải pháp học tập ngoại ngữ <em>toàn diện, hiệu quả và cá nhân hóa</em> nhất cho người Việt Nam. Chúng tôi tin rằng công nghệ AI có thể phá bỏ rào cản ngôn ngữ, biến việc học tiếng Trung và tiếng Anh trở nên trực quan, thú vị và đạt kết quả thực sự.
              </p>
              <p>
                Không đơn thuần là một ứng dụng từ điển, CnenDict là <strong className="text-primary">hệ sinh thái học tập</strong> tích hợp tra cứu, luyện nói, luyện viết, flashcard và luyện thi — tất cả được hỗ trợ bởi trí tuệ nhân tạo thế hệ mới để cá nhân hóa lộ trình học theo năng lực và mục tiêu của từng người dùng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FEATURES GRID ══════ */}
      <section ref={featuresSection.ref} className="py-8 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary">Các tính năng chính</h2>
            <p className="text-sm text-secondary mt-2">Tất cả những gì bạn cần để chinh phục ngoại ngữ, trong một nền tảng duy nhất.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`group relative bg-white border border-outline rounded-2xl p-5 transition-all duration-500 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 cursor-default ${
                  featuresSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl ${f.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                    <span className="material-symbols-outlined text-white text-[20px]">{f.icon}</span>
                  </div>
                  <h3 className="font-bold text-primary text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ AI TECHNOLOGY ══════ */}
      <section ref={aiSection.ref} className="py-16 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary rounded-[1.5rem] p-6 md:p-10 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 30% 40%, rgba(99,102,241,0.4) 0%, transparent 50%),
                                radial-gradient(circle at 70% 70%, rgba(107,144,128,0.3) 0%, transparent 50%)`,
            }} />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-300 text-[22px]">smart_toy</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Công nghệ AI nền tảng</h2>
                  <p className="text-xs text-slate-400">Sức mạnh đằng sau CnenDict</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mt-4 mb-8">
                CnenDict tích hợp các mô hình AI hàng đầu thế giới để mang lại trải nghiệm học tập vượt trội. Mọi nội dung do AI tạo ra đều được gắn nhãn rõ ràng và chỉ mang tính chất <strong className="text-white">tham khảo</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AI_TECH.map((tech, i) => (
                  <div
                    key={i}
                    className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition-all duration-700 hover:bg-white/10 ${
                      aiSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                    style={{ transitionDelay: `${i * 150}ms` }}
                  >
                    <span className="material-symbols-outlined text-indigo-300 text-[28px] mb-2 block">{tech.icon}</span>
                    <h3 className="font-bold text-white text-sm">{tech.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tech.role}</p>
                  </div>
                ))}
              </div>

              {/* AI Disclaimer mini */}
              <div className="mt-8 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <span className="material-symbols-outlined text-amber-400 text-[20px] shrink-0 mt-0.5">info</span>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300">Lưu ý:</strong> Nội dung do AI tạo ra (bản dịch, bài tập, phản hồi ngữ pháp, hình ảnh minh họa) chỉ mang tính tham khảo và có thể không chính xác 100%. Vui lòng tham khảo thêm{' '}
                  <Link href={`/${lang}/terms`} className="underline text-amber-300 hover:text-amber-200 transition-colors">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  để biết chi tiết.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ COMMITMENT ══════ */}
      <section ref={commitSection.ref} className="py-8 pb-16 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div
            className={`bg-white border border-outline rounded-[1.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden transition-all duration-700 ${
              commitSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-sage to-teal-500" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">verified</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">Cam kết của chúng tôi</h2>
                <p className="text-xs text-secondary mt-0.5">Giá trị cốt lõi xuyên suốt</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                { icon: "update", title: "Cập nhật liên tục", desc: "Dữ liệu từ vựng, đề thi và mô hình AI được cập nhật thường xuyên để đảm bảo chất lượng tốt nhất." },
                { icon: "security", title: "Bảo mật tuyệt đối", desc: "Dữ liệu cá nhân và quá trình học tập được bảo vệ bằng mã hóa và các biện pháp bảo mật nghiêm ngặt." },
                { icon: "support_agent", title: "Hỗ trợ tận tâm", desc: "Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ và lắng nghe phản hồi từ cộng đồng người dùng." },
                { icon: "diversity_3", title: "Cộng đồng là trọng tâm", desc: "Mọi tính năng đều được phát triển dựa trên nhu cầu thực tế và phản hồi từ người học." },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-outline/50 transition-all duration-700 ${
                    commitSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${(i + 1) * 120}ms` }}
                >
                  <span className="material-symbols-outlined text-sage text-[20px] mt-0.5 shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold text-primary text-sm">{item.title}</h3>
                    <p className="text-xs text-secondary mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
