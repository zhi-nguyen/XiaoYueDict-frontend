import { djangoClient } from '@/lib/apiClient';

export interface CreateReportPayload {
  report_type: 'image' | 'translation' | 'pinyin' | 'example' | 'exam_question' | 'audio' | 'other';
  content_type: 'zh_word' | 'en_word' | 'zh_example' | 'en_example' | 'exam_question' | 'exam_option';
  object_id: string;
  reason?: string;
  suggested_correction?: string;
  guest_id?: string;
}

export async function createReport(payload: CreateReportPayload): Promise<{ detail: string; id: string }> {
  const response = await djangoClient.post('/reports/', payload);
  return response.data;
}
