'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { getGoogleAuthUrl } from '@/lib/api-url';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().length(6).optional().or(z.literal('')),
});

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1),
  password: z.string().min(8),
});

type Mode = 'login' | 'register';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const [googleUrl, setGoogleUrl] = useState(getGoogleAuthUrl());
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const schema = mode === 'login' ? loginSchema : registerSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', username: '', displayName: '' } as z.infer<typeof schema>,
  });

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'google_auth_failed') {
      toast.error('Google sign-in failed. Try again or use email/password.');
    }
  }, [searchParams]);

  useEffect(() => {
    api
      .get('/auth/oauth/status')
      .then(({ data }) => {
        setGoogleEnabled(Boolean(data.data?.google));
        if (data.data?.url) setGoogleUrl(data.data.url);
      })
      .catch(() => {
        setApiUnreachable(true);
        setGoogleEnabled(false);
      });
  }, []);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data: res } = await api.post(endpoint, data);
      setAuth(res.data.user, res.data.accessToken);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      router.push('/chat');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Authentication failed');
    }
  };

  const handleGoogleClick = () => {
    if (!googleEnabled) {
      toast.error(
        'Google sign-in is not configured on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to apps/server/.env, then restart npm run dev.',
        { duration: 8000 }
      );
      return;
    }
    window.location.href = googleUrl;
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#090d16]/80 p-8 shadow-2xl backdrop-blur-2xl"
    >
      {mode === 'register' && (
        <div className="space-y-3">
          <Input placeholder="Display Name (e.g. John Doe)" {...form.register('displayName')} />
          <Input placeholder="Username (e.g. johndoe)" {...form.register('username')} />
        </div>
      )}
      <Input type="email" placeholder="Email Address" {...form.register('email')} />
      <Input type="password" placeholder="Password" {...form.register('password')} />
      {mode === 'login' && (
        <Input placeholder="2FA Code (if enabled)" maxLength={6} {...form.register('twoFactorCode')} />
      )}

      <Button
        type="submit"
        className="w-full h-11 font-semibold text-xs rounded-2xl shadow-lg shadow-emerald-600/30"
        disabled={form.formState.isSubmitting}
      >
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </Button>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <span className="relative bg-[#090d16] px-3 text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
          Or
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full h-11 text-xs rounded-2xl border-white/[0.08] hover:bg-white/[0.06] flex items-center justify-center gap-2"
        onClick={handleGoogleClick}
        disabled={googleEnabled === false}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        {googleEnabled === null
          ? 'Loading Google…'
          : googleEnabled
            ? 'Continue with Google'
            : 'Continue with Google'}
      </Button>

      {apiUnreachable && (
        <p className="text-center text-xs text-red-400/90">
          Cannot reach the API. Please ensure the backend server is running.
        </p>
      )}

      <p className="text-center text-xs text-zinc-400 pt-2">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
              Register
            </Link>
            {' · '}
            <Link href="/forgot-password" className="text-zinc-500 hover:text-zinc-300">
              Forgot password?
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
              Sign In
            </Link>
          </>
        )}
      </p>
    </motion.form>
  );
}
