'use client';

import React, { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PostCommentSection } from './PostCommentSection';
import { CommunityReportModal } from './CommunityReportModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { getMediaUrl } from '@/lib/mediaUtils';

interface PostDetailProps {
  postId: string;
  lang: string;
}

export const PostDetail: React.FC<PostDetailProps> = ({ postId, lang }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportConfig, setReportConfig] = useState<{
    isOpen: boolean;
    contentType: 'post' | 'post_comment' | 'word_comment';
    objectId: string;
  }>({
    isOpen: false,
    contentType: 'post',
    objectId: ''
  });

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

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const currentPost = useCommunityStore((state) => state.currentPost);
  const fetchPostDetail = useCommunityStore((state) => state.fetchPostDetail);
  const deletePost = useCommunityStore((state) => state.deletePost);
  const likePost = useCommunityStore((state) => state.likePost);
  const bookmarkPost = useCommunityStore((state) => state.bookmarkPost);
  const loading = useCommunityStore((state) => state.loading);

  useEffect(() => {
    fetchPostDetail(postId);
  }, [postId, fetchPostDetail]);

  if (loading && !currentPost) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1d2b3e] rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-inter">Đang tải nội dung...</span>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-slate-400 text-4xl">error</span>
        <h5 className="text-sm font-semibold text-slate-500 font-lexend">Không tìm thấy bài viết</h5>
        <p className="text-xs text-slate-400 font-inter">
          Bài viết này có thể không tồn tại hoặc đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.
        </p>
        <Link href={`/${lang}/community`}>
          <button className="mt-2 px-4 py-2 bg-[#1d2b3e] hover:bg-[#1d2b3e]/90 text-white rounded-xl text-xs font-semibold font-lexend transition-colors">
            Quay lại diễn đàn
          </button>
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === currentPost.author?.id;

  const handleDelete = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsDeleting(true);
        try {
          await deletePost(currentPost.id);
          router.push(`/${lang}/community`);
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Không thể xóa bài viết. Vui lòng thử lại.'
          });
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleReportPost = () => {
    setReportConfig({
      isOpen: true,
      contentType: 'post',
      objectId: currentPost.id
    });
  };

  const handleReportComment = (commentId: string) => {
    setReportConfig({
      isOpen: true,
      contentType: 'post_comment',
      objectId: commentId
    });
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
    } catch (e) {
      return '';
    }
  };

  const langTagLabel = currentPost.lang === 'zh' ? 'Mandarin' : 'English';

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto pb-20 text-[#0b1c30]">
      {/* Back Button */}
      <div>
        <Link href={`/${lang}/community`} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1d2b3e] transition-colors font-lexend">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại Diễn đàn
        </Link>
      </div>

      {/* Main Post Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col overflow-hidden animate-slide-up">
        {/* Detail Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Author Header */}
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-[#E2E8F0] bg-slate-50 flex-shrink-0 flex items-center justify-center">
                {currentPost.author?.avatar ? (
                  <img src={getMediaUrl(currentPost.author.avatar) || ''} alt={currentPost.author.full_name || currentPost.author.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-400 text-2xl">person</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0b1c30] font-lexend">
                  {currentPost.author?.full_name || currentPost.author?.username || 'Cộng đồng viên'}
                </span>
                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-inter mt-0.5">
                  <span>{formatTime(currentPost.created_at)}</span>
                  <span className="w-1 h-1 bg-slate-350 rounded-full"></span>
                  <span className={`font-bold uppercase tracking-wider text-[10px] ${
                    currentPost.lang === 'zh' ? 'text-[#2a4d40]' : 'text-indigo-650'
                  }`}>
                    {langTagLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-slate-400 hover:text-slate-650 p-1 hover:bg-[#F1F5F9] rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
              
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                  <div className="absolute right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl w-36 py-1.5 z-20 animate-fade-in">
                    {isAuthor ? (
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full px-4 py-2 text-left text-xs text-red-500 hover:bg-slate-55 transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        {isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          handleReportPost();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-650 hover:bg-slate-55 transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">report</span>
                        Báo cáo bài
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-[#0b1c30] font-inter text-sm leading-relaxed whitespace-pre-wrap">
            {currentPost.content}
          </p>

          {/* Image Attachment */}
          {currentPost.image_url && (
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50 aspect-video w-full relative">
              <img 
                src={getMediaUrl(currentPost.image_url) || ''} 
                alt="Post media" 
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Actions (Like, Save) */}
          <div className="border-t border-[#E2E8F0]/80 pt-4 flex items-center justify-between text-slate-550">
            <div className="flex items-center gap-6">
              <button
                onClick={() => likePost(currentPost.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-[#F1F5F9] transition-all ${
                  currentPost.is_liked ? 'text-rose-500 font-semibold' : ''
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${currentPost.is_liked ? 'fill-current' : ''}`}>
                  favorite
                </span>
                <span className="text-xs font-inter font-medium">{currentPost.like_count || 0} lượt thích</span>
              </button>

              <button
                onClick={() => bookmarkPost(currentPost.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-[#F1F5F9] transition-all ${
                  currentPost.is_bookmarked ? 'text-[#426657] font-semibold' : ''
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${currentPost.is_bookmarked ? 'fill-current' : ''}`}>
                  bookmark
                </span>
                <span className="text-xs font-inter font-medium">{currentPost.is_bookmarked ? 'Đã lưu' : 'Lưu bài viết'}</span>
              </button>
            </div>

            {!isAuthor && (
              <button
                onClick={handleReportPost}
                className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">report</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Comments Section Component (Light Theme matching styling) */}
        <div className="bg-[#eff4ff]/20 border-t border-[#E2E8F0]/65 p-6 space-y-4">
          <PostCommentSection 
            postId={currentPost.id} 
            onReportCommentClick={handleReportComment}
          />
        </div>
      </div>

      {/* Report Modal */}
      <CommunityReportModal 
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ ...reportConfig, isOpen: false })}
        contentType={reportConfig.contentType}
        objectId={reportConfig.objectId}
      />
      </div>

      {/* Alert and Confirm Modals */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isDestructive={true}
      />
    </>
  );
};
export default PostDetail;
