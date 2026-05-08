import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv, parse as parseEnv } from 'dotenv';
import { z } from 'zod';

const envFilePath = resolve(__dirname, '../../.env');

loadEnv({
  path: envFilePath,
});

const envFileValues = parseEnv(readFileSync(envFilePath));

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  BACKEND_PUBLIC_URL: z.url().default('http://localhost:4000'),
  FRONTEND_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),
  MEDIA_LOCAL_DIR: z.string().min(1).default('uploads/products'),
  MEDIA_LOCAL_BASE_PATH: z.string().min(1).default('/uploads/products'),
  MEDIA_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(6),
});

const parsedEnv = envSchema.parse({
  PORT: process.env.PORT,
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DATABASE_URL: envFileValues.DATABASE_URL ?? process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  MEDIA_LOCAL_DIR: process.env.MEDIA_LOCAL_DIR,
  MEDIA_LOCAL_BASE_PATH: process.env.MEDIA_LOCAL_BASE_PATH,
  MEDIA_MAX_FILE_SIZE_MB: process.env.MEDIA_MAX_FILE_SIZE_MB,
});

export const appEnv = {
  port: parsedEnv.PORT,
  backendPublicUrl: parsedEnv.BACKEND_PUBLIC_URL,
  frontendUrl: parsedEnv.FRONTEND_URL,
  databaseUrl: parsedEnv.DATABASE_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  cookieSecret: parsedEnv.COOKIE_SECRET,
  mediaLocalDir: parsedEnv.MEDIA_LOCAL_DIR,
  mediaLocalBasePath: parsedEnv.MEDIA_LOCAL_BASE_PATH,
  mediaMaxFileSizeBytes: Math.round(
    parsedEnv.MEDIA_MAX_FILE_SIZE_MB * 1024 * 1024,
  ),
} as const;
