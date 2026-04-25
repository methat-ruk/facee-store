import { INestApplication } from '@nestjs/common';
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

  app.use(helmet());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.setGlobalPrefix(APP_CONSTANTS.apiPrefix);
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
}
