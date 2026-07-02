'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Lightbulb,
  HeadphonesIcon,
  History,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getGuestId } from '@/lib/guest';
import { getErrorMessage } from '@/lib/errorHelper';
import {
  createFeatureReport,
  createSupportRequest,
  getFeatureReports,
  getSupportRequests,
  getSupportRequestDetail,
  getGuestTicketDetail,
  bulkVerifyGuestTickets,
  saveGuestToken,
  getValidGuestTokens,
  type CreateFeatureReportPayload,
  type CreateSupportRequestPayload,
  type FeatureReportSummary,
  type SupportRequestSummary,
  type SupportRequestDetail,
} from '@/lib/api/support';

// ─── Constants ─────────────────────────────────────────────────────

type TabKey = 'feature' | 'support' | 'history';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'feature', label: 'Góp ý Tính năng', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'support', label: 'Yêu cầu Hỗ trợ', icon: <HeadphonesIcon className="w-4 h-4" /> },
  { key: 'history', label: 'Lịch sử Yêu cầu', icon: <History className="w-4 h-4" /> },
];

const FEATURE_AREAS: { value: CreateFeatureReportPayload['feature_area']; label: string }[] = [
  { value: 'dictionary', label: 'Tra từ & Học tập' },
  { value: 'speaking', label: 'Luyện nói' },
  { value: 'writing', label: 'Luyện viết' },
  { value: 'exam', label: 'Luyện thi' },
  { value: 'notes', label: 'Sổ tay' },
  { value: 'translate', label: 'Dịch thông minh' },
  { value: 'ui_ux', label: 'Giao diện & Trải nghiệm' },
  { value: 'other', label: 'Khác' },
];

const SUPPORT_CATEGORIES: { value: CreateSupportRequestPayload['category']; label: string }[] = [
  { value: 'bug', label: 'Lỗi hệ thống' },
  { value: 'billing', label: 'Thanh toán & Đăng ký' },
  { value: 'account', label: 'Tài khoản & Bảo mật' },
  { value: 'other', label: 'Hỗ trợ khác' },
];

