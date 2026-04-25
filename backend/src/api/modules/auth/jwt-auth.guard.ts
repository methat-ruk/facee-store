import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { readCookie } from './auth-cookie';
import {
  AUTH_COOKIE_NAME,
  type AuthTokenPayload,
  type AuthenticatedRequest,
} from './auth.types';

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
      throw new UnauthorizedException('Authentication is required.');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Authentication is invalid.');
    }
  }
}
