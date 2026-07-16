import { djangoClient } from '@/lib/apiClient';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// ═══════════════════════════════════════════
//  IMAGE UPLOAD TO FASTAPI VIA NGINX
// ═══════════════════════════════════════════

export const uploadCommunityImage = async (file: File, lang: string = 'zh') => {
  const token = useAuthStore.getState().accessToken;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('lang', lang);

  const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await axios.post(`${gatewayUrl}/api/image/community/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data; // Returns: { image_url: string, temp_path: string }
};

// ═══════════════════════════════════════════
//  WORD COMMENTS SYSTEM
// ═══════════════════════════════════════════

export const getWordComments = async (wordId: string, lang: string) => {
  const response = await djangoClient.get(`/community/word-comments/?word_id=${wordId}&lang=${lang}`);
  return response.data;
};

export const createWordComment = async (wordId: string, lang: string, content: string) => {
  const response = await djangoClient.post('/community/word-comments/', { word_id: wordId, lang, content });
  return response.data;
};

export const deleteWordComment = async (commentId: string) => {
  const response = await djangoClient.delete(`/community/word-comments/${commentId}/`);
  return response.data;
};

export const voteWordComment = async (commentId: string, vote: number) => {
  const response = await djangoClient.post(`/community/word-comments/${commentId}/vote/`, { vote });
  return response.data;
};

// ═══════════════════════════════════════════
//  FORUM & POST SYSTEM
// ═══════════════════════════════════════════

export const getForumPosts = async (lang: string) => {
  const response = await djangoClient.get(`/community/posts/?lang=${lang}`);
  return response.data;
};

export const createForumPost = async (lang: string, content: string, imageUrl: string = '') => {
  const response = await djangoClient.post('/community/posts/', { lang, content, image_url: imageUrl });
  return response.data;
};

export const getForumPostDetail = async (postId: string) => {
  const response = await djangoClient.get(`/community/posts/${postId}/`);
  return response.data;
};

export const deleteForumPost = async (postId: string) => {
  const response = await djangoClient.delete(`/community/posts/${postId}/`);
  return response.data;
};

export const likeForumPost = async (postId: string) => {
  const response = await djangoClient.post(`/community/posts/${postId}/like/`);
  return response.data;
};

export const bookmarkForumPost = async (postId: string) => {
  const response = await djangoClient.post(`/community/posts/${postId}/bookmark/`);
  return response.data;
};

// ═══════════════════════════════════════════
//  POST COMMENTS SYSTEM
// ═══════════════════════════════════════════

export const getPostComments = async (postId: string) => {
  const response = await djangoClient.get(`/community/posts/${postId}/comments/`);
  return response.data;
};

export const createPostComment = async (postId: string, content: string) => {
  const response = await djangoClient.post(`/community/posts/${postId}/comments/`, { content });
  return response.data;
};

export const deletePostComment = async (commentId: string) => {
  const response = await djangoClient.delete(`/community/comments/${commentId}/`);
  return response.data;
};

export const likePostComment = async (commentId: string) => {
  const response = await djangoClient.post(`/community/comments/${commentId}/like/`);
  return response.data;
};

// ═══════════════════════════════════════════
//  REPORTS & APPEALS
// ═══════════════════════════════════════════

export const reportContent = async (contentType: 'post' | 'post_comment' | 'word_comment', objectId: string, reason: string, detail: string = '') => {
  const response = await djangoClient.post('/community/report/', { content_type: contentType, object_id: objectId, reason, detail });
  return response.data;
};

export const getAppeals = async () => {
  const response = await djangoClient.get('/community/appeals/');
  return response.data;
};

export const createAppeal = async (contentType: 'post' | 'post_comment' | 'word_comment', objectId: string, reason: string) => {
  const response = await djangoClient.post('/community/appeals/', { content_type: contentType, object_id: objectId, reason });
  return response.data;
};

// ═══════════════════════════════════════════
//  MY PROFILE MANAGEMENT TABS
// ═══════════════════════════════════════════

export const getMyPosts = async () => {
  const response = await djangoClient.get('/community/me/posts/');
  return response.data;
};

export const getMyComments = async () => {
  const response = await djangoClient.get('/community/me/comments/');
  return response.data;
};

export const getMyLikes = async () => {
  const response = await djangoClient.get('/community/me/likes/');
  return response.data;
};

export const getMyBookmarks = async () => {
  const response = await djangoClient.get('/community/me/bookmarks/');
  return response.data;
};

export const getMyHiddenContent = async () => {
  const response = await djangoClient.get('/community/me/hidden/');
  return response.data;
};

// ═══════════════════════════════════════════
//  LEADERBOARD SYSTEM
// ═══════════════════════════════════════════

export const getLeaderboard = async (boardType: string, lang: string) => {
  const response = await djangoClient.get(`/leaderboard/?board_type=${boardType}&lang=${lang}`);
  return response.data;
};
