import { djangoClient } from '@/lib/apiClient';

export async function fetchDeepPracticeExercises(word: string, lang: string) {
  const res = await djangoClient.get('/flashcard/exercises/', {
    params: { word, lang },
  });
  return res.data; // { status: 'SUCCESS' | 'PENDING', exercises?: {...}, task_id?: string }
}

export async function checkDeepPracticeWritingExercise(sentence: string, targetWord: string, lang: string) {
  const res = await djangoClient.post('/flashcard/check-writing/', {
    sentence,
    target_word: targetWord,
    lang,
  });
  return res.data; // { status: 'PENDING', task_id: string }
}

export async function completeDeepPracticeExercise(exerciseId: string) {
  const res = await djangoClient.post('/flashcard/exercises/complete/', {
    exercise_id: exerciseId,
  });
  return res.data;
}

export async function checkGeneralWriting(sentence: string, lang: string) {
  const res = await djangoClient.post('/writing', {
    sentence,
    lang,
  });
  return res.data;
}
