'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If the email exists, a reset link was sent');
    } catch {
      toast.error('Request failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100">Forgot password</h1>
        <p className="text-sm text-zinc-500">
          {sent ? 'Check your email for a reset link.' : 'Enter your email to receive a reset link.'}
        </p>
        {!sent && (
          <>
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full">Send reset link</Button>
          </>
        )}
        <Link href="/login" className="block text-center text-sm text-emerald-400 hover:underline">
          Back to login
        </Link>
      </form>
    </div>
  );
}
