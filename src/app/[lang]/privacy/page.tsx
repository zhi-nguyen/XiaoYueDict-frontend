"use client";

import React from 'react';
import { useParams } from 'next/navigation';

export default function PrivacyPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-[800px] mx-auto bg-white border border-outline rounded-[1.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
        {/* Top border strip */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-[32px] font-bold">security</span>
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Chính sách bảo mật</h1>
          <p className="text-secondary text-sm mt-2">
            Chúng tôi cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn tại CnenDict.
          </p>
        </div>

        <div className="space-y-6 text-primary leading-relaxed text-sm text-secondary">
          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">1. Thông tin chúng tôi thu thập</h2>
            <p>
              Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản (tên, email, ảnh đại diện) và dữ liệu học tập (lịch sử tra cứu, tiến trình làm bài tập, kết quả luyện thi) để cá nhân hóa lộ trình học cho bạn.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">2. Cách chúng tôi sử dụng thông tin</h2>
            <p>
              Thông tin của bạn được sử dụng để duy trì, cải thiện chất lượng dịch vụ, gửi thông báo cập nhật, và bảo vệ tài khoản của bạn khỏi các hành vi truy cập trái phép.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">3. Bảo mật thông tin</h2>
            <p>
              Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức bảo mật nghiêm ngặt để ngăn chặn việc truy cập, thay đổi, tiết lộ hoặc phá hủy trái phép thông tin cá nhân của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">4. Quyền của bạn</h2>
            <p>
              Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình bất kỳ lúc nào bằng cách đăng nhập vào tài khoản hoặc liên hệ trực tiếp với đội ngũ hỗ trợ của chúng tôi qua email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
