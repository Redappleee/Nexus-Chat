import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  callActive: boolean;
  callType: 'voice' | 'video' | null;
  setSidebarOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setCallActive: (active: boolean, type?: 'voice' | 'video' | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  searchOpen: false,
  callActive: false,
  callType: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setCallActive: (callActive, callType) => set({ callActive, callType: callType ?? null }),
}));
