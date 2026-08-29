import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { ChatService } from '../services/chat.service';
import { SOCKET_EVENTS } from '@nexus/shared';
import { env } from '../config/env';
import { setSocketServer } from './io';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

const onlineUsers = new Map<string, string>();

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.toString().slice(7);
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).userId = payload.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
    const userId = (socket as AuthenticatedSocket).userId;
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });
    socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, { userId });

    const userChats = await Chat.find({ 'members.user': userId }).select('_id');
    userChats.forEach((c) => socket.join(String(c._id)));

    socket.on(SOCKET_EVENTS.CHAT_JOIN, (chatId: string) => socket.join(chatId));

    socket.on(SOCKET_EVENTS.TYPING_START, ({ chatId }: { chatId: string }) => {
      socket.to(chatId).emit(SOCKET_EVENTS.TYPING_START, { chatId, userId });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ chatId }: { chatId: string }) => {
      socket.to(chatId).emit(SOCKET_EVENTS.TYPING_STOP, { chatId, userId });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, ack) => {
      try {
        const message = await ChatService.createMessage(userId, payload);
        const populated = await Message.findById(message._id)
          .populate('sender', 'username displayName avatar')
          .populate('replyTo');
        io.to(String(payload.chatId)).emit(SOCKET_EVENTS.MESSAGE_NEW, populated);
        ack?.({ success: true, message: populated });
      } catch (err: unknown) {
        ack?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, async ({ chatId, messageIds }: { chatId: string; messageIds: string[] }) => {
      await Message.updateMany(
        { _id: { $in: messageIds }, chat: chatId },
        { $addToSet: { readBy: { user: userId, at: new Date() } }, status: 'read' }
      );
      socket.to(chatId).emit(SOCKET_EVENTS.MESSAGE_READ, { chatId, userId, messageIds });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, ({ chatId, messageIds }: { chatId: string; messageIds: string[] }) => {
      socket.to(chatId).emit(SOCKET_EVENTS.MESSAGE_DELIVERED, { chatId, userId, messageIds });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_REACTION, async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      let reaction = msg.reactions.find((r) => r.emoji === emoji);
      if (!reaction) {
        reaction = { emoji, users: [] };
        msg.reactions.push(reaction);
      }
      const idx = reaction.users.findIndex((u) => String(u) === userId);
      if (idx >= 0) reaction.users.splice(idx, 1);
      else reaction.users.push(userId as never);
      await msg.save();
      io.to(String(msg.chat)).emit(SOCKET_EVENTS.MESSAGE_REACTION, msg);
    });

    socket.on(SOCKET_EVENTS.CALL_OFFER, (data) => {
      socket.to(data.targetSocketId || data.chatId).emit(SOCKET_EVENTS.CALL_OFFER, { ...data, from: userId });
    });
    socket.on(SOCKET_EVENTS.CALL_ANSWER, (data) => {
      socket.to(data.targetSocketId || data.chatId).emit(SOCKET_EVENTS.CALL_ANSWER, { ...data, from: userId });
    });
    socket.on(SOCKET_EVENTS.CALL_ICE, (data) => {
      socket.to(data.targetSocketId || data.chatId).emit(SOCKET_EVENTS.CALL_ICE, data);
    });
    socket.on(SOCKET_EVENTS.CALL_END, (data) => {
      socket.to(data.chatId).emit(SOCKET_EVENTS.CALL_END, { ...data, from: userId });
    });
    socket.on(SOCKET_EVENTS.CALL_REJECT, (data) => {
      socket.to(data.chatId).emit(SOCKET_EVENTS.CALL_REJECT, { ...data, from: userId });
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
      socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, { userId });
    });
  });

  setSocketServer(io);
  return io;
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}
