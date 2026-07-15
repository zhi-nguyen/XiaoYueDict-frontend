'use client';

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const params = useParams();
  const pathname = usePathname();
  const language = (params?.lang as string) || 'zh';

  if (pathname && (pathname.includes('/exam/take/') || pathname.includes('/ai-chat') || pathname.includes('/community/post/'))) {
    return null;
  }

  return (
    <footer className="w-full bg-surface border-t border-outline py-8 px-6 md:px-8 shrink-0 bg-white">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between gap-8 text-secondary">
        {/* Left Side: Brand & Copyright */}
        <div className="flex flex-col gap-2">
          <span className="font-bold text-primary text-lg tracking-tight">CnenDict</span>
          <span className="text-xs text-secondary/70">
            © {new Date().getFullYear()} CnenDict. All rights reserved.
          </span>
          <span className="text-xs text-secondary/70">
            Ứng dụng hỗ trợ học tiếng Trung & tiếng Anh toàn diện.
          </span>
        </div>

        {/* Middle Side: About & Policies Links */}
        <div className="flex flex-col gap-2.5">
          <span className="font-semibold text-primary text-xs uppercase tracking-wider">Thông tin</span>
          <div className="flex flex-col gap-1.5 text-xs">
            <Link href={`/${language}/about`} className="hover:text-primary transition-colors">
              Giới thiệu
            </Link>
            <Link href={`/${language}/terms`} className="hover:text-primary transition-colors">
              Điều khoản dịch vụ
            </Link>
            <Link href={`/${language}/community-rules`} className="hover:text-primary transition-colors">
              Điều khoản cộng đồng
            </Link>
            <Link href={`/${language}/privacy`} className="hover:text-primary transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href={`/${language}/support`} className="hover:text-primary transition-colors">
              Trợ giúp & Góp ý
            </Link>
          </div>
        </div>

        {/* Right Side: Contact Information */}
        <div className="flex flex-col gap-2.5">
          <span className="font-semibold text-primary text-xs uppercase tracking-wider">Liên hệ</span>
          <div className="flex flex-col gap-1.5 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary/60">chat</span>
              Zalo: <strong className="text-primary font-medium">0373664881</strong>
            </span>
            <a 
              href="https://www.facebook.com/nguyen.nguyen.904615" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary/60">public</span>
              Facebook: <span className="underline">Nguyen Nguyen</span>
            </a>
            <a 
              href="mailto:support@cnendict.xyz" 
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary/60">mail</span>
              Email: <span className="underline">support@cnendict.xyz</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
