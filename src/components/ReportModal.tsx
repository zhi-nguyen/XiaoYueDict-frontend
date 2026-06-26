'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createReport, CreateReportPayload } from '@/lib/api/reports';
import { getGuestId } from '@/lib/guest';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'zh_word' | 'en_word' | 'zh_example' | 'en_example' | 'exam_question' | 'exam_option';
  objectId: string;
  defaultReportType?: 'image' | 'translation' | 'pinyin' | 'example' | 'exam_question' | 'audio' | 'other';
  title?: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  image: 'Hình ảnh lỗi/không phù hợp',
  translation: 'Bản dịch sai nghĩa',
  pinyin: 'Pinyin / Phiên âm IPA sai',
  example: 'Câu ví dụ / Nghĩa ví dụ sai',
  exam_question: 'Câu hỏi thi sai thông tin',
  audio: 'Âm thanh/Phát âm lỗi',
  other: 'Lỗi khác',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  zh_word: 'Từ vựng tiếng Trung',
  en_word: 'Từ vựng tiếng Anh',
  zh_example: 'Ví dụ tiếng Trung',
  en_example: 'Ví dụ tiếng Anh',
  exam_question: 'Câu hỏi đề thi',
  exam_option: 'Đáp án đề thi',
};

export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  objectId,
  defaultReportType = 'other',
  title = 'Báo cáo lỗi nội dung',
}: ReportModalProps) {
  const [reportType, setReportType] = useState<CreateReportPayload['report_type']>(defaultReportType);
  const [reason, setReason] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync default report type when modal opens or changes
  useEffect(() => {
    if (isOpen) {
      setReportType(defaultReportType);
      setReason('');
      setSuggestedCorrection('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultReportType]);

  if (!isOpen || !mounted) return null;

  // Filter valid report types based on content_type
  const getAvailableReportTypes = (): CreateReportPayload['report_type'][] => {
    switch (contentType) {
      case 'zh_word':
        return ['translation', 'image', 'pinyin', 'audio', 'other'];
      case 'en_word':
        return ['translation', 'image', 'pinyin', 'audio', 'other'];
      case 'zh_example':
      case 'en_example':
        return ['example', 'translation', 'audio', 'other'];
      case 'exam_question':
        return ['exam_question', 'image', 'audio', 'other'];
      case 'exam_option':
        return ['exam_question', 'image', 'other'];
      default:
        return ['other'];
    }
  };

  const availableTypes = getAvailableReportTypes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Vui lòng nhập mô tả chi tiết về lỗi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const guestId = getGuestId();

    try {
      await createReport({
        report_type: reportType,
        content_type: contentType,
        object_id: objectId,
        reason: reason.trim(),
        suggested_correction: suggestedCorrection.trim() || undefined,
        guest_id: guestId || undefined,
      });

      setSuccessMsg('Cảm ơn bạn! Báo cáo lỗi của bạn đã được gửi thành công.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMsg('Bạn đã gửi báo cáo cho nội dung này trước đó rồi.');
      } else if (err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-300 font-sans">
      <div className="bg-surface rounded-3xl w-full max-w-lg border border-outline shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header (Static) */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline/50 bg-hover-bg shrink-0">
          <div className="flex items-center gap-2 text-red-600">
            <Flag className="w-5 h-5" />
            <h3 className="text-lg font-bold text-primary tracking-tight">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-outline/20 text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container (Full Height Flex) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-outline/50">
            {/* Info Banner */}
            <div className="p-3.5 bg-hover-bg rounded-2xl border border-outline/30 text-xs text-secondary leading-relaxed">
              Mục báo cáo: <strong className="text-primary">{CONTENT_TYPE_LABELS[contentType]}</strong><br />
              ID đối tượng: <span className="font-mono bg-outline/20 px-1 py-0.5 rounded">{objectId}</span>
            </div>

            {/* Success / Error Messages */}
            {successMsg && (
              <div className="flex items-start gap-2.5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl animate-in fade-in duration-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{successMsg}</div>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Report Type Select */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-primary">Loại lỗi cần báo cáo</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                disabled={isSubmitting || !!successMsg}
                className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm font-medium transition-all"
              >
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {REPORT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason TextArea */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-primary">Mô tả chi tiết lỗi <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vui lòng cung cấp thông tin chi tiết lỗi (Ví dụ: Từ này có nghĩa gốc là ... chứ không phải ..., hoặc hình ảnh bị nhầm sang con vật khác...)"
                rows={4}
                disabled={isSubmitting || !!successMsg}
                className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm leading-relaxed transition-all resize-none placeholder:text-secondary/50"
                maxLength={1000}
              />
            </div>

            {/* Suggested Correction TextArea */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-primary flex items-center justify-between">
                <span>Đề xuất sửa đổi mới (Không bắt buộc)</span>
                <span className="text-[11px] font-normal text-secondary">Optional</span>
              </label>
              <textarea
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                placeholder="Nhập nội dung đề xuất chính xác (ví dụ bản dịch đúng hoặc cách phát âm đúng...)"
                rows={2}
                disabled={isSubmitting || !!successMsg}
                className="w-full px-4 py-3 rounded-2xl border border-outline bg-surface text-primary focus:outline-none focus:border-primary/50 text-sm leading-relaxed transition-all resize-none placeholder:text-secondary/50"
                maxLength={1000}
              />
            </div>
          </div>

          {/* Footer Actions (Static) */}
          <div className="p-6 border-t border-outline/50 bg-hover-bg flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || !!successMsg}
              className="flex-1 py-3.5 px-5 text-sm font-bold rounded-2xl text-secondary bg-hover-bg hover:bg-outline/20 border border-outline transition-all duration-200 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMsg}
              className="flex-1 py-3.5 px-5 text-sm font-bold rounded-2xl text-white bg-red-600 hover:bg-red-700 shadow-md transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  <span>Gửi</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
