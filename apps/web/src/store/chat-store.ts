import { create } from 'zustand';

export interface ChatItem {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  members: { user: { _id: string; displayName: string; username?: string; avatar?: string; status?: string } }[];
  lastMessage?: { _id?: string; content?: string; type: string; sender?: { displayName: string }; createdAt?: string };
  lastMessageAt?: string;
  pinnedBy?: { user: string }[];
  archivedBy?: { user: string }[];
}

export interface MessageItem {
  _id: string;
  chat: string;
  sender: { _id: string; displayName: string; avatar?: string };
  type: string;
  content?: string;
  media?: { url: string; mimeType?: string };
  replyTo?: MessageItem | string;
  reactions: { emoji: string; users: string[] }[];
  readBy?: { user: string; readAt: string }[];
  status: string;
  isEdited: boolean;
  isDeleted?: boolean;
  createdAt: string;
}

interface ChatState {
  chats: ChatItem[];
  archivedChats: ChatItem[];
  activeChatId: string | null;
  messages: Record<string, MessageItem[]>;
  typing: Record<string, string[]>;
  drafts: Record<string, string>;
  replyTo: Record<string, MessageItem | null>;
  onlineUsers: Record<string, boolean>;
  setChats: (chats: ChatItem[]) => void;
  setArchivedChats: (chats: ChatItem[]) => void;
  upsertChat: (chat: ChatItem) => void;
  setActiveChat: (id: string | null) => void;
  setMessages: (chatId: string, messages: MessageItem[]) => void;
  addMessage: (chatId: string, message: MessageItem) => void;
  updateMessage: (chatId: string, message: MessageItem) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  setTyping: (chatId: string, userIds: string[]) => void;
  setDraft: (chatId: string, text: string) => void;
  setReplyTo: (chatId: string, message: MessageItem | null) => void;
  setUserOnline: (userId: string, online: boolean) => void;
}

function patchChatPreview(chats: ChatItem[], chatId: string, message: MessageItem): ChatItem[] {
  return chats.map((c) =>
    c._id === chatId
      ? {
          ...c,
          lastMessage: {
            _id: message._id,
            content: message.isDeleted ? undefined : message.content,
            type: message.type,
            sender: message.sender,
            createdAt: message.createdAt,
          },
          lastMessageAt: message.createdAt,
        }
      : c
  );
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  archivedChats: [],
  activeChatId: null,
  messages: {},
  typing: {},
  drafts: {},
  replyTo: {},
  onlineUsers: {},
  setChats: (chats) => set({ chats }),
  setArchivedChats: (archivedChats) => set({ archivedChats }),
  upsertChat: (chat) =>
    set((s) => {
      const idx = s.chats.findIndex((c) => c._id === chat._id);
      if (idx >= 0) {
        const next = [...s.chats];
        next[idx] = { ...next[idx], ...chat };
        return { chats: next };
      }
      return { chats: [chat, ...s.chats] };
    }),
  setActiveChat: (activeChatId) => set({ activeChatId }),
  setMessages: (chatId, messages) =>
    set((s) => ({ messages: { ...s.messages, [chatId]: messages } })),
  addMessage: (chatId, message) =>
    set((s) => {
      const existing = s.messages[chatId] || [];
      if (existing.some((m) => m._id === message._id)) {
        return { messages: { ...s.messages, [chatId]: existing.map((m) => (m._id === message._id ? message : m)) } };
      }
      return {
        messages: { ...s.messages, [chatId]: [...existing, message] },
        chats: patchChatPreview(s.chats, chatId, message),
      };
    }),
  updateMessage: (chatId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] || []).map((m) => (m._id === message._id ? message : m)),
      },
      chats: patchChatPreview(s.chats, chatId, message),
    })),
  removeMessage: (chatId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] || []).filter((m) => m._id !== messageId),
      },
    })),
  setTyping: (chatId, userIds) =>
    set((s) => ({ typing: { ...s.typing, [chatId]: userIds } })),
  setDraft: (chatId, text) =>
    set((s) => ({ drafts: { ...s.drafts, [chatId]: text } })),
  setReplyTo: (chatId, message) =>
    set((s) => ({ replyTo: { ...s.replyTo, [chatId]: message } })),
  setUserOnline: (userId, online) =>
    set((s) => ({
      onlineUsers: { ...s.onlineUsers, [userId]: online },
    })),
}));
