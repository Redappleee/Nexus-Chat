'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Check,
  CheckCheck,
  Reply,
  Languages,
  Trash2,
  Download,
  FileText,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useChatStore, MessageItem } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { useChatThemeStore, BubbleTheme, FontSize, BubbleRadius } from '@/store/chat-theme-store';
import { Avatar } from '@/components/ui/avatar';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const EMOJI_REACTIONS = ['👍', '❤️', '🔥', '😂', '😮', '👏'];
const EMPTY_MESSAGES: MessageItem[] = [];

function resolveMediaUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

const BUBBLE_THEMES: Record<BubbleTheme, string> = {
  emerald: 'bg-emerald-600 text-white selection:bg-emerald-800',
  blue: 'bg-blue-600 text-white selection:bg-blue-800',
  purple: 'bg-indigo-600 text-white selection:bg-indigo-800',
  rose: 'bg-rose-600 text-white selection:bg-rose-800',
  amber: 'bg-amber-600 text-white selection:bg-amber-800',
  carbon: 'bg-zinc-700 text-white selection:bg-zinc-800',
};

const FONT_SIZES: Record<FontSize, string> = {
  compact: 'text-[11.5px] leading-normal py-1.5 px-3',
  regular: 'text-[13px] leading-relaxed py-2 px-3.5',
  large: 'text-[14.5px] leading-relaxed py-2.5 px-4',
};

const SENT_RADIUS: Record<BubbleRadius, string> = {
  rounded: 'rounded-2xl rounded-br-xs',
  modern: 'rounded-xl rounded-br-xs',
  sharp: 'rounded-sm',
};

const RECEIVED_RADIUS: Record<BubbleRadius, string> = {
  rounded: 'rounded-2xl rounded-bl-xs',
  modern: 'rounded-xl rounded-bl-xs',
  sharp: 'rounded-sm',
};

