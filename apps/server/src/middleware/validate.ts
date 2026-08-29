import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/apiResponse';

declare module 'express-serve-static-core' {
  interface Request {
    validatedBody?: unknown;
    validatedQuery?: unknown;
  }
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.errors.forEach((e) => {
        const key = e.path.join('.') || 'body';
        errors[key] = errors[key] || [];
        errors[key].push(e.message);
      });
      return sendError(res, 'Validation failed', 422, errors);
    }
    req.validatedBody = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return sendError(res, 'Invalid query parameters', 422);
    }
    req.validatedQuery = result.data;
    next();
  };
}

/** Use after validateBody middleware */
export function getValidatedBody<T>(req: Request): T {
  return (req.validatedBody ?? req.body) as T;
}
