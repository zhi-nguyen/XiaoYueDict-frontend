'use client';

import React, { useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import AlertModal from '@/components/AlertModal';

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'post_comment' | 'word_comment';
  objectId: string;
}

export const CommunityReportModal: React.FC<CommunityReportModalProps> = ({ isOpen, onClose, contentType, objectId }) => {
  const [reason, setReason] = useState('spam');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportContent = useCommunityStore((state) => state.reportContent);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportContent(contentType, objectId, reason as any, detail);
      setDetail('');
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Thành công',
        message: 'Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ kiểm duyệt nội dung này sớm nhất.'
      });
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.detail || 'Không thể gửi báo cáo. Vui lòng thử lại.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const REASONS = [
    { value: 'spam', label: 'Spam / Quảng cáo trái phép' },
    { value: 'harassment', label: 'Quấy rối / Bắt nạt học đường' },
    { value: 'inappropriate', label: 'Nội dung không phù hợp, nhạy cảm' },
    { value: 'misinformation', label: 'Thông tin sai lệch liên quan học tập' },
    { value: 'other', label: 'Lý do khác (Vui lòng ghi rõ bên dưới)' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-sm font-semibold text-slate-100 font-lexend flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500">report</span>
            Báo cáo vi phạm cộng đồng
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-semibold font-lexend">Lý do báo cáo:</label>
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <label 
                  key={r.value} 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-800 cursor-pointer transition-all hover:bg-slate-850 ${
                    reason === r.value ? 'bg-rose-500/10 border-rose-500/50 text-slate-200' : 'text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-rose-500"
                  />
                  <span className="text-xs font-inter font-medium">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs text-slate-400 font-semibold font-lexend">Chi tiết thêm (tùy chọn):</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Cung cấp thêm ngữ cảnh hoặc dẫn chứng chi tiết..."
              rows={3}
              maxLength={500}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none font-inter"
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-800/80 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl transition-all shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xs">send</span>
                  Gửi báo cáo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
          if (alertConfig.type === 'success') {
            onClose();
          }
        }}
      />
    </>
  );
};
export default CommunityReportModal;
