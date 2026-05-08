import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCustomersService } from './admin-customers.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [AuthModule],
  controllers: [AccountController, AdminCustomersController],
  providers: [AccountService, AdminCustomersService],
})
export class AccountModule {}
