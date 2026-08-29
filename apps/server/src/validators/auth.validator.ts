import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().length(6).optional(),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatar: z.string().optional(),
  status: z.enum(['online', 'offline', 'away', 'busy']).optional(),
  privacy: z
    .object({
      lastSeen: z.enum(['everyone', 'contacts', 'nobody']).optional(),
      profilePhoto: z.enum(['everyone', 'contacts', 'nobody']).optional(),
      readReceipts: z.boolean().optional(),
    })
    .optional(),
});
