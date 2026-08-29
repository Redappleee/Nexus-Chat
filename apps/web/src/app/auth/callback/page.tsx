'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    localStorage.setItem('accessToken', token);
    api
      .get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAuth(data.data, token);
        router.replace('/chat');
      })
      .catch(() => router.replace('/login'));
  }, [params, router, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center text-zinc-400">
      Completing sign in...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-zinc-400">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
