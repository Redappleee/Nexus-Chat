# Nexus Chat

Production-ready real-time chat application with a premium UI (WhatsApp + Discord + Telegram inspired).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion, Zustand, TanStack Query |
| Backend | Node.js, Express 5, Mongoose, Socket.io |
| Database | MongoDB |
| Auth | JWT, Google OAuth, 2FA (TOTP) |
| Media | Cloudinary (optional local fallback) |
| AI | OpenAI (smart replies, translate, assistant) |
| Calls | WebRTC + Socket.io signaling |

## Project structure

```
nexus-chat/
├── apps/
│   ├── server/     # Express API + Socket.io
│   └── web/        # Next.js frontend
├── packages/
│   └── shared/     # Shared types & socket events
└── package.json    # npm workspaces
```

## Quick start

### Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Install dependencies

```bash
cd ~/Projects/nexus-chat
npm install
npm run build -w @nexus/shared
```

### 2. Environment

Copy root `.env.example` to `apps/server/.env` and adjust `MONGODB_URI`.  
Web defaults are in `apps/web/.env.local`.

### 3. Run development

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:4000  
- Swagger: http://localhost:4000/api/docs  

## Features implemented

- **Auth**: Register, login, refresh tokens, email verify/reset (SMTP stub), Google OAuth, 2FA setup, profile, block/unblock
- **Messaging**: Direct & group chats, real-time Socket.io, typing, read/delivered, reactions, edit/delete, search, pin/archive, media upload
- **Social**: User search, friend requests
- **AI**: Smart replies, translation, in-app assistant
- **Calls**: WebRTC voice/video UI with signaling hooks
- **Admin**: Dashboard, user list, ban, reports (admin/moderator role)

## Deployment

### Frontend (Vercel)

Set environment variables from `apps/web/.env.local.example`.  
Root directory: `apps/web`.

### Backend (Render / Railway)

- Build: `npm run build -w @nexus/shared && npm run build -w @nexus/server`
- Start: `npm run start -w @nexus/server`
- Set all variables from `.env.example`
- Use MongoDB Atlas connection string

### MongoDB Atlas

Create a cluster, allow your IP (or `0.0.0.0/0` for cloud hosts), and set `MONGODB_URI`.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Sign up |
| POST | `/api/v1/auth/login` | Sign in |
| GET | `/api/v1/chats` | List chats |
| POST | `/api/v1/chats/messages` | Send message (REST fallback) |
| POST | `/api/v1/ai/smart-replies` | AI reply suggestions |

Socket events are defined in `@nexus/shared` (`SOCKET_EVENTS`).

## Scripts

```bash
npm run dev          # Server + web concurrently
npm run build        # Build all workspaces
npm run lint         # Lint server + web
```

## Next steps

- Configure Google OAuth, Cloudinary, SMTP, OpenAI, Firebase for full production
- Add Husky, Docker, and integration tests (skipped per minimal setup)
- Enable HTTPS and secure cookie settings in production

## License

MIT
