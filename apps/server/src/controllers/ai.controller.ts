import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/ai.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const smartReplies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const replies = await AIService.smartReplies(req.body.messages || []);
  return sendSuccess(res, replies);
});

export const translate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const text = await AIService.translate(req.body.text, req.body.targetLang || 'en');
  return sendSuccess(res, { translation: text });
});

export const assistant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reply = await AIService.chatAssistant(req.body.message, req.body.history || []);
  return sendSuccess(res, { reply });
});
