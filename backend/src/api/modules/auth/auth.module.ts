import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { appEnv } from '../../../config/env';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

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
