import { create } from 'zustand';
import * as api from '@/lib/api/community';

interface CommunityState {
  posts: any[];
  currentPost: any | null;
  postComments: any[];
  wordComments: any[];
  leaderboard: {
    entries: any[];
    my_entry: any | null;
    created_at: string | null;
    snapshot_id: string | null;
  } | null;
  appeals: any[];
  myPosts: any[];
  myComments: { post_comments: any[]; word_comments: any[] } | null;
  myLikes: any[];
  myBookmarks: any[];
  myHiddenContent: { posts: any[]; post_comments: any[]; word_comments: any[] } | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchPosts: (lang: string) => Promise<void>;
  createPost: (lang: string, content: string, file?: File) => Promise<void>;
  fetchPostDetail: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;

  fetchPostComments: (postId: string) => Promise<void>;
  createPostComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string, postId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;

  fetchWordComments: (wordId: string, lang: string) => Promise<void>;
  createWordComment: (wordId: string, lang: string, content: string) => Promise<void>;
  deleteWordComment: (commentId: string) => Promise<void>;
  voteWordComment: (commentId: string, vote: number) => Promise<void>;

  fetchLeaderboard: (boardType: string, lang: string) => Promise<void>;
  fetchAppeals: () => Promise<void>;
  createAppeal: (contentType: 'post' | 'post_comment' | 'word_comment', objectId: string, reason: string) => Promise<void>;
  reportContent: (contentType: 'post' | 'post_comment' | 'word_comment', objectId: string, reason: string, detail?: string) => Promise<void>;

  fetchProfileCommunityData: () => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  currentPost: null,
  postComments: [],
  wordComments: [],
  leaderboard: null,
  appeals: [],
  myPosts: [],
  myComments: null,
  myLikes: [],
  myBookmarks: [],
  myHiddenContent: null,
  loading: false,
  error: null,

  fetchPosts: async (lang) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getForumPosts(lang);
      set({ posts: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch posts', loading: false });
    }
  },

  createPost: async (lang, content, file) => {
    set({ loading: true, error: null });
    try {
      let imageUrl = '';
      if (file) {
        const uploadRes = await api.uploadCommunityImage(file, lang);
        imageUrl = uploadRes.image_url;
      }
      await api.createForumPost(lang, content, imageUrl);
      const data = await api.getForumPosts(lang);
      set({ posts: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to create post', loading: false });
      throw err;
    }
  },

  fetchPostDetail: async (postId) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getForumPostDetail(postId);
      set({ currentPost: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch post detail', loading: false });
    }
  },

  deletePost: async (postId) => {
    set({ loading: true, error: null });
    try {
      await api.deleteForumPost(postId);
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        myPosts: state.myPosts.filter((p) => p.id !== postId),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete post', loading: false });
      throw err;
    }
  },

  likePost: async (postId) => {
    try {
      const res = await api.likeForumPost(postId);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_liked: res.liked, like_count: res.like_count } : p
        ),
        currentPost:
          state.currentPost && state.currentPost.id === postId
            ? { ...state.currentPost, is_liked: res.liked, like_count: res.like_count }
            : state.currentPost,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to like post' });
    }
  },

