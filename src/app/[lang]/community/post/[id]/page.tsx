'use client';

import React from 'react';
import { PostDetail } from '@/components/community/PostDetail';

interface PostDetailPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const lang = params.lang || 'zh';
  const postId = params.id;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0b1c30] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl mx-auto py-4">
        <PostDetail postId={postId} lang={lang} />
      </div>
    </div>
  );
}
