'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSocket } from '@/hooks/use-socket';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, hasHydrated, setAuth, clearAuth } = useAuthStore();
  const activeChatId = useChatStore((s) => s.activeChatId);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useSocket();
  useChatRoom(activeChatId);
  useKeyboardShortcuts();

  useEffect(() => {
    // Check for cached token from localStorage or store
    const storedToken =
      accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    if (storedToken) {
      api
        .get('/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
        .then(({ data }) => {
          setAuth(data.data, storedToken);
          setCheckingAuth(false);
        })
        .catch((err) => {
          // If token expired, attempt refresh via cookie
          if (err.response?.status === 401) {
            api
              .post('/auth/refresh')
              .then(({ data }) => {
                const newToken = data.data.accessToken;
                api
                  .get('/auth/me', { headers: { Authorization: `Bearer ${newToken}` } })
                  .then((meRes) => {
                    setAuth(meRes.data.data, newToken);
                    setCheckingAuth(false);
                  })
                  .catch(() => {
                    clearAuth();
                    router.replace('/login');
                  });
              })
              .catch(() => {
                clearAuth();
                router.replace('/login');
              });
          } else {
            clearAuth();
            router.replace('/login');
          }
        });
    } else {
      // No local token found, try refresh token cookie before redirecting
      api
        .post('/auth/refresh')
        .then(({ data }) => {
          const newToken = data.data.accessToken;
          api
            .get('/auth/me', { headers: { Authorization: `Bearer ${newToken}` } })
            .then((meRes) => {
              setAuth(meRes.data.data, newToken);
              setCheckingAuth(false);
            })
            .catch(() => {
              clearAuth();
              router.replace('/login');
            });
        })
        .catch(() => {
          clearAuth();
          router.replace('/login');
        });
    }
  }, [setAuth, clearAuth, router]);

  if (checkingAuth && !user) {
    return (
      <div className="fixed inset-0 flex h-full w-full items-center justify-center bg-[#080c16] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
