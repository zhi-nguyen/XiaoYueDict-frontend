import React from 'react';
import Link from 'next/link';
import { fetchNotebook, fetchWords } from '@/lib/api/notes';
import NotebookDetailClient from './NotebookDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
    lang: string;
  };
}

export default async function NotebookDetailPage({ params }: PageProps) {
  const notebookId = parseInt(params.id, 10);
  const language = params.lang || 'zh';

  if (isNaN(notebookId)) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">
          ID Sổ tay không hợp lệ
        </div>
        <Link href={`/${language}/notes`} className="text-primary hover:underline">&larr; Quay lại danh sách</Link>
      </div>
    );
  }

  try {
    const notebook = await fetchNotebook(notebookId);
    const words = await fetchWords(notebookId);

    return (
      <NotebookDetailClient
        notebookId={notebookId}
        initialNotebook={notebook}
        initialWords={words}
      />
    );
  } catch (err) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">
          Không thể tải dữ liệu sổ tay hoặc sổ tay không tồn tại.
        </div>
        <Link href={`/${language}/notes`} className="text-primary hover:underline">&larr; Quay lại danh sách</Link>
      </div>
    );
  }
}
