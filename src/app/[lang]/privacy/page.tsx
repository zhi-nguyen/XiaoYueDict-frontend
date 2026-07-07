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

export default function PrivacyPage() {
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
            <span className="material-symbols-outlined text-[32px]">security</span>
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Chính sách bảo mật</h1>
          <p className="text-secondary text-sm mt-2 max-w-lg">
            CnenDict cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.
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
              "Thông tin chúng tôi thu thập",
              "Cách chúng tôi sử dụng thông tin",
              "Chia sẻ với bên thứ ba",
              "Cookie & Công nghệ theo dõi",
              "Bảo mật dữ liệu",
              "Lưu trữ & Xóa dữ liệu",
              "Quyền của người dùng",
              "Bảo vệ trẻ em",
              "Thay đổi chính sách & Liên hệ",
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

          {/* ── 1. Thu thập thông tin ── */}
          <Section number="Điều 1" title="Thông tin chúng tôi thu thập">
            <p>Khi bạn sử dụng CnenDict, chúng tôi có thể thu thập các loại thông tin sau:</p>

            <div className="space-y-4 mt-2">
              <div className="bg-slate-50/80 border border-outline/50 rounded-xl p-4">
                <h3 className="font-semibold text-primary text-sm mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary/60">person</span>
                  1.1. Thông tin cá nhân
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                  <li>Họ tên, địa chỉ email, ảnh đại diện (khi đăng ký tài khoản).</li>
                  <li>Mã định danh Firebase UID (khi đăng nhập qua Google/Firebase).</li>
                  <li>Thông tin gói dịch vụ và lịch sử thanh toán.</li>
                </ul>
              </div>

              <div className="bg-slate-50/80 border border-outline/50 rounded-xl p-4">
                <h3 className="font-semibold text-primary text-sm mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary/60">school</span>
                  1.2. Dữ liệu học tập
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                  <li>Lịch sử tra cứu từ điển và dịch thuật.</li>
                  <li>Tiến trình và kết quả làm bài tập, flashcard, luyện thi.</li>
                  <li>Sổ ghi chú (notebooks) và danh sách từ vựng đã lưu.</li>
                  <li>Lịch sử và kết quả luyện viết, chấm chữa ngữ pháp.</li>
                </ul>
              </div>

              <div className="bg-slate-50/80 border border-outline/50 rounded-xl p-4">
                <h3 className="font-semibold text-primary text-sm mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary/60">devices</span>
                  1.3. Dữ liệu kỹ thuật
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                  <li>Địa chỉ IP, loại trình duyệt, hệ điều hành và thiết bị.</li>
                  <li>Thời gian truy cập, tần suất sử dụng và các trang đã xem.</li>
                  <li>Dữ liệu hiệu suất ứng dụng (Vercel Analytics & Speed Insights).</li>
                </ul>
              </div>

              <div className="bg-blue-50/60 border border-blue-200/50 rounded-xl p-4">
                <h3 className="font-semibold text-primary text-sm mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-blue-500">mic</span>
                  1.4. Dữ liệu giọng nói
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                  <li>Bản ghi âm phát âm khi sử dụng tính năng Luyện nói (Speaking Assessment).</li>
                  <li>Dữ liệu giọng nói được gửi tới dịch vụ AI để chấm điểm và <strong className="text-primary">không được lưu trữ vĩnh viễn</strong> trên máy chủ. Bản ghi âm sẽ bị xóa sau khi xử lý hoàn tất.</li>
                  <li>Chỉ kết quả chấm điểm (điểm số, phản hồi) được lưu trữ gắn với tài khoản người dùng.</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* ── 2. Sử dụng thông tin ── */}
          <Section number="Điều 2" title="Cách chúng tôi sử dụng thông tin">
            <p>Thông tin của bạn được sử dụng cho các mục đích sau:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-primary">Cung cấp dịch vụ:</strong> Duy trì tài khoản, đồng bộ dữ liệu học tập trên các thiết bị.</li>
              <li><strong className="text-primary">Cá nhân hóa trải nghiệm:</strong> Đề xuất từ vựng, bài tập và lộ trình học phù hợp với trình độ và mục tiêu của bạn.</li>
              <li><strong className="text-primary">Cải thiện mô hình AI:</strong> Dữ liệu ẩn danh (anonymized) có thể được sử dụng để đánh giá và cải thiện chất lượng bản dịch, bài tập và phản hồi AI. Chúng tôi <strong>không sử dụng dữ liệu cá nhân nhận diện được</strong> để huấn luyện mô hình.</li>
              <li><strong className="text-primary">Thông báo & Cập nhật:</strong> Gửi thông báo về tính năng mới, bảo trì hệ thống, hoặc cảnh báo bảo mật.</li>
              <li><strong className="text-primary">Bảo vệ hệ thống:</strong> Phát hiện và ngăn chặn gian lận, lạm dụng, hoặc các hoạt động bất thường.</li>
              <li><strong className="text-primary">Tuân thủ pháp luật:</strong> Cung cấp thông tin khi được yêu cầu bởi cơ quan có thẩm quyền theo quy định pháp luật.</li>
            </ul>
          </Section>

          {/* ── 3. Bên thứ ba ── */}
          <Section number="Điều 3" title="Chia sẻ thông tin với bên thứ ba">
            <p>
              CnenDict <strong className="text-primary">không bán, cho thuê hoặc trao đổi</strong> thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại. Tuy nhiên, để cung cấp dịch vụ, dữ liệu có thể được xử lý bởi các đối tác công nghệ sau:
            </p>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs border border-outline/50 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 font-semibold text-primary border-b border-outline/50">Đối tác</th>
                    <th className="text-left p-3 font-semibold text-primary border-b border-outline/50">Mục đích</th>
                    <th className="text-left p-3 font-semibold text-primary border-b border-outline/50">Dữ liệu xử lý</th>
                  </tr>
                </thead>
                <tbody className="text-secondary">
                  <tr className="border-b border-outline/30">
                    <td className="p-3 font-medium text-primary">Google Cloud / Vertex AI</td>
                    <td className="p-3">Dịch thuật, sinh bài tập, chấm chữa ngữ pháp</td>
                    <td className="p-3">Văn bản đầu vào (ẩn danh)</td>
                  </tr>
                  <tr className="border-b border-outline/30 bg-slate-50/50">
                    <td className="p-3 font-medium text-primary">Microsoft Azure</td>
                    <td className="p-3">Chấm phát âm, Text-to-Speech</td>
                    <td className="p-3">Dữ liệu giọng nói, văn bản</td>
                  </tr>
                  <tr className="border-b border-outline/30">
                    <td className="p-3 font-medium text-primary">Firebase (Google)</td>
                    <td className="p-3">Xác thực đăng nhập</td>
                    <td className="p-3">Email, UID</td>
                  </tr>
                  <tr className="border-b border-outline/30 bg-slate-50/50">
                    <td className="p-3 font-medium text-primary">Vercel</td>
                    <td className="p-3">Hosting, Analytics, Speed Insights</td>
                    <td className="p-3">Dữ liệu truy cập ẩn danh</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-primary">Google Cloud Storage</td>
                    <td className="p-3">Lưu trữ file media (audio, image)</td>
                    <td className="p-3">File media được tạo</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">
              Các đối tác trên đều tuân thủ các tiêu chuẩn bảo mật quốc tế (SOC 2, ISO 27001, GDPR). Dữ liệu chỉ được chia sẻ trong phạm vi cần thiết để cung cấp dịch vụ.
            </p>
          </Section>

          {/* ── 4. Cookie ── */}
          <Section number="Điều 4" title="Cookie & Công nghệ theo dõi">
            <p>Cookie phiên bản, JWT token và log kỹ thuật được sử dụng để tối ưu trải nghiệm người dùng:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-primary">Cookie phiên đăng nhập:</strong> Duy trì trạng thái đăng nhập và phiên làm việc. Cookie này là bắt buộc để sử dụng dịch vụ.</li>
              <li><strong className="text-primary">JWT Token:</strong> Mã xác thực được lưu trữ phía client để xác minh quyền truy cập API.</li>
              <li><strong className="text-primary">Vercel Analytics:</strong> Thu thập dữ liệu truy cập ẩn danh (số lượt truy cập, trang phổ biến, thời gian trung bình) để cải thiện trải nghiệm người dùng. Không thu thập thông tin cá nhân nhận diện được.</li>
              <li><strong className="text-primary">Redis Cache:</strong> Bộ nhớ đệm phía máy chủ để tối ưu hiệu suất và giảm tải cho hệ thống AI. Dữ liệu cache tự động hết hạn.</li>
            </ul>
            <p className="mt-2">
              CnenDict <strong className="text-primary">không sử dụng</strong> cookie theo dõi quảng cáo, cookie phân tích hành vi người dùng từ bên thứ ba, hoặc pixel tracking.
            </p>
          </Section>

          {/* ── 5. Bảo mật ── */}
          <Section number="Điều 5" title="Bảo mật dữ liệu">
            <p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức nghiêm ngặt:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-primary">Mã hóa truyền tải:</strong> Tất cả kết nối đều sử dụng HTTPS/TLS để mã hóa dữ liệu trong quá trình truyền.</li>
              <li><strong className="text-primary">Xác thực JWT:</strong> Token xác thực có thời hạn, được ký bằng khóa bí mật và tự động làm mới.</li>
              <li><strong className="text-primary">Rate Limiting:</strong> Giới hạn số lượng request để ngăn chặn tấn công brute-force và DDoS.</li>
              <li><strong className="text-primary">Mã hóa mật khẩu:</strong> Mật khẩu được băm (hash) bằng thuật toán mạnh, không lưu trữ dạng văn bản thuần.</li>
              <li><strong className="text-primary">Phân quyền truy cập:</strong> Hệ thống phân quyền theo vai trò (RBAC) đảm bảo người dùng chỉ truy cập được dữ liệu của mình.</li>
              <li><strong className="text-primary">Giám sát hệ thống:</strong> Theo dõi hoạt động bất thường và cảnh báo tự động khi phát hiện nguy cơ bảo mật.</li>
            </ul>
          </Section>

          {/* ── 6. Lưu trữ ── */}
          <Section number="Điều 6" title="Lưu trữ & Xóa dữ liệu">
            <p>Chính sách lưu trữ dữ liệu:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-primary">Dữ liệu tài khoản:</strong> Được lưu trữ trong suốt thời gian tài khoản hoạt động.</li>
              <li><strong className="text-primary">Dữ liệu học tập:</strong> Được lưu trữ gắn với tài khoản. Khi tài khoản bị xóa, toàn bộ dữ liệu học tập sẽ được xóa trong vòng 30 ngày.</li>
              <li><strong className="text-primary">Dữ liệu giọng nói:</strong> Bản ghi âm phát âm được xử lý ngay và <strong>không lưu trữ vĩnh viễn</strong>. Chỉ kết quả chấm điểm được giữ lại.</li>
              <li><strong className="text-primary">Cache AI:</strong> Kết quả dịch thuật AI được cache tạm thời (tối đa 5 phút) để tối ưu hiệu suất, sau đó tự động hết hạn.</li>
              <li><strong className="text-primary">Log hệ thống:</strong> Log kỹ thuật được lưu trữ tối đa 90 ngày cho mục đích debug và bảo mật, sau đó tự động xóa.</li>
            </ul>
          </Section>

          {/* ── 7. Quyền người dùng ── */}
          <Section number="Điều 7" title="Quyền của người dùng">
            <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {[
                { icon: "visibility", title: "Quyền truy cập", desc: "Xem toàn bộ dữ liệu cá nhân và dữ liệu học tập đang được lưu trữ." },
                { icon: "edit", title: "Quyền chỉnh sửa", desc: "Cập nhật thông tin cá nhân (tên, ảnh đại diện) bất kỳ lúc nào." },
                { icon: "delete", title: "Quyền xóa", desc: "Yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan." },
                { icon: "download", title: "Quyền xuất dữ liệu", desc: "Tải xuống bản sao dữ liệu học tập ở định dạng phổ biến." },
                { icon: "block", title: "Quyền phản đối", desc: "Phản đối việc sử dụng dữ liệu cho mục đích cải thiện AI." },
                { icon: "lock", title: "Quyền hạn chế", desc: "Yêu cầu hạn chế xử lý dữ liệu trong một số trường hợp." },
              ].map((right, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-outline/50">
                  <span className="material-symbols-outlined text-sage text-[18px] mt-0.5 shrink-0">{right.icon}</span>
                  <div>
                    <h3 className="font-semibold text-primary text-xs">{right.title}</h3>
                    <p className="text-xs text-secondary mt-0.5">{right.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3">
              Để thực hiện các quyền trên, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@cnendict.xyz" className="text-primary underline">support@cnendict.xyz</a> hoặc qua chức năng quản lý tài khoản trên ứng dụng. Chúng tôi sẽ phản hồi yêu cầu trong vòng <strong className="text-primary">15 ngày làm việc</strong>.
            </p>
          </Section>

          {/* ── 8. Bảo vệ trẻ em ── */}
          <Section number="Điều 8" title="Bảo vệ trẻ em">
            <p>
              CnenDict không chủ đích thu thập thông tin từ trẻ em dưới 13 tuổi. Nếu bạn là phụ huynh hoặc người giám hộ và phát hiện con bạn đã cung cấp thông tin cá nhân cho chúng tôi, vui lòng liên hệ ngay để chúng tôi xóa dữ liệu.
            </p>
            <p>
              Đối với người dùng từ 13–17 tuổi, chúng tôi khuyến khích có sự đồng ý và giám sát từ phụ huynh hoặc người giám hộ hợp pháp.
            </p>
          </Section>

          {/* ── 9. Thay đổi & Liên hệ ── */}
          <Section number="Điều 9" title="Thay đổi chính sách & Liên hệ">
            <p>
              CnenDict có quyền cập nhật chính sách bảo mật này vào bất kỳ thời điểm nào. Mọi thay đổi quan trọng sẽ được thông báo qua ứng dụng và/hoặc email. Ngày cập nhật lần cuối luôn được hiển thị ở đầu trang.
            </p>

            <div className="bg-slate-50 border border-outline/50 rounded-xl p-4 mt-3">
              <h3 className="font-semibold text-primary text-xs uppercase tracking-wider mb-2">Thông tin liên hệ về bảo mật</h3>
              <p className="text-xs mb-2">Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc yêu cầu nào liên quan đến quyền riêng tư và bảo mật dữ liệu, vui lòng liên hệ:</p>
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
