'use client';

import React, { useState, useEffect } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';

interface WordCommentSectionProps {
  wordId: string;
  lang: string;
  onReportCommentClick: (commentId: string) => void;
}

export const WordCommentSection: React.FC<WordCommentSectionProps> = ({ wordId, lang, onReportCommentClick }) => {
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');

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

  const comments = useCommunityStore((state) => state.wordComments);
  const fetchComments = useCommunityStore((state) => state.fetchWordComments);
  const createComment = useCommunityStore((state) => state.createWordComment);
  const deleteComment = useCommunityStore((state) => state.deleteWordComment);
  const voteComment = useCommunityStore((state) => state.voteWordComment);
  const loading = useCommunityStore((state) => state.loading);

  useEffect(() => {
    fetchComments(wordId, lang);
  }, [wordId, lang, fetchComments]);

  // Kiểm tra xem user hiện tại đã bình luận từ này chưa
  const hasUserCommented = comments.some(c => c.user?.id === user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await createComment(wordId, lang, content);
      setContent('');
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.detail || 'Không thể gửi bình luận.'
      });
    } finally {
      setContent('');
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
          await deleteComment(commentId);
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
      <div className="mt-4 border-t border-slate-800/80 pt-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-semibold text-slate-300 font-lexend flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-400 text-sm">comment</span>
          Ý kiến cộng đồng ({comments.length})
        </h4>
        <span className="text-[10px] text-slate-500 font-inter">Xếp theo điểm vote cao nhất</span>
      </div>

      {/* Form viết bình luận (chỉ hiển thị nếu user chưa comment từ này) */}
      {!hasUserCommented ? (
        <form onSubmit={handleSubmit} className="flex gap-2.5 items-start">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-800 bg-slate-950 flex-shrink-0 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-slate-500 text-xs">person</span>
            )}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ cách nhớ từ vựng này..."
              maxLength={500}
              className="flex-1 bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-inter"
            />
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3.5 py-1.5 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : 'Gửi'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 py-2 text-[10px] text-slate-400 font-inter text-center">
          Bạn đã đóng góp ý kiến cho từ vựng này. Bạn có thể xóa bình luận hiện tại để viết bình luận mới.
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-6 font-inter">
            Chưa có bình luận nào cho từ vựng này.
          </p>
        ) : (
          comments.map((comment) => {
            const isCommentAuthor = user?.id === comment.user?.id;
            return (
              <div 
                key={comment.id} 
                className="flex gap-2.5 items-start p-3 bg-slate-950/20 border border-slate-850/60 rounded-xl hover:border-slate-800/80 transition-colors"
              >
                {/* Vote Control Panel (Up/Down) */}
                <div className="flex flex-col items-center gap-1.5 px-1 pt-0.5">
                  <button
                    onClick={() => voteComment(comment.id, 1)}
                    className={`hover:text-indigo-400 p-0.5 rounded transition-all ${
                      comment.my_vote === 1 ? 'text-indigo-400 scale-110 font-bold' : 'text-slate-500'
                    }`}
                    title="Hữu ích (Upvote)"
                  >
                    <span className="material-symbols-outlined text-sm">thumb_up</span>
                  </button>
                  <span className={`text-[10px] font-bold font-inter ${
                    comment.score > 0 ? 'text-indigo-400' : comment.score < 0 ? 'text-rose-500' : 'text-slate-500'
                  }`}>
                    {comment.score}
                  </span>
                  <button
                    onClick={() => voteComment(comment.id, -1)}
                    className={`hover:text-rose-400 p-0.5 rounded transition-all ${
                      comment.my_vote === -1 ? 'text-rose-500 scale-110 font-bold' : 'text-slate-500'
                    }`}
                    title="Không hữu ích (Downvote)"
                  >
                    <span className="material-symbols-outlined text-sm">thumb_down</span>
                  </button>
                </div>

                {/* Comment Content */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 font-lexend">
                        {comment.user?.full_name || comment.user?.username || 'Cộng đồng viên'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-inter">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCommentAuthor ? (
                        <button
                          onClick={() => handleCommentDelete(comment.id)}
                          className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                          title="Xóa bình luận"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onReportCommentClick(comment.id)}
                          className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                          title="Báo cáo bình luận"
                        >
                          <span className="material-symbols-outlined text-sm">report</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300 font-inter text-xs leading-relaxed break-words whitespace-pre-wrap">
                    {comment.content}
                  </p>
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
export default WordCommentSection;
