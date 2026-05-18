import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { appEnv } from '../config/env';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: appEnv.databaseUrl,
      }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
