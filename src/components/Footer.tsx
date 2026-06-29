'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const params = useParams();
  const language = (params?.lang as string) || 'zh';

  return (
    <footer className="w-full bg-surface border-t border-outline py-4 px-6 md:px-8 shrink-0">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-secondary">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-sm tracking-tight">CnenDict</span>
          <span className="text-secondary/40">|</span>
          <span>© {new Date().getFullYear()} CnenDict. All rights reserved.</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href={`/${language}/study`} className="hover:text-primary transition-colors">
            {language === 'en' ? 'Dictionary' : 'Tra từ'}
          </Link>
          <Link href={`/${language}/translate`} className="hover:text-primary transition-colors">
            {language === 'en' ? 'Translation' : 'Dịch thuật'}
          </Link>
          <Link href={`/${language}/speaking`} className="hover:text-primary transition-colors">
            {language === 'en' ? 'Speaking' : 'Luyện nói'}
          </Link>
          <Link href={`/${language}/exam`} className="hover:text-primary transition-colors">
            {language === 'en' ? 'Practice' : 'Luyện thi'}
          </Link>
          <span className="text-secondary/40">|</span>
          <a href="#" className="hover:text-primary transition-colors">
            {language === 'en' ? 'Terms' : 'Điều khoản'}
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            {language === 'en' ? 'Privacy' : 'Bảo mật'}
          </a>
        </div>
      </div>
    </footer>
  );
}
