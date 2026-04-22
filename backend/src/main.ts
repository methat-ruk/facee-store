import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_CONSTANTS } from './config/app.constants';
import { appEnv } from './config/env';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app, appEnv);
  await app.listen(appEnv.port);
  Logger.log(
    `${APP_CONSTANTS.serviceName} is running at http://localhost:${appEnv.port}/${APP_CONSTANTS.apiPrefix}/health`,
    'Bootstrap',
  );
}

void bootstrap();
