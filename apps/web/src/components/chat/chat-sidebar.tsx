'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Pin,
  Archive,
  MessageSquare,
  Settings,
  Shield,
  UserPlus,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { useChatStore, ChatItem } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NewChatDialog } from './new-chat-dialog';
import { SearchModal } from './search-modal';
import { FriendsPanel } from './friends-panel';
import { disconnectSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function getChatTitle(chat: ChatItem, currentUserId: string): string {
  if (chat.type === 'group') return chat.name || 'Group';
  const other = chat.members.find((m) => m.user._id !== currentUserId)?.user;
  return other?.displayName || other?.username || 'Unknown';
}

function getChatAvatar(chat: ChatItem, currentUserId: string): string | undefined {
  if (chat.type === 'group') return chat.avatar;
  const other = chat.members.find((m) => m.user._id !== currentUserId)?.user;
  return other?.avatar;
}

function getOtherUser(chat: ChatItem, currentUserId: string) {
  if (chat.type === 'group') return null;
  return chat.members.find((m) => m.user._id !== currentUserId)?.user;
}

function isPinned(chat: ChatItem, currentUserId: string): boolean {
  return !!chat.pinnedBy?.some((p) => String(p.user) === currentUserId);
}

export function ChatSidebar() {
  const router = useRouter();
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [filter, setFilter] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const chats = useChatStore((s) => s.chats);
  const archivedChats = useChatStore((s) => s.archivedChats);
  const setChats = useChatStore((s) => s.setChats);
  const setArchivedChats = useChatStore((s) => s.setArchivedChats);
  const upsertChat = useChatStore((s) => s.upsertChat);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const updateUser = useAuthStore((s) => s.updateUser);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  const { data: fetchedChats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data } = await api.get('/chats');
      return (data.data || []) as ChatItem[];
    },
  });

  const { data: fetchedArchivedChats } = useQuery({
    queryKey: ['chats-archived'],
    queryFn: async () => {
      const { data } = await api.get('/chats/archived');
      return (data.data || []) as ChatItem[];
    },
  });

  useEffect(() => {
    if (fetchedChats) {
      setChats(fetchedChats);
    }
  }, [fetchedChats, setChats]);

  useEffect(() => {
    if (fetchedArchivedChats) {
      setArchivedChats(fetchedArchivedChats);
    }
  }, [fetchedArchivedChats, setArchivedChats]);

  const list = view === 'active' ? chats : archivedChats;
  const currentUserId = user?._id || '';

  const sorted = useMemo(() => {
    return [...list]
      .filter((c) => {
        if (!filter.trim()) return true;
        return getChatTitle(c, currentUserId).toLowerCase().includes(filter.toLowerCase());
      })
      .sort((a, b) => {
        const aPin = isPinned(a, currentUserId) ? 1 : 0;
        const bPin = isPinned(b, currentUserId) ? 1 : 0;
        if (aPin !== bPin) return bPin - aPin;
        return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
      });
  }, [list, filter, currentUserId]);

  const handleStatusChange = async (status: string) => {
    try {
      updateUser({ status });
      await api.patch('/auth/profile', { status });
      toast.success(`Status set to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    disconnectSocket();
    clearAuth();
    router.replace('/login');
  };

  return (
    <>
      <aside className="relative flex h-full min-h-0 w-full flex-col border-r border-white/[0.08] bg-[#0c101c] overflow-hidden">
        {/* User Header Profile with Interactive Settings Popover */}
        <div className="shrink-0 relative flex items-center justify-between border-b border-white/[0.06] p-3 bg-[#0f1424]">
          {/* Profile Picture Trigger Button */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl p-1 -m-1 hover:bg-white/[0.06] transition-all text-left group min-w-0"
            title="Profile & Settings"
          >
            <div className="relative">
              <Avatar
                src={user?.avatar}
                name={user?.displayName}
                status={user?.status as 'online' | 'offline' | 'away' | 'busy'}
                size="default"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0c101c] border border-white/20 text-zinc-400 group-hover:text-white transition-colors">
                <Settings className="h-2.5 w-2.5" />
              </span>
            </div>
            <div className="min-w-0 pr-1">
              <h2 className="font-semibold text-zinc-100 truncate text-xs flex items-center gap-1">
                <span className="truncate">{user?.displayName}</span>
                <ChevronDown className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium truncate capitalize">
                {user?.status || 'Online'}
              </p>
            </div>
          </button>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
              onClick={() => setFriendsOpen(true)}
              title="Friend Requests"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="default"
              className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-none"
              onClick={() => setNewChatOpen(true)}
              title="New Conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile & Settings Dropdown Menu */}
          {profileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="absolute left-3 top-14 z-50 w-64 rounded-2xl border border-white/[0.1] bg-[#111728] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-2 border-b border-white/[0.08] mb-1">
                  <Avatar src={user?.avatar} name={user?.displayName} size="default" />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-zinc-100 truncate">{user?.displayName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">@{user?.username}</p>
                  </div>
                </div>

                {/* Primary Settings Link */}
                <Link
                  href="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-emerald-600/20 hover:border-emerald-500/30 border border-transparent transition-all mb-1"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                    <Settings className="h-3.5 w-3.5" />
                  </div>
                  <span>Account & App Settings</span>
                </Link>

                {/* Presence Status Selector */}
                <div className="px-2 py-1.5 border-t border-white/[0.06] my-1">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Set Online Status
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {[
                      { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                      { id: 'away', label: 'Away', color: 'bg-amber-500' },
                      { id: 'busy', label: 'Do Not Disturb', color: 'bg-rose-500' },
                      { id: 'offline', label: 'Invisible', color: 'bg-zinc-500' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleStatusChange(s.id)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-colors',
                          user?.status === s.id
                            ? 'bg-white/[0.1] text-zinc-100 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                        )}
                      >
                        <span className={cn('h-2 w-2 rounded-full shrink-0', s.color)} />
                        <span className="truncate">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Dashboard link if user is admin */}
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <Link
                    href="/admin"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Control Center
                  </Link>
                )}

                {/* Sign Out Button */}
                <div className="border-t border-white/[0.06] pt-1 mt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="shrink-0 px-3 pt-3">
          <div className="flex rounded-lg bg-[#141a2c] p-1 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setView('active')}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                view === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chats
            </button>
            <button
              type="button"
              onClick={() => setView('archived')}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                view === 'archived'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Archive className="h-3.5 w-3.5" />
              Archived
            </button>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="shrink-0 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#141b2c] pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {sorted.map((chat) => {
            const title = getChatTitle(chat, currentUserId);
            const avatar = getChatAvatar(chat, currentUserId);
            const other = getOtherUser(chat, currentUserId);
            const pinned = isPinned(chat, currentUserId);
            const isActive = activeChatId === chat._id;

            return (
              <div
                key={chat._id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveChat(chat._id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors cursor-pointer border',
                  isActive
                    ? 'bg-[#162035] border-white/[0.1] text-white shadow-sm'
                    : 'border-transparent text-zinc-300 hover:bg-white/[0.04]'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={avatar}
                    name={title}
                    status={other?.status as 'online'}
                    size="default"
                  />
                  {pinned && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#111728] border border-white/20 text-emerald-400 shadow-sm">
                      <Pin className="h-2.5 w-2.5 fill-current" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs truncate text-zinc-100">{title}</span>
                    {chat.lastMessageAt && (
                      <span className="text-[10px] text-zinc-500 shrink-0 font-normal">
                        {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-xs text-zinc-400">
                    {chat.lastMessage?.content ||
                      (chat.lastMessage?.type ? `[${chat.lastMessage.type}]` : 'No messages yet')}
                  </p>
                </div>
              </div>
            );
          })}

          {!sorted.length && (
            <div className="p-6 text-center text-xs text-zinc-500">
              {filter ? 'No matching conversations' : 'No conversations yet'}
            </div>
          )}
        </div>
      </aside>

      {/* Modals */}
      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <FriendsPanel open={friendsOpen} onClose={() => setFriendsOpen(false)} />
    </>
  );
}
