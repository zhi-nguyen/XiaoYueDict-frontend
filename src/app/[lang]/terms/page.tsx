"use client";

import React from 'react';
import { useParams } from 'next/navigation';

export default function TermsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-[800px] mx-auto bg-white border border-outline rounded-[1.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
        {/* Top border strip */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-[32px] font-bold">gavel</span>
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Điều khoản dịch vụ</h1>
          <p className="text-secondary text-sm mt-2">
            Vui lòng đọc kỹ các điều khoản dưới đây khi sử dụng dịch vụ của CnenDict.
          </p>
        </div>

        <div className="space-y-6 text-primary leading-relaxed text-sm text-secondary">
          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">1. Chấp thuận điều khoản</h2>
            <p>
              Bằng việc truy cập hoặc sử dụng ứng dụng CnenDict, bạn đồng ý tuân thủ và chịu sự ràng buộc bởi các điều khoản sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng ngừng sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">2. Tài khoản người dùng</h2>
            <p>
              Khi tạo tài khoản trên CnenDict, bạn phải cung cấp thông tin chính xác, đầy đủ và bảo mật mật khẩu của mình. Bạn hoàn toàn chịu trách nhiệm cho tất cả các hoạt động xảy ra dưới tài khoản của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">3. Sở hữu trí tuệ</h2>
            <p>
              Toàn bộ nội dung, tính năng và giao diện của CnenDict (bao gồm mã nguồn, văn bản, thiết kế, cơ sở dữ liệu) thuộc sở hữu độc quyền của CnenDict và được bảo hộ bởi luật sở hữu trí tuệ. Bạn không được sao chép, chỉnh sửa hoặc phân phối nội dung của chúng tôi mà không có sự đồng ý bằng văn bản.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-3">4. Giới hạn trách nhiệm</h2>
            <p>
              Chúng tôi cung cấp dịch vụ "như hiện có" và không cam kết dịch vụ sẽ không bao giờ gián đoạn hay không có lỗi. CnenDict sẽ không chịu trách nhiệm pháp lý đối với bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ của bạn.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
