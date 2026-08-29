'use client';

import { useEffect } from 'react';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';

/** Join socket room when user opens a chat (required for realtime on new chats). */
export function useChatRoom(chatId: string | null) {
  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.CHAT_JOIN, chatId);
    } else {
      socket?.once('connect', () => socket.emit(SOCKET_EVENTS.CHAT_JOIN, chatId));
    }
  }, [chatId]);
}

export function joinChatRoom(chatId: string) {
  getSocket()?.emit(SOCKET_EVENTS.CHAT_JOIN, chatId);
}
