import React from 'react';
import { Exam } from '@/types/exam';
import nextDynamic from 'next/dynamic';
import { getServerAuthToken } from '@/lib/serverAuth';

const ExamListClient = nextDynamic(() => import('./ExamListClient'), {
  ssr: true,
  loading: () => (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
});

export const dynamic = 'force-dynamic';

interface ExamPageProps {
  params: {
    lang: string;
  };
}

export default async function ExamPage({ params }: ExamPageProps) {
  let initialExams: Exam[] = [];
  const lang = params.lang || 'zh';
  
  try {
    const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    const token = await getServerAuthToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${GATEWAY_URL}/api/core/exams/?language=${lang}`, {
      method: 'GET',
      headers,
      next: { revalidate: 60 }
    });

    if (res.ok) {
      initialExams = await res.json();
    }
  } catch (err) {
    console.error('[ExamPage Server] Failed to pre-fetch exams:', err);
  }

  return <ExamListClient initialExams={initialExams} />;
}

