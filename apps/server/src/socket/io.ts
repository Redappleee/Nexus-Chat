import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@nexus/shared';

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

export function getSocketServer(): Server | null {
  return io;
}

export function emitToChat(chatId: string, event: string, payload: unknown): void {
  io?.to(String(chatId)).emit(event, payload);
}

export async function broadcastMessage(
  chatId: string,
  message: unknown,
  event: string = SOCKET_EVENTS.MESSAGE_NEW
): Promise<void> {
  emitToChat(chatId, event, message);
}
