import { Response } from 'express';
import type { ApiResponse, PaginatedResponse, PaginationMeta } from '@nexus/shared';

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(status).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string
) {
  const body: PaginatedResponse<T> = { success: true, data, meta, message };
  return res.status(200).json(body);
}

export function sendError(res: Response, message: string, status = 400, errors?: Record<string, string[]>) {
  const body: ApiResponse = { success: false, message, errors };
  return res.status(status).json(body);
}
