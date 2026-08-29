import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { ensureGoogleOAuth, googleLogin, googleCallbackHandler } from '../middleware/googleAuth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validateBody(registerSchema), auth.register);
router.post('/login', validateBody(loginSchema), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, auth.me);
router.get('/verify-email', auth.verifyEmail);
router.post('/forgot-password', validateBody(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), auth.resetPassword);
router.post('/2fa/setup', authenticate, auth.setup2FA);
router.post('/2fa/enable', authenticate, auth.enable2FA);
router.patch('/profile', authenticate, validateBody(updateProfileSchema), auth.updateProfile);
router.post('/block/:userId', authenticate, auth.blockUser);
router.post('/unblock/:userId', authenticate, auth.unblockUser);

router.get('/oauth/status', auth.oauthStatus);
router.get('/google', ensureGoogleOAuth, googleLogin);
router.get('/google/callback', ensureGoogleOAuth, googleCallbackHandler, auth.googleCallback);

export default router;
