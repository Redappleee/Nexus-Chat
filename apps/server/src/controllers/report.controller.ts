import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Report } from '../models/Report';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await Report.create({
    reporter: req.userId,
    reportedUser: req.body.userId,
    reportedMessage: req.body.messageId,
    reason: req.body.reason || 'Unspecified',
  });
  return sendSuccess(res, report, undefined, 201);
});
