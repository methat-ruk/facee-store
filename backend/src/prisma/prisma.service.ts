import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.cjs';
import { appEnv } from '../config/env';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: appEnv.databaseUrl,
    }),
  });

  get user() {
    return this.client.user;
  }

  get category() {
    return this.client.category;
  }

  get product() {
    return this.client.product;
  }

  get order() {
    return this.client.order;
  }

  get orderItem() {
    return this.client.orderItem;
  }

  $connect() {
    return this.client.$connect();
  }

  $disconnect() {
    return this.client.$disconnect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
