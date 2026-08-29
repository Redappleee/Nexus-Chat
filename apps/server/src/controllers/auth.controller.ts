import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody } from '../middleware/validate';
import { env } from '../config/env';
import { getApiPublicUrl, isGoogleOAuthEnabled } from '../config/passport';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await AuthService.register(getValidatedBody(req));
  res.cookie('refreshToken', result.refreshToken, cookieOptions);
  return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 'Registered', 201);
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const body = getValidatedBody<{ email: string; password: string; twoFactorCode?: string }>(req);
    const result = await AuthService.login(body.email, body.password, body.twoFactorCode);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    return sendSuccess(res, { user: result.user, accessToken: result.accessToken });
  } catch (err: unknown) {
    const e = err as Error & { status?: number; code?: string };
    if (e.code === '2FA_REQUIRED') return sendError(res, e.message, 403);
    throw err;
  }
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) return sendError(res, 'Refresh token required', 401);
  const result = await AuthService.refresh(token);
  res.cookie('refreshToken', result.refreshToken, cookieOptions);
  return sendSuccess(res, { user: result.user, accessToken: result.accessToken });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await AuthService.logout(req.userId!, req.cookies?.refreshToken);
  res.clearCookie('refreshToken');
  return sendSuccess(res, null, 'Logged out');
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  return sendSuccess(res, AuthService.sanitizeUser(req.authUser!));
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  await AuthService.verifyEmail(req.query.token as string);
  return sendSuccess(res, null, 'Email verified');
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await AuthService.forgotPassword(getValidatedBody<{ email: string }>(req).email);
  return sendSuccess(res, null, 'If the email exists, a reset link was sent');
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = getValidatedBody<{ token: string; password: string }>(req);
  await AuthService.resetPassword(body.token, body.password);
  return sendSuccess(res, null, 'Password reset successful');
});

export const setup2FA = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AuthService.setup2FA(req.userId!);
  return sendSuccess(res, data);
});

export const enable2FA = asyncHandler(async (req: AuthRequest, res: Response) => {
  await AuthService.enable2FA(req.userId!, req.body.code);
  return sendSuccess(res, null, '2FA enabled');
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  Object.assign(req.authUser!, getValidatedBody(req));
  await req.authUser!.save();
  return sendSuccess(res, AuthService.sanitizeUser(req.authUser!));
});

export const blockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = req.params.userId;
  if (!req.authUser!.blockedUsers.some((b) => String(b) === targetId)) {
    req.authUser!.blockedUsers.push(targetId as never);
    await req.authUser!.save();
  }
  return sendSuccess(res, null, 'User blocked');
});

export const unblockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  req.authUser!.blockedUsers = req.authUser!.blockedUsers.filter((b) => String(b) !== req.params.userId);
  await req.authUser!.save();
  return sendSuccess(res, null, 'User unblocked');
});

export const oauthStatus = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const enabled = isGoogleOAuthEnabled();
  return sendSuccess(res, {
    google: enabled,
    url: enabled ? `${getApiPublicUrl()}/api/v1/auth/google` : null,
    callbackUrl: enabled ? `${getApiPublicUrl()}/api/v1/auth/google/callback` : null,
  });
});

export const googleCallback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user as import('mongoose').HydratedDocument<import('../models/User').IUser>;
  if (!user) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
  }
  const result = await AuthService.issueTokens(user);
  res.redirect(`${env.CLIENT_URL}/auth/callback?token=${result.accessToken}`);
});
