"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useAuthStore } from '@/store/useAuthStore';
import AuthModal from '@/components/auth/AuthModal';
import { checkGeneralWriting } from '@/lib/api/deepPractice';
import { Loader2 } from 'lucide-react';

export default function WritingPage() {
  const params = useParams();
  const language = (params?.lang as string) || 'zh';

  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const tier = useSubscriptionStore((state) => state.tier);
  const isFree = !tier || tier === 'Free';

  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheck = async () => {
    if (!text.trim()) return;
    setIsChecking(true);
    setErrorMsg('');
    setResult(null);

    // Language validation
    if (language === 'zh') {
      if (!/[\u4e00-\u9fa5]/.test(text)) {
        setErrorMsg("Vui lòng viết đoạn văn bằng tiếng Trung (chữ Hán).");
        setIsChecking(false);
        return;
      }
      if (/[a-zA-Z]/.test(text)) {
        setErrorMsg("Đoạn văn viết tiếng Trung không được chứa các từ không phải tiếng Trung (chữ Latin).");
        setIsChecking(false);
        return;
      }
    } else if (language === 'en') {
      if (!/[a-zA-Z]/.test(text)) {
        setErrorMsg("Vui lòng viết đoạn văn bằng tiếng Anh.");
        setIsChecking(false);
        return;
      }
      if (/[\u4e00-\u9fa5]/.test(text)) {
        setErrorMsg("Đoạn văn viết tiếng Anh không được chứa chữ Trung Quốc.");
        setIsChecking(false);
        return;
      }
    }

    try {
      const response = await checkGeneralWriting(text.trim(), language);
      if (response.status === 'SUCCESS') {
        setResult(response.result);
      } else {
        setErrorMsg("Không thể nhận diện kết quả từ hệ thống.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Gặp lỗi khi gửi yêu cầu chấm điểm.");
      }
    } finally {
      setIsChecking(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8 pb-16">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-surface border border-outline rounded-[1.5rem] p-6 md:p-8 shadow-sm flex flex-col relative overflow-hidden bg-white">
          {/* Top border strip */}
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

          {!isAuthenticated ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <span className="material-symbols-outlined text-primary text-4xl font-bold">account_circle</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
                {language === 'zh' ? 'Luyện Viết Tiếng Trung' : 'Luyện Viết Tiếng Anh'}
              </h1>
              <p className="text-secondary text-sm max-w-md mb-8 leading-relaxed">
                Tính năng Luyện viết đoạn văn tự do và Nhận xét ngữ pháp chi tiết bằng AI chỉ dành cho thành viên của hệ thống. Vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu học tập!
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Đăng nhập / Đăng ký
              </button>
            </div>
          ) : isFree ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <span className="material-symbols-outlined text-primary text-4xl font-bold">lock</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
                {language === 'zh' ? 'Luyện Viết Tiếng Trung' : 'Luyện Viết Tiếng Anh'}
              </h1>
              <p className="text-secondary text-sm max-w-md mb-8 leading-relaxed">
                Tính năng Luyện viết đoạn văn tự do và Nhận xét ngữ pháp chi tiết bằng AI chỉ dành cho tài khoản trả phí. Hãy nâng cấp tài khoản để bắt đầu học tập!
              </p>
              <Link
                href={`/${language}/pricing`}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">workspace_premium</span>
                Nâng cấp tài khoản
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-[32px] font-bold">edit_note</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                  {language === 'zh' ? 'Luyện Viết Tiếng Trung' : 'Luyện Viết Tiếng Anh'}
                </h1>
                <p className="text-secondary text-xs sm:text-sm max-w-md">
                  {language === 'zh'
                    ? 'Luyện tập viết các đoạn văn tiếng Trung tự do. AI sẽ nhận xét ngữ pháp, sửa lỗi và gợi ý cách viết tự nhiên hơn.'
                    : 'Luyện tập viết các đoạn văn tiếng Anh tự do. AI sẽ nhận xét ngữ pháp, sửa lỗi và gợi ý cách viết tự nhiên hơn.'}
                </p>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isChecking}
                className="w-full h-48 p-4 bg-slate-50 border border-outline rounded-xl mb-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none text-primary leading-relaxed text-sm transition-colors"
                placeholder={
                  language === 'zh'
                    ? "Nhập đoạn văn tiếng Trung của bạn vào đây..."
                    : "Nhập đoạn văn tiếng Anh của bạn vào đây..."
                }
              />

              {errorMsg && (
                <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleCheck}
                disabled={isChecking || !text.trim()}
                className="w-full sm:w-auto self-end px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang chấm điểm bài viết...
                  </>
                ) : (
                  'Gửi để chấm điểm'
                )}
              </button>

              {result && (
                <div className="mt-8 p-6 bg-surface-container-low border border-outline rounded-2xl animate-in fade-in slide-in-from-top-3">
                  <div className="flex items-center justify-between border-b border-outline/50 pb-4 mb-4">
                    <span className="text-base font-bold text-primary">Kết quả AI đánh giá:</span>
                    <span
                      className={`text-lg font-bold px-3 py-1 rounded-full ${result.score >= 70
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}
                    >
                      {result.score}/100 Điểm
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <strong className="text-sm text-primary block mb-1">Nhận xét ngữ pháp:</strong>
                      <p className="text-sm text-primary leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-outline/40 select-all">
                        {result.feedback}
                      </p>
                    </div>

                    {result.suggestion && (
                      <div>
                        <strong className="text-sm text-emerald-700 block mb-1">💡 Gợi ý đoạn văn viết chuẩn:</strong>
                        <p className="text-sm text-emerald-950 font-medium italic bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 select-all whitespace-pre-line">
                          "{result.suggestion}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
