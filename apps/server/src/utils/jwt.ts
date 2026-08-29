import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Types } from 'mongoose';

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(userId: Types.ObjectId | string, role: string): string {
  return jwt.sign({ userId: String(userId), role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: Types.ObjectId | string, role: string): string {
  return jwt.sign({ userId: String(userId), role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
