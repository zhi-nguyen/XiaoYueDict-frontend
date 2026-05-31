import { Exam } from '@/types/exam';
import { djangoClient } from '@/lib/apiClient';

export async function fetchExams(level?: string, language?: string): Promise<Exam[]> {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  if (language) params.append('language', language);
  
  const queryStr = params.toString();
  const path = queryStr ? `/exams?${queryStr}` : `/exams`;
  
  const res = await djangoClient.get(path);
  return res.data;
}

export async function fetchExamDetails(examId: number): Promise<Exam> {
  const path = `/exams/${examId}/full_exam`;
  const res = await djangoClient.get(path);
  return res.data;
}

