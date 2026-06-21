import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // Initially true while we check if the user has a valid session

  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isLoading: false }),
  
  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
  
  setUser: (user) => set({ user }),
  
  updateProfile: (data) => set((state) => ({ 
    user: state.user ? { ...state.user, ...data } : null 
  })),

  logout: async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    try {
      // Attempt silent refresh first
      const { data: refreshData } = await axios.post('/api/auth/refresh');
      const token = refreshData.access;
      
      // Set access token and authentication state immediately so subsequent calls can use the token
      set({ accessToken: token, isAuthenticated: true, isLoading: false });
      
      // Then fetch user profile in the background
      const { data: userData } = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ user: userData });
    } catch (e) {
      // Silent refresh failed (no valid refresh token), so user is not logged in
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
