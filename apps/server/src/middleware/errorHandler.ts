import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export function errorHandler(err: Error & { status?: number; code?: number }, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err.status || (err.code === 11000 ? 409 : 500);
  const message =
    status === 500 && env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Something went wrong';
  return sendError(res, message, status);
}
