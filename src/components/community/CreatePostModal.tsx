'use client';

import React, { useState, useRef } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import AlertModal from '@/components/AlertModal';
import Link from 'next/link';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, lang }) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const createPost = useCommunityStore((state) => state.createPost);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Tệp quá lớn',
          message: 'Kích thước ảnh tối đa là 5MB'
        });
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await createPost(lang, content, selectedFile || undefined);
      setContent('');
      removeImage();
      onClose();
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.detail || 'Đăng bài thất bại. Vui lòng thử lại.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in text-[#0b1c30]">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
            <h3 className="text-sm font-bold text-[#1d2b3e] font-lexend flex items-center gap-2">
              <span className="material-symbols-outlined text-[#426657]">create</span>
              Tạo bài viết mới
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-[#F1F5F9]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang muốn chia sẻ điều gì về học tập?..."
              rows={5}
              maxLength={2000}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#1d2b3e] rounded-xl px-4 py-3 text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1d2b3e]/30 resize-none font-inter"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-[#E2E8F0] aspect-video bg-slate-50">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            )}

            {/* Upload Button */}
            {!imagePreview && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-300 hover:border-[#1d2b3e] hover:bg-[#e5eeff]/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#426657] text-3xl transition-colors">
                  add_photo_alternate
                </span>
                <span className="text-xs text-slate-500 group-hover:text-slate-650 font-inter">
                  Thêm tối đa 1 ảnh (JPEG, PNG, WebP tối đa 5MB)
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>
            )}

            {/* Terms disclaimer */}
            <p className="text-[10px] text-slate-400 text-left font-inter leading-normal mt-1">
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <Link href={`/${lang}/community-rules`} target="_blank" className="text-[#1d2b3e] hover:underline font-bold">
                Điều khoản cộng đồng
              </Link>{" "}
              của chúng tôi.
            </p>

            {/* Action Footer */}
            <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-100/80">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs text-slate-500 hover:bg-[#F1F5F9] rounded-xl transition-colors disabled:opacity-50 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="px-6 py-2 text-xs text-white bg-[#1d2b3e] hover:bg-[#1d2b3e]/90 active:bg-slate-900 rounded-xl transition-all shadow-md font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    Đăng bài
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
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
export default CreatePostModal;
