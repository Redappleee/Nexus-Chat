'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, MessageSquare, Check, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chat-store';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinChatRoom } from '@/hooks/use-chat-room';
import { toast } from 'sonner';

interface UserResult {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status?: string;
}

export function NewChatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [groupName, setGroupName] = useState('');
  const { upsertChat, setActiveChat } = useChatStore();

  const searchUsers = async () => {
    if (!query.trim()) return;
    try {
      const { data } = await api.get('/users/search', { params: { q: query } });
      setUsers(data.data || []);
    } catch {
      toast.error('Search failed');
    }
  };

  const startDirect = useMutation({
    mutationFn: (userId: string) => api.post('/chats/direct', { userId }),
    onSuccess: ({ data }) => {
      upsertChat(data.data);
      setActiveChat(data.data._id);
      joinChatRoom(data.data._id);
      toast.success('Conversation opened');
      onClose();
    },
    onError: () => toast.error('Could not start conversation'),
  });

  const createGroup = useMutation({
    mutationFn: () =>
      api.post('/chats/group', {
        name: groupName,
        memberIds: selected.map((u) => u._id),
      }),
    onSuccess: ({ data }) => {
      upsertChat(data.data);
      setActiveChat(data.data._id);
      joinChatRoom(data.data._id);
      toast.success('Group created');
      onClose();
    },
    onError: () => toast.error('Could not create group'),
  });

  const toggleSelect = (user: UserResult) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]
    );
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="w-full max-w-lg rounded-3xl border border-white/[0.1] bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                New Conversation
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Start a direct message or group chat</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={onClose}>
              <X className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>

          {/* Segmented Tab */}
          <div className="mb-4 flex rounded-xl bg-black/40 p-1 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setTab('direct')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'direct'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Direct Message
            </button>
            <button
              type="button"
              onClick={() => setTab('group')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'group'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Group Chat
            </button>
          </div>

          {tab === 'group' && (
            <div className="mb-3">
              <input
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          {/* Search Input */}
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                placeholder="Search by name or @username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                className="w-full rounded-xl border border-white/[0.1] bg-black/30 pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Button
              type="button"
              onClick={searchUsers}
              className="rounded-xl px-4 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm text-xs"
            >
              Search
            </Button>
          </div>

          {/* Results list */}
          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
            {users.map((user) => {
              const isSelected = selected.some((s) => s._id === user._id);
              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => (tab === 'direct' ? startDirect.mutate(user._id) : toggleSelect(user))}
                  className={`flex w-full items-center justify-between rounded-2xl p-2.5 text-left transition-all border ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.06] text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={user.avatar}
                      name={user.displayName}
                      status={user.status as 'online'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-zinc-100 truncate">{user.displayName}</p>
                      <p className="text-[11px] text-zinc-400 truncate">@{user.username}</p>
                    </div>
                  </div>

                  {tab === 'group' && (
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-white/20 bg-black/20 text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })}

            {!users.length && (
              <p className="py-8 text-center text-xs text-zinc-500">
                Type a name or username above to find users.
              </p>
            )}
          </div>

          {tab === 'group' && selected.length > 0 && (
            <Button
              className="mt-4 w-full rounded-xl py-3 font-semibold text-xs shadow-lg shadow-emerald-600/30"
              disabled={!groupName.trim() || createGroup.isPending}
              onClick={() => createGroup.mutate()}
            >
              Create Group ({selected.length} members)
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
