export interface ZhExample {
  id: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
  audio_url: string;
}

export interface ZhWord {
  id: string;
  word: string;
  traditional: string;
  pinyin: string;
  toneless_pinyin: string;
  han_viet: string;
  translation_vi: string;
  translation_en: string;
  part_of_speech: string[];
  hsk_level: string;
  radical: string[];
  stroke_number: number[];
  components: string[][];
  synonyms: string[];
  antonyms: string[];
  tags: string[];
  word_frequency: number;
  popularity_rank: number;
  audio_url: string;
  examples: ZhExample[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
