import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { IUser, User } from '../models/User';
import { sendError } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  authUser?: IUser;
  userId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : cookieToken;

    if (!token) return sendError(res, 'Authentication required', 401);

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);
    if (!user || user.isBanned) return sendError(res, 'Unauthorized', 401);

    req.authUser = user;
    req.userId = String(user._id);
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return sendError(res, 'Forbidden', 403);
    }
    next();
  };
}
