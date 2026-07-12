export interface QuizItem {
  id: number;
  type: 'fill_blank' | 'multiple_choice' | 'listening';
  question: string;
  options?: string[];
  answer: string;
}

export interface CorrectionDetail {
  is_correct: boolean;
  mistake_highlight?: string;
  explanation?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  translation?: string;
  pinyin?: string;
  emotion?: string;
  thought?: string;
  correction?: CorrectionDetail;
  quizzes?: QuizItem[];
  isStreaming?: boolean;
}

export interface Persona {
  id: string;
  agent_name: string;
  avatar_emoji?: string;
  avatar_url?: string;
  context_setting: string;
  learning_language: string;
  user_name?: string;
  user_gender?: string;
  user_birth_year?: number;
  user_level?: string;
  relation_type?: string;
  joy_current?: number;
  sad_current?: number;
  personality_type?: string;
  personality_desc?: string;
  agent_self_ref?: string;
  user_honorific?: string;
  agent_birth_year?: number | null;
  age_diff?: number | null;
}

export const CONTEXT_SETTINGS = [
  { value: 'wuxia', label: 'Cổ trang / Giang hồ', langs: ['zh'] },
  { value: 'modern', label: 'Hiện đại / Công sở', langs: ['zh', 'en'] },
  { value: 'academic', label: 'Học đường / Học thuật', langs: ['zh', 'en'] },
];

export const ROLE_MAP: Record<string, { value: string; label: string }[]> = {
  wuxia: [
    { value: 'Sư huynh', label: 'Sư huynh (Vai Nam)' },
    { value: 'Sư tỷ', label: 'Sư tỷ (Vai Nữ)' },
    { value: 'Nữ Sư Phụ', label: 'Nữ Sư Phụ (AI là Sư phụ, Bạn là Đệ tử)' },
    { value: 'Đệ đệ', label: 'Đệ đệ' },
    { value: 'Tỷ tỷ', label: 'Tỷ tỷ' },
  ],
  modern: [
    { value: 'Đồng nghiệp', label: 'Đồng nghiệp (Colleagues)' },
    { value: 'Bạn thân', label: 'Bạn thân (Friends)' },
    { value: 'Người yêu', label: 'Người yêu / Crush' },
    { value: 'Phỏng vấn', label: 'Phỏng vấn xin việc (Job Interview)' },
  ],
  academic: [
    { value: 'Nghiên cứu sinh', label: 'Giáo sư (Oxford/PKU)' },
    { value: 'Bạn cùng lớp', label: 'Bạn cùng phòng / Học nhóm' },
  ]
};

export const LEVEL_MAP: Record<string, { value: string; label: string }[]> = {
  zh: [
    { value: 'Beginner', label: 'Sơ cấp HSK 1-2' },
    { value: 'Intermediate', label: 'Trung cấp HSK 3-4' },
    { value: 'Advanced', label: 'Cao cấp HSK 5-6' },
  ],
  en: [
    { value: 'Beginner', label: 'Sơ cấp (A1-A2)' },
    { value: 'Intermediate', label: 'Trung cấp (B1-B2)' },
    { value: 'Advanced', label: 'Cao cấp (C1-C2)' },
  ]
};

export const TOPIC_MAP: Record<string, { value: string; label: string }[]> = {
  wuxia: [
    { value: 'Daily Conversation', label: 'Hội thoại hàng ngày' },
    { value: 'Ordering Food at Tavern', label: 'Gọi món ở Tửu điếm' },
    { value: 'Asking for Directions in Jianghu', label: 'Hỏi đường hành tẩu Giang hồ' },
    { value: 'Martial Arts Sparring', label: 'Thảo luận võ học' },
  ],
  modern: [
    { value: 'Daily Conversation', label: 'Trò chuyện hàng ngày' },
    { value: 'Office Talk', label: 'Chuyện công sở' },
    { value: 'Job Interviewing', label: 'Trả lời Phỏng vấn' },
    { value: 'Shopping & Travel', label: 'Mua sắm & Du lịch' },
  ],
  academic: [
    { value: 'Research Discussion', label: 'Thảo luận Luận văn / Đề tài' },
    { value: 'Laboratory Work', label: 'Nghiên cứu phòng thí nghiệm' },
    { value: 'Debating Theory', label: 'Tranh luận lý thuyết học thuật' },
  ]
};

