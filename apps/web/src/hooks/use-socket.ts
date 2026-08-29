'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore, MessageItem } from '@/store/chat-store';
import { toast } from 'sonner';

export function useSocket() {
  const tokenFromStore = useAuthStore((s) => s.accessToken);
  const token =
    tokenFromStore || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  const userId = useAuthStore((s) => s.user?._id);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setUserOnline = useChatStore((s) => s.setUserOnline);
  const queryClient = useQueryClient();
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = useChatStore.getState().activeChatId;
    return useChatStore.subscribe((s) => {
      activeChatIdRef.current = s.activeChatId;
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (message: MessageItem) => {
      const chatId = String(message.chat);
      addMessage(chatId, message);
      if (message.sender._id !== userId) {
        socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
          chatId,
          messageIds: [message._id],
        });
      }
      if (chatId !== activeChatIdRef.current && message.sender._id !== userId) {
        toast.message(message.sender.displayName, {
          description: message.content || `[${message.type}]`,
        });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UPDATE, (message: MessageItem) => {
      updateMessage(String(message.chat), message);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, (message: MessageItem) => {
      updateMessage(String(message.chat), { ...message, isDeleted: true, content: undefined });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_REACTION, (message: MessageItem) => {
      updateMessage(String(message.chat), message);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ chatId, messageIds }: { chatId: string; messageIds: string[] }) => {
      const msgs = useChatStore.getState().messages[chatId] || [];
      msgs.forEach((m) => {
        if (messageIds.includes(m._id) && m.sender._id === userId) {
          updateMessage(chatId, { ...m, status: 'read' });
        }
      });
    });

    socket.on(SOCKET_EVENTS.TYPING_START, ({ chatId, userId: uid }: { chatId: string; userId: string }) => {
      if (uid === userId) return;
      const current = useChatStore.getState().typing[chatId] || [];
      if (!current.includes(uid)) setTyping(chatId, [...current, uid]);
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ chatId, userId: uid }: { chatId: string; userId: string }) => {
      const current = useChatStore.getState().typing[chatId] || [];
      setTyping(chatId, current.filter((id) => id !== uid));
    });

    socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId: uid }: { userId: string }) => {
      setUserOnline(uid, true);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });

    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId: uid }: { userId: string }) => {
      setUserOnline(uid, false);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });

    socket.on(SOCKET_EVENTS.NOTIFICATION, (data: { title: string; body: string }) => {
      toast(data.title, { description: data.body });
    });

    return () => disconnectSocket();
  }, [token, userId, addMessage, updateMessage, setTyping, setUserOnline, queryClient]);
}
