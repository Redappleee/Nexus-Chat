import { SOCKET_EVENTS } from '@nexus/shared';
import { broadcastMessage } from '../socket/io';
import { Message } from '../models/Message';

type MessageEvent =
  | typeof SOCKET_EVENTS.MESSAGE_NEW
  | typeof SOCKET_EVENTS.MESSAGE_UPDATE
  | typeof SOCKET_EVENTS.MESSAGE_DELETE
  | typeof SOCKET_EVENTS.MESSAGE_REACTION;

export async function emitMessageEvent(messageId: string, event: MessageEvent) {
  const msg = await Message.findById(messageId)
    .populate('sender', 'username displayName avatar')
    .populate('replyTo');
  if (!msg) return;
  await broadcastMessage(String(msg.chat), msg, event);
}
