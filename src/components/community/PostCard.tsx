'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { getMediaUrl } from '@/lib/mediaUtils';

interface PostCardProps {
  post: any;
  lang: string;
  onReportClick: (postId: string) => void;
  onPostDeleted?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, lang, onReportClick, onPostDeleted }) => {
  const { user } = useAuthStore();
  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const likePost = useCommunityStore((state) => state.likePost);
  const bookmarkPost = useCommunityStore((state) => state.bookmarkPost);
  const deletePost = useCommunityStore((state) => state.deletePost);

  const isAuthor = user?.id === post.author?.id;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    likePost(post.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    bookmarkPost(post.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsDeleting(true);
        try {
          await deletePost(post.id);
          if (onPostDeleted) onPostDeleted();
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

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
    } catch (e) {
      return '';
    }
  };

  const langTagLabel = post.lang === 'zh' ? 'Mandarin' : 'English';

  return (
    <>
      <article className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:translate-y-[-2px] hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 relative flex flex-col overflow-hidden">
      <div className="p-6 flex flex-col gap-4">
        {/* Header Info */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-[#E2E8F0] bg-slate-50 flex-shrink-0 flex items-center justify-center">
              {post.author?.avatar ? (
                <img src={getMediaUrl(post.author.avatar) || ''} alt={post.author.full_name || post.author.username} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-slate-400 text-2xl">person</span>
              )}
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-[#0b1c30] font-lexend">
                {post.author?.full_name || post.author?.username || 'Cộng đồng viên'}
              </h4>
              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-inter mt-0.5">
                <span>{formatTime(post.created_at)}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${post.lang === 'zh' ? 'text-[#2a4d40]' : 'text-indigo-600'
                  }`}>
                  {langTagLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Options Button */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-[#F1F5F9] rounded-lg transition-colors"
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
                      className="w-full px-4 py-2 text-left text-xs text-red-500 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      {isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        onReportClick(post.id);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-650 hover:bg-slate-50 transition-colors flex items-center gap-2"
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

        {/* Post Text */}
        {(() => {
          const isLongText = post.content.length > 200 || post.content.split('\n').length > 4;

          return (
            <div className="flex flex-col items-start gap-1 w-full">
              <Link href={`/${lang}/community/post/${post.id}`} className="block w-full">
                <p className={`text-[#0b1c30] font-inter text-sm leading-relaxed whitespace-pre-wrap break-all hover:text-indigo-900 transition-colors cursor-pointer ${
                  !isExpanded ? 'line-clamp-4' : 'line-clamp-none'
                }`}>
                  {post.content}
                </p>
              </Link>
              {isLongText && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-xs font-semibold text-[#1d2b3e] hover:text-indigo-650 transition-colors mt-0.5 font-lexend focus:outline-none"
                >
                  {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </div>
          );
        })()}

        {/* Post Image Media */}
        {post.image_url && (
          <Link href={`/${lang}/community/post/${post.id}`}>
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50 aspect-video w-full cursor-pointer relative group">
              <img
                src={getMediaUrl(post.image_url) || ''}
                alt="Post attachment"
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          </Link>
        )}

        {/* Actions (Like, Comment, Save, Report) */}
        <div className="border-t border-[#E2E8F0]/80 pt-4 flex items-center justify-between text-slate-500">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-all hover:text-rose-500 ${post.is_liked ? 'text-rose-500 font-semibold' : ''
                }`}
            >
              <span className={`material-symbols-outlined text-lg ${post.is_liked ? 'fill-current' : ''}`}>
                favorite
              </span>
              <span className="text-xs font-inter font-medium">{post.like_count || 0}</span>
            </button>

            <Link href={`/${lang}/community/post/${post.id}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              <span className="text-xs font-inter font-medium">{post.comment_count || 0}</span>
            </Link>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 transition-all hover:text-[#426657] ${post.is_bookmarked ? 'text-[#426657] font-semibold' : ''
                }`}
            >
              <span className={`material-symbols-outlined text-lg ${post.is_bookmarked ? 'fill-current' : ''}`}>
                bookmark
              </span>
              <span className="text-xs font-inter font-medium">Save</span>
            </button>
          </div>

          {!isAuthor && (
            <button
              onClick={() => onReportClick(post.id)}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">report</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Report</span>
            </button>
          )}
        </div>
      </div>
    </article>

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
export default PostCard;
