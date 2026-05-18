import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../errors/app-exception';
import { API_ERROR_CODES } from '../errors/error-codes';
import { appEnv } from '../../config/env';
import {
  type AuthenticatedRequest,
  type AuthTokenPayload,
} from '../../api/modules/auth/auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;
    const [scheme, token] = authorizationHeader?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is required.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret: appEnv.jwtAccessSecret,
        },
      );

      if (payload.type !== 'access') {
        throw new Error('Invalid token type.');
      }

      request.user = payload;
      return true;
    } catch {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is invalid.',
      );
    }
  }
}
