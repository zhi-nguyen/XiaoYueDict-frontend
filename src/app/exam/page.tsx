import React from 'react';
import { fetchExams } from '@/lib/api/exams';
import { Exam } from '@/types/exam';
import ExamClient from './ExamClient';

export const dynamic = 'force-dynamic';

export default async function ExamPage() {
  let initialExams: Exam[] = [];
  try {
    initialExams = await fetchExams();
  } catch (err) {
    console.error('[ExamPage Server] Failed to pre-fetch exams:', err);
  }

  return <ExamClient initialExams={initialExams} />;
}
