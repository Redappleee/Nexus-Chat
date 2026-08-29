import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';

export function getGoogleCallbackUrl(): string {
  if (env.GOOGLE_CALLBACK_URL) return env.GOOGLE_CALLBACK_URL;
  return `http://localhost:${env.PORT}/api/v1/auth/google/callback`;
}

export function getApiPublicUrl(): string {
  if (process.env.API_PUBLIC_URL) return process.env.API_PUBLIC_URL.replace(/\/$/, '');
  return `http://localhost:${env.PORT}`;
}

export function isGoogleOAuthEnabled(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}

export function configurePassport(): void {
  if (!isGoogleOAuthEnabled()) {
    console.warn(
      '[auth] Google OAuth disabled — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in apps/server/.env'
    );
    return;
  }

  const callbackURL = getGoogleCallbackUrl();
  console.log(`[auth] Google OAuth enabled (callback: ${callbackURL})`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const { User } = await import('../models/User');
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Google account has no email'));

          let user = await User.findOne({ email });
          if (!user) {
            const baseUsername = (profile.displayName || 'user')
              .replace(/[^\w]/g, '_')
              .toLowerCase()
              .slice(0, 20);
            user = await User.create({
              email,
              username: `${baseUsername}_${Date.now().toString(36)}`,
              displayName: profile.displayName || email.split('@')[0],
              avatar: profile.photos?.[0]?.value,
              googleId: profile.id,
              isEmailVerified: true,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
            await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}