export const PERSONA_DETAILS: Record<string, { name: string; tag: string; desc: string }> = {
  "Sư huynh": { name: "Tiểu Nguyệt", tag: "Sư muội (Tsundere)", desc: "Sư muội bướng bỉnh nhưng cực kỳ quan tâm sư huynh. Đồng hành sửa lỗi phát âm và đàm đạo võ học!" },
  "Sư tỷ": { name: "A Lang / Junior", tag: "Sư đệ ngoan ngoãn", desc: "Sư đệ kính trọng sư tỷ, luôn lắng nghe và học hỏi võ công." },
  "Đệ đệ": { name: "Vân tỷ tỷ", tag: "Tỷ tỷ ác ma", desc: "Tỷ tỷ cực kỳ nghiêm khắc, phê bình lỗi sai không nể nang nhưng rất thương đệ đệ." },
  "Tỷ tỷ": { name: "Tiểu Bảo / Sister", tag: "Muội muội nhõng nhẽo", desc: "Muội muội bé bỏng rất thích bám lấy tỷ tỷ, hay nũng nịu đòi dạy chữ Hán." },
  "Đồng nghiệp": { name: "Tiểu Lâm / Colleague", tag: "Đồng nghiệp vui tính", desc: "Đồng nghiệp cùng phòng năng động, chia sẻ những câu chuyện và thuật ngữ công sở thực tế." },
  "Bạn thân": { name: "A Bảo / Bestie", tag: "Bạn thân chí cốt", desc: "Người bạn chí cốt cùng phòng, trò chuyện thân thiết, tự nhiên và dùng nhiều từ lóng." },
  "Người yêu": { name: "Tuyết Nhi / Crush", tag: "Crush ngọt ngào", desc: "Người yêu đáng yêu, hay dỗi hờn nhẹ nhàng khi bạn trêu đùa." },
  "Phỏng vấn": { name: "Giám khảo Lâm / Interviewer", tag: "Nhà tuyển dụng", desc: "Người phỏng vấn lịch sự nhưng nghiêm túc, đặt câu hỏi kiểm tra năng lực giao tiếp và tư duy." },
  "Nghiên cứu sinh": { name: "Giáo sư Vương / Prof. Vance", tag: "Giáo sư hướng dẫn", desc: "Giáo sư có kiến thức chuyên môn cao, giúp thẩm định bài viết học thuật và chỉ dạy kỹ lưỡng." },
  "Bạn cùng lớp": { name: "Minh Triết / Classmate", tag: "Bạn cùng lớp", desc: "Người bạn học nhóm chăm chỉ, cùng bạn giải bài tập lớn và chuẩn bị thi cử." }
};

export const EMOTION_MAP: Record<string, { emoji: string; text: string; bg: string; border: string }> = {
  neutral: { emoji: '', text: 'Bình thường', bg: 'bg-slate-100', border: 'border-slate-300' },
  happy: { emoji: '', text: 'Vui vẻ', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  excited: { emoji: '', text: 'Phấn khích', bg: 'bg-amber-50', border: 'border-amber-300' },
  cheerful: { emoji: '', text: 'Hớn hở', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  strict: { emoji: '', text: 'Nghiêm khắc', bg: 'bg-rose-50', border: 'border-rose-300' },
  concerned: { emoji: '', text: 'Lo lắng', bg: 'bg-sky-50', border: 'border-sky-300' },
  sulking: { emoji: '', text: 'Hờn dỗi', bg: 'bg-purple-50', border: 'border-purple-300' },
  angry: { emoji: '', text: 'Tức giận', bg: 'bg-red-50', border: 'border-red-300' },
};

export const VOICE_PRESETS_CLIENT: Record<string, { voice: string; rate: string; volume: string }> = {
  neutral: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', volume: '+0%' },
  happy: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+10%', volume: '+10%' },
  excited: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+15%', volume: '+20%' },
  cheerful: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+10%', volume: '+10%' },
  strict: { voice: 'zh-CN-XiaoxiaoNeural', rate: '-5%', volume: '+10%' },
  concerned: { voice: 'zh-CN-XiaoxiaoNeural', rate: '-5%', volume: '-15%' },
  sulking: { voice: 'zh-CN-XiaoxiaoNeural', rate: '-10%', volume: '-10%' },
  angry: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+20%', volume: '+25%' },
};

export const VOICE_PRESETS_CLIENT_EN: Record<string, { voice: string; rate: string; volume: string }> = {
  neutral: { voice: 'en-US-JennyNeural', rate: '+0%', volume: '+0%' },
  happy: { voice: 'en-US-JennyNeural', rate: '+5%', volume: '+5%' },
  excited: { voice: 'en-US-JennyNeural', rate: '+10%', volume: '+10%' },
  cheerful: { voice: 'en-US-JennyNeural', rate: '+5%', volume: '+5%' },
  strict: { voice: 'en-US-JennyNeural', rate: '-2%', volume: '+5%' },
  concerned: { voice: 'en-US-JennyNeural', rate: '-2%', volume: '-10%' },
  sulking: { voice: 'en-US-JennyNeural', rate: '-5%', volume: '-5%' },
  angry: { voice: 'en-US-JennyNeural', rate: '+10%', volume: '+15%' },
};
