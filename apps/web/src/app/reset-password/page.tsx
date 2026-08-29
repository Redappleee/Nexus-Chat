'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset — you can sign in');
      router.push('/login');
    } catch {
      toast.error('Invalid or expired link');
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">Reset password</h1>
      <Input
        type="password"
        placeholder="New password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      <Button type="submit" className="w-full" disabled={!token}>
        Reset password
      </Button>
      <Link href="/login" className="block text-center text-sm text-emerald-400 hover:underline">
        Back to login
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
