import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getGuestId } from '@/lib/guest';

// We use the Next.js BFF routes for auth to leverage HttpOnly cookies
const NEXT_API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: NEXT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// For calls directly to Django if needed, though we route most via Next.js BFF or Nginx.
export const djangoClient = axios.create({
  baseURL: '/api/core', // Assuming Nginx routes /api/core to Django
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });

  failedQueue = [];
};

// Add access token or Guest ID to requests
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const { accessToken, isAuthenticated } = useAuthStore.getState();
  
  if (accessToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // Only attach X-Guest-ID if the user is not authenticated
  if (!isAuthenticated && config.headers) {
    const guestId = getGuestId();
    if (config.headers && guestId) {
      config.headers['X-Guest-ID'] = guestId;
    }
  }
  return config;
};

apiClient.interceptors.request.use(requestInterceptor, error => Promise.reject(error));
djangoClient.interceptors.request.use(requestInterceptor, error => Promise.reject(error));

// Response interceptor to handle 401s and silent refresh
const responseInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

  if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
    // Avoid refreshing if the original request was to the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If currently refreshing, enqueue the failed request and wait.
      // Once refresh is complete, retry the original request. The cookies will be updated,
      // so it will automatically carry the new access_token cookie.
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          if (token && originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return axios(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call our Next.js BFF to get a new token using the HttpOnly cookie
      const { data } = await axios.post('/api/auth/refresh');
      const newAccessToken = data.access;

      // Update Zustand store
      useAuthStore.getState().setAccessToken(newAccessToken);

      // Process the queue of failed requests
      processQueue(null, newAccessToken);

      // Retry the original request
      if (newAccessToken && originalRequest.headers) {
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
      }
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Logout the user if refresh fails completely
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  if (error.response?.status === 429) {
    const data = error.response.data as any;
    const retryAfter = error.response.headers?.['retry-after'] || data?.retry_after_seconds || 60;
    
    return Promise.reject({
      isRateLimited: true,
      message: data?.message || 'Tài khoản đã vượt quá giới hạn dung lượng tải tệp quy định.',
      limitType: data?.limit_type,
      retryAfterSeconds: parseInt(retryAfter, 10),
    });
  }

  return Promise.reject(error);
};

apiClient.interceptors.response.use(response => response, responseInterceptor);
djangoClient.interceptors.response.use(response => response, responseInterceptor);
