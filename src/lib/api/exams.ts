import { Exam } from '@/types/exam';

const isServer = typeof window === 'undefined';

const getUrl = (path: string) => {
  if (isServer) {
    const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost';
    const serverPath = path.replace(/^\/api\/exams\//, '/api/core/exams/');
    return `${GATEWAY_URL}${serverPath}`;
  }
  return path;
};

export async function fetchExams(level?: string, language?: string): Promise<Exam[]> {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  if (language) params.append('language', language);
  
  const queryStr = params.toString();
  const path = queryStr 
    ? `/api/exams/?${queryStr}` 
    : `/api/exams/`;
  const url = getUrl(path);
    
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Exams list can be cached but let's revalidate every 60 seconds
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch exams');
  }

  return res.json();
}

export async function fetchExamDetails(examId: number): Promise<Exam> {
  const url = getUrl(`/api/exams/${examId}/full_exam/`);
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Real-time data for taking exam
  });

  if (!res.ok) {
    throw new Error('Failed to fetch exam details');
  }

  return res.json();
}

