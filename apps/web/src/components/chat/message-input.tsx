'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chat-store';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const POPULAR_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎉', '👏', '🙏', '😊', '🚀', '💯'];

export function MessageInput({ chatId }: { chatId: string }) {
  const drafts = useChatStore((s) => s.drafts);
  const setDraft = useChatStore((s) => s.setDraft);
  const replyTo = useChatStore((s) => s.replyTo[chatId]);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const [value, setText] = useState(() => drafts[chatId] || '');
  const [prevChatId, setPrevChatId] = useState(chatId);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (prevChatId !== chatId) {
    setPrevChatId(chatId);
    setText(drafts[chatId] || '');
    setShowEmojiPicker(false);
    setSmartReplies([]);
  }

  const handleChange = (val: string) => {
    setText(val);
    setDraft(chatId, val);
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.TYPING_START, { chatId });
    }
  };

  const send = async (payload?: {
    content?: string;
    type?: 'text' | 'image' | 'video' | 'file';
    media?: { url: string; publicId?: string; mimeType: string; size: number; name?: string };
    poll?: { question: string; options: string[] };
  }) => {
    const body = {
      chatId,
      type: 'text' as const,
      content: value.trim(),
      replyTo: replyTo?._id,
      ...payload,
    };
    if (!payload?.media && !payload?.poll && !body.content) return;

    const socket = getSocket();
    if (socket?.connected && !payload?.media) {
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, body, (ack: { success: boolean; error?: string }) => {
        if (!ack?.success) {
          api.post('/chats/messages', body).catch(() => toast.error(ack?.error || 'Failed to send'));
        }
      });
    } else {
      try {
        await api.post('/chats/messages', body);
      } catch {
        toast.error('Failed to send message');
        return;
      }
    }
    setText('');
    setDraft(chatId, '');
    setReplyTo(chatId, null);
    setSmartReplies([]);
    socket?.emit(SOCKET_EVENTS.TYPING_STOP, { chatId });
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const loadSmartReplies = async () => {
    setLoadingReplies(true);
    try {
      const msgs =
        useChatStore.getState().messages[chatId]?.slice(-5).map((m) => m.content || '') || [];
      const { data } = await api.post('/ai/smart-replies', { messages: msgs });
      setSmartReplies(data.data || []);
    } catch {
      toast.error('Failed to generate smart replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  const uploadFile = async (file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/chats/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const type = file.type.startsWith('image')
        ? 'image'
        : file.type.startsWith('video')
        ? 'video'
        : 'file';
      await send({ type, media: data.data, content: file.name });
      toast.success('Uploaded successfully', { id: toastId });
    } catch {
      toast.error('Upload failed. Please try again.', { id: toastId });
    }
  };

  const addEmoji = (emoji: string) => {
    handleChange(value + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative shrink-0 border-t border-white/[0.08] bg-[#0c101c] px-4 py-3">
      {/* Replying To Preview Banner */}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-[#141b2c] border border-emerald-500/30 px-3 py-2 text-xs">
          <div className="min-w-0 pr-2 border-l-2 border-emerald-500 pl-2">
            <p className="font-semibold text-emerald-400 text-[11px]">
              Replying to {replyTo.sender.displayName}
            </p>
            <p className="truncate text-zinc-300">{replyTo.content || '[Media]'}</p>
          </div>
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            onClick={() => setReplyTo(chatId, null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* AI Smart Replies Pill Bar */}
      {smartReplies.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mr-1">
            <Sparkles className="h-3 w-3" />
            AI Suggestions:
          </span>
          {smartReplies.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setText(r);
                setSmartReplies([]);
                textareaRef.current?.focus();
              }}
              className="rounded-full bg-[#162033] hover:bg-[#1e2a44] border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSmartReplies([])}
            className="p-1 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-30 flex gap-1 rounded-xl border border-white/[0.12] bg-[#141b2c] p-2 shadow-xl">
          {POPULAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="rounded-lg p-1.5 text-base hover:bg-white/[0.1] transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Integrated Message Input Area */}
      <div className="flex items-end gap-1.5 rounded-xl bg-[#131929] border border-white/[0.08] p-1 focus-within:border-emerald-500/50 transition-colors">
        {/* Attachment Upload Button */}
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors">
            <Paperclip className="h-4 w-4" />
          </span>
        </label>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((p) => !p)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Add Emoji"
        >
          <Smile className="h-4 w-4" />
        </button>

        {/* AI Smart Replies Trigger Button */}
        <button
          type="button"
          onClick={loadSmartReplies}
          disabled={loadingReplies}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
          title="Suggest Smart Replies"
        >
          <Sparkles className={`h-4 w-4 ${loadingReplies ? 'animate-spin' : ''}`} />
        </button>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a message..."
          rows={1}
          className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none leading-relaxed"
        />

        {/* Send Button */}
        <Button
          size="icon"
          onClick={() => send()}
          disabled={!value.trim()}
          className="h-9 w-9 shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
