import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.parse({
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_SECRET: process.env.COOKIE_SECRET,
});

export const appEnv = {
  port: parsedEnv.PORT,
  frontendUrl: parsedEnv.FRONTEND_URL,
  databaseUrl: parsedEnv.DATABASE_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  cookieSecret: parsedEnv.COOKIE_SECRET,
} as const;
