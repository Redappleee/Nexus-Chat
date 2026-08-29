'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  LogOut,
  Shield,
  KeyRound,
  User,
  Bell,
  MessageSquare,
  HardDrive,
  Camera,
  Check,
  Sparkles,
  Eye,
  Volume2,
  Lock,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { disconnectSocket } from '@/lib/socket';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'privacy' | 'security' | 'notifications' | 'chat' | 'storage';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // 2FA state
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ secret: string; qr: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [enabling2FA, setEnabling2FA] = useState(false);

  // Status state
  const [status, setStatus] = useState(user?.status || 'online');

  // Privacy state
  const [lastSeen, setLastSeen] = useState<'everyone' | 'contacts' | 'nobody'>(
    user?.privacy?.lastSeen || 'everyone'
  );
  const [profilePhoto, setProfilePhoto] = useState<'everyone' | 'contacts' | 'nobody'>(
    user?.privacy?.profilePhoto || 'everyone'
  );
  const [readReceipts, setReadReceipts] = useState<boolean>(
    user?.privacy?.readReceipts ?? true
  );

  // Local preferences (saved in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ringtoneEnabled, setRingtoneEnabled] = useState(true);
  const [enterToSend, setEnterToSend] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  const form = useForm({
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      username: user?.username || '',
      avatar: user?.avatar || '',
    },
  });

  const { setAuth } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(!user);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!user) {
      if (token) {
        api
          .get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then(({ data }) => {
            setAuth(data.data, token);
            setCheckingAuth(false);
          })
          .catch(() => {
            clearAuth();
            router.replace('/login');
          });
      } else {
        router.replace('/login');
      }
    }

    // Load local client preferences
    if (typeof window !== 'undefined') {
      setSoundEnabled(localStorage.getItem('pref_sound') !== 'false');
      setRingtoneEnabled(localStorage.getItem('pref_ringtone') !== 'false');
      setEnterToSend(localStorage.getItem('pref_enter_send') !== 'false');
      setAiSuggestions(localStorage.getItem('pref_ai_suggestions') !== 'false');
      setAutoScroll(localStorage.getItem('pref_auto_scroll') !== 'false');
    }
  }, [user, router, setAuth, clearAuth]);

  if (checkingAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090e] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const saveProfile = async (data: { displayName: string; bio: string; username: string; avatar?: string }) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        status,
        privacy: { lastSeen, profilePhoto, readReceipts },
      };
      const res = await api.patch('/auth/profile', payload);
      updateUser(res.data.data);
      toast.success('Settings saved successfully!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    const toastId = toast.loading('Uploading avatar...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/chats/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatarUrl = data.data.url;
      form.setValue('avatar', newAvatarUrl);
      const res = await api.patch('/auth/profile', { avatar: newAvatarUrl });
      updateUser(res.data.data);
      toast.success('Avatar updated!', { id: toastId });
    } catch {
      toast.error('Failed to upload avatar', { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  };

  const start2FASetup = async () => {
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setTwoFactorSetupData(data.data);
    } catch {
      toast.error('Failed to initiate 2FA setup');
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setEnabling2FA(true);
    try {
      await api.post('/auth/2fa/enable', { code: twoFactorCode });
      updateUser({ ...user, twoFactorEnabled: true });
      setTwoFactorSetupData(null);
      setTwoFactorCode('');
      toast.success('Two-factor authentication is now active!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Verification failed');
    } finally {
      setEnabling2FA(false);
    }
  };

  const toggleSoundPref = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    if (typeof window !== 'undefined') localStorage.setItem(key, String(val));
    toast.success('Preference updated');
  };

  const clearAllDrafts = () => {
    useChatStore.setState({ drafts: {} });
    toast.success('All message drafts cleared');
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    disconnectSocket();
    clearAuth();
    router.replace('/login');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'chat', label: 'Chat & AI', icon: MessageSquare },
    { id: 'storage', label: 'Data & Storage', icon: HardDrive },
  ];

  return (
    <div className="relative min-h-screen bg-[#07090e] text-zinc-100 p-4 sm:p-6 md:p-10 overflow-hidden">
      {/* Background glow mesh */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-teal-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Navigation back */}
        <Link
          href="/chat"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to conversations
        </Link>

        {/* User Summary Header */}
        <div className="mb-8 rounded-3xl border border-white/[0.08] bg-[#090d16]/80 p-6 backdrop-blur-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar src={user.avatar} name={user.displayName} size="xl" status={status as 'online' | 'offline' | 'busy' | 'away'} />
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                />
                <Camera className="h-5 w-5 text-white" />
              </label>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                {user.displayName}
                {user.role === 'admin' && (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                    Admin
                  </span>
                )}
              </h1>
              <p className="text-xs text-emerald-400 font-medium">@{user.username}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
            className="rounded-xl text-xs shadow-md shadow-red-500/20"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>

        {/* Main Settings Body with Category Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Tabs (Horizontal scroll on mobile, vertical stack on tablet/desktop) */}
          <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 md:space-y-1 md:col-span-1 scrollbar-none">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl md:rounded-2xl px-3.5 py-2.5 md:py-3 text-xs font-semibold text-left transition-all ${
                  activeTab === id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-zinc-400 hover:text-zinc-100 bg-[#0e1322] md:bg-transparent hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="md:col-span-3">
            <div className="rounded-3xl border border-white/[0.08] bg-[#090d16]/80 p-6 backdrop-blur-2xl shadow-xl min-h-[460px]">
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Public Profile</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Manage how other members see you in chats and calls</p>
                  </div>

                  {/* Presence Status Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Online Presence Status
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                        { id: 'away', label: 'Away', color: 'bg-amber-500' },
                        { id: 'busy', label: 'Do Not Disturb', color: 'bg-rose-500' },
                        { id: 'offline', label: 'Invisible', color: 'bg-zinc-600' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setStatus(item.id)}
                          className={`flex items-center gap-2 rounded-2xl p-2.5 text-xs font-medium border transition-all ${
                            status === item.id
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                              : 'border-white/[0.06] bg-black/20 text-zinc-400 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Details */}
                  <form onSubmit={form.handleSubmit(saveProfile)} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Display Name
                      </label>
                      <Input placeholder="Your display name" {...form.register('displayName')} />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Username
                      </label>
                      <Input placeholder="username" {...form.register('username')} />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        About / Bio
                      </label>
                      <Input placeholder="Hey there! I am using Nexus Chat." {...form.register('bio')} />
                    </div>

                    <Button type="submit" className="w-full h-11 text-xs font-semibold rounded-2xl shadow-lg shadow-emerald-600/30 mt-2" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Profile Details'}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* PRIVACY TAB */}
              {activeTab === 'privacy' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Privacy & Visibility</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Control who can see your presence, profile details, and activity</p>
                  </div>

                  {/* Last Seen */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-200">
                      Who can see my Last Seen & Online time
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['everyone', 'contacts', 'nobody'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setLastSeen(opt)}
                          className={`rounded-2xl py-2.5 text-xs font-medium capitalize border transition-all ${
                            lastSeen === opt
                              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                              : 'border-white/[0.06] bg-black/20 text-zinc-400 hover:bg-white/[0.04]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-200">
                      Who can view my Profile Photo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['everyone', 'contacts', 'nobody'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setProfilePhoto(opt)}
                          className={`rounded-2xl py-2.5 text-xs font-medium capitalize border transition-all ${
                            profilePhoto === opt
                              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                              : 'border-white/[0.06] bg-black/20 text-zinc-400 hover:bg-white/[0.04]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Read Receipts */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Read Receipts (✓✓)</p>
                      <p className="text-[11px] text-zinc-500">Show double-check marks when you read incoming messages</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReadReceipts((r) => !r)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        readReceipts ? 'bg-emerald-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          readReceipts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <Button
                    onClick={() => saveProfile(form.getValues())}
                    className="w-full h-11 text-xs font-semibold rounded-2xl"
                    disabled={loading}
                  >
                    Save Privacy Settings
                  </Button>
                </motion.div>
              )}

              {/* SECURITY & 2FA TAB */}
              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Security & Authentication</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Protect your communications with enterprise-grade two-factor security</p>
                  </div>

                  {/* 2FA Card */}
                  <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          Two-Factor Authentication (TOTP)
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Requires a 6-digit code from Google Authenticator on every sign-in.
                        </p>
                      </div>
                      {user.twoFactorEnabled && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>

                    {user.twoFactorEnabled ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-3">
                        <Check className="h-4 w-4" />
                        <span>Your account is protected with Two-Factor Authentication.</span>
                      </div>
                    ) : twoFactorSetupData ? (
                      <div className="space-y-4 pt-2">
                        <p className="text-xs text-zinc-300 font-medium">
                          1. Scan this QR code with your authenticator app:
                        </p>
                        <div className="flex justify-center bg-white p-3 rounded-2xl w-40 mx-auto shadow-md">
                          <img src={twoFactorSetupData.qr} alt="2FA QR Code" className="h-34 w-34" />
                        </div>
                        <p className="text-[11px] text-zinc-400 text-center">
                          Secret key:{' '}
                          <code className="bg-zinc-800 px-2 py-0.5 rounded text-emerald-400 font-mono text-xs">
                            {twoFactorSetupData.secret}
                          </code>
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                            className="font-mono text-center tracking-[0.3em] text-base font-bold"
                          />
                          <Button onClick={verifyAndEnable2FA} disabled={enabling2FA} className="rounded-2xl px-6 text-xs">
                            {enabling2FA ? 'Verifying...' : 'Enable 2FA'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={start2FASetup}
                        className="w-full text-xs font-semibold rounded-2xl"
                      >
                        <KeyRound className="mr-2 h-4 w-4 text-emerald-400" />
                        Setup Two-Factor Authentication
                      </Button>
                    )}
                  </div>

                  {/* Password Reset */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Password Management</p>
                      <p className="text-[11px] text-zinc-500">Need to change your account password?</p>
                    </div>
                    <Link href="/forgot-password">
                      <Button variant="outline" size="sm" className="text-xs rounded-xl">
                        Reset Password
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Notification Preferences</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Control sound effects and alerts for incoming events</p>
                  </div>

                  {/* Message sound */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Incoming Message Sounds</p>
                      <p className="text-[11px] text-zinc-500">Play a pleasant sound effect when new messages arrive</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSoundPref('pref_sound', !soundEnabled, setSoundEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        soundEnabled ? 'bg-emerald-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Call Ringtone */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Voice & Video Call Ringtone</p>
                      <p className="text-[11px] text-zinc-500">Play ringing alert during incoming peer-to-peer calls</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSoundPref('pref_ringtone', !ringtoneEnabled, setRingtoneEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        ringtoneEnabled ? 'bg-emerald-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          ringtoneEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* CHAT & AI TAB */}
              {activeTab === 'chat' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Chat & AI Preferences</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Customize your typing behavior, AI assistant, and message view</p>
                  </div>

                  {/* Enter to send */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Send on Enter Key</p>
                      <p className="text-[11px] text-zinc-500">Press Enter to send (Shift+Enter inserts a new line)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSoundPref('pref_enter_send', !enterToSend, setEnterToSend)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enterToSend ? 'bg-emerald-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enterToSend ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* AI Smart Replies */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">AI Smart Suggestions Bar</p>
                      <p className="text-[11px] text-zinc-500">Enable Google Gemini context-aware smart response chips</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSoundPref('pref_ai_suggestions', !aiSuggestions, setAiSuggestions)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        aiSuggestions ? 'bg-emerald-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          aiSuggestions ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto-scroll */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Smooth Auto-Scroll</p>
                      <p className="text-[11px] text-zinc-500">Automatically scroll down when new messages arrive</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSoundPref('pref_auto_scroll', !autoScroll, setAutoScroll)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoScroll ? 'bg-emerald-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoScroll ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STORAGE & DATA TAB */}
              {activeTab === 'storage' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Data & Local Storage</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Manage cached conversation drafts and local storage</p>
                  </div>

                  {/* Clear Drafts */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Unsent Message Drafts</p>
                      <p className="text-[11px] text-zinc-500">Clear saved text drafts across all active chats</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={clearAllDrafts} className="rounded-xl text-xs">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear Drafts
                    </Button>
                  </div>

                  {/* Re-sync Chats */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Re-Sync Chat Cache</p>
                      <p className="text-[11px] text-zinc-500">Force refresh messages and media from MongoDB</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.reload();
                      }}
                      className="rounded-xl text-xs"
                    >
                      Re-Sync Now
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
