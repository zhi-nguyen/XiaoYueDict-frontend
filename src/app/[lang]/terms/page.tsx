"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const EFFECTIVE_DATE = "01/07/2026";
const LAST_UPDATED = "01/07/2026";

/* ── Reusable Section Component ── */
function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="text-lg font-bold text-primary border-b border-outline/50 pb-2 mb-4 flex items-baseline gap-2">
        <span className="text-xs font-semibold text-secondary bg-slate-100 rounded-md px-2 py-0.5">{number}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-[1200px] mx-auto bg-white border border-outline rounded-[1.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
        {/* Top border strip */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-[32px]">gavel</span>
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Điều khoản dịch vụ</h1>
          <p className="text-secondary text-sm mt-2 max-w-lg">
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ của CnenDict.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-secondary/70">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              Ngày hiệu lực: {EFFECTIVE_DATE}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">update</span>
              Cập nhật lần cuối: {LAST_UPDATED}
            </span>
          </div>
        </div>

        {/* ── Table of Contents ── */}
        <nav className="mb-10 bg-slate-50 border border-outline/50 rounded-xl p-4">
          <h3 className="font-semibold text-primary text-xs uppercase tracking-wider mb-3">Mục lục</h3>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-secondary">
            {[
              "Chấp thuận điều khoản",
              "Tài khoản người dùng",
              "Mô tả dịch vụ",
              "Nội dung do AI tạo ra",
              "Sở hữu trí tuệ",
              "Quy tắc sử dụng",
              "Thanh toán & Gói dịch vụ",
              "Giới hạn trách nhiệm",
              "Thay đổi điều khoản",
              "Luật áp dụng & Liên hệ",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-primary/40 font-mono text-[10px] w-5 text-right shrink-0">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Content ── */}
        <div className="space-y-8">

          {/* ── 1. Chấp thuận ── */}
          <Section number="Điều 1" title="Chấp thuận điều khoản">
            <p>
              Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ tính năng nào trên ứng dụng CnenDict (bao gồm website và các dịch vụ liên kết), bạn xác nhận rằng bạn đã đọc, hiểu rõ và đồng ý tuân thủ toàn bộ các điều khoản được nêu trong tài liệu này.
            </p>
            <p>
              Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng ngừng sử dụng dịch vụ ngay lập tức. Việc tiếp tục sử dụng sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp thuận các thay đổi mới.
            </p>
          </Section>

          {/* ── 2. Tài khoản ── */}
          <Section number="Điều 2" title="Tài khoản người dùng">
            <p>Khi tạo tài khoản trên CnenDict, bạn cam kết:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Cung cấp thông tin đăng ký chính xác, đầy đủ và cập nhật.</li>
              <li>Bảo mật thông tin đăng nhập (mật khẩu, token xác thực) và không chia sẻ cho bất kỳ bên thứ ba nào.</li>
              <li>Chịu trách nhiệm hoàn toàn cho mọi hoạt động xảy ra dưới tài khoản của mình, bao gồm cả hành vi truy cập trái phép do lỗi bảo mật từ phía người dùng.</li>
              <li>Thông báo cho CnenDict ngay lập tức nếu phát hiện truy cập trái phép vào tài khoản.</li>
            </ul>
            <p>
              CnenDict có quyền đình chỉ hoặc xóa tài khoản vi phạm điều khoản sử dụng mà không cần thông báo trước.
            </p>
          </Section>

          {/* ── 3. Mô tả dịch vụ ── */}
          <Section number="Điều 3" title="Mô tả dịch vụ">
            <p>CnenDict cung cấp các dịch vụ học tập ngôn ngữ bao gồm nhưng không giới hạn:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-primary">Tra cứu từ điển:</strong> Từ điển Trung-Việt, Anh-Việt với giải nghĩa, bính âm, ví dụ và stroke order.</li>
              <li><strong className="text-primary">Dịch thuật thông minh:</strong> Dịch văn bản đa ngôn ngữ, có hỗ trợ AI khi không tìm thấy trong cơ sở dữ liệu.</li>
              <li><strong className="text-primary">Luyện nói:</strong> Ghi âm và chấm điểm phát âm bằng công nghệ nhận dạng giọng nói.</li>
              <li><strong className="text-primary">Luyện viết:</strong> Viết câu tự do và nhận phản hồi ngữ pháp từ AI.</li>
              <li><strong className="text-primary">Flashcard & Bài tập:</strong> Hệ thống flashcard với bài tập reading/listening được sinh tự động.</li>
              <li><strong className="text-primary">Luyện thi:</strong> Kho đề thi HSK, IELTS với chấm điểm và phân tích.</li>
              <li><strong className="text-primary">Text-to-Speech:</strong> Chuyển văn bản thành giọng nói phát âm chuẩn.</li>
            </ul>
          </Section>

          {/* ── 4. AI DISCLAIMER ── */}
          <div className="relative">
            {/* Accent left border */}
            <div className="absolute top-0 left-0 bottom-0 w-[4px] rounded-full bg-gradient-to-b from-amber-500 via-orange-500 to-red-500" />

            <div className="pl-6">
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-5 md:p-6">
                {/* Header with warning icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 rounded-md px-2 py-0.5">Điều 4</span>
                      Nội dung do AI tạo ra — Miễn trừ trách nhiệm
                    </h2>
                    <p className="text-xs text-amber-700/70 mt-0.5">Điều khoản quan trọng — Vui lòng đọc kỹ</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-secondary leading-relaxed">
                  {/* 4.1 Khai báo */}
                  <div>
                    <h3 className="font-semibold text-primary text-sm mb-2">4.1. Khai báo nội dung AI</h3>
                    <p>CnenDict sử dụng các mô hình Trí tuệ nhân tạo (AI) để tạo ra và hỗ trợ nhiều loại nội dung trên nền tảng, bao gồm nhưng không giới hạn:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                      <li><strong className="text-primary">Bản dịch AI:</strong> Khi hệ thống không tìm thấy kết quả trong cơ sở dữ liệu, AI sẽ tự động dịch và trả kết quả cho người dùng.</li>
                      <li><strong className="text-primary">Bài tập Flashcard:</strong> Bài tập reading và listening được sinh tự động bởi mô hình ngôn ngữ lớn (LLM).</li>
                      <li><strong className="text-primary">Chấm chữa ngữ pháp:</strong> Phản hồi về lỗi ngữ pháp, gợi ý sửa câu và giải thích quy tắc ngôn ngữ do AI tạo ra.</li>
                      <li><strong className="text-primary">Hình ảnh minh họa:</strong> Hình ảnh minh họa từ vựng có thể được sinh bởi dịch vụ AI image generation.</li>
                      <li><strong className="text-primary">Âm thanh phát âm:</strong> Giọng nói tổng hợp (Text-to-Speech) được tạo bởi công nghệ AI.</li>
                      <li><strong className="text-primary">Đánh giá phát âm:</strong> Điểm số và phản hồi phát âm được xử lý bởi mô hình nhận dạng giọng nói AI.</li>
                    </ul>
                  </div>

                  {/* 4.2 Tuyên bố miễn trừ */}
                  <div className="bg-white/70 border border-amber-200/50 rounded-lg p-4">
                    <h3 className="font-semibold text-primary text-sm mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">warning</span>
                      4.2. Tuyên bố miễn trừ trách nhiệm
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <strong className="text-primary">Nội dung do AI tạo ra chỉ mang tính chất tham khảo</strong> và không được coi là nguồn thông tin chính xác tuyệt đối. Mặc dù CnenDict nỗ lực sử dụng các mô hình AI tiên tiến nhất, chúng tôi <strong className="text-red-600">KHÔNG đảm bảo</strong> rằng:
                      </p>
                      <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Bản dịch AI luôn chính xác về ngữ nghĩa, ngữ pháp và ngữ cảnh sử dụng.</li>
                        <li>Bài tập do AI sinh ra không có lỗi về nội dung, đáp án hoặc logic.</li>
                        <li>Phản hồi ngữ pháp AI luôn đúng và phù hợp với mọi ngữ cảnh.</li>
                        <li>Điểm số chấm phát âm phản ánh chính xác 100% năng lực thực tế của người dùng.</li>
                        <li>Hình ảnh minh họa AI luôn phù hợp và chính xác về mặt văn hóa, ngữ cảnh.</li>
                      </ul>
                    </div>
                  </div>

                  {/* 4.3 Khuyến cáo */}
                  <div>
                    <h3 className="font-semibold text-primary text-sm mb-2">4.3. Khuyến cáo người dùng</h3>
                    <p>Chúng tôi khuyến khích người dùng:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                      <li>Luôn kiểm tra chéo nội dung AI với các nguồn uy tín khác (từ điển chính thống, giáo viên, tài liệu học thuật).</li>
                      <li>Không hoàn toàn phụ thuộc vào kết quả AI cho các quyết định quan trọng (thi cử, đánh giá năng lực chính thức).</li>
                      <li>Sử dụng nội dung AI như một công cụ bổ trợ, không phải nguồn thông tin duy nhất.</li>
                      <li>Báo cáo nội dung AI không chính xác thông qua chức năng báo cáo trên ứng dụng để giúp chúng tôi cải thiện.</li>
                    </ul>
                  </div>

                  {/* 4.4 Giới hạn trách nhiệm AI */}
                  <div>
                    <h3 className="font-semibold text-primary text-sm mb-2">4.4. Giới hạn trách nhiệm đối với nội dung AI</h3>
                    <p>CnenDict <strong className="text-primary">không chịu trách nhiệm pháp lý</strong> đối với:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                      <li>Bất kỳ thiệt hại trực tiếp, gián tiếp, đặc biệt hoặc hậu quả nào phát sinh từ việc sử dụng hoặc tin tưởng vào nội dung do AI tạo ra.</li>
                      <li>Kết quả thi cử, đánh giá năng lực hoặc quyết định cá nhân/nghề nghiệp dựa trên phản hồi AI của ứng dụng.</li>
                      <li>Sự khác biệt giữa nội dung AI và thực tế ngôn ngữ học, bao gồm cả phương ngữ, biến thể vùng miền.</li>
                      <li>Nội dung AI có thể bị hiểu sai do sự khác biệt văn hóa hoặc ngữ cảnh cụ thể.</li>
                    </ul>
                  </div>

                  {/* 4.5 Cam kết cải tiến */}
                  <div className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-200/50 rounded-lg p-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">auto_fix_high</span>
                    <div>
                      <h3 className="font-semibold text-primary text-sm mb-1">4.5. Cam kết cải tiến liên tục</h3>
                      <p className="text-xs">
                        CnenDict cam kết không ngừng nâng cấp các mô hình AI, mở rộng cơ sở dữ liệu và cải thiện độ chính xác của nội dung. Tuy nhiên, cam kết này <strong className="text-primary">không đồng nghĩa</strong> với việc đảm bảo nội dung AI sẽ hoàn toàn không có sai sót tại bất kỳ thời điểm nào.
                      </p>
                    </div>
                  </div>

                  {/* 4.6 Báo cáo bản quyền */}
                  <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-200/50 rounded-lg p-3">
                    <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0 mt-0.5">copyright</span>
                    <div>
                      <h3 className="font-semibold text-primary text-sm mb-1">4.6. Báo cáo vi phạm bản quyền đối với nội dung AI</h3>
                      <p className="text-xs">
                        Nếu bạn phát hiện bất kỳ nội dung nào (bao gồm văn bản, hình ảnh hoặc âm thanh) do AI tạo ra trên hệ thống CnenDict có dấu hiệu xâm phạm quyền tác giả hoặc quyền sở hữu trí tuệ của bạn hoặc của một chủ thể mà bạn đại diện hợp pháp, xin vui lòng gửi thông báo cho chúng tôi kèm theo bằng chứng chứng minh quyền sở hữu hợp pháp. Bạn có thể gửi báo cáo trực tiếp thông qua <strong className="text-primary">tính năng báo cáo lỗi/vi phạm hiện có trên ứng dụng</strong>, hoặc liên hệ qua email <a href="mailto:support@cnendict.xyz" className="text-primary underline font-medium">support@cnendict.xyz</a> / số điện thoại (Zalo) <strong className="text-primary">0373664881</strong>. Chúng tôi cam kết tiếp nhận, xác minh và gỡ bỏ các nội dung này trong thời gian sớm nhất.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Sở hữu trí tuệ ── */}
          <Section number="Điều 5" title="Sở hữu trí tuệ">
            <p>
              Toàn bộ nội dung, tính năng và giao diện của CnenDict — bao gồm nhưng không giới hạn: mã nguồn, thiết kế giao diện, cơ sở dữ liệu từ vựng, đề thi, hình ảnh, âm thanh, và các tài liệu khác — thuộc sở hữu độc quyền của CnenDict và được bảo hộ bởi luật sở hữu trí tuệ Việt Nam và các điều ước quốc tế liên quan.
            </p>
            <p>Bạn <strong className="text-primary">không được phép</strong>:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Sao chép, tải xuống, phân phối hoặc tái xuất bản nội dung của CnenDict dưới bất kỳ hình thức nào mà không có sự đồng ý bằng văn bản.</li>
              <li>Sử dụng kỹ thuật dịch ngược (reverse engineering), giải mã hoặc trích xuất mã nguồn ứng dụng.</li>
              <li>Sử dụng bot, crawler hoặc công cụ tự động để thu thập dữ liệu từ hệ thống.</li>
            </ul>
          </Section>

          {/* ── 6. Quy tắc sử dụng ── */}
          <Section number="Điều 6" title="Quy tắc sử dụng">
            <p>Khi sử dụng CnenDict, bạn cam kết <strong className="text-primary">không</strong> thực hiện các hành vi sau:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Sử dụng dịch vụ cho mục đích phi pháp hoặc vi phạm pháp luật Việt Nam.</li>
              <li>Gửi nội dung vi phạm, xúc phạm, đe dọa hoặc quấy rối người khác thông qua hệ thống.</li>
              <li>Cố tình lạm dụng tài nguyên AI (spam request, tấn công từ chối dịch vụ) nhằm gây quá tải hệ thống.</li>
              <li>Chia sẻ tài khoản trả phí cho nhiều người sử dụng đồng thời.</li>
              <li>Can thiệp, phá hoại hoặc gây gián đoạn hoạt động bình thường của hệ thống.</li>
            </ul>
            <p>
              Vi phạm quy tắc sử dụng có thể dẫn đến việc đình chỉ tài khoản tạm thời hoặc vĩnh viễn, tùy theo mức độ nghiêm trọng.
            </p>
          </Section>

          {/* ── 7. Thanh toán ── */}
          <Section number="Điều 7" title="Thanh toán & Gói dịch vụ">
            <p>CnenDict cung cấp nhiều gói dịch vụ với các mức tính năng và hạn mức khác nhau:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-primary">Free:</strong> Truy cập cơ bản với hạn mức sử dụng AI giới hạn.</li>
              <li><strong className="text-primary">Plus / Pro / Premium:</strong> Các gói trả phí với hạn mức AI cao hơn, tính năng nâng cao và ưu tiên hỗ trợ.</li>
            </ul>
            <p>Chính sách thanh toán:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Thanh toán được thực hiện qua các phương thức được hỗ trợ trên nền tảng (chuyển khoản ngân hàng, QR code).</li>
              <li>Gói dịch vụ được tính theo chu kỳ (tháng/năm) và tự động gia hạn trừ khi bạn hủy trước ngày gia hạn.</li>
              <li>CnenDict có quyền thay đổi giá cả và cấu trúc gói dịch vụ với thông báo trước ít nhất 15 ngày.</li>
              <li>Chính sách hoàn tiền áp dụng theo quy định riêng, được công bố trên trang Hỗ trợ.</li>
            </ul>
          </Section>

          {/* ── 8. Giới hạn trách nhiệm ── */}
          <Section number="Điều 8" title="Giới hạn trách nhiệm chung">
            <p>
              Dịch vụ CnenDict được cung cấp <strong className="text-primary">{'"'}như hiện có{'"'} (as-is)</strong> và <strong className="text-primary">{'"'}theo khả năng sẵn có{'"'} (as available)</strong>. Chúng tôi không cam kết rằng:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Dịch vụ sẽ hoạt động liên tục, không bị gián đoạn hoặc hoàn toàn không có lỗi kỹ thuật.</li>
              <li>Tất cả dữ liệu, nội dung và kết quả (bao gồm cả nội dung AI) đều chính xác tuyệt đối.</li>
              <li>Dịch vụ sẽ đáp ứng mọi yêu cầu hoặc kỳ vọng cụ thể của từng người dùng.</li>
            </ul>
            <p>
              Trong mọi trường hợp, tổng mức trách nhiệm pháp lý của CnenDict đối với bạn sẽ không vượt quá số tiền bạn đã thanh toán cho dịch vụ trong 12 tháng gần nhất.
            </p>
          </Section>

          {/* ── 9. Thay đổi ── */}
          <Section number="Điều 9" title="Thay đổi điều khoản">
            <p>
              CnenDict có quyền sửa đổi, bổ sung hoặc cập nhật các điều khoản này vào bất kỳ thời điểm nào. Mọi thay đổi quan trọng sẽ được thông báo qua:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Thông báo trên ứng dụng (in-app notification).</li>
              <li>Email đến địa chỉ đăng ký tài khoản (đối với thay đổi trọng yếu).</li>
            </ul>
            <p>
              Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp thuận các thay đổi.
            </p>
          </Section>

          {/* ── 10. Luật áp dụng ── */}
          <Section number="Điều 10" title="Luật áp dụng & Liên hệ">
            <p>
              Các điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết bằng thương lượng; nếu không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án nhân dân có thẩm quyền tại Việt Nam.
            </p>
            <div className="bg-slate-50 border border-outline/50 rounded-xl p-4 mt-3">
              <h3 className="font-semibold text-primary text-xs uppercase tracking-wider mb-2">Thông tin liên hệ</h3>
              <div className="space-y-1 text-xs">
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary/50">mail</span>
                  Email: <a href="mailto:support@cnendict.xyz" className="text-primary underline">support@cnendict.xyz</a>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary/50">chat</span>
                  Zalo: <strong className="text-primary">0373664881</strong>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary/50">public</span>
                  Facebook: <a href="https://www.facebook.com/nguyen.nguyen.904615" target="_blank" rel="noopener noreferrer" className="text-primary underline">Nguyen Nguyen</a>
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
