'use client';

import React, { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { getMediaUrl } from '@/lib/mediaUtils';

interface CommunityManageTabProps {
  lang: string;
}

type SubTab = 'posts' | 'comments' | 'likes' | 'bookmarks' | 'hidden';

export const CommunityManageTab: React.FC<CommunityManageTabProps> = ({ lang }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('posts');
  const [appealReason, setAppealReason] = useState('');
  const [appealTarget, setAppealTarget] = useState<{
    id: string;
    type: 'post' | 'post_comment' | 'word_comment';
  } | null>(null);

  const [submittingAppeal, setSubmittingAppeal] = useState(false);

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
    onConfirm: () => { }
  });

  const {
    myPosts,
    myComments,
    myLikes,
    myBookmarks,
    myHiddenContent,
    appeals,
    loading,
    fetchProfileCommunityData,
    fetchAppeals,
    createAppeal,
    deletePost,
    deleteComment,
    deleteWordComment,
  } = useCommunityStore();

  useEffect(() => {
    fetchProfileCommunityData();
    fetchAppeals();
  }, [fetchProfileCommunityData, fetchAppeals]);

  const handleDeletePost = async (postId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deletePost(postId);
          fetchProfileCommunityData();
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Xóa bài viết thất bại.'
          });
        }
      }
    });
  };

  const handleDeletePostComment = async (commentId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bình luận',
      message: 'Bạn có chắc chắn muốn xóa bình luận này không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteComment(commentId, '');
          fetchProfileCommunityData();
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Xóa bình luận thất bại.'
          });
        }
      }
    });
  };

  const handleDeleteWordComment = async (commentId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bình luận từ vựng',
      message: 'Bạn có chắc chắn muốn xóa bình luận từ vựng này không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteWordComment(commentId);
          fetchProfileCommunityData();
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Xóa bình luận thất bại.'
          });
        }
      }
    });
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealTarget || !appealReason.trim()) return;

    setSubmittingAppeal(true);
    try {
      await createAppeal(appealTarget.type, appealTarget.id, appealReason);
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Thành công',
        message: 'Gửi khiếu nại thành công! Vui lòng chờ quản trị viên xem xét.'
      });
      setAppealReason('');
      setAppealTarget(null);
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.detail || 'Không thể gửi khiếu nại.'
      });
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
    } catch (e) {
      return '';
    }
  };

  const getAppealStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Chờ duyệt</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-850 text-[10px] font-bold">Chấp nhận</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Từ chối</span>;
      default:
        return null;
    }
  };

  // Số lượng nội dung bị ẩn
  const hiddenCount =
    (myHiddenContent?.posts?.length || 0) +
    (myHiddenContent?.post_comments?.length || 0) +
    (myHiddenContent?.word_comments?.length || 0);

  const SUB_TABS = [
    { id: 'posts' as SubTab, label: 'Bài viết', icon: 'feed', badge: 0 },
    { id: 'comments' as SubTab, label: 'Bình luận', icon: 'forum', badge: 0 },
    { id: 'likes' as SubTab, label: 'Đã thích', icon: 'favorite', badge: 0 },
    { id: 'bookmarks' as SubTab, label: 'Đã lưu', icon: 'bookmark', badge: 0 },
    { id: 'hidden' as SubTab, label: 'Khiếu nại', icon: 'gavel', badge: hiddenCount },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 text-[#0b1c30] pb-24 md:pb-6">
        {/* Navigation Sub-Tabs (Bottom bar on Mobile, Horizontal tabs on Desktop) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-2 py-2 flex justify-around shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] md:relative md:bottom-auto md:left-auto md:right-auto md:bg-[#e5eeff]/45 md:p-1.5 md:border md:border-[#E2E8F0] md:rounded-2xl md:w-full md:flex-wrap md:gap-3 md:justify-between md:shadow-none md:z-auto">
          {SUB_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setAppealTarget(null);
              }}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-1 md:py-2 md:px-5 rounded-xl transition-all flex-1 md:flex-none text-center ${activeSubTab === tab.id
                ? 'bg-[#1d2b3e] text-white shadow-sm md:shadow-md'
                : 'text-[#44474c] hover:bg-[#F1F5F9]'
                }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-lg md:text-base">{tab.icon}</span>
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] min-h-[14px] px-1 bg-rose-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] md:text-xs font-semibold font-lexend block tracking-tight line-clamp-1">
                {tab.id === 'hidden' ? 'Khiếu nại' : tab.label}
              </span>
            </button>
          ))}
        </div>

        {loading && !myComments && myPosts.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#1d2b3e] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="min-h-[300px] animate-slide-up">
            {/* TAB 1: MY POSTS */}
            {activeSubTab === 'posts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPosts.length === 0 ? (
                  <p className="text-slate-400 text-xs font-inter text-center py-10 w-full col-span-2">Bạn chưa đăng bài viết nào.</p>
                ) : (
                  myPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] hover:translate-y-[-2px] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2.5">
                          <span className="px-2 py-0.5 bg-[#c1e8d6] text-[#2a4d40] text-[10px] rounded font-bold uppercase tracking-wider">
                            {post.lang === 'zh' ? 'Mandarin' : 'English'}
                          </span>
                          <span className="text-slate-400 text-[10px] font-inter">{formatTime(post.created_at)}</span>
                        </div>
                        <Link href={`/${lang}/community/post/${post.id}`}>
                          <p className="text-[#0b1c30] font-inter text-sm line-clamp-3 leading-relaxed hover:text-[#1d2b3e] cursor-pointer mb-2.5">
                            {post.content}
                          </p>
                        </Link>
                        {post.image_url && (
                          <Link href={`/${lang}/community/post/${post.id}`}>
                            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50 aspect-video w-full cursor-pointer relative group mb-1">
                              <img
                                src={getMediaUrl(post.image_url) || ''}
                                alt="Post attachment"
                                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                              />
                            </div>
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#E2E8F0]/50 text-slate-400">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">favorite</span>
                            <span className="text-[11px] font-medium font-inter">{post.like_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">chat_bubble</span>
                            <span className="text-[11px] font-medium font-inter">{post.comment_count || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Link href={`/${lang}/community/post/${post.id}`}>
                            <button className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-[#F1F5F9] rounded-lg transition-colors">
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: MY COMMENTS */}
            {activeSubTab === 'comments' && (
              <div className="flex flex-col gap-4">
                {(!myComments || (myComments.post_comments.length === 0 && myComments.word_comments.length === 0)) ? (
                  <p className="text-slate-400 text-xs font-inter text-center py-10">Bạn chưa gửi bình luận nào.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Post comments */}
                    {myComments.post_comments.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-lexend">Bình luận diễn đàn</h5>
                        {myComments.post_comments.map(c => (
                          <div key={c.id} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] hover:translate-y-[-2px] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.06)] transition-all flex justify-between items-center gap-4">
                            <Link href={`/${lang}/community/post/${c.post}`} className="flex-1 min-w-0">
                              <div className="flex flex-col gap-1 cursor-pointer">
                                <p className="text-[#0b1c30] font-inter text-xs line-clamp-1 pr-2">"{c.content}"</p>
                                <span className="text-[9px] text-slate-400 font-inter">Đăng {formatTime(c.created_at)}</span>
                              </div>
                            </Link>
                            <button
                              onClick={() => handleDeletePostComment(c.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Word comments */}
                    {myComments.word_comments.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-lexend">Đóng góp ý kiến từ vựng</h5>
                        {myComments.word_comments.map(c => (
                          <div key={c.id} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] hover:translate-y-[-2px] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.06)] transition-all flex justify-between items-center gap-4">
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <p className="text-[#0b1c30] font-inter text-xs line-clamp-1 pr-2">"{c.content}"</p>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-inter">
                                <span>Ngôn ngữ: {c.lang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'}</span>
                                <span>•</span>
                                <span>Score: {c.score}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteWordComment(c.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LIKED POSTS */}
            {activeSubTab === 'likes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLikes.length === 0 ? (
                  <p className="text-slate-400 text-xs font-inter text-center py-10 col-span-2">Bạn chưa thích bài viết nào.</p>
                ) : (
                  myLikes.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] hover:translate-y-[-2px] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
                      <Link href={`/${lang}/community/post/${post.id}`}>
                        <div className="flex flex-col gap-2 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-semibold font-inter">Đăng bởi {post.author?.full_name || post.author?.username}</span>
                            <span className="text-[10px] text-slate-400 font-inter">{formatTime(post.created_at)}</span>
                          </div>
                          <p className="text-[#44474c] font-inter text-xs line-clamp-3 leading-relaxed mb-1">{post.content}</p>
                          {post.image_url && (
                            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50 aspect-video w-full relative group mt-1">
                              <img
                                src={getMediaUrl(post.image_url) || ''}
                                alt="Post attachment"
                                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: BOOKMARKED POSTS */}
            {activeSubTab === 'bookmarks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBookmarks.length === 0 ? (
                  <p className="text-slate-400 text-xs font-inter text-center py-10 col-span-2">Bạn chưa lưu bài viết nào.</p>
                ) : (
                  myBookmarks.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] hover:translate-y-[-2px] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
                      <Link href={`/${lang}/community/post/${post.id}`}>
                        <div className="flex flex-col gap-2 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-[#426657] font-extrabold font-inter">Đăng bởi {post.author?.full_name || post.author?.username}</span>
                            <span className="text-[10px] text-slate-400 font-inter">{formatTime(post.created_at)}</span>
                          </div>
                          <p className="text-[#44474c] font-inter text-xs line-clamp-3 leading-relaxed mb-1">{post.content}</p>
                          {post.image_url && (
                            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50 aspect-video w-full relative group mt-1">
                              <img
                                src={getMediaUrl(post.image_url) || ''}
                                alt="Post attachment"
                                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: HIDDEN & APPEAL */}
            {activeSubTab === 'hidden' && (
              <div className="flex flex-col gap-6">
                {/* Form appeal input (if target is selected) */}
                {appealTarget && (
                  <form onSubmit={handleSendAppeal} className="bg-white border-2 border-[#1d2b3e]/30 p-5 rounded-2xl flex flex-col gap-4 animate-slide-up">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#1d2b3e] font-lexend flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">campaign</span>
                        Gửi khiếu nại khôi phục nội dung
                      </span>
                      <button type="button" onClick={() => setAppealTarget(null)} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <textarea
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Giải thích rõ lý do nội dung của bạn hợp lệ, không vi phạm các tiêu chuẩn cộng đồng để quản trị viên phê duyệt sớm nhất..."
                      rows={3}
                      maxLength={1000}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#1d2b3e] rounded-xl px-4 py-2.5 text-xs text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1d2b3e]/30 font-inter"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAppealTarget(null)}
                        className="px-4 py-1.5 text-xs text-slate-400 hover:bg-[#F1F5F9] rounded-xl font-bold font-lexend transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={!appealReason.trim() || submittingAppeal}
                        className="px-5 py-1.5 bg-[#1d2b3e] hover:bg-[#1d2b3e]/90 text-white rounded-xl text-xs font-bold font-lexend transition-all disabled:opacity-50"
                      >
                        {submittingAppeal ? 'Đang gửi...' : 'Gửi khiếu nại'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Hidden contents list */}
                <div className="flex flex-col gap-4">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-lexend">Danh sách nội dung bị ẩn</h5>

                  {(!myHiddenContent || (myHiddenContent.posts.length === 0 && myHiddenContent.post_comments.length === 0 && myHiddenContent.word_comments.length === 0)) ? (
                    <p className="text-slate-400 text-xs font-inter text-center py-8 border border-dashed border-[#E2E8F0] rounded-2xl bg-white">Không có nội dung nào bị ẩn do vi phạm cộng đồng.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Hidden posts */}
                      {myHiddenContent.posts.map(post => (
                        <div key={post.id} className="bg-rose-500/5 border border-rose-200 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-sm hover:translate-y-[-2px] transition-all">
                          <div>
                            <span className="text-[9px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Bài viết bị ẩn</span>
                            <p className="text-[#0b1c30] font-inter text-xs line-clamp-2 mt-2 leading-relaxed">{post.content}</p>
                          </div>
                          <button
                            onClick={() => setAppealTarget({ id: post.id, type: 'post' })}
                            className="px-3.5 py-1.5 bg-white border border-rose-350 hover:bg-rose-100/10 text-rose-600 hover:text-rose-500 text-xs font-bold font-lexend rounded-xl transition-all w-full text-center"
                          >
                            Gửi khiếu nại
                          </button>
                        </div>
                      ))}

                      {/* Hidden post comments */}
                      {myHiddenContent.post_comments.map(c => (
                        <div key={c.id} className="bg-rose-500/5 border border-rose-200 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-sm hover:translate-y-[-2px] transition-all">
                          <div>
                            <span className="text-[9px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Bình luận bị ẩn</span>
                            <p className="text-[#0b1c30] font-inter text-xs line-clamp-2 mt-2 leading-relaxed">"{c.content}"</p>
                          </div>
                          <button
                            onClick={() => setAppealTarget({ id: c.id, type: 'post_comment' })}
                            className="px-3.5 py-1.5 bg-white border border-rose-350 hover:bg-rose-100/10 text-rose-600 hover:text-rose-500 text-xs font-bold font-lexend rounded-xl transition-all w-full text-center"
                          >
                            Gửi khiếu nại
                          </button>
                        </div>
                      ))}

                      {/* Hidden word comments */}
                      {myHiddenContent.word_comments.map(c => (
                        <div key={c.id} className="bg-rose-500/5 border border-rose-200 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-sm hover:translate-y-[-2px] transition-all">
                          <div>
                            <span className="text-[9px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Ý kiến từ vựng bị ẩn</span>
                            <p className="text-[#0b1c30] font-inter text-xs line-clamp-2 mt-2 leading-relaxed">"{c.content}"</p>
                          </div>
                          <button
                            onClick={() => setAppealTarget({ id: c.id, type: 'word_comment' })}
                            className="px-3.5 py-1.5 bg-white border border-rose-350 hover:bg-rose-100/10 text-rose-600 hover:text-rose-500 text-xs font-bold font-lexend rounded-xl transition-all w-full text-center"
                          >
                            Gửi khiếu nại
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Appeal history */}
                <div className="flex flex-col gap-4 mt-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-lexend">Lịch sử khiếu nại</h5>
                  {appeals.length === 0 ? (
                    <p className="text-slate-400 text-xs font-inter text-center py-6 border border-dashed border-[#E2E8F0] bg-white rounded-2xl">Không có lịch sử khiếu nại.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {appeals.map(appeal => (
                        <div key={appeal.id} className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-5 flex flex-col gap-2 hover:translate-y-[-2px] transition-all">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 font-inter uppercase">
                              {appeal.content_type === 'post' ? 'Bài viết' : 'Bình luận'}
                            </span>
                            {getAppealStatusBadge(appeal.status)}
                          </div>
                          <p className="text-[#44474c] text-xs font-inter leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            Lý do gửi: "{appeal.reason}"
                          </p>
                          {appeal.admin_notes && (
                            <div className="mt-1 bg-indigo-50/20 p-3 rounded-xl border border-[#e5eeff]">
                              <span className="text-[10px] text-indigo-900 font-bold block font-lexend">Phản hồi của Admin:</span>
                              <span className="text-xs text-indigo-950 font-inter mt-0.5 block">{appeal.admin_notes}</span>
                            </div>
                          )}
                          <span className="text-[9px] text-slate-400 font-inter self-end mt-1">
                            Gửi {formatTime(appeal.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
export default CommunityManageTab;
