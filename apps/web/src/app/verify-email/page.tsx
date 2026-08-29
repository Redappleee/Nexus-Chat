'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckCircle, XCircle } from 'lucide-react';

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="text-center space-y-4">
      {status === 'loading' && <p className="text-zinc-400">Verifying your email…</p>}
      {status === 'success' && (
        <>
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-bold text-zinc-100">Email verified!</h1>
          <p className="text-zinc-500">Your account is ready to use.</p>
          <Link href="/chat"><Button className="mt-4">Go to chat</Button></Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-xl font-bold text-zinc-100">Verification failed</h1>
          <p className="text-zinc-500">The link may be expired or invalid.</p>
          <Link href="/login"><Button variant="secondary" className="mt-4">Back to login</Button></Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-emerald-500">
        <MessageCircle className="h-8 w-8" />
        <span className="text-xl font-bold">Nexus Chat</span>
      </Link>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