export function MessageList({ chatId }: { chatId: string }) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const rawMessages = useChatStore((s) => s.messages[chatId]);
  const messages = rawMessages ?? EMPTY_MESSAGES;
  const setMessages = useChatStore((s) => s.setMessages);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const user = useAuthStore((s) => s.user);
  const readRef = useRef<Set<string>>(new Set());

  // Theme customization for this chat
  const globalTheme = useChatThemeStore((s) => s.globalTheme);
  const chatTheme = useChatThemeStore((s) => s.chatThemes[chatId]);
  const theme = useMemo(() => ({ ...globalTheme, ...chatTheme }), [globalTheme, chatTheme]);

  // Translation state: { [msgId]: translatedText }
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const { data: fetchedMessages } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const { data } = await api.get(`/chats/${chatId}/messages`, { params: { limit: 50 } });
      return (data.data?.messages || data.data || []) as MessageItem[];
    },
    enabled: !!chatId,
  });

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(chatId, fetchedMessages);
    }
  }, [fetchedMessages, chatId, setMessages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!chatId || !user?._id) return;
    const unread = messages
      .filter((m) => m.sender._id !== user._id && !m.readBy?.some((r) => r.user === user._id))
      .map((m) => m._id)
      .filter((id) => !readRef.current.has(id));

    if (!unread.length) return;
    unread.forEach((id) => readRef.current.add(id));
    getSocket()?.emit(SOCKET_EVENTS.MESSAGE_READ, { chatId, messageIds: unread });
  }, [messages, chatId, user?._id]);

  const react = async (messageId: string, emoji: string) => {
    await api.post(`/chats/messages/${messageId}/react`, { emoji }).catch(() => { });
  };

  const deleteMsg = async (messageId: string, everyone = false) => {
    await api.delete(`/chats/messages/${messageId}`, { params: { scope: everyone ? 'everyone' : 'me' } });
  };

  const translateMessage = async (messageId: string, text: string) => {
    if (translations[messageId]) {
      // Toggle off if already translated
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      return;
    }
    setTranslatingId(messageId);
    try {
      const { data } = await api.post('/ai/translate', { text, targetLang: 'English' });
      setTranslations((prev) => ({ ...prev, [messageId]: data.data.translated }));
    } catch {
      toast.error('Translation failed');
    } finally {
      setTranslatingId(null);
    }
  };

  const visibleMessages = useMemo(() => messages.filter((m) => !m.isDeleted), [messages]);

  const wallpaperStyle: React.CSSProperties = useMemo(() => ({
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    backgroundColor: theme.wallpaperBg || '#090d16',
    backgroundImage:
      theme.wallpaperPattern === 'dots'
        ? 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)'
        : theme.wallpaperPattern === 'grid'
          ? 'linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)'
          : theme.wallpaperPattern === 'lines'
            ? 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.02) 0, rgba(255, 255, 255, 0.02) 1px, transparent 0, transparent 8px)'
            : 'none',
    backgroundSize:
      theme.wallpaperPattern === 'dots'
        ? '14px 14px'
        : theme.wallpaperPattern === 'grid'
          ? '20px 20px'
          : undefined,
  }), [theme.wallpaperBg, theme.wallpaperPattern]);

  if (!visibleMessages.length) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 text-center text-zinc-500 transition-colors w-full max-w-full overflow-x-hidden box-border"
        style={wallpaperStyle}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/80 border border-white/[0.08]">
          <Sparkles className="h-5 w-5 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-200">No messages yet</p>
        <p className="mt-1 text-xs text-zinc-500">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="h-full w-full max-w-[95%] mx-auto min-w-0 overflow-x-hidden px-2 sm:px-4 py-3 transition-colors box-border"
      style={{
        ...wallpaperStyle,
        width: '95%',
        maxWidth: '95%',
        margin: '0 auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehaviorY: 'contain',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
      data={visibleMessages}
      initialTopMostItemIndex={visibleMessages.length - 1}
      followOutput="smooth"
      itemContent={(_, message: MessageItem) => {
        const isMine = message.sender._id === user?._id;
        const reply = typeof message.replyTo === 'object' && message.replyTo ? message.replyTo : null;
        const translation = translations[message._id];

        // Aggregate reactions
        const reactionCounts: Record<string, number> = {};
        message.reactions?.forEach((r) => {
          reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });

        const bubbleClass = isMine
          ? BUBBLE_THEMES[theme.bubbleTheme] || BUBBLE_THEMES.emerald
          : 'bg-[#131927] text-zinc-100 border border-white/[0.08]';

        const radiusClass = isMine
          ? SENT_RADIUS[theme.bubbleRadius] || SENT_RADIUS.rounded
          : RECEIVED_RADIUS[theme.bubbleRadius] || RECEIVED_RADIUS.rounded;

        const sizeClass = FONT_SIZES[theme.fontSize] || FONT_SIZES.regular;

        return (
          <div
            key={message._id}
            className={cn(
              'group relative mb-3 flex gap-2.5 items-end w-full max-w-full min-w-0',
              isMine ? 'flex-row-reverse pr-[3%]' : ''
            )}
          >
            <Avatar
              src={message.sender?.avatar || (isMine ? user?.avatar : undefined)}
              name={message.sender?.displayName || (isMine ? (user?.displayName || 'You') : 'User')}
              className="h-7 w-7 shrink-0 mb-0.5"
              size="sm"
            />

            <div className={cn('relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-0 flex flex-col', isMine ? 'items-end' : 'items-start')}>
              {/* Sender Name in group */}
              {!isMine && (
                <span className="ml-1 mb-1 text-[11px] font-semibold text-zinc-400 truncate max-w-full">
                  {message.sender.displayName}
                </span>
              )}

              {/* Message Bubble Container */}
              <div
                className={cn(
                  'relative shadow-sm transition-all max-w-full min-w-0 [overflow-wrap:anywhere] [word-break:break-word]',
                  bubbleClass,
                  radiusClass,
                  sizeClass
                )}
              >
                {/* Quoted reply box */}
                {reply && (
                  <div
                    className={cn(
                      'mb-2 rounded-lg p-2 text-xs border-l-2 max-w-full min-w-0 overflow-hidden',
                      isMine
                        ? 'bg-black/20 border-white/80 text-emerald-100'
                        : 'bg-black/30 border-emerald-500 text-zinc-300'
                    )}
                  >
                    <p className="text-[10px] font-semibold tracking-wide uppercase opacity-80 truncate">
                      {reply.sender?.displayName || 'Replying'}
                    </p>
                    <p className="truncate text-xs opacity-90">{reply.content || `[${reply.type}]`}</p>
                  </div>
                )}

                {/* Media Attachment */}
                {message.media?.url && (
                  <div className="overflow-hidden rounded-xl my-1.5 max-w-full min-w-0">
                    {message.type === 'video' ? (
                      <video
                        src={resolveMediaUrl(message.media.url)}
                        controls
                        className="max-h-72 w-full max-w-full rounded-xl object-contain bg-black"
                      />
                    ) : message.type === 'image' ? (
                      <img
                        src={resolveMediaUrl(message.media.url)}
                        alt="attachment"
                        className="max-h-72 w-full max-w-full rounded-xl object-contain hover:opacity-95 transition-opacity cursor-pointer"
                        onClick={() => window.open(resolveMediaUrl(message.media!.url), '_blank')}
                      />
                    ) : (
                      <a
                        href={resolveMediaUrl(message.media.url)}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl p-2.5 transition-colors max-w-full min-w-0',
                          isMine ? 'bg-black/20 hover:bg-black/30 text-white' : 'bg-black/30 hover:bg-black/40 text-zinc-200'
                        )}
                      >
                        <FileText className="h-5 w-5 shrink-0 opacity-80" />
                        <span className="truncate text-xs font-medium flex-1 min-w-0">{message.content || 'Download Document'}</span>
                        <Download className="h-4 w-4 shrink-0 opacity-70 ml-auto" />
                      </a>
                    )}
                  </div>
                )}

                {/* Text Content */}
                {message.content && (
                  <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0 max-w-full">{message.content}</p>
                )}

                {/* Translation display */}
                {translation && (
                  <div className={cn(
                    'mt-2 pt-2 border-t text-xs max-w-full min-w-0 [overflow-wrap:anywhere]',
                    isMine ? 'border-white/20 text-white/90' : 'border-white/[0.08] text-emerald-400'
                  )}>
                    <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                      <Languages className="h-3 w-3 shrink-0" /> English Translation:
                    </div>
                    <p className="italic text-zinc-200 whitespace-pre-wrap break-words">{translation}</p>
                  </div>
                )}

                {/* Bubble Footer: Timestamp & Read Status */}
                <div
                  className={cn(
                    'mt-1 flex items-center justify-end gap-1 text-[10px] select-none shrink-0',
                    isMine ? 'opacity-80' : 'text-zinc-500'
                  )}
                >
                  {message.isEdited && <span className="italic">edited</span>}
                  <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                  {isMine && (
                    <span>
                      {message.readBy && message.readBy.length > 0 ? (
                        <CheckCheck className="h-3 w-3 text-cyan-200 stroke-[2.5]" />
                      ) : (
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Reaction Badges below bubble */}
              {Object.keys(reactionCounts).length > 0 && (
                <div
                  className={cn(
                    'flex flex-wrap gap-1 mt-1 select-none max-w-full',
                    isMine ? 'justify-end' : 'justify-start'
                  )}
                >
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => react(message._id, emoji)}
                      className="flex items-center gap-1 rounded-full bg-[#161d2d] border border-white/[0.1] px-2 py-0.5 text-xs text-zinc-200 hover:border-emerald-500/50 transition-colors shadow-sm shrink-0"
                    >
                      <span>{emoji}</span>
                      {count > 1 && <span className="text-[10px] font-bold text-zinc-400">{count}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Toolbar on Hover */}
              <div
                className={cn(
                  'opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute -top-3 z-10 flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-[#111726] p-0.5 shadow-lg max-w-[calc(100vw-2.5rem)]',
                  isMine ? 'right-0' : 'left-0'
                )}
              >
                {EMOJI_REACTIONS.slice(0, 4).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded p-1 text-xs hover:bg-white/[0.1] transition-transform hover:scale-125"
                    onClick={() => react(message._id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded p-1 text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                  onClick={() => setReplyTo(chatId, message)}
                  title="Reply"
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
                {message.content && (
                  <button
                    type="button"
                    className="rounded p-1 text-zinc-400 hover:text-emerald-400 hover:bg-white/[0.1] transition-colors"
                    onClick={() => translateMessage(message._id, message.content!)}
                    title="Translate"
                  >
                    <Languages className="h-3.5 w-3.5" />
                  </button>
                )}
                {isMine ? (
                  <button
                    type="button"
                    className="rounded p-1 text-zinc-400 hover:text-rose-400 hover:bg-white/[0.1] transition-colors"
                    onClick={() => deleteMsg(message._id, true)}
                    title="Delete message"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded p-1 text-zinc-400 hover:text-rose-400 hover:bg-white/[0.1] transition-colors"
                    onClick={() => deleteMsg(message._id, false)}
                    title="Delete for me"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
