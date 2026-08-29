import path from 'path';
import { z } from 'zod';
import dotenv from 'dotenv';

const serverRoot = path.resolve(__dirname, '../..');
const monorepoRoot = path.resolve(serverRoot, '../..');

// Load shared env first, then apps/server/.env overrides
for (const envPath of [
  path.join(monorepoRoot, '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'apps/server/.env'),
]) {
  dotenv.config({ path: envPath });
}

dotenv.config({
  path: path.join(serverRoot, '.env'),
  override: true,
});

if (process.env.ENV_PATH) {
  dotenv.config({
    path: process.env.ENV_PATH,
    override: true,
  });
}

function cleanProcessEnv() {
  const copy = { ...process.env };

  const optionalKeys = [
    'ENCRYPTION_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'AI_PROVIDER',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM',
  ];

  for (const key of optionalKeys) {
    if (copy[key] !== undefined && String(copy[key]).trim() === '') {
      delete copy[key];
    }
  }

  // Normalize CLIENT_URL
  if (copy.CLIENT_URL) {
    copy.CLIENT_URL = String(copy.CLIENT_URL).trim();
    if (copy.CLIENT_URL && !copy.CLIENT_URL.startsWith('http://') && !copy.CLIENT_URL.startsWith('https://')) {
      copy.CLIENT_URL = `https://${copy.CLIENT_URL}`;
    }
  }

  // Normalize GOOGLE_CALLBACK_URL
  if (copy.GOOGLE_CALLBACK_URL && !String(copy.GOOGLE_CALLBACK_URL).startsWith('http')) {
    delete copy.GOOGLE_CALLBACK_URL;
  }

  // Provide fallback for JWT secrets if missing
  if (!copy.JWT_ACCESS_SECRET || String(copy.JWT_ACCESS_SECRET).length < 16) {
    copy.JWT_ACCESS_SECRET = 'nexus_access_secret_production_key_40cba93b449b2d05ba6a8fe5bbb';
  }
  if (!copy.JWT_REFRESH_SECRET || String(copy.JWT_REFRESH_SECRET).length < 16) {
    copy.JWT_REFRESH_SECRET = 'nexus_refresh_secret_production_key_27c305263cd854c53cd82741ce';
  }

  if (copy.ENCRYPTION_KEY && String(copy.ENCRYPTION_KEY).length < 32) {
    delete copy.ENCRYPTION_KEY;
  }

  return copy;
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().default(4000),

  CLIENT_URL: z
    .string()
    .default('http://localhost:3000'),

  MONGODB_URI: z
    .string()
    .default('mongodb+srv://raiyanzuberi5586_db_user:MwlLf2ijC1wJXd21@nexus-chat.odyoou3.mongodb.net/?appName=nexus-chat'),

  JWT_ACCESS_SECRET: z.string().default('nexus_access_secret_production_key_40cba93b449b2d05ba6a8fe5bbb'),
  JWT_REFRESH_SECRET: z.string().default('nexus_refresh_secret_production_key_27c305263cd854c53cd82741ce'),

  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // AI
  AI_PROVIDER: z
    .enum(['openai', 'gemini'])
    .default('gemini'),

  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32).optional(),
});

const parsed = envSchema.safeParse(cleanProcessEnv());

if (!parsed.success) {
  console.warn(
    'Warning: Environment validation issues:',
    parsed.error.flatten().fieldErrors
  );
}

export const env = parsed.success
  ? parsed.data
  : ({
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: Number(process.env.PORT) || 4000,
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://raiyanzuberi5586_db_user:MwlLf2ijC1wJXd21@nexus-chat.odyoou3.mongodb.net/?appName=nexus-chat',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'nexus_access_secret_production_key_40cba93b449b2d05ba6a8fe5bbb',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'nexus_refresh_secret_production_key_27c305263cd854c53cd82741ce',
      JWT_ACCESS_EXPIRES: '15m',
      JWT_REFRESH_EXPIRES: '7d',
      AI_PROVIDER: 'gemini',
    } as z.infer<typeof envSchema>);