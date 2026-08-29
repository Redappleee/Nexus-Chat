import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Report } from '../models/Report';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const dashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [users, chats, messages, reports] = await Promise.all([
    User.countDocuments(),
    Chat.countDocuments(),
    Message.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
  ]);
  return sendSuccess(res, { users, chats, messages, pendingReports: reports });
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await User.find()
    .limit(Number(req.query.limit) || 50)
    .select('email username displayName role isBanned status createdAt');
  return sendSuccess(res, users);
});

export const banUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { isBanned: true }, { new: true });
  return sendSuccess(res, user);
});

export const listReports = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const reports = await Report.find({ status: 'pending' })
    .populate('reporter', 'username')
    .populate('reportedUser', 'username')
    .limit(100);
  return sendSuccess(res, reports);
});
