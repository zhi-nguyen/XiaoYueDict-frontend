'use client';

import React, { useState, useEffect } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { CommunityReportModal } from './CommunityReportModal';

interface ForumFeedProps {
  lang: string;
}

export const ForumFeed: React.FC<ForumFeedProps> = ({ lang }) => {
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [activeFilter, setActiveFilter] = useState<'all' | 'zh' | 'en'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [reportConfig, setReportConfig] = useState<{
    isOpen: boolean;
    contentType: 'post' | 'post_comment' | 'word_comment';
    objectId: string;
  }>({
    isOpen: false,
    contentType: 'post',
    objectId: ''
  });

  const posts = useCommunityStore((state) => state.posts);
  const fetchPosts = useCommunityStore((state) => state.fetchPosts);
  const createPost = useCommunityStore((state) => state.createPost);
  const loading = useCommunityStore((state) => state.loading);

  useEffect(() => {
    fetchPosts(lang);
  }, [lang, fetchPosts]);

  const handleReportClick = (postId: string) => {
    setReportConfig({
      isOpen: true,
      contentType: 'post',
      objectId: postId
    });
  };



  // Filter posts based on language activeFilter and search query
  const filteredPosts = posts.filter(post => {
    const matchesLang = activeFilter === 'all' || post.lang === activeFilter;
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.author?.full_name || post.author?.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesSearch;
  });

  // Calculate live stats for the sidebar widget
  const activeLearners = Math.max(10, posts.length * 3 + 5);
  const dailyPostsCount = posts.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length + 2;

  return (
    <div className="w-full max-w-6xl mx-auto pb-10 flex flex-col gap-6">
      {/* Search & Language Filters Pill Navigation */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-lexend text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm ${activeFilter === 'all'
              ? 'bg-[#1d2b3e] text-white'
              : 'bg-white border border-[#E2E8F0] text-[#44474c] hover:bg-[#F1F5F9]'
              }`}
          >
            Tất cả ngôn ngữ
          </button>
          <button
            onClick={() => setActiveFilter('zh')}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-lexend text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm ${activeFilter === 'zh'
              ? 'bg-[#1d2b3e] text-white'
              : 'bg-white border border-[#E2E8F0] text-[#44474c] hover:bg-[#F1F5F9]'
              }`}
          >
            Tiếng Trung (Mandarin)
          </button>
          <button
            onClick={() => setActiveFilter('en')}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-lexend text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm ${activeFilter === 'en'
              ? 'bg-[#1d2b3e] text-white'
              : 'bg-white border border-[#E2E8F0] text-[#44474c] hover:bg-[#F1F5F9]'
              }`}
          >
            Tiếng Anh (English)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm bài viết, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-full pl-9 pr-4 py-2 text-xs text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d2b3e]/20 transition-all font-inter"
          />
        </div>
      </div>

      {/* Grid Layout PC: 3 Columns (Feed: 2 Col, Sidebar: 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Section (Facebook-style thin bar) */}
          <section
            onClick={() => setIsCreateOpen(true)}
            className="bg-white rounded-full px-4 py-2.5 border border-[#E2E8F0] shadow-sm hover:border-[#cbd5e1] hover:shadow-md cursor-pointer transition-all duration-300 flex items-center justify-between gap-3 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="My avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                )}
              </div>
              <div className="flex-1 bg-[#F8FAFC] rounded-full px-4 py-1.5 border border-[#E2E8F0]/80 min-w-0">
                <p className="text-xs text-slate-400 truncate font-inter">
                  Bạn đang nghĩ gì, {user?.last_name || 'học giả'}?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">

              {/* Photo/Gallery Icon */}
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-105 text-emerald-500 transition-colors"
                title="Thêm hình ảnh"
              >
                <span className="material-symbols-outlined text-lg">image</span>
              </button>

            </div>
          </section>

          {/* Feed Posts */}
          <div className="space-y-6">
            {loading && posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E2E8F0] rounded-2xl">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1d2b3e] rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-inter">Đang tải bảng tin cộng đồng...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E2E8F0] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-slate-300 text-4xl">feed</span>
                <h5 className="text-sm font-semibold text-slate-400 font-lexend">Bảng tin trống</h5>
                <p className="text-xs text-slate-500 max-w-sm font-inter">
                  {searchQuery ? 'Không tìm thấy bài viết nào khớp với từ khóa tìm kiếm.' : 'Chưa có hoạt động học tập nào được chia sẻ ở diễn đàn này.'}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  lang={lang}
                  onReportClick={handleReportClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        lang={lang}
      />

      {/* Report Modal */}
      <CommunityReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ ...reportConfig, isOpen: false })}
        contentType={reportConfig.contentType}
        objectId={reportConfig.objectId}
      />
    </div>
  );
};
export default ForumFeed;
