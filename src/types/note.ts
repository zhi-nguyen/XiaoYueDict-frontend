export interface Notebook {
  id: string;
  name: string;
  description: string;
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
  created_at: string;
  updated_at: string;
}

