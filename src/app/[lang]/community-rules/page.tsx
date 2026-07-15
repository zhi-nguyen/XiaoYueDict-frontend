"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const EFFECTIVE_DATE = "15/07/2026";
const LAST_UPDATED = "15/07/2026";

/* ── Reusable Section Component ── */
function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="text-base font-bold text-[#0b1c30] border-b border-[#E2E8F0] pb-2 mb-4 flex items-baseline gap-2">
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5">{number}</span>
        {title}
      </h2>
      <div className="space-y-3 text-xs md:text-sm text-slate-600 leading-relaxed text-justify font-inter">
        {children}
      </div>
    </section>
  );
}

export default function CommunityRulesPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-[1000px] mx-auto bg-white border border-[#E2E8F0] rounded-[1.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
        {/* Top border strip */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-500 via-[#1d2b3e] to-indigo-650" />

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#1d2b3e]/10 flex items-center justify-center text-[#1d2b3e] mb-4">
            <span className="material-symbols-outlined text-[32px]">diversity_3</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0b1c30] tracking-tight font-lexend">Điều khoản cộng đồng</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-2 max-w-lg font-inter">
            Tiêu chuẩn ứng xử, xử lý dữ liệu và cơ chế báo cáo kháng nghị đảm bảo môi trường học tập chuẩn mực tại CnenDict.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-[10px] text-slate-400 font-inter">
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
        <nav className="mb-10 bg-slate-50 border border-[#E2E8F0] rounded-xl p-4">
          <h3 className="font-semibold text-[#0b1c30] text-[10px] uppercase tracking-wider mb-3 font-lexend">Mục lục</h3>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-inter">
            <li className="font-bold text-[#0b1c30] col-span-1 sm:col-span-2 mt-1 first:mt-0">PHẦN 1: ĐIỀU KHOẢN DỊCH VỤ VÀ TIÊU CHUẨN CỘNG ĐỒNG</li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">1.</span>
              Quy Định Đăng Bài & Trách Nhiệm Nội Dung
            </li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">2.</span>
              Quy Tắc Ứng Xử Cộng Đồng (Code of Conduct)
            </li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">3.</span>
              Danh Mục Nội Dung Nghiêm Cấm Đăng Tải
            </li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">4.</span>
              Giới Hạn Độ Tuổi & Quyền Chấm Dứt Dịch Vụ
            </li>

            <li className="font-bold text-[#0b1c30] col-span-1 sm:col-span-2 mt-3">PHẦN 2: CHÍNH SÁCH BẢO MẬT VÀ XỬ LÝ DỮ LIỆU</li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">5.</span>
              Xử Lý Dữ Liệu Nội Dung (Posts & Comments)
            </li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">6.</span>
              Kiểm Soát Hoạt Động & Tần Suất Truy Cập
            </li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">7.</span>
              Dữ Liệu Định Danh & Quyền Riêng Tư
            </li>

            <li className="font-bold text-[#0b1c30] col-span-1 sm:col-span-2 mt-3">PHẦN 3: CƠ CHẾ BÁO CÁO VÀ QUY TRÌNH KHÁNG NGHỊ</li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">8.</span>
              Cơ Chế Hoạt Động Của Tính Năng Báo Cáo
            </li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">9.</span>
              Quy Trình Kháng Nghị (Appeals)
            </li>
            <li className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-400 font-mono text-[10px]">10.</span>
              Quyết Định Xử Lý Kháng Nghị Của Admin
            </li>
          </ol>
        </nav>

        {/* ── Content ── */}
        <div className="space-y-10">

          {/* ── PART 1 ── */}
          <div className="space-y-6">
            <h3 className="text-xs font-extrabold text-[#1d2b3e] uppercase tracking-widest border-l-4 border-[#1d2b3e] pl-2 mb-4 font-lexend">
              PHẦN 1: ĐIỀU KHOẢN DỊCH VỤ VÀ TIÊU CHUẨN CỘNG ĐỒNG (TERMS OF SERVICE)
            </h3>

            <Section number="Điều 1" title="Quy Định Đăng Bài Và Trách Nhiệm Nội Dung">
              <div className="space-y-3">
                <p>
                  <strong>• Quyền sở hữu nội dung:</strong> Hệ thống CnenDict tôn trọng quyền sở hữu trí tuệ của người dùng. Mọi bài viết, bình luận và hình ảnh do người dùng đăng tải thuộc quyền sở hữu cá nhân của chính người dùng đó.
                </p>
                <p>
                  <strong>• Trách nhiệm pháp lý cá nhân:</strong> Người dùng chịu hoàn toàn trách nhiệm trước pháp luật về tính chính xác, tính chính đáng cũng như mọi hậu quả dân sự, hình sự phát sinh từ nội dung (văn bản, hình ảnh) do mình đăng tải.
                </p>
                <p>
                  <strong>• Tuyên bố miễn trừ trách nhiệm:</strong> CnenDict hoạt động với tư cách là một nền tảng trung gian kết nối cộng đồng học tập. Chúng tôi không cam kết, không đại diện và không chịu bất kỳ trách nhiệm pháp lý nào đối với các tranh chấp bản quyền, tổn thất tinh thần hoặc vật chất do nội dung của người dùng gây ra cho bên thứ ba.
                </p>
              </div>
            </Section>

            <Section number="Điều 2" title="Quy Tắc Ứng Xử Cộng Đồng (Code of Conduct)">
              <div className="space-y-3">
                <p>
                  <strong>• Tinh thần học tập:</strong> Cộng đồng CnenDict được xây dựng thuần túy cho mục đích học tập tiếng Trung và tiếng Anh. Mọi tương tác phải dựa trên tinh thần tôn trọng, xây dựng và hỗ trợ lẫn nhau.
                </p>
                <p>
                  <strong>• Ngôn từ chuẩn mực:</strong> Tuyệt đối không sử dụng ngôn từ tục tĩu, thô tục, tiếng lóng mang tính xúc phạm hoặc cố tình lách luật bằng các ký tự biến điệu khi tham gia bình luận trên từ điển hoặc diễn đàn.
                </p>
                <p>
                  <strong>• Tôn trọng cá nhân:</strong> Nghiêm cấm mọi hành vi tấn công cá nhân, bôi nhọ danh dự, quấy rối hoặc công khai thông tin cá nhân/bảo mật (Doxxing) của người dùng khác cũng như của đội ngũ Quản trị viên hệ thống.
                </p>
              </div>
            </Section>

            <Section number="Điều 3" title="Danh Mục Nội Dung Nghiêm Cấm Đăng Tải (Zero Tolerance)">
              <div className="space-y-3">
                <p className="bg-rose-50 border-l-4 border-rose-500 text-rose-950 p-3 rounded-r-xl text-xs">
                  Hệ thống áp dụng chính sách <strong>"Không khoan nhượng" (Zero Tolerance)</strong> đối với các danh mục nội dung sau. Mọi tài khoản vi phạm sẽ bị khóa vĩnh viễn ngay lập tức mà không cần cảnh báo trước:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-2">
                  <li>
                    <strong>Chính trị và Tôn giáo:</strong> Nghiêm cấm tuyệt đối mọi bài viết, bình luận, hình ảnh bàn luận, xuyên tạc hoặc tuyên truyền về các chủ đề chính trị, thể chế nhà nước, biểu tượng quốc gia, tranh chấp chủ quyền hoặc các xung đột tôn giáo nhạy cảm.
                  </li>
                  <li>
                    <strong>Phát ngôn và Hình ảnh thù ghét (Hate Speech):</strong> Nghiêm cấm các nội dung kích động bạo lực, kỳ thị chủng tộc, quốc tịch, giới tính, xu hướng tình dục, khuyết tật hoặc vùng miền.
                  </li>
                  <li>
                    <strong>Hàng hóa và Dịch vụ vi phạm pháp luật:</strong> Nghiêm cấm phát tán, quảng cáo hoặc mua bán các loại hàng hóa, dịch vụ bị pháp luật cấm (chất cấm, vũ khí, cờ bạc, nội dung khiêu dâm, dịch vụ thi hộ, mua bán tài khoản trái phép).
                  </li>
                  <li>
                    <strong>Vi phạm bản quyền:</strong> Nghiêm cấm đăng tải tài liệu học tập, giáo trình có bản quyền thương mại mà không có sự ủy quyền hoặc cho phép từ tác giả.
                  </li>
                  <li>
                    <strong>Spam và Quảng cáo trái phép:</strong> Nghiêm cấm mọi hành vi rải liên kết rác (Spam links), quảng bá các dịch vụ, trung tâm ngoại ngữ, ứng dụng đối thủ hoặc các nội dung mang tính chất thương mại mà không có sự chấp thuận bằng văn bản từ Ban Quản trị CnenDict.
                  </li>
                </ul>
              </div>
            </Section>

            <Section number="Điều 4" title="Giới Hạn Độ Tuổi Và Quyền Chấm Dứt Dịch Vụ">
              <div className="space-y-3">
                <p>
                  <strong>• Giới hạn độ tuổi:</strong> Nền tảng CnenDict yêu cầu người dùng phải đủ 13 tuổi trở lên để khởi tạo tài khoản và tham gia các hoạt động cộng đồng.
                </p>
                <p>
                  <strong>• Quyền đơn phương chấm dứt dịch vụ:</strong> Ban Quản trị bảo lưu quyền đình chỉ hoặc xóa bỏ vĩnh viễn bất kỳ tài khoản nào vi phạm Điều khoản Dịch vụ mà không cần báo trước, đồng thời không chịu trách nhiệm bồi hoàn đối với các tài sản số (Ví, Điểm thưởng) trong tài khoản vi phạm.
                </p>
              </div>
            </Section>
          </div>

          {/* ── PART 2 ── */}
          <div className="space-y-6">
            <h3 className="text-xs font-extrabold text-[#1d2b3e] uppercase tracking-widest border-l-4 border-[#1d2b3e] pl-2 mb-4 font-lexend">
              PHẦN 2: CHÍNH SÁCH BẢO MẬT VÀ XỬ LÝ DỮ LIỆU (PRIVACY & DATA POLICY)
            </h3>

            <Section number="Điều 5" title="Xử Lý Dữ Liệu Nội Dung (Posts & Comments)">
              <div className="space-y-3">
                <p>
                  <strong>• Lưu trữ văn bản:</strong> Toàn bộ bài viết và bình luận được mã hóa và lưu trữ an toàn trong cơ sở dữ liệu hệ thống (PostgreSQL).
                </p>
                <p>
                  <strong>• Xử lý hình ảnh:</strong> Mọi tệp tin hình ảnh tải lên đều được hệ thống tự động tối ưu hóa, nén về định dạng WebP (độ phân giải tối đa 1080px) nhằm tiết kiệm băng thông và được lưu trữ tập trung tại cơ sở hạ tầng Đám mây (Google Cloud Storage - GCS).
                </p>
                <p>
                  <strong>• Quyền xóa và Xóa mềm (Soft Delete):</strong> Khi người dùng thực hiện lệnh "Xóa bài viết/bình luận", nội dung sẽ ngay lập tức được gỡ bỏ khỏi giao diện hiển thị công cộng. Tuy nhiên, nhằm tuân thủ các quy định về an ninh mạng và lưu vết kiểm toán, bản ghi này sẽ được chuyển vào phân vùng lưu trữ an toàn (Soft Delete) trong vòng 30 ngày. Sau thời hạn này, hệ thống mới tự động kích hoạt lệnh xóa vật lý (Hard Delete) trên cả cơ sở dữ liệu và Google Cloud Storage.
                </p>
              </div>
            </Section>

            <Section number="Điều 6" title="Kiểm Soát Hoạt Động Và Tần Suất Truy Cập (Throttles & Cache)">
              <div className="space-y-3">
                <p>
                  <strong>• Bảo vệ hệ thống:</strong> Để ngăn chặn các cuộc tấn công từ chối dịch vụ (DDoS) hoặc hành vi phá hoại cộng đồng (Spam), hệ thống sử dụng bộ nhớ đệm tốc độ cao (Redis) để giám sát và giới hạn tần suất yêu cầu (Rate Limiting).
                </p>
                <p>
                  <strong>• Vòng đời dữ liệu tạm:</strong> Dữ liệu theo dõi số lượt đăng bài và lượt bình luận trong ngày của từng tài khoản sẽ tự động được dọn dẹp (Flush) sau mỗi chu kỳ 24 giờ.
                </p>
              </div>
            </Section>

            <Section number="Điều 7" title="Dữ Liệu Định Danh Và Quyền Riêng Tư">
              <div className="space-y-3">
                <p>
                  <strong>• Bảo mật Thông tin Cá nhân:</strong> Các thông tin định danh bao gồm Địa chỉ Email, Mật khẩu (đã mã hóa một chiều) và Địa chỉ IP của người dùng được thu thập duy nhất cho mục đích xác thực tài khoản và bảo vệ an toàn hệ thống. CnenDict cam kết không mua bán, trao đổi hoặc cung cấp dữ liệu định danh cá nhân cho bất kỳ bên thứ ba nào vì mục đích thương mại.
                </p>
              </div>
            </Section>
          </div>

          {/* ── PART 3 ── */}
          <div className="space-y-6">
            <h3 className="text-xs font-extrabold text-[#1d2b3e] uppercase tracking-widest border-l-4 border-[#1d2b3e] pl-2 mb-4 font-lexend">
              PHẦN 3: CƠ CHẾ BÁO CÁO (REPORTS) VÀ QUY TRÌNH KHÁNG NGHỊ (APPEALS)
            </h3>

            <Section number="Điều 8" title="Cơ Chế Hoạt Động Của Tính Năng Báo Cáo (Reports)">
              <div className="space-y-3">
                <p>
                  <strong>• Quyền báo cáo:</strong> Mọi người dùng hợp lệ đều có quyền sử dụng tính năng "Báo cáo" đối với bất kỳ bài viết hoặc bình luận nào có dấu hiệu vi phạm Tiêu chuẩn Cộng đồng.
                </p>
                <p>
                  <strong>• Cơ chế Tự động Ẩn (Auto-hide):</strong> Nhằm cách ly kịp thời các nội dung độc hại ngoài giờ làm việc của Ban Quản trị, hệ thống sẽ tự động chuyển trạng thái nội dung sang "Ẩn" nếu nội dung đó nhận đủ 5 lượt báo cáo từ 5 tài khoản uy tín khác nhau trong vòng 24 giờ.
                </p>
                <p>
                  <strong>• Thực thi hệ thống:</strong> Nội dung vi phạm sẽ ngay lập tức bị gỡ bỏ khỏi bảng tin chung và các trang từ điển. Đồng thời, hệ thống phát đi một Thông báo Tự động đến chủ sở hữu nội dung, nêu rõ lý do và trạng thái tạm ẩn của bài viết.
                </p>
              </div>
            </Section>

            <Section number="Điều 9" title="Quy Trình Kháng Nghị (Appeals)">
              <div className="space-y-3">
                <p className="bg-indigo-50/50 border border-indigo-150 p-3.5 rounded-xl text-xs leading-relaxed text-[#1d2b3e]">
                  Người dùng có quyền bảo vệ nội dung của mình nếu nhận định rằng cộng đồng đã báo cáo nhầm lẫn hoặc có hành vi lạm dụng báo cáo (Censor bẩn).
                </p>
                <p>
                  <strong>• Cách thức thực hiện:</strong> Người dùng truy cập mục "Cộng đồng &gt; Bài bị ẩn & Khiếu nại" tại Trang cá nhân. Chọn nội dung bị ẩn và cung cấp lý do giải trình chi tiết vào biểu mẫu khiếu nại.
                </p>
                <p>
                  <strong>• Trạng thái xử lý:</strong> Sau khi gửi, trạng thái khiếu nại sẽ chuyển sang Chờ xử lý. Nội dung tiếp tục được giữ ẩn để đảm bảo an toàn cho cộng đồng cho đến khi Ban Quản trị đưa ra phán quyết cuối cùng.
                </p>
                <p>
                  <strong>• Cam kết thời gian xử lý:</strong> Ban Quản trị cam kết sẽ tiếp nhận, rà soát và đưa ra quyết định cuối cùng đối với các yêu cầu Kháng nghị hợp lệ trong vòng 05 đến 07 ngày làm việc (không bao gồm Thứ Bảy, Chủ Nhật và các ngày Lễ).
                </p>
              </div>
            </Section>

            <Section number="Điều 10" title="Quyết Định Xử Lý Kháng Nghị Của Ban Quản Trị">
              <div className="space-y-3">
                <p>
                  Đại diện Ban Quản trị sẽ trực tiếp đối chiếu nội dung gốc và lý do khiếu nại thông qua hệ thống Quản trị tập trung:
                </p>
                <p>
                  <strong>• Trường hợp Kháng nghị được Chấp nhận (APPROVED):</strong> Trạng thái ẩn của nội dung sẽ được vô hiệu hóa. Bài viết/bình luận lập tức được khôi phục hiển thị trên toàn hệ thống, bảo toàn nguyên vẹn số lượt tương tác (Like/Comment). Các tài khoản cố tình lạm dụng tính năng báo cáo sai sự thật sẽ bị hệ thống đánh dấu và hạ bậc uy tín.
                </p>
                <p>
                  <strong>• Trường hợp Kháng nghị bị Từ chối (REJECTED):</strong> Nội dung vi phạm sẽ bị xóa bỏ hoàn toàn hoặc khóa vĩnh viễn. Hệ thống gửi thông báo từ chối đính kèm ghi chú chi tiết từ Quản trị viên (Admin notes). Tùy thuộc vào mức độ nghiêm trọng, tài khoản vi phạm có thể bị đình chỉ quyền đăng tải từ 3 đến 7 ngày, hoặc cấm vĩnh viễn nếu vi phạm Danh mục Nghiêm cấm. Quyết định của Ban Quản trị tại bước này là phán quyết cuối cùng và không tiếp nhận khiếu nại bổ sung.
                </p>
              </div>
            </Section>
          </div>
        </div>

        {/* Back Link to community */}
        <div className="mt-12 pt-6 border-t border-[#E2E8F0] flex justify-center font-lexend">
          <Link href={`/${lang}/community`} className="flex items-center gap-1.5 text-xs text-[#1d2b3e] hover:underline font-bold transition-all">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Quay lại Cộng đồng
          </Link>
        </div>
      </div>
    </div>
  );
}
