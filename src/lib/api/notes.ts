import { Notebook, Word } from '@/types/note';
import { djangoClient } from '@/lib/apiClient';

export async function fetchNotebooks(lang?: string): Promise<Notebook[]> {
  const path = lang ? `/notes/notebooks?lang=${lang}` : '/notes/notebooks';
  const res = await djangoClient.get(path);
  return res.data;
}

export async function createNotebook(data: { name: string; description?: string }, lang?: string): Promise<Notebook> {
  const path = lang ? `/notes/notebooks?lang=${lang}` : '/notes/notebooks';
  const res = await djangoClient.post(path, data);
  return res.data;
}

export async function fetchNotebook(id: string): Promise<Notebook> {
  const res = await djangoClient.get(`/notes/notebooks/${id}`);
  return res.data;
}

export async function updateNotebook(id: string, data: { name?: string; description?: string }): Promise<Notebook> {
  const res = await djangoClient.patch(`/notes/notebooks/${id}`, data);
  return res.data;
}

export async function deleteNotebook(id: string): Promise<void> {
  await djangoClient.delete(`/notes/notebooks/${id}`);
}

export async function fetchWords(notebookId: string, search?: string, mastered?: boolean | null): Promise<Word[]> {
  const params = new URLSearchParams();
  params.set('paginate', 'false');
  if (search) {
    params.set('search', search);
  }
  if (mastered === true) {
    params.set('mastered', 'true');
  } else if (mastered === false) {
    params.set('mastered', 'false');
  }
  const query = params.toString();
  const path = `/notes/notebooks/${notebookId}/words/${query ? '?' + query : ''}`;
  const res = await djangoClient.get(path);
  return Array.isArray(res.data) ? res.data : (res.data.results || []);
}

export async function cloneSystemNotebook(systemNotebookKey: string, lang: string): Promise<Notebook> {
  const res = await djangoClient.post('/notes/clone-system-notebook/', {
    system_notebook_key: systemNotebookKey,
    lang,
  });
  return res.data;
}

export async function toggleWordMastered(notebookId: string, wordId: string, isMastered: boolean): Promise<Word> {
  const res = await djangoClient.patch(`/notes/notebooks/${notebookId}/words/${wordId}/`, {
    is_mastered: isMastered,
  });
  return res.data;
}

export async function createWord(
  notebookId: string,
  data: { vocabulary: string; pinyin?: string; meaning: string; note?: string; notes?: string }
): Promise<Word> {
  const requestData = {
    vocabulary: data.vocabulary,
    pinyin: data.pinyin,
    meaning: data.meaning,
    note: data.note || data.notes || '',
  };
  const res = await djangoClient.post(`/notes/notebooks/${notebookId}/words/`, requestData);
  return res.data;
}

export async function updateWord(
  notebookId: string,
  wordId: string,
  data: { vocabulary?: string; pinyin?: string; meaning?: string; note?: string; notes?: string }
): Promise<Word> {
  const requestData: any = { ...data };
  if ('notes' in data) {
    requestData.note = data.note || data.notes;
    delete requestData.notes;
  }
  const res = await djangoClient.patch(`/notes/notebooks/${notebookId}/words/${wordId}/`, requestData);
  return res.data;
}

export async function deleteWord(notebookId: string, wordId: string): Promise<void> {
  await djangoClient.delete(`/notes/notebooks/${notebookId}/words/${wordId}/`);
}