const STATUS_BADGE_MAP: Record<string, { label: string; classes: string }> = {
  open: { label: 'Đang mở', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'Đang xử lý', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolved: { label: 'Đã giải quyết', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  closed: { label: 'Đã đóng', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  pending: { label: 'Chờ xử lý', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  reviewing: { label: 'Đang xem xét', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  planned: { label: 'Đã lên kế hoạch', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  implemented: { label: 'Đã triển khai', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  dismissed: { label: 'Bỏ qua', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
};

// ─── Helper Components ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE_MAP[status] || { label: status, classes: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.classes}`}>
      {badge.label}
    </span>
  );
}

function AlertMessage({ type, message }: { type: 'success' | 'error'; message: string }) {
  const isSuccess = type === 'success';
  return (
    <div
      className={`flex items-start gap-2.5 p-4 rounded-2xl animate-in fade-in duration-300 border ${isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-800'
        }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="text-sm font-medium">{message}</div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────

export default function SupportPage() {
  const params = useParams();
  const language = (params?.lang as string) || 'zh';
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('feature');

  return (
    <div className="w-full p-4 md:p-8 pb-16">
      <div className="max-w-[800px] mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-lg">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Trung tâm Hỗ trợ & Góp ý</h1>
            <p className="text-white/80 text-lg">
              Giúp chúng tôi cải thiện CnenDict tốt hơn mỗi ngày
            </p>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -left-8 w-20 h-20 rounded-full bg-white/5" />
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1.5 bg-hover-bg rounded-2xl border border-outline">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.key
                  ? 'bg-primary text-white shadow-md'
                  : 'text-secondary hover:bg-outline/20 hover:text-primary'
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'feature' && <FeatureReportForm isAuthenticated={isAuthenticated} />}
        {activeTab === 'support' && (
          <SupportRequestForm isAuthenticated={isAuthenticated} />
        )}
        {activeTab === 'history' && (
          <TicketHistory isAuthenticated={isAuthenticated} language={language} />
        )}
      </div>
    </div>
  );
}

// ─── Feature Report Form ───────────────────────────────────────────

function FeatureReportForm({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [featureArea, setFeatureArea] = useState<CreateFeatureReportPayload['feature_area']>('other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tiêu đề và mô tả.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const guestId = getGuestId();
      await createFeatureReport({
        title: title.trim(),
        description: description.trim(),
        feature_area: featureArea,
        guest_id: !isAuthenticated ? guestId || undefined : undefined,
      });

      setSuccessMsg('Cảm ơn bạn! Đề xuất tính năng đã được ghi nhận.');
      setTitle('');
      setDescription('');
      setFeatureArea('other');
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface rounded-3xl border border-outline shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-outline/50 bg-hover-bg">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Đề xuất Tính năng mới
        </h2>
        <p className="text-sm text-secondary mt-1">
          Chia sẻ ý tưởng giúp CnenDict hoàn thiện hơn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {successMsg && <AlertMessage type="success" message={successMsg} />}
        {errorMsg && <AlertMessage type="error" message={errorMsg} />}

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-primary">
            Khu vực tính năng
          </label>
          <select
            value={featureArea}
            onChange={(e) => setFeatureArea(e.target.value as CreateFeatureReportPayload['feature_area'])}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm font-medium transition-all"
          >
            {FEATURE_AREAS.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-primary">
            Tiêu đề đề xuất <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Thêm chế độ Dark Mode"
            disabled={isSubmitting}
            maxLength={150}
            className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm transition-all placeholder:text-secondary/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-primary">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả tính năng bạn muốn, tại sao nó hữu ích, cách bạn hình dung nó hoạt động..."
            rows={5}
            disabled={isSubmitting}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm leading-relaxed transition-all resize-none placeholder:text-secondary/50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-5 text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi đề xuất</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Support Request Form ──────────────────────────────────────────

function SupportRequestForm({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CreateSupportRequestPayload['category']>('other');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tiêu đề và mô tả.');
      return;
    }
    if (!isAuthenticated && !guestEmail.trim()) {
      setErrorMsg('Vui lòng cung cấp email liên hệ để nhận phản hồi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const guestId = getGuestId();
      const result = await createSupportRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        guest_id: !isAuthenticated ? guestId || undefined : undefined,
        guest_name: !isAuthenticated ? guestName.trim() || undefined : undefined,
        guest_email: !isAuthenticated ? guestEmail.trim() || undefined : undefined,
      });

      // Lưu signed_token cho Guest
      if (result.signed_token) {
        saveGuestToken(result.id, result.signed_token);
      }

      setSuccessMsg('Yêu cầu hỗ trợ đã được ghi nhận! Chúng tôi sẽ phản hồi sớm nhất.');
      setTitle('');
      setDescription('');
      setCategory('other');
      setGuestName('');
      setGuestEmail('');
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface rounded-3xl border border-outline shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-outline/50 bg-hover-bg">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <HeadphonesIcon className="w-5 h-5 text-indigo-500" />
          Gửi Yêu cầu Hỗ trợ
        </h2>
        <p className="text-sm text-secondary mt-1">
          Mô tả sự cố hoặc vấn đề bạn đang gặp phải
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {successMsg && <AlertMessage type="success" message={successMsg} />}
        {errorMsg && <AlertMessage type="error" message={errorMsg} />}

        {/* Guest-only fields */}
        {!isAuthenticated && (
          <div className="p-4 bg-hover-bg rounded-2xl border border-outline/30 space-y-4">
            <p className="text-xs text-secondary font-medium">
              Thông tin liên hệ (bắt buộc cho khách vãng lai)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-primary">Họ tên</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  disabled={isSubmitting}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm transition-all placeholder:text-secondary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-primary">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm transition-all placeholder:text-secondary/50"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-primary">Phân loại vấn đề</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CreateSupportRequestPayload['category'])}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm font-medium transition-all"
          >
            {SUPPORT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-primary">
            Tiêu đề yêu cầu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Không thanh toán được gói Premium"
            disabled={isSubmitting}
            maxLength={150}
            className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm transition-all placeholder:text-secondary/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-primary">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả sự cố hoặc vấn đề bạn gặp phải, kèm theo bước tái tạo lỗi nếu có thể..."
            rows={5}
            disabled={isSubmitting}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm leading-relaxed transition-all resize-none placeholder:text-secondary/50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-5 text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi yêu cầu</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Ticket History ────────────────────────────────────────────────

function TicketHistory({ isAuthenticated, language }: { isAuthenticated: boolean; language: string }) {
  const [supportTickets, setSupportTickets] = useState<SupportRequestSummary[]>([]);
  const [featureReports, setFeatureReports] = useState<FeatureReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportRequestDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isAuthenticated) {
        const [supportData, featureData] = await Promise.all([
          getSupportRequests(),
          getFeatureReports(),
        ]);
        setSupportTickets(supportData);
        setFeatureReports(featureData);
      } else {
        // Guest: sử dụng bulk verify
        const validTokens = getValidGuestTokens();
        if (validTokens.length > 0) {
          const tokens = validTokens.map((t) => t.token);
          const result = await bulkVerifyGuestTickets(tokens);
          setSupportTickets(result.tickets);
        }
        setFeatureReports([]);
      }
    } catch {
      setErrorMsg('Không thể tải lịch sử yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleViewDetail = async (ticket: SupportRequestSummary) => {
    setIsLoadingDetail(true);
    try {
      if (isAuthenticated) {
        const detail = await getSupportRequestDetail(ticket.id);
        setSelectedTicket(detail);
      } else {
        // Guest: tìm token tương ứng
        const validTokens = getValidGuestTokens();
        const entry = validTokens.find((t) => t.id === ticket.id);
        if (entry) {
          const detail = await getGuestTicketDetail(entry.token);
          setSelectedTicket(detail);
        }
      }
    } catch {
      setErrorMsg('Không thể tải chi tiết yêu cầu.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Detail View
  if (selectedTicket) {
    return (
      <div className="bg-surface rounded-3xl border border-outline shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-outline/50 bg-hover-bg flex items-center gap-3">
          <button
            onClick={() => setSelectedTicket(null)}
            className="p-1.5 rounded-full hover:bg-outline/20 text-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-primary">{selectedTicket.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={selectedTicket.status} />
              <span className="text-xs text-secondary">
                {new Date(selectedTicket.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-primary mb-2">Mô tả</h3>
            <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
              {selectedTicket.description}
            </p>
          </div>

          {/* Comments */}
          {selectedTicket.comments.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Phản hồi ({selectedTicket.comments.length})
              </h3>
              <div className="space-y-3">
                {selectedTicket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-hover-bg rounded-2xl border border-outline/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">
                        {comment.author_name}
                      </span>
                      <span className="text-xs text-secondary">
                        {new Date(comment.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                      {comment.comment_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTicket.comments.length === 0 && (
            <div className="text-center py-6 text-secondary text-sm">
              Chưa có phản hồi nào. Chúng tôi sẽ xử lý yêu cầu của bạn sớm nhất.
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="bg-surface rounded-3xl border border-outline shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-outline/50 bg-hover-bg">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <History className="w-5 h-5 text-purple-500" />
          Lịch sử Yêu cầu
        </h2>
        <p className="text-sm text-secondary mt-1">
          {isAuthenticated
            ? 'Theo dõi trạng thái các yêu cầu và góp ý của bạn'
            : 'Theo dõi trạng thái yêu cầu hỗ trợ (dựa trên token lưu trên trình duyệt này)'}
        </p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            <span className="text-sm text-secondary">Đang tải...</span>
          </div>
        ) : errorMsg ? (
          <AlertMessage type="error" message={errorMsg} />
        ) : supportTickets.length === 0 && featureReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hover-bg flex items-center justify-center">
              <History className="w-8 h-8 text-secondary/40" />
            </div>
            <p className="text-secondary font-medium">Chưa có yêu cầu nào</p>
            <p className="text-xs text-secondary/70 mt-1">
              Các yêu cầu bạn gửi sẽ xuất hiện ở đây
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Support Tickets */}
            {supportTickets.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-primary mb-3">
                  Yêu cầu Hỗ trợ ({supportTickets.length})
                </h3>
                <div className="space-y-2">
                  {supportTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => handleViewDetail(ticket)}
                      disabled={isLoadingDetail}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl border border-outline hover:bg-hover-bg transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {ticket.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status={ticket.status} />
                          <span className="flex items-center gap-1 text-xs text-secondary">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-secondary/40 group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Reports (only for authenticated users) */}
            {featureReports.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-primary mb-3">
                  Góp ý Tính năng ({featureReports.length})
                </h3>
                <div className="space-y-2">
                  {featureReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-outline"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {report.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status={report.status} />
                          <span className="flex items-center gap-1 text-xs text-secondary">
                            <Clock className="w-3 h-3" />
                            {new Date(report.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
