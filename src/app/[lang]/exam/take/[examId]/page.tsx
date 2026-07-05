'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ExamTakeClient = dynamic(() => import('./ExamTakeClient'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-20 min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <span className="ml-3 font-semibold text-primary text-sm font-lexend">
        Đang tải bài thi...
      </span>
    </div>
  ),
});

export default function ExamTakePage() {
  return <ExamTakeClient />;
}
