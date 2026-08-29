import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('[database] MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[database] MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[database] MongoDB disconnected. Reconnecting...');
  });

  let uri = env.MONGODB_URI;
  if (uri.includes('.mongodb.net/?')) {
    uri = uri.replace('.mongodb.net/?', '.mongodb.net/nexus-chat?');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    autoIndex: true,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