  bookmarkPost: async (postId) => {
    try {
      const res = await api.bookmarkForumPost(postId);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, is_bookmarked: res.bookmarked } : p
        ),
        currentPost:
          state.currentPost && state.currentPost.id === postId
            ? { ...state.currentPost, is_bookmarked: res.bookmarked }
            : state.currentPost,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to bookmark post' });
    }
  },

  fetchPostComments: async (postId) => {
    try {
      const data = await api.getPostComments(postId);
      set({ postComments: data });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch comments' });
    }
  },

  createPostComment: async (postId, content) => {
    try {
      await api.createPostComment(postId, content);
      const data = await api.getPostComments(postId);
      set((state) => ({
        postComments: data,
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
        ),
        currentPost:
          state.currentPost && state.currentPost.id === postId
            ? { ...state.currentPost, comment_count: state.currentPost.comment_count + 1 }
            : state.currentPost,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to comment' });
      throw err;
    }
  },

  deleteComment: async (commentId, postId) => {
    try {
      await api.deletePostComment(commentId);
      set((state) => ({
        postComments: state.postComments.filter((c) => c.id !== commentId),
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p
        ),
        currentPost:
          state.currentPost && state.currentPost.id === postId
            ? { ...state.currentPost, comment_count: Math.max(0, state.currentPost.comment_count - 1) }
            : state.currentPost,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete comment' });
      throw err;
    }
  },

  likeComment: async (commentId) => {
    try {
      const res = await api.likePostComment(commentId);
      set((state) => ({
        postComments: state.postComments.map((c) =>
          c.id === commentId ? { ...c, is_liked: res.liked, like_count: res.like_count } : c
        ),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to like comment' });
    }
  },

  fetchWordComments: async (wordId, lang) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getWordComments(wordId, lang);
      set({ wordComments: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch word comments', loading: false });
    }
  },

  createWordComment: async (wordId, lang, content) => {
    try {
      await api.createWordComment(wordId, lang, content);
      const data = await api.getWordComments(wordId, lang);
      set({ wordComments: data });
    } catch (err: any) {
      set({ error: err.message || 'Failed to submit word comment' });
      throw err;
    }
  },

  deleteWordComment: async (commentId) => {
    try {
      await api.deleteWordComment(commentId);
      set((state) => ({
        wordComments: state.wordComments.filter((c) => c.id !== commentId)
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete word comment' });
      throw err;
    }
  },

  voteWordComment: async (commentId, vote) => {
    try {
      const res = await api.voteWordComment(commentId, vote);
      set((state) => ({
        wordComments: state.wordComments.map((c) => {
          if (c.id === commentId) {
            let diffUp = 0;
            let diffDown = 0;
            if (c.my_vote === vote) {
              if (vote === 1) diffUp = -1;
              else diffDown = -1;
            } else {
              if (vote === 1) {
                diffUp = 1;
                if (c.my_vote === -1) diffDown = -1;
              } else {
                diffDown = 1;
                if (c.my_vote === 1) diffUp = -1;
              }
            }
            const newUp = c.upvotes + diffUp;
            const newDown = c.downvotes + diffDown;
            return {
              ...c,
              my_vote: res.my_vote,
              upvotes: newUp,
              downvotes: newDown,
              score: newUp - newDown
            };
          }
          return c;
        }).sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to vote' });
    }
  },

  fetchLeaderboard: async (boardType, lang) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getLeaderboard(boardType, lang);
      set({ leaderboard: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch leaderboard', loading: false });
    }
  },

  fetchAppeals: async () => {
    try {
      const data = await api.getAppeals();
      set({ appeals: data });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch appeals' });
    }
  },

  createAppeal: async (contentType, objectId, reason) => {
    set({ loading: true });
    try {
      await api.createAppeal(contentType, objectId, reason);
      const data = await api.getAppeals();
      const hidden = await api.getMyHiddenContent();
      set({ appeals: data, myHiddenContent: hidden, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to submit appeal', loading: false });
      throw err;
    }
  },

  reportContent: async (contentType, objectId, reason, detail) => {
    try {
      await api.reportContent(contentType, objectId, reason, detail);
    } catch (err: any) {
      set({ error: err.message || 'Failed to submit report' });
      throw err;
    }
  },

  fetchProfileCommunityData: async () => {
    set({ loading: true });
    try {
      const [posts, comments, likes, bookmarks, hidden] = await Promise.all([
        api.getMyPosts(),
        api.getMyComments(),
        api.getMyLikes(),
        api.getMyBookmarks(),
        api.getMyHiddenContent(),
      ]);
      set({
        myPosts: posts,
        myComments: comments,
        myLikes: likes,
        myBookmarks: bookmarks,
        myHiddenContent: hidden,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch profile community data', loading: false });
    }
  },
}));
export type { CommunityState };
