'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Pin,
  Archive,
  MessageSquare,
  Settings,
  ShieldAlert,
  UserPlus,
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
import { cn } from '@/lib/utils';

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
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [filter, setFilter] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);

  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const chats = useChatStore((s) => s.chats);
  const archivedChats = useChatStore((s) => s.archivedChats);
  const setChats = useChatStore((s) => s.setChats);
  const setArchivedChats = useChatStore((s) => s.setArchivedChats);
  const upsertChat = useChatStore((s) => s.upsertChat);
  const user = useAuthStore((s) => s.user);
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

  return (
    <>
      <aside className="relative flex h-full min-h-0 w-full flex-col border-r border-white/[0.08] bg-[#0c101c] overflow-hidden">
        {/* User Header Profile */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.06] p-3.5 bg-[#0f1424]">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} name={user?.displayName} status="online" size="default" />
            <div className="min-w-0">
              <h2 className="font-semibold text-zinc-100 truncate text-xs">{user?.displayName}</h2>
              <p className="text-[11px] text-zinc-400 font-medium truncate">@{user?.username}</p>
            </div>
          </div>
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

        {/* Search Input */}
        <div className="shrink-0 px-3 py-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Search conversations..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[#141b2c] pl-8 pr-12 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-white/[0.05]">
              ⌘K
            </span>
          </div>
        </div>

        {/* Quick Links Bar */}
        <div className="shrink-0 flex items-center justify-between px-3.5 pb-2 text-xs text-zinc-400">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors text-[11px] font-medium"
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
          {user?.role === 'admin' || user?.role === 'moderator' ? (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Admin
            </Link>
          ) : null}
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-3">
          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-xs font-semibold text-zinc-300 mb-1">
                {view === 'archived' ? 'No archived chats' : 'No conversations yet'}
              </p>
              <p className="text-[11px] text-zinc-500 max-w-[180px] mb-3">
                {view === 'archived'
                  ? 'Archived chats appear here'
                  : 'Start a conversation to get started'}
              </p>
              {view === 'active' && (
                <Button size="sm" className="rounded-lg text-xs" onClick={() => setNewChatOpen(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Start chat
                </Button>
              )}
            </div>
          )}

          {sorted.map((chat) => {
            const title = getChatTitle(chat, currentUserId);
            const avatar = getChatAvatar(chat, currentUserId);
            const other = getOtherUser(chat, currentUserId);
            const pinned = isPinned(chat, currentUserId);
            const isActive = activeChatId === chat._id;
            const preview =
              chat.lastMessage?.content ||
              (chat.lastMessage?.type && chat.lastMessage.type !== 'text'
                ? `[${chat.lastMessage.type}]`
                : 'No messages yet');

            return (
              <button
                key={chat._id}
                type="button"
                onClick={() => {
                  upsertChat(chat);
                  setActiveChat(chat._id);
                }}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors',
                  isActive
                    ? 'bg-[#182236] border border-emerald-500/30'
                    : 'border border-transparent hover:bg-[#121828]'
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-emerald-500" />
                )}

                <Avatar
                  src={avatar}
                  name={title}
                  status={other?.status as 'online'}
                  size="default"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <span
                      className={cn(
                        'truncate text-xs font-semibold flex items-center gap-1',
                        isActive ? 'text-white' : 'text-zinc-200'
                      )}
                    >
                      {pinned && view === 'active' && (
                        <Pin className="h-3 w-3 text-emerald-400 fill-emerald-400/40" />
                      )}
                      {title}
                    </span>
                    {chat.lastMessageAt && (
                      <span className="shrink-0 text-[10px] text-zinc-500">
                        {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'truncate text-[11px]',
                      isActive ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-400'
                    )}
                  >
                    {preview}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <FriendsPanel open={friendsOpen} onClose={() => setFriendsOpen(false)} />
    </>
  );
}
