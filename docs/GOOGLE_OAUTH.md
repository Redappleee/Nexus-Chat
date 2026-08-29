# Google OAuth setup for Nexus Chat

## 1. Create Google Cloud credentials

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create a project (or pick an existing one).
3. **OAuth consent screen** → External → fill app name, support email, developer email → Save.
4. **Create credentials** → **OAuth client ID** → Application type: **Web application**.
5. Add **Authorized redirect URIs** (must match exactly):

   ```
   http://localhost:4000/api/v1/auth/google/callback
   ```

   For production, also add:

   ```
   https://YOUR-API-DOMAIN/api/v1/auth/google/callback
   ```

6. Copy the **Client ID** and **Client secret**.

## 2. Configure the API (`apps/server/.env`)

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback
```

`GOOGLE_CALLBACK_URL` is optional in dev — it defaults to `http://localhost:{PORT}/api/v1/auth/google/callback`.

## 3. Restart the server

```bash
npm run dev
```

You should see in the server log:

```
[auth] Google OAuth enabled (callback: http://localhost:4000/api/v1/auth/google/callback)
```

## 4. Test

1. Open http://localhost:3001/login
2. Click **Continue with Google**
3. After Google approves, you are redirected to `/auth/callback` and then `/chat`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Unknown authentication strategy "google"` | Missing env vars or server not restarted |
| `redirect_uri_mismatch` | Redirect URI in Google Console must match `GOOGLE_CALLBACK_URL` exactly |
| Button says "not configured" | Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/server/.env` |
| 503 on `/auth/google` | Same as above |

Check status: `GET http://localhost:4000/api/v1/auth/oauth/status`
