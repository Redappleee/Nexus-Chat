import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChatType, MemberRole } from '@nexus/shared';

export interface IChatMember {
  user: Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
  mutedUntil?: Date;
}

export interface IChat extends Document {
  _id: Types.ObjectId;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  members: IChatMember[];
  admins: Types.ObjectId[];
  createdBy: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  pinnedBy: { user: Types.ObjectId; at: Date }[];
  archivedBy: Types.ObjectId[];
  mutedBy: { user: Types.ObjectId; until?: Date }[];
  folder?: string;
  wallpaper?: string;
  inviteCode?: string;
  inviteExpires?: Date;
  settings: {
    onlyAdminsCanPost?: boolean;
    disappearingMessages?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    type: { type: String, enum: ['direct', 'group'], required: true },
    name: String,
    description: { type: String, maxlength: 1000 },
    avatar: String,
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        mutedUntil: Date,
      },
    ],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: Date,
    pinnedBy: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, at: Date }],
    archivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mutedBy: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, until: Date }],
    folder: String,
    wallpaper: String,
    inviteCode: String,
    inviteExpires: Date,
    settings: {
      onlyAdminsCanPost: Boolean,
      disappearingMessages: Number,
    },
  },
  { timestamps: true }
);

chatSchema.index({ 'members.user': 1, lastMessageAt: -1 });
chatSchema.index({ type: 1, 'members.user': 1 });

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
