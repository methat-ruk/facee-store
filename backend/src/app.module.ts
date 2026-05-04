import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccountModule } from './api/modules/account/account.module';
import { AuthModule } from './api/modules/auth/auth.module';
import { CategoriesModule } from './api/modules/categories/categories.module';
import { HealthModule } from './api/modules/health/health.module';
import { NotificationsModule } from './api/modules/notifications/notifications.module';
import { OrdersModule } from './api/modules/orders/orders.module';
import { ProductsModule } from './api/modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 20,
      },
    ]),
    PrismaModule,
    AccountModule,
    AuthModule,
    CategoriesModule,
    HealthModule,
    NotificationsModule,
    OrdersModule,
    ProductsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
