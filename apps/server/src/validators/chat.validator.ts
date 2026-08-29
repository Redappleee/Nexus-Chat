import { z } from 'zod';

export const createDirectChatSchema = z.object({ userId: z.string().min(1) });

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  memberIds: z.array(z.string()).min(1),
});

export const sendMessageSchema = z.object({
  chatId: z.string().min(1),
  type: z.enum(['text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'poll']).default('text'),
  content: z.string().max(10000).optional(),
  media: z
    .object({
      url: z.string(),
      publicId: z.string().optional(),
      mimeType: z.string().optional(),
    })
    .optional(),
  replyTo: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  encrypted: z.boolean().optional(),
  poll: z
    .object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(10),
      multiple: z.boolean().optional(),
    })
    .optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(30),
});
