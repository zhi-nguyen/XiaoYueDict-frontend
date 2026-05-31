import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  
  isDesktopSidebarCollapsed: boolean;
  setDesktopSidebarCollapsed: (isCollapsed: boolean) => void;
  toggleDesktopSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  isDesktopSidebarCollapsed: false,
  setDesktopSidebarCollapsed: (isCollapsed) => set({ isDesktopSidebarCollapsed: isCollapsed }),
  toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarCollapsed: !state.isDesktopSidebarCollapsed })),
}));
