import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client.cjs';
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

  get savedPaymentMethod() {
    return this.client.savedPaymentMethod;
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

  get notification() {
    return this.client.notification;
  }

  $connect() {
    return this.client.$connect();
  }

  $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ) {
    if (Array.isArray(query)) {
      return this.client.$queryRaw<T>(query, ...values);
    }

    return this.client.$queryRaw<T>(query);
  }

  $executeRaw(query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) {
    if (Array.isArray(query)) {
      return this.client.$executeRaw(query, ...values);
    }

    return this.client.$executeRaw(query);
  }

  $disconnect() {
    return this.client.$disconnect();
  }

  $transaction<T>(
    fn: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction((transaction) => fn(transaction));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
