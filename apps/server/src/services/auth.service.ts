import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateToken, hashToken } from '../utils/crypto';
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } from './email.service';
import { env } from '../config/env';

export class AuthService {
  static sanitizeUser(user: { toObject: () => Record<string, unknown> }) {
    const obj = user.toObject();
    delete obj.password;
    delete obj.refreshTokens;
    delete obj.twoFactorSecret;
    delete obj.emailVerificationToken;
    delete obj.passwordResetToken;
    return obj;
  }

  static async register(data: { email: string; username: string; displayName: string; password: string }) {
    const exists = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
    if (exists) throw Object.assign(new Error('Email or username already in use'), { status: 409 });

    const verificationToken = generateToken();
    const user = await User.create({
      ...data,
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const link = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail(user.email, 'Verify your Nexus Chat account', verificationEmailHtml(link));

    return this.issueTokens(user);
  }

  static async login(email: string, password: string, twoFactorCode?: string) {
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    if (!user || !(await user.comparePassword(password))) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    if (user.isBanned) throw Object.assign(new Error('Account suspended'), { status: 403 });

    if (user.twoFactorEnabled) {
      if (!twoFactorCode || !user.twoFactorSecret) {
        throw Object.assign(new Error('Two-factor code required'), { status: 403, code: '2FA_REQUIRED' });
      }
      const valid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1,
      });
      if (!valid) throw Object.assign(new Error('Invalid two-factor code'), { status: 401 });
    }

    return this.issueTokens(user);
  }

  static async issueTokens(user: InstanceType<typeof User> | import('../models/User').IUser) {
    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id, user.role);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save();
    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens?.includes(refreshToken)) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
    return this.issueTokens(user);
  }

  static async logout(userId: string, refreshToken?: string) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens?.filter((t) => t !== refreshToken) || [];
    } else {
      user.refreshTokens = [];
    }
    await user.save();
  }

  static async verifyEmail(token: string) {
    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) throw Object.assign(new Error('Invalid or expired token'), { status: 400 });
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    return user;
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) return;
    const token = generateToken();
    user.passwordResetToken = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail(user.email, 'Reset your password', resetPasswordEmailHtml(link));
  }

  static async resetPassword(token: string, password: string) {
    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');
    if (!user) throw Object.assign(new Error('Invalid or expired token'), { status: 400 });
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return user;
  }

  static async setup2FA(userId: string) {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const secret = speakeasy.generateSecret({ name: `Nexus Chat (${user.email})` });
    user.twoFactorSecret = secret.base32;
    await user.save();
    const qr = await qrcode.toDataURL(secret.otpauth_url || '');
    return { secret: secret.base32, qr };
  }

  static async enable2FA(userId: string, code: string) {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user?.twoFactorSecret) throw Object.assign(new Error('Setup 2FA first'), { status: 400 });
    const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code, window: 1 });
    if (!valid) throw Object.assign(new Error('Invalid code'), { status: 400 });
    user.twoFactorEnabled = true;
    await user.save();
    return user;
  }
}
