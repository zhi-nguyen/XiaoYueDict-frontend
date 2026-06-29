import React from 'react';
import Link from 'next/link';
import NotebookDetailClient from './NotebookDetailClient';
import { getServerAuthToken } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
    lang: string;
  };
}

export default async function NotebookDetailPage({ params }: PageProps) {
  const notebookId = params.id;
  const language = params.lang || 'zh';

  if (!notebookId) {
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
    const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    const token = await getServerAuthToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Fetch notebook details
    const notebookRes = await fetch(`${GATEWAY_URL}/api/core/notes/notebooks/${notebookId}/`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!notebookRes.ok) {
      throw new Error(`Failed to fetch notebook: ${notebookRes.status}`);
    }
    const notebook = await notebookRes.json();

    // Fetch words in notebook
    const wordsRes = await fetch(`${GATEWAY_URL}/api/core/notes/notebooks/${notebookId}/words/`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!wordsRes.ok) {
      throw new Error(`Failed to fetch words: ${wordsRes.status}`);
    }
    const wordsData = await wordsRes.json();
    const words = Array.isArray(wordsData) ? wordsData : (wordsData.results || []);

    return (
      <NotebookDetailClient
        notebookId={notebookId}
        initialNotebook={notebook}
        initialWords={words}
      />
    );
  } catch (err) {
    console.error('[NotebookDetailPage Server] Error fetching notebook/words:', err);
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
