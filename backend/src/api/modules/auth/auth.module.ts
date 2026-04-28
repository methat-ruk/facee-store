import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { appEnv } from '../../../config/env';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminRoleGuard } from './admin-role.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: appEnv.jwtSecret ?? 'facee-dev-jwt-secret',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AdminRoleGuard],
  exports: [AuthService, JwtAuthGuard, AdminRoleGuard, JwtModule],
})
export class AuthModule {}
