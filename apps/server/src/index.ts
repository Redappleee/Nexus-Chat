import http from 'http';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { initCloudinary } from './config/cloudinary';
import { initSocket } from './socket';
import { env } from './config/env';

async function bootstrap() {
  initCloudinary();
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.PORT} is already in use. Stop the other process:\n` +
          `  lsof -i :${env.PORT}   # find PID\n` +
          `  kill <PID>\n` +
          `Or set PORT=4001 in apps/server/.env`
      );
      process.exit(1);
    }
    throw err;
  });

  server.listen(env.PORT, () => {
    console.log(`Nexus Chat API running on http://localhost:${env.PORT}`);
    console.log(`Swagger docs: http://localhost:${env.PORT}/api/docs`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
