import http from 'http';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { initCloudinary } from './config/cloudinary';
import { initSocket } from './socket';
import { env } from './config/env';

async function bootstrap() {
  console.log(`[bootstrap] Starting Nexus Chat API in ${env.NODE_ENV} mode...`);

  try {
    initCloudinary();
  } catch (e) {
    console.warn('[cloudinary] Init warning:', e);
  }

  try {
    await connectDatabase();
    console.log('[database] MongoDB connected successfully');
  } catch (e) {
    console.error('[database] MongoDB connection error:', e);
    // Don't crash immediately if MongoDB is momentarily connecting
  }

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${env.PORT} is already in use.`);
      process.exit(1);
    }
    console.error('[server] Unexpected server error:', err);
    throw err;
  });

  const port = Number(process.env.PORT) || env.PORT || 4000;

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Nexus Chat API listening on http://0.0.0.0:${port}`);
    console.log(`📡 Client origin: ${env.CLIENT_URL}`);
  });
}

bootstrap().catch((err) => {
  console.error('[bootstrap] Failed to start server:', err);
  process.exit(1);
});
