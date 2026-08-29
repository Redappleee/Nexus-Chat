import { Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import { isGoogleOAuthEnabled } from '../config/passport';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

const SETUP_MESSAGE =
  'Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to apps/server/.env. ' +
  'Create credentials at https://console.cloud.google.com/apis/credentials';

export function ensureGoogleOAuth(req: Request, res: Response, next: NextFunction) {
  if (!isGoogleOAuthEnabled()) {
    return sendError(res, SETUP_MESSAGE, 503);
  }
  next();
}

export const googleLogin: RequestHandler = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next);
};

export const googleCallbackHandler: RequestHandler = (req, res, next) => {
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=google_auth_failed`,
  })(req, res, next);
};
