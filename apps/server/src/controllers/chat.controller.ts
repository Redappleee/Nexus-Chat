import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ChatService } from '../services/chat.service';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody } from '../middleware/validate';
import { uploadToCloudinary } from '../services/upload.service';
import { emitMessageEvent } from '../utils/messageEvents';
import { SOCKET_EVENTS } from '@nexus/shared';
import fs from 'fs';

export const listChats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const { chats, total, page: p, limit: l } = await ChatService.listUserChats(req.userId!, page, limit);
  return sendPaginated(res, chats, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
    hasMore: p * l < total,
  });
});

export const createDirect = asyncHandler(async (req: AuthRequest, res: Response) => {
  const chat = await ChatService.getOrCreateDirectChat(
    req.userId!,
    getValidatedBody<{ userId: string }>(req).userId
  );
  const populated = await chat.populate('members.user', 'username displayName avatar status lastSeen');
  return sendSuccess(res, populated, undefined, 201);
});

export const createGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = getValidatedBody<{ name: string; memberIds: string[]; description?: string }>(req);
  const chat = await ChatService.createGroup(req.userId!, body.name, body.memberIds, body.description);
  const populated = await chat.populate('members.user', 'username displayName avatar status lastSeen');
  return sendSuccess(res, populated, undefined, 201);
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const chatId = String(req.params.chatId);
  const result = await ChatService.getMessages(chatId, req.userId!, page, limit);
  return sendPaginated(res, result.messages, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / result.limit),
    hasMore: result.page * result.limit < result.total,
  });
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = getValidatedBody<{
    chatId: string;
    type: string;
    content?: string;
    replyTo?: string;
    media?: object;
    scheduledFor?: string;
    encrypted?: boolean;
    poll?: { question: string; options: string[]; multiple?: boolean };
  }>(req);
  const message = await ChatService.createMessage(req.userId!, {
    chatId: body.chatId,
    type: body.type,
    content: body.content,
    replyTo: body.replyTo,
    media: body.media,
    scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    encrypted: body.encrypted,
    poll: body.poll
      ? {
          question: body.poll.question,
          options: body.poll.options.map((o) => ({ text: o, votes: [] })),
          multiple: body.poll.multiple,
        }
      : undefined,
  });
  const populated = await message.populate('sender', 'username displayName avatar');
  await emitMessageEvent(String(populated._id), SOCKET_EVENTS.MESSAGE_NEW);
  return sendSuccess(res, populated, undefined, 201);
});

export const editMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const msg = await Message.findOne({ _id: req.params.messageId, sender: req.userId });
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  msg.content = req.body.content;
  msg.isEdited = true;
  await msg.save();
  await emitMessageEvent(String(msg._id), SOCKET_EVENTS.MESSAGE_UPDATE);
  return sendSuccess(res, msg);
});

export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const msg = await Message.findById(req.params.messageId);
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  const forEveryone = req.query.scope === 'everyone' && String(msg.sender) === req.userId;
  if (forEveryone) {
    msg.isDeleted = true;
    msg.content = undefined;
  } else {
    msg.deletedFor.push(req.userId! as never);
  }
  await msg.save();
  await emitMessageEvent(String(msg._id), SOCKET_EVENTS.MESSAGE_DELETE);
  return sendSuccess(res, msg);
});

export const reactMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const msg = await Message.findById(req.params.messageId);
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  let reaction = msg.reactions.find((r) => r.emoji === req.body.emoji);
  if (!reaction) {
    reaction = { emoji: req.body.emoji, users: [] };
    msg.reactions.push(reaction);
  }
  const idx = reaction.users.findIndex((u) => String(u) === req.userId);
  if (idx >= 0) reaction.users.splice(idx, 1);
  else reaction.users.push(req.userId! as never);
  await msg.save();
  await emitMessageEvent(String(msg._id), SOCKET_EVENTS.MESSAGE_REACTION);
  return sendSuccess(res, msg);
});

export const searchMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const results = await ChatService.searchMessages(
    req.userId!,
    req.query.q as string,
    req.query.chatId as string | undefined
  );
  return sendSuccess(res, results);
});

export const uploadMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
  const type = file.mimetype.startsWith('video') ? 'video' : file.mimetype.startsWith('image') ? 'image' : 'raw';
  const result = await uploadToCloudinary(file.path, type);
  fs.unlinkSync(file.path);
  return sendSuccess(res, result);
});

export const pinChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) throw Object.assign(new Error('Chat not found'), { status: 404 });
  chat.pinnedBy = chat.pinnedBy.filter((p) => String(p.user) !== req.userId);
  chat.pinnedBy.push({ user: req.userId! as never, at: new Date() });
  await chat.save();
  return sendSuccess(res, chat);
});

export const listArchived = asyncHandler(async (req: AuthRequest, res: Response) => {
  const chats = await ChatService.listArchivedChats(req.userId!);
  return sendSuccess(res, chats);
});

export const unpinChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) throw Object.assign(new Error('Chat not found'), { status: 404 });
  chat.pinnedBy = chat.pinnedBy.filter((p) => String(p.user) !== req.userId);
  await chat.save();
  return sendSuccess(res, chat);
});

export const unarchiveChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) throw Object.assign(new Error('Chat not found'), { status: 404 });
  chat.archivedBy = chat.archivedBy.filter((a) => String(a) !== req.userId);
  await chat.save();
  return sendSuccess(res, chat);
});

export const archiveChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) throw Object.assign(new Error('Chat not found'), { status: 404 });
  if (!chat.archivedBy.some((a) => String(a) === req.userId)) {
    chat.archivedBy.push(req.userId! as never);
  }
  await chat.save();
  return sendSuccess(res, chat);
});
