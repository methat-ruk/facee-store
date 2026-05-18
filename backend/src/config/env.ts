import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv, parse as parseEnv } from 'dotenv';
import { z } from 'zod';

const envFilePath = resolve(__dirname, '../../.env');

if (existsSync(envFilePath)) {
  loadEnv({
    path: envFilePath,
  });
}

const envFileValues = existsSync(envFilePath)
  ? parseEnv(readFileSync(envFilePath))
  : {};

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  BACKEND_PUBLIC_URL: z.url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().default('facee-dev-access-secret'),
  JWT_REFRESH_SECRET: z.string().default('facee-dev-refresh-secret'),
  JWT_ACCESS_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  MEDIA_LOCAL_DIR: z.string().min(1).default('uploads/products'),
  MEDIA_LOCAL_BASE_PATH: z.string().min(1).default('/uploads/products'),
  MEDIA_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(6),
});

const parsedEnv = envSchema.parse({
  PORT: process.env.PORT,
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL,
  DATABASE_URL: envFileValues.DATABASE_URL ?? process.env.DATABASE_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET,
  JWT_ACCESS_TTL_MINUTES: process.env.JWT_ACCESS_TTL_MINUTES,
  JWT_REFRESH_TTL_DAYS: process.env.JWT_REFRESH_TTL_DAYS,
  MEDIA_LOCAL_DIR: process.env.MEDIA_LOCAL_DIR,
  MEDIA_LOCAL_BASE_PATH: process.env.MEDIA_LOCAL_BASE_PATH,
  MEDIA_MAX_FILE_SIZE_MB: process.env.MEDIA_MAX_FILE_SIZE_MB,
});

export const appEnv = {
  port: parsedEnv.PORT,
  backendPublicUrl: parsedEnv.BACKEND_PUBLIC_URL,
  corsOrigins: parsedEnv.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: parsedEnv.DATABASE_URL,
  jwtAccessSecret: parsedEnv.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsedEnv.JWT_REFRESH_SECRET,
  jwtAccessTtlMinutes: parsedEnv.JWT_ACCESS_TTL_MINUTES,
  jwtRefreshTtlDays: parsedEnv.JWT_REFRESH_TTL_DAYS,
  mediaLocalDir: parsedEnv.MEDIA_LOCAL_DIR,
  mediaLocalBasePath: parsedEnv.MEDIA_LOCAL_BASE_PATH,
  mediaMaxFileSizeBytes: Math.round(
    parsedEnv.MEDIA_MAX_FILE_SIZE_MB * 1024 * 1024,
  ),
} as const;
