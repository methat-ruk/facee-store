import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiExceptionFilter } from './common/errors/api-exception-filter';
import { APP_CONSTANTS } from './config/app.constants';
import { appEnv } from './config/env';

export function setupApp(app: INestApplication, env: typeof appEnv = appEnv) {
  const allowedOrigins = env.frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const uploadDirectory = resolve(process.cwd(), env.mediaLocalDir);

  if (!existsSync(uploadDirectory)) {
    mkdirSync(uploadDirectory, { recursive: true });
  }

  app.use(
    env.mediaLocalBasePath,
    express.static(uploadDirectory, {
      fallthrough: false,
      setHeaders: (response) => {
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );

  app.setGlobalPrefix(APP_CONSTANTS.apiPrefix);
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
}
