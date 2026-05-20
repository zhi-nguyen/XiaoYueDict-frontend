# XiaoYueDict Frontend

Giao diện người dùng (Frontend) cho ứng dụng từ điển và luyện thi **XiaoYueDict**, được xây dựng bằng **Next.js 14**, **TypeScript**, và **Tailwind CSS**.

## 🌟 Tính năng chính

- **Luyện thi HSK (Exam Center)**:
  - Giao diện làm bài thi HSK trực quan và thân thiện.
  - Hỗ trợ lưu trữ trạng thái làm bài (Resumable exam state) qua localStorage để tránh mất dữ liệu khi bị ngắt quãng.
  - Phân tích và chấm điểm bài thi chi tiết.
- **Luyện nói & Đánh giá phát âm (Pronunciation Scoring)**:
  - Luyện nói tiếng Anh (sử dụng mô hình Wav2Vec2 GOP).
  - Luyện nói tiếng Trung (sử dụng mô hình Sherpa-ONNX).
  - Phản hồi phát âm chi tiết ở cấp độ từ và ký tự (Character-level alignment).
  - Bộ ghi âm (Audio Recorder) tích hợp Waveform trực quan.
- **Sổ tay từ vựng (Vocabulary Notebook)**:
  - Quản lý nhiều sổ tay từ vựng theo chủ đề.
  - Thêm từ mới với thông tin chi tiết (Từ vựng, Pinyin, Nghĩa, Ghi chú).
  - Hỗ trợ học tập, tra cứu từ vựng thông minh.
- **Luyện viết (Writing Practice)** & **Luyện đọc/học (Study)**.

## 🛠️ Công nghệ sử dụng

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [PostCSS](https://postcss.org/)
- **State Management**: React Context & Hooks
- **Icons & UI Elements**: Tùy chỉnh với CSS Variables mượt mà

## 🚀 Khởi chạy dự án

### Tiền đề
Đảm bảo bạn đã cài đặt:
- [Node.js](https://nodejs.org/) (v18.x trở lên)
- [npm](https://www.npmjs.com/) hoặc [yarn](https://yarnpkg.com/)

### Hướng dẫn cài đặt

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

2. Cấu hình biến môi trường:
   Tạo file `.env.local` ở thư mục gốc của frontend và cấu hình API gateway đến backend Django:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Chạy ứng dụng ở chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
   Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt của bạn để xem kết quả.

4. Xây dựng phiên bản Production:
   ```bash
   npm run build
   npm run start
   ```

## 📂 Cấu trúc thư mục

```text
frontend_nextjs/
├── src/
│   ├── app/                 # Định tuyến Next.js (App Router)
│   ├── components/          # Các Component dùng chung (Sidebar, Header, AudioRecorder,...)
│   ├── context/             # Quản lý State chung (LanguageContext)
│   ├── hooks/               # Các custom hooks (usePronunciationScorer, useSmartQueue)
│   ├── lib/                 # Các API client, quản lý trạng thái thi (exams, notes,...)
│   └── types/               # Các định nghĩa kiểu TypeScript
├── public/                  # Static assets
├── tailwind.config.ts       # Cấu hình Tailwind CSS
└── tsconfig.json            # Cấu hình TypeScript
```

## 🤝 Liên kết dự án

Dự án này kết nối với backend Django của **XiaoYueDict**:
- Repository Backend: [XiaoYueDict](https://github.com/zhi-nguyen/XiaoYueDict)
