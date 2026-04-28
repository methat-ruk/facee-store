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

  get address() {
    return this.client.address;
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

  get orderCancellationRequest() {
    return this.client.orderCancellationRequest;
  }

  $connect() {
    return this.client.$connect();
  }

  $disconnect() {
    return this.client.$disconnect();
  }

  $transaction<T>(
    fn: (
      transaction: Omit<PrismaClient, '$connect' | '$disconnect'>,
    ) => Promise<T>,
  ) {
    return this.client.$transaction(fn);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
