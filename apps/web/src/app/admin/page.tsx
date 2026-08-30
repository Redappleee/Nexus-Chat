'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Users, MessageSquare, Flag, Ban, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'moderator') {
      router.replace('/chat');
    }
  }, [user, router]);

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data,
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
  });

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users')).data.data,
    enabled: !!user && user.role === 'admin',
  });

  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => (await api.get('/admin/reports')).data.data,
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
  });

  if (!user) return null;

  const banUser = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/ban`);
      toast.success('User banned');
      refetchUsers();
    } catch {
      toast.error('Failed to ban user');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c16] text-zinc-100 p-4 sm:p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Navigation back */}
        <Link
          href="/chat"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to conversations
        </Link>

        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Admin Control Center</h1>
              <p className="text-xs text-zinc-400">Platform statistics, moderation, and user management</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400 uppercase">
            {user.role}
          </span>
        </div>

        {/* Metric Cards Grid */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              { label: 'Total Users', value: stats.users, icon: Users },
              { label: 'Total Chats', value: stats.chats, icon: MessageSquare },
              { label: 'Messages Sent', value: stats.messages, icon: CheckCircle2 },
              { label: 'Pending Reports', value: stats.pendingReports, icon: Flag },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.08] bg-[#0e1424] p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">{label}</span>
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-extrabold text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pending Reports Section */}
        <section className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0e1424] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-400" />
            Pending Reports ({reports.length})
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {reports.map((r: { _id: string; reason: string; reporter?: { username: string }; reportedUser?: { username: string } }) => (
              <div
                key={r._id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#141b2c] px-4 py-3 text-xs"
              >
                <div>
                  <p className="text-zinc-200 font-medium">{r.reason}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Reported by <span className="text-emerald-400">@{r.reporter?.username}</span> against{' '}
                    <span className="text-rose-400">@{r.reportedUser?.username}</span>
                  </p>
                </div>
              </div>
            ))}
            {!reports.length && (
              <p className="text-xs text-zinc-500 py-4 text-center">No pending reports to review</p>
            )}
          </div>
        </section>

        {/* Users Management Section */}
        {user.role === 'admin' && (
          <section className="rounded-2xl border border-white/[0.08] bg-[#0e1424] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Registered Users ({users.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((u: { _id: string; username: string; email: string; role: string; isBanned: boolean }) => (
                <div
                  key={u._id}
                  className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-[#141b2c] px-4 py-2.5 text-xs min-w-0"
                >
                  <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                    <span className="font-semibold text-zinc-200 truncate">@{u.username}</span>
                    <span className="text-zinc-400 truncate">{u.email}</span>
                    <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase">
                      {u.role}
                    </span>
                    {u.isBanned && (
                      <span className="shrink-0 rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                        Banned
                      </span>
                    )}
                  </div>
                  {!u.isBanned && u.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => banUser(u._id)}
                      className="text-xs h-7 px-3 rounded-lg shrink-0"
                    >
                      <Ban className="h-3 w-3 mr-1" /> Ban
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
