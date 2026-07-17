import { create } from 'zustand';
import axios from 'axios';
import { auth as firebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { clearGuestId } from '@/lib/guest';

export interface LevelProgress {
  level: number;
  current_exp: number;
  exp_required: number;
  total_exp: number;
}

export interface UserLevels {
  zh: LevelProgress;
  en: LevelProgress;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  avatar: string | null;
  equipped_frame?: {
    image_url: string;
    ui_metadata?: {
      frame_type?: string;
      assets?: {
        overlay_svg_url?: string;
      };
      style?: any;
    };
  } | null;
  equipped_title?: {
    id: string;
    name: string;
    title_text: string;
  } | null;
  levels?: UserLevels;
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

let isAuthStateListenerSet = false;

export const useAuthStore = create<AuthState>((set, get) => ({
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
      // 1. Sign out from Firebase
      await fbSignOut(firebaseAuth);
    } catch (e) {
      console.error('Firebase logout error', e);
    }

    try {
      // 2. Sign out from Django backend by clearing cookies
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.error('Django logout error', e);
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    if (isAuthStateListenerSet) return;
    isAuthStateListenerSet = true;

    // Set up Firebase auth state listener
    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Check if email is verified. If not, sign out immediately to prevent State Leak
        if (!firebaseUser.emailVerified) {
          try {
            await fbSignOut(firebaseAuth);
          } catch (e) {
            console.error('Failed to auto-sign out unverified user:', e);
          }
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          // 2. Force refresh the token to obtain the latest email_verified claim from server
          const idToken = await firebaseUser.getIdToken(true);
          
          // Send to Next.js BFF -> Django to verify and set secure cookies
          const { data } = await axios.post('/api/auth/firebase-login', { id_token: idToken });
          
          set({ 
            user: data.user, 
            accessToken: data.access, 
            isAuthenticated: true, 
            isLoading: false 
          });
          // Remove stale guest identity — prevent WS/task identity leak
          clearGuestId();
        } catch (e) {
          console.error('Failed to sync Firebase session with Django backend', e);
          // If token exchange fails, reset state
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        // No firebase user, make sure backend session is cleared
        try {
          if (get().isAuthenticated) {
            await axios.post('/api/auth/logout');
          }
        } catch (e) {
          // Ignore
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    });
  }
}));
