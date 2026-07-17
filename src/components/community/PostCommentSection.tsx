'use client';

import React, { useState, useEffect } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { getMediaUrl } from '@/lib/mediaUtils';
import UserAvatarContainer from '@/components/UserAvatarContainer';

interface PostCommentSectionProps {
  postId: string;
  onReportCommentClick: (commentId: string) => void;
}

export const PostCommentSection: React.FC<PostCommentSectionProps> = ({ postId, onReportCommentClick }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
  
  const comments = useCommunityStore((state) => state.postComments);
  const fetchComments = useCommunityStore((state) => state.fetchPostComments);
  const createComment = useCommunityStore((state) => state.createPostComment);
  const deleteComment = useCommunityStore((state) => state.deleteComment);
  const likeComment = useCommunityStore((state) => state.likeComment);

  useEffect(() => {
    fetchComments(postId);
  }, [postId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await createComment(postId, content);
      setContent('');
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.detail || 'Không thể đăng bình luận.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bình luận',
      message: 'Bạn có chắc muốn xóa bình luận này không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteComment(commentId, postId);
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Không thể xóa bình luận.'
          });
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

  return (
    <>
      <div className="flex flex-col gap-5 text-[#0b1c30]">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-lexend flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[#426657] text-sm">chat_bubble</span>
        Bình luận ({comments.length})
      </h4>

      {/* Write Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <UserAvatarContainer 
          user={user} 
          sizeClass="w-8 h-8"
        />
        <div className="flex-1 flex gap-2 min-w-0">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết phản hồi của bạn..."
            className="w-full min-w-0 flex-1 bg-white border border-[#E2E8F0] focus:border-[#1d2b3e] rounded-xl px-4 py-2 text-xs text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1d2b3e]/30 font-inter"
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="bg-[#1d2b3e] hover:bg-[#1d2b3e]/90 text-white rounded-xl w-9 h-9 flex items-center justify-center shrink-0 hover:shadow-sm transition-all disabled:opacity-50"
            title="Gửi bình luận"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-sm">send</span>
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        {comments.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-4 font-inter">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        ) : (
          comments.map((comment) => {
            const isCommentAuthor = user?.id === comment.user?.id;
            return (
              <div key={comment.id} className="flex gap-3 items-start">
                <UserAvatarContainer 
                  user={comment.user} 
                  sizeClass="w-8 h-8"
                />
                {/* Individual comment balloon similar to examples.html */}
                <div className="flex-1 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0b1c30] font-lexend">
                        {comment.user?.full_name || comment.user?.username || 'Cộng đồng viên'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-inter">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>

                    {/* Options (Delete / Report) */}
                    <div className="flex items-center gap-1">
                      {isCommentAuthor ? (
                        <button
                          onClick={() => handleCommentDelete(comment.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                          title="Xóa bình luận"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onReportCommentClick(comment.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                          title="Báo cáo bình luận"
                        >
                          <span className="material-symbols-outlined text-base">report</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[#44474c] font-inter text-xs leading-relaxed break-words">
                    {comment.content}
                  </p>

                  {/* Comment Actions (Like comment) */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => likeComment(comment.id)}
                      className={`flex items-center gap-1 text-[10px] transition-colors ${
                        comment.is_liked ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-sm ${comment.is_liked ? 'fill-current' : ''}`}>
                        favorite
                      </span>
                      <span>{comment.like_count || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
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
export default PostCommentSection;
