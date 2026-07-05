export interface Notebook {
  id: string;
  name: string;
  description: string;
  lang?: string;
  created_at: string;
  updated_at: string;
  word_count_annotated?: number;
}

export interface Word {
  id: string;
  notebook: string;
  vocabulary: string;
  pinyin: string;
  meaning: string;
  note: string;
  is_mastered: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReadingExercise {
  question: string;
  choices: { text: string; is_correct: boolean }[];
  explanation?: string;
}

export interface ListeningExercise {
  sentence: string;
  pinyin: string;
  choices: { text: string; is_correct: boolean }[];
}

export interface FlashcardExercises {
  reading: {
    id: string;
    content: ReadingExercise;
    audio_url: string;
  };
  listening: {
    id: string;
    content: ListeningExercise;
    audio_url: string;
  };
}

export interface WritingCheckResult {
  score: number;
  is_correct: boolean;
  feedback: string;
  suggestion?: string;
}

