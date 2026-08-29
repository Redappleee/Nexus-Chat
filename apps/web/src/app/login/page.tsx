import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080c16] p-6 text-zinc-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <img src="/logo.png" alt="Nexus Logo" className="h-10 w-10 rounded-2xl object-cover shadow-lg shadow-blue-500/20 ring-1 ring-white/10" />
            <span className="text-xl font-bold tracking-tight text-white">Nexus Chat</span>
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold text-zinc-100 tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-xs text-zinc-400">Sign in to your account</p>
        </div>
        <Suspense fallback={<p className="text-center text-xs text-zinc-500">Loading…</p>}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
