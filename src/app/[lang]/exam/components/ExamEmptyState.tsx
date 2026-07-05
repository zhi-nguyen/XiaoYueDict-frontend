'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function ExamEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 border border-outline/30 text-on-surface-variant/50">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-primary font-lexend mb-1">
        Không tìm thấy đề thi
      </h3>
      <p className="text-sm text-on-surface-variant font-medium font-inter max-w-sm">
        Chưa có đề thi nào trong hệ thống hoặc mục bạn chọn hiện chưa có dữ liệu.
      </p>
    </div>
  );
}
