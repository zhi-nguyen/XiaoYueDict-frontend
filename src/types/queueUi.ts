export interface QueueStageMessages {
  stage1: string[]; // 0 - 3 giây đầu (Thông báo tiêu chuẩn)
  stage2: string[]; // 3 - 7 giây (Thông báo giảm tốc)
  stage3: string[]; // > 7 giây (Xoa dịu trải nghiệm)
}

export interface QueueUiStrategy {
  title: string;
  messages: QueueStageMessages;
  tips: string[];    // Danh sách các thông tin/mẹo hiển thị ngẫu nhiên
  errorText: string; // Nội dung thông báo lỗi đặc thù của tính năng
}
