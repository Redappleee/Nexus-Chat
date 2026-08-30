'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  Video,
  MoreVertical,
  Bot,
  Pin,
  Archive,
  UserPlus,
  Ban,
  Flag,
  ArchiveRestore,
  MessageSquare,
  ArrowLeft,
  Palette,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { CallOverlay } from '@/components/call/call-overlay';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { ChatCustomizerDialog } from './chat-customizer-dialog';
import { toast } from 'sonner';

export function ChatWindow() {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const chats = useChatStore((s) => s.chats);
  const typing = useChatStore((s) => s.typing);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const user = useAuthStore((s) => s.user);
  const setCallActive = useUIStore((s) => s.setCallActive);
  const [aiOpen, setAiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const qc = useQueryClient();

  const chat = chats.find((c) => c._id === activeChatId);
  const isPinned = chat?.pinnedBy?.some((p) => String(p.user) === user?._id);

  const pinChat = useMutation({
    mutationFn: () => api.post(`/chats/${activeChatId}/${isPinned ? 'unpin' : 'pin'}`),
    onSuccess: () => {
      toast.success(isPinned ? 'Chat unpinned' : 'Chat pinned');
      qc.invalidateQueries({ queryKey: ['chats'] });
      setMenuOpen(false);
    },
  });

  const archiveChat = useMutation({
    mutationFn: () => api.post(`/chats/${activeChatId}/archive`),
    onSuccess: () => {
      toast.success('Chat archived');
      qc.invalidateQueries({ queryKey: ['chats'] });
      useChatStore.getState().setActiveChat(null);
      setMenuOpen(false);
    },
  });

  const unarchiveChat = useMutation({
    mutationFn: () => api.post(`/chats/${activeChatId}/unarchive`),
    onSuccess: () => {
      toast.success('Chat restored');
      qc.invalidateQueries({ queryKey: ['chats'] });
      qc.invalidateQueries({ queryKey: ['chats-archived'] });
      setMenuOpen(false);
    },
  });

  const blockUser = useMutation({
    mutationFn: (userId: string) => api.post(`/auth/block/${userId}`),
    onSuccess: () => toast.success('User blocked'),
    onError: () => toast.error('Could not block user'),
  });

  const reportUser = useMutation({
    mutationFn: (payload: { userId?: string; messageId?: string; reason: string }) =>
      api.post('/reports', payload),
    onSuccess: () => toast.success('Report submitted'),
  });

  const sendFriendRequest = useMutation({
    mutationFn: (userId: string) => api.post('/users/friends/request', { userId }),
    onSuccess: () => toast.success('Friend request sent'),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Could not send request');
    },
  });

  if (!activeChatId || !chat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full min-h-0 overflow-hidden bg-[#090d16]">
        <div className="flex flex-col items-center text-center max-w-sm px-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141b2c] border border-white/[0.08] shadow-xl p-1.5">
            <img src="/logo.png" alt="Nexus Logo" className="h-full w-full rounded-xl object-cover" />
          </div>

          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            Nexus Chat
          </h2>

          <p className="mt-1.5 text-xs text-zinc-400">
            Select a conversation from the sidebar to view messages.
          </p>

          <div className="mt-6 flex items-center justify-center text-xs text-zinc-500">
            <span className="rounded-lg bg-[#141b2c] border border-white/[0.08] px-3 py-1 font-mono text-[11px] text-zinc-400">
              Press ⌘K to search messages
            </span>
          </div>
        </div>
      </div>
    );
  }

  const title = chat.type === 'group' ? chat.name : chat.members.find((m) => m.user._id !== user?._id)?.user.displayName;
  const other = chat.members.find((m) => m.user._id !== user?._id)?.user;
  const typingUsers = (typing[activeChatId] || []).filter((id) => id !== user?._id);

  return (
    <div className="relative flex flex-1 flex-col h-full min-h-0 w-full min-w-0 max-w-full bg-[#090d16] overflow-hidden">
      {/* Chat Window Header */}
      <header className="relative z-20 shrink-0 flex items-center justify-between border-b border-white/[0.08] bg-[#0f1424] px-3 sm:px-4 py-3 min-w-0 w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-1.5 sm:mr-2">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={() => setActiveChat(null)}
            className="md:hidden p-1.5 -ml-1 shrink-0 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
            title="Back to Chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Avatar
            src={other?.avatar}
            name={title}
            status={other?.status as 'online'}
            size="default"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5 min-w-0">
              <span className="truncate">{title}</span>
              {chat.type === 'group' && (
                <span className="shrink-0 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase font-semibold">
                  Group
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1.5 min-w-0">
              {typingUsers.length ? (
                <div className="text-xs text-emerald-400 font-medium truncate">
                  <span>typing...</span>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 flex items-center gap-1 truncate">
                  {other?.status === 'online' ? (
                    <>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-emerald-400 font-medium truncate">Online</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                      <span className="truncate">Offline</span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="relative flex items-center gap-0.5 sm:gap-1 shrink-0">
          {chat.type === 'direct' && other && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
              title="Add Friend"
              onClick={() => sendFriendRequest.mutate(other._id)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
            onClick={() => setCustomizerOpen(true)}
            title="Customize Chat Theme"
          >
            <Palette className="h-4 w-4 text-emerald-400" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
            onClick={() => setCallActive(true, 'voice')}
            title="Voice Call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
            onClick={() => setCallActive(true, 'video')}
            title="Video Call"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
            onClick={() => setAiOpen(true)}
            title="AI Assistant"
          >
            <Bot className="h-4 w-4 text-emerald-400" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {/* Chat Settings Popup Menu */}
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 min-w-[190px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.1] bg-[#141b2c] p-1.5 shadow-xl">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] transition-colors"
                    onClick={() => {
                      setCustomizerOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Palette className="h-3.5 w-3.5 text-emerald-400" />
                    Customize Chat Theme
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] transition-colors"
                    onClick={() => pinChat.mutate()}
                  >
                    <Pin className="h-3.5 w-3.5 text-emerald-400" />
                    {isPinned ? 'Unpin Conversation' : 'Pin Conversation'}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] transition-colors"
                    onClick={() => archiveChat.mutate()}
                  >
                    <Archive className="h-3.5 w-3.5 text-zinc-400" />
                    Archive Chat
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] transition-colors"
                    onClick={() => unarchiveChat.mutate()}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5 text-zinc-400" />
                    Restore from Archive
                  </button>

                  {chat.type === 'direct' && other && (
                    <>
                      <div className="my-1 border-t border-white/[0.08]" />
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={() => {
                          blockUser.mutate(other._id);
                          setMenuOpen(false);
                        }}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Block User
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.08] transition-colors"
                        onClick={() => {
                          reportUser.mutate({ userId: other._id, reason: 'Reported from chat' });
                          setMenuOpen(false);
                        }}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        Report User
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Message List Container */}
      <div className="flex-1 min-h-0 w-full max-w-full min-w-0 h-full overflow-hidden flex flex-col">
        <MessageList chatId={activeChatId} />
      </div>

      {/* Input Field Bar */}
      <div className="shrink-0 w-full">
        <MessageInput chatId={activeChatId} />
      </div>

      {/* Overlays & Modals */}
      <CallOverlay chatId={activeChatId} />
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      <ChatCustomizerDialog
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        chatId={activeChatId}
      />
    </div>
  );
}
