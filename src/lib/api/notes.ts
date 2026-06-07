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

export async function fetchNotebook(id: number): Promise<Notebook> {
  const res = await djangoClient.get(`/notes/notebooks/${id}`);
  return res.data;
}

export async function updateNotebook(id: number, data: { name?: string; description?: string }): Promise<Notebook> {
  const res = await djangoClient.patch(`/notes/notebooks/${id}`, data);
  return res.data;
}

export async function deleteNotebook(id: number): Promise<void> {
  await djangoClient.delete(`/notes/notebooks/${id}`);
}

export async function fetchWords(notebookId: number, search?: string): Promise<Word[]> {
  let path = `/notes/notebooks/${notebookId}/words`;
  if (search) {
    path += `?search=${encodeURIComponent(search)}`;
  }
  const res = await djangoClient.get(path);
  return res.data;
}

export async function createWord(notebookId: number, data: { vocabulary: string; pinyin?: string; meaning: string; notes?: string }): Promise<Word> {
  const res = await djangoClient.post(`/notes/notebooks/${notebookId}/words`, data);
  return res.data;
}

export async function updateWord(notebookId: number, wordId: number, data: { vocabulary?: string; pinyin?: string; meaning?: string; notes?: string }): Promise<Word> {
  const res = await djangoClient.patch(`/notes/notebooks/${notebookId}/words/${wordId}`, data);
  return res.data;
}

export async function deleteWord(notebookId: number, wordId: number): Promise<void> {
  await djangoClient.delete(`/notes/notebooks/${notebookId}/words/${wordId}`);
}
