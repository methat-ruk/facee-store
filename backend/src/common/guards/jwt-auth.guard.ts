import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppException } from '../errors/app-exception';
import { API_ERROR_CODES } from '../errors/error-codes';
import { readCookie } from '../../api/modules/auth/auth-cookie';
import {
  AUTH_COOKIE_NAME,
  type AuthenticatedRequest,
  type AuthTokenPayload,
} from '../../api/modules/auth/auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(
      (request as Request).headers.cookie,
      AUTH_COOKIE_NAME,
    );

    if (!token) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is required.',
      );
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
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
