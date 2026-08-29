import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clean: xssClean } = require('xss-clean/lib/xss') as { clean: (data: unknown) => unknown };

/**
 * Express 5 makes req.query / req.params read-only getters.
 * Do NOT use express-mongo-sanitize or xss-clean middleware — they reassign them and crash.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = xssClean(mongoSanitize.sanitize(req.body));
  }
  next();
}
