import { Types } from 'mongoose';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { encryptText } from '../utils/crypto';
import { generateToken } from '../utils/crypto';

export class ChatService {
  static async getOrCreateDirectChat(userId: string, otherUserId: string) {
    const existing = await Chat.findOne({
      type: 'direct',
      $and: [
        { 'members.user': userId },
        { 'members.user': otherUserId },
        { $expr: { $eq: [{ $size: '$members' }, 2] } },
      ],
    });
    if (existing) return existing;

    return Chat.create({
      type: 'direct',
      createdBy: userId,
      members: [
        { user: userId, role: 'member' },
        { user: otherUserId, role: 'member' },
      ],
    });
  }

  static async createGroup(userId: string, name: string, memberIds: string[], description?: string) {
    const members = [
      { user: new Types.ObjectId(userId), role: 'owner' as const, joinedAt: new Date() },
      ...memberIds
        .filter((id) => id !== userId)
        .map((id) => ({ user: new Types.ObjectId(id), role: 'member' as const, joinedAt: new Date() })),
    ];
    return Chat.create({
      type: 'group',
      name,
      description,
      createdBy: userId,
      members,
      admins: [userId],
      inviteCode: generateToken(8),
      inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  static async listArchivedChats(userId: string) {
    return Chat.find({ 'members.user': userId, archivedBy: userId })
      .sort({ lastMessageAt: -1 })
      .populate('members.user', 'username displayName avatar status lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username displayName avatar' },
      });
  }

  static async listUserChats(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const filter = { 'members.user': userId, archivedBy: { $ne: userId } };
    const [chats, total] = await Promise.all([
      Chat.find(filter)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('members.user', 'username displayName avatar status lastSeen')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'username displayName avatar' },
        }),
      Chat.countDocuments(filter),
    ]);
    return { chats, total, page, limit };
  }

  static async getMessages(chatId: string, userId: string, page = 1, limit = 50) {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.members.some((m) => String(m.user) === userId)) {
      throw Object.assign(new Error('Chat not found'), { status: 404 });
    }
    const skip = (page - 1) * limit;
    const filter = {
      chat: chatId,
      $or: [{ isDeleted: false }, { deletedFor: { $ne: userId } }],
    };
    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username displayName avatar')
        .populate('replyTo'),
      Message.countDocuments(filter),
    ]);
    return { messages: messages.reverse(), total, page, limit };
  }

  static async createMessage(
    userId: string,
    data: {
      chatId: string;
      type: string;
      content?: string;
      replyTo?: string;
      media?: object;
      scheduledFor?: Date;
      encrypted?: boolean;
      poll?: object;
    }
  ) {
    const chat = await Chat.findById(data.chatId);
    if (!chat || !chat.members.some((m) => String(m.user) === userId)) {
      throw Object.assign(new Error('Chat not found'), { status: 404 });
    }

    const blocked = await User.findById(userId);
    if (chat.type === 'direct') {
      const otherId = chat.members.find((m) => String(m.user) !== userId)?.user;
      if (otherId && blocked?.blockedUsers.some((b) => String(b) === String(otherId))) {
        throw Object.assign(new Error('Cannot message blocked user'), { status: 403 });
      }
    }

    let content = data.content;
    if (data.encrypted && content) content = encryptText(content);

    const isScheduled = data.scheduledFor && data.scheduledFor > new Date();
    const message = await Message.create({
      chat: data.chatId,
      sender: userId,
      type: data.type,
      content,
      media: data.media,
      replyTo: data.replyTo,
      poll: data.poll,
      scheduledFor: data.scheduledFor,
      isSent: !isScheduled,
      status: isScheduled ? 'sending' : 'sent',
    });

    if (!isScheduled) {
      chat.lastMessage = message._id;
      chat.lastMessageAt = new Date();
      await chat.save();
    }

    return message.populate('sender', 'username displayName avatar');
  }

  static async searchMessages(userId: string, query: string, chatId?: string) {
    const userChats = await Chat.find({ 'members.user': userId }).select('_id');
    const chatIds = chatId ? [chatId] : userChats.map((c) => c._id);
    const baseFilter = { chat: { $in: chatIds }, isDeleted: false };

    try {
      const textResults = await Message.find({
        ...baseFilter,
        $text: { $search: query },
      })
        .limit(50)
        .populate('sender', 'username displayName avatar')
        .populate('chat', 'name type');
      if (textResults.length) return textResults;
    } catch {
      // text index may be missing in dev
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return Message.find({
      ...baseFilter,
      content: regex,
    })
      .limit(50)
      .sort({ createdAt: -1 })
      .populate('sender', 'username displayName avatar')
      .populate('chat', 'name type');
  }
}
