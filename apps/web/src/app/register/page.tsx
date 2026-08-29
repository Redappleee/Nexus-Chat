import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-500">
            <MessageCircle className="h-8 w-8" />
            <span className="text-xl font-bold">Nexus Chat</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-zinc-100">Create account</h1>
          <p className="mt-2 text-sm text-zinc-500">Join Nexus Chat today</p>
        </div>
        <Suspense fallback={<p className="text-center text-zinc-500">Loading…</p>}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </div>
  );
}
