"use client";

import React from 'react';
import { useParams } from 'next/navigation';

export default function AboutPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-[800px] mx-auto bg-white border border-outline rounded-[1.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
        {/* Top border strip */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-[32px] font-bold">info</span>
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Giới thiệu CnenDict</h1>
          <p className="text-secondary text-sm mt-2 max-w-md">
            Hệ thống từ điển và luyện tập ngôn ngữ thông minh, đồng hành cùng bạn trên con đường chinh phục tiếng Trung và tiếng Anh.
          </p>
        </div>

        <div className="space-y-6 text-primary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">Tầm nhìn & Sứ mệnh</h2>
            <p className="text-sm text-secondary">
              CnenDict được xây dựng với mục tiêu mang lại giải pháp học tập ngoại ngữ toàn diện và hiệu quả nhất cho người Việt Nam. Chúng tôi tin rằng công nghệ và trí tuệ nhân tạo (AI) có thể giúp việc học tiếng Trung và tiếng Anh trở nên cá nhân hóa, trực quan và thú vị hơn bao giờ hết.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">Các tính năng chính</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-secondary pl-2">
              <li><strong>Tra cứu đa ngôn ngữ:</strong> Hệ thống từ điển thông minh hỗ trợ giải nghĩa chi tiết, bính âm pinyin, ví dụ thực tế và stroke order (cách viết chữ Hán).</li>
              <li><strong>Luyện nói (Speaking):</strong> Tích hợp công nghệ nhận dạng giọng nói tiên tiến để chấm điểm phát âm trực tiếp.</li>
              <li><strong>Luyện viết (Writing):</strong> Tính năng đặt câu và viết đoạn văn tự do kết hợp chấm chữa lỗi ngữ pháp bằng AI.</li>
              <li><strong>Luyện thi (Exams):</strong> Kho đề thi phong phú và đa dạng hỗ trợ đắc lực cho các kỳ thi HSK, IELTS.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">Cam kết của chúng tôi</h2>
            <p className="text-sm text-secondary">
              Chúng tôi không ngừng nâng cấp hệ thống dữ liệu, tối ưu hóa các mô hình AI và hoàn thiện trải nghiệm giao diện người dùng để CnenDict luôn là trợ thủ đắc lực nhất trên con đường chinh phục tri thức của bạn.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
