'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BubbleTheme = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'carbon';
export type WallpaperPattern = 'none' | 'dots' | 'grid' | 'lines' | 'carbon';
export type FontSize = 'compact' | 'regular' | 'large';
export type BubbleRadius = 'rounded' | 'modern' | 'sharp';

export interface ChatThemeSettings {
  bubbleTheme: BubbleTheme;
  wallpaperPattern: WallpaperPattern;
  wallpaperBg: string;
  customWallpaperUrl?: string;
  fontSize: FontSize;
  bubbleRadius: BubbleRadius;
}

const DEFAULT_THEME: ChatThemeSettings = {
  bubbleTheme: 'emerald',
  wallpaperPattern: 'none',
  wallpaperBg: '#090d16',
  fontSize: 'regular',
  bubbleRadius: 'rounded',
};

interface ChatThemeState {
  globalTheme: ChatThemeSettings;
  chatThemes: Record<string, Partial<ChatThemeSettings>>;
  getChatTheme: (chatId?: string | null) => ChatThemeSettings;
  setGlobalTheme: (settings: Partial<ChatThemeSettings>) => void;
  setChatTheme: (chatId: string, settings: Partial<ChatThemeSettings>) => void;
  resetChatTheme: (chatId: string) => void;
}

export const useChatThemeStore = create<ChatThemeState>()(
  persist(
    (set, get) => ({
      globalTheme: DEFAULT_THEME,
      chatThemes: {},
      getChatTheme: (chatId) => {
        const state = get();
        const global = state.globalTheme;
        if (!chatId || !state.chatThemes[chatId]) return global;
        return { ...global, ...state.chatThemes[chatId] };
      },
      setGlobalTheme: (settings) =>
        set((s) => ({ globalTheme: { ...s.globalTheme, ...settings } })),
      setChatTheme: (chatId, settings) =>
        set((s) => ({
          chatThemes: {
            ...s.chatThemes,
            [chatId]: { ...(s.chatThemes[chatId] || {}), ...settings },
          },
        })),
      resetChatTheme: (chatId) =>
        set((s) => {
          const next = { ...s.chatThemes };
          delete next[chatId];
          return { chatThemes: next };
        }),
    }),
    { name: 'nexus-chat-theme' }
  )
);
