import { QueueUiStrategy } from '@/types/queueUi';

export const QUEUE_STRATEGIES: Record<string, QueueUiStrategy> = {
  // CHIẾN LƯỢC: CHẤM ĐIỂM PHÁT ÂM TIẾNG TRUNG
  'speaking_zh': {
    title: 'Chấm điểm phát âm AI (Trung)',
    messages: {
      stage1: ['Hệ thống đang tiếp nhận ghi âm...', 'Đang điều phối dữ liệu sang máy chủ AI...'],
      stage2: ['Đang phân tích cấu trúc phát âm chữ Hán...', 'Đang chấm điểm thanh điệu (Pinyin)...'],
      stage3: ['Dữ liệu đang được xử lý ở hàng đợi ưu tiên, vui lòng chờ trong giây lát...']
    },
    tips: [
      'Bạn có biết: Chữ An (安) gồm bộ Miên (宀 - mái nhà) bọc trên chữ Nữ (女 - phụ nữ), ý nghĩa là nhà có người phụ nữ thì mới bình an.',
      'Mẹo nhỏ: Hãy chú ý bật hơi thật rõ khi phát âm các âm đầu như p, t, k, q, c nhé!',
      'Bạn có biết: Chữ Nhân (人) nghĩa là người. Khi hai chữ Nhân đứng cạnh nhau ta được chữ Tòng (从 - đi theo), ba chữ Nhân sẽ tạo thành chữ Chúng (众 - đông người)!',
      'Bạn có biết: Chữ Minh (明 - sáng sủa/thông minh) được ghép từ bộ Nhật (日 - mặt trời) và bộ Nguyệt (月 - mặt trăng)?',
      'Bạn có biết: Chữ Tử (子 - con) ghép với chữ Nữ (女 - phụ nữ) sẽ tạo thành chữ Hảo (好 - tốt lành, hay)?'
    ],
    errorText: 'Kết nối với máy chủ phân tích phát âm bị gián đoạn.'
  },

  // CHIẾN LƯỢC: CHẤM ĐIỂM PHÁT ÂM TIẾNG ANH
  'speaking_en': {
    title: 'Chấm điểm phát âm AI (Anh)',
    messages: {
      stage1: ['Hệ thống đang tiếp nhận ghi âm...', 'Đang điều phối dữ liệu sang máy chủ AI...'],
      stage2: ['Đang phân tích cấu trúc âm thanh tiếng Anh...', 'Đang tính toán độ chính xác và lưu loát...'],
      stage3: ['Hệ thống AI hiện đang xử lý lượng lớn yêu cầu, vui lòng chờ thêm trong giây lát...']
    },
    tips: [
      'Bạn có biết: Từ ngắn nhất và lâu đời nhất trong tiếng Anh vẫn còn sử dụng là "I" (tôi).',
      'Mẹo phát âm: Khi phát âm âm /θ/ (như trong "think"), hãy đặt nhẹ đầu lưỡi ở giữa hai hàm răng và thổi hơi nhẹ ra ngoài.',
      'Mẹo học từ vựng: Học từ vựng theo cụm từ (collocations) sẽ giúp bạn diễn đạt trôi chảy và tự nhiên hơn.',
      'Bạn có biết: Từ "Alphabet" bắt nguồn từ hai chữ cái đầu tiên trong bảng chữ cái Hy Lạp là Alpha (α) và Beta (β).',
      'Bạn có biết: "Pneumonoultramicroscopicsilicovolcanoconiosis" (bệnh bụi phổi silic) là từ dài nhất trong từ điển tiếng Anh với 45 chữ cái!'
    ],
    errorText: 'Kết nối với máy chủ phân tích phát âm tiếng Anh bị gián đoạn.'
  },

  // CHIẾN LƯỢC: DỊCH THUẬT TIẾNG TRUNG
  'translation_zh': {
    title: 'Dịch thuật AI',
    messages: {
      stage1: ['Đang kết nối hệ thống AI...', 'Đang phân tích ngữ cảnh...'],
      stage2: ['Đang dịch thuật văn bản bằng AI...', 'Đang hiệu đính và tối ưu hóa bản dịch...'],
      stage3: ['Hệ thống AI hiện đang xử lý lượng lớn yêu cầu. Dữ liệu của bạn đã được đưa vào hàng đợi ưu tiên, vui lòng chờ thêm trong giây lát...']
    },
    tips: [
      'Bạn có biết: Chữ An (安) gồm bộ Miên (宀 - mái nhà) bọc trên chữ Nữ (女 - phụ nữ). Người xưa quan niệm nhà có người phụ nữ thì mới bình an!',
      'Bạn có biết: Chữ Nhân (人) nghĩa là người. Hai chữ Nhân ghép lại là chữ Tòng (Từ - theo sau), ba chữ Nhân ghép lại thành chữ Chúng (众 - đám đông).',
      'Mẹo học: Sử dụng tính năng "Sổ tay từ vựng" thường xuyên sẽ giúp bạn lưu nhớ sâu các từ khó tra cứu.'
    ],
    errorText: 'Kết nối với máy chủ dịch thuật AI bị gián đoạn.'
  },

  // CHIẾN LƯỢC: XUẤT FILE PDF TẬP VIẾT CHỮ HÁN
  'pdf_export': {
    title: 'Khởi tạo vở tập viết chữ Hán',
    messages: {
      stage1: ['Đang thu thập danh sách từ vựng từ Sổ tay...', 'Đang khởi tạo bố cục lưới ô chữ Tianzige...'],
      stage2: ['Đang nạp bộ Font chữ Khải Thể (KaiTi) chất lượng cao...', 'Đang vẽ từng nét bút SVG theo đúng thứ tự...'],
      stage3: ['Hệ thống đang nén file và tạo trang PDF độ phân giải cao, vui lòng chờ thêm ít phút...']
    },
    tips: [
      'Thư pháp: Font chữ Khải Thể (KaiTi) hệ thống đang dùng được mô phỏng từ chữ viết tay chuẩn mực thời nhà Đường.',
      'Quy tắc thuận bút: Hãy luôn viết từ trên xuống dưới, từ trái sang phải, ngang trước sổ sau nhé!'
    ],
    errorText: 'Quá trình biên tập và xuất file PDF gặp sự cố.'
  }
};
