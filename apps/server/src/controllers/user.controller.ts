import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { FriendRequest } from '../models/FriendRequest';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string) || '';
  const users = await User.find({
    _id: { $ne: req.userId },
    isBanned: false,
    $or: [
      { username: new RegExp(q, 'i') },
      { displayName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ],
  })
    .limit(20)
    .select('username displayName avatar status lastSeen bio');
  return sendSuccess(res, users);
});

export const sendFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const to = req.body.userId;
  if (to === req.userId) throw Object.assign(new Error('Cannot friend yourself'), { status: 400 });
  const existing = await FriendRequest.findOne({
    $or: [
      { from: req.userId, to },
      { from: to, to: req.userId },
    ],
    status: 'pending',
  });
  if (existing) throw Object.assign(new Error('Request already pending'), { status: 409 });
  const request = await FriendRequest.create({ from: req.userId, to });
  return sendSuccess(res, request, undefined, 201);
});

export const respondFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await FriendRequest.findOne({ _id: req.params.id, to: req.userId });
  if (!request) throw Object.assign(new Error('Request not found'), { status: 404 });
  request.status = req.body.accept ? 'accepted' : 'rejected';
  await request.save();
  return sendSuccess(res, request);
});

export const listFriendRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requests = await FriendRequest.find({ to: req.userId, status: 'pending' }).populate(
    'from',
    'username displayName avatar'
  );
  return sendSuccess(res, requests);
});
