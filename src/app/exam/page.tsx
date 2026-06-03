import React from 'react';
import { Exam } from '@/types/exam';
import ExamClient from './ExamClient';
import { getServerAuthToken } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export default async function ExamPage() {
  let initialExams: Exam[] = [];
  try {
    const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    const token = await getServerAuthToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${GATEWAY_URL}/api/core/exams/`, {
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

  return <ExamClient initialExams={initialExams} />;
}
