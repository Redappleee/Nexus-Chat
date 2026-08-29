import mongoose, { Schema, Document, Types } from 'mongoose';
import type { MessageStatus, MessageType } from '@nexus/shared';

export interface IReaction {
  emoji: string;
  users: Types.ObjectId[];
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  type: MessageType;
  content?: string;
  media?: {
    url: string;
    publicId?: string;
    mimeType?: string;
    size?: number;
    duration?: number;
    thumbnail?: string;
  };
  replyTo?: Types.ObjectId;
  forwardedFrom?: Types.ObjectId;
  reactions: IReaction[];
  readBy: { user: Types.ObjectId; at: Date }[];
  deliveredTo: Types.ObjectId[];
  status: MessageStatus;
  isEdited: boolean;
  isDeleted: boolean;
  deletedFor: Types.ObjectId[];
  pinned: boolean;
  starredBy: Types.ObjectId[];
  scheduledFor?: Date;
  isSent: boolean;
  poll?: {
    question: string;
    options: { text: string; votes: Types.ObjectId[] }[];
    multiple: boolean;
    closesAt?: Date;
  };
  location?: { lat: number; lng: number; label?: string };
  translations?: Record<string, string>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'poll', 'system'],
      default: 'text',
    },
    content: String,
    media: {
      url: String,
      publicId: String,
      mimeType: String,
      size: Number,
      duration: Number,
      thumbnail: String,
    },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: 'Message' },
    reactions: [{ emoji: String, users: [{ type: Schema.Types.ObjectId, ref: 'User' }] }],
    readBy: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, at: Date }],
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['sending', 'sent', 'delivered', 'read', 'failed'], default: 'sent' },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pinned: { type: Boolean, default: false },
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduledFor: Date,
    isSent: { type: Boolean, default: true },
    poll: {
      question: String,
      options: [{ text: String, votes: [{ type: Schema.Types.ObjectId, ref: 'User' }] }],
      multiple: Boolean,
      closesAt: Date,
    },
    location: { lat: Number, lng: Number, label: String },
    translations: Schema.Types.Mixed,
    expiresAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });
messageSchema.index({ scheduledFor: 1, isSent: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
