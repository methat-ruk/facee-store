import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.role !== 'ADMIN') {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        API_ERROR_CODES.authUnauthorized,
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
