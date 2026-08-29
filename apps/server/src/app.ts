import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { sanitizeInput } from './middleware/sanitize';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import mongoose from 'mongoose';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { configurePassport } from './config/passport';

export function createApp() {
  const app = express();

  configurePassport();
  app.use(passport.initialize());

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl) or any localhost/vercel domain
        if (!origin || origin === env.CLIENT_URL || origin.includes('localhost') || origin.includes('vercel.app')) {
          callback(null, true);
        } else {
          callback(null, true); // Fallback to allow connection for dev/preview environments
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'Nexus Chat API', version: '1.0.0' },
      servers: [{ url: `/api/v1` }],
    },
    apis: ['./src/routes/*.ts'],
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/', (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    res.json({
      name: 'Nexus Chat API',
      status: 'online',
      database: dbStatusMap[dbState] || 'unknown',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
      api: '/api/v1',
    });
  });

  app.get('/health', (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const isDbReady = dbState === 1;
    res.status(isDbReady ? 200 : 503).json({
      status: isDbReady ? 'ok' : 'database_unavailable',
      databaseState: dbState,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1', routes);
  app.use(errorHandler);

  return app;
}
