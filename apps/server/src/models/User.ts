import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserStatus } from '@nexus/shared';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  username: string;
  displayName: string;
  password?: string;
  avatar?: string;
  bio?: string;
  googleId?: string;
  status: UserStatus;
  lastSeen: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  blockedUsers: Types.ObjectId[];
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
  };
  refreshTokens: string[];
  role: 'user' | 'admin' | 'moderator';
  isBanned: boolean;
  fcmTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    displayName: { type: String, required: true, trim: true },
    password: { type: String, select: false, minlength: 8 },
    avatar: String,
    bio: { type: String, maxlength: 500 },
    googleId: { type: String, sparse: true, unique: true },
    status: { type: String, enum: ['online', 'offline', 'away', 'busy'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    privacy: {
      lastSeen: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      profilePhoto: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      readReceipts: { type: Boolean, default: true },
    },
    refreshTokens: [{ type: String, select: false }],
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    fcmTokens: [String],
  },
  { timestamps: true }
);

userSchema.index({ username: 'text', displayName: 'text', email: 'text' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
