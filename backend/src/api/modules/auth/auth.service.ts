import { createHash } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { appEnv } from '../../../config/env';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthProfileResponseDto } from './dto/auth-profile-response.dto';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginRequestDto } from './dto/login-request.dto';
import type { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import type { RegisterRequestDto } from './dto/register-request.dto';
import type { RefreshTokenPayload } from './auth.types';

const PASSWORD_SALT_ROUNDS = 12;

type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  role: 'ADMIN' | 'CUSTOMER';
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterRequestDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(input.email);
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new AppException(
        HttpStatus.CONFLICT,
        API_ERROR_CODES.authEmailAlreadyExists,
        'This email is already registered.',
        {
          email: [API_ERROR_CODES.authEmailAlreadyExists],
        },
      );
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      PASSWORD_SALT_ROUNDS,
    );
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        passwordHash,
      },
    });

    return this.createAuthResponse(user);
  }

  async login(input: LoginRequestDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user?.passwordHash) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authInvalidCredentials,
        'Email or password is invalid.',
        {
          email: [API_ERROR_CODES.authInvalidCredentials],
          password: [API_ERROR_CODES.authInvalidCredentials],
        },
      );
    }

    const isValidPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authInvalidCredentials,
        'Email or password is invalid.',
        {
          email: [API_ERROR_CODES.authInvalidCredentials],
          password: [API_ERROR_CODES.authInvalidCredentials],
        },
      );
    }

    return this.createAuthResponse(user);
  }

  async refresh(input: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const session = await this.validateRefreshToken(input.refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is invalid.',
      );
    }

    const tokens = await this.rotateSession(session.id, user);

    return {
      user: this.toProfile(user),
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: appEnv.jwtRefreshSecret,
        },
      );

      if (payload.type !== 'refresh') {
        return { ok: true } as const;
      }

      await this.prisma.authSession.updateMany({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      return { ok: true } as const;
    }

    return { ok: true } as const;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is invalid.',
      );
    }

    return this.toProfile(user);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createAuthResponse(
    user: SessionUser,
  ): Promise<AuthResponseDto> {
    const tokens = await this.createSessionTokens(user);

    return {
      user: this.toProfile(user),
      ...tokens,
    };
  }

  private toProfile(user: SessionUser): AuthProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      addressLine: user.addressLine,
      city: user.city,
      postalCode: user.postalCode,
      role: user.role,
    };
  }

  private async createSessionTokens(user: SessionUser): Promise<TokenPair> {
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash: '',
        expiresAt: this.createRefreshExpiryDate(),
      },
      select: {
        id: true,
      },
    });

    const tokens = await this.buildTokenPair(user, session.id);

    await this.prisma.authSession.update({
      where: {
        id: session.id,
      },
      data: {
        tokenHash: this.hashToken(tokens.refreshToken),
        expiresAt: new Date(tokens.refreshTokenExpiresAt),
        lastUsedAt: new Date(),
      },
    });

    return tokens;
  }

  private async rotateSession(
    sessionId: string,
    user: SessionUser,
  ): Promise<TokenPair> {
    const tokens = await this.buildTokenPair(user, sessionId);

    await this.prisma.authSession.update({
      where: {
        id: sessionId,
      },
      data: {
        tokenHash: this.hashToken(tokens.refreshToken),
        expiresAt: new Date(tokens.refreshTokenExpiresAt),
        lastUsedAt: new Date(),
      },
    });

    return tokens;
  }

  private async buildTokenPair(
    user: SessionUser,
    sessionId: string,
  ): Promise<TokenPair> {
    const accessTokenExpiresAt = this.createAccessExpiryDate();
    const refreshTokenExpiresAt = this.createRefreshExpiryDate();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: appEnv.jwtAccessSecret,
          expiresIn: `${appEnv.jwtAccessTtlMinutes}m`,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          sessionId,
          type: 'refresh',
        },
        {
          secret: appEnv.jwtRefreshSecret,
          expiresIn: `${appEnv.jwtRefreshTtlDays}d`,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
    };
  }

  private async validateRefreshToken(refreshToken: string) {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: appEnv.jwtRefreshSecret,
        },
      );
    } catch {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is invalid.',
      );
    }

    if (payload.type !== 'refresh') {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is invalid.',
      );
    }

    const session = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        revokedAt: null,
      },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
      },
    });

    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      session.tokenHash !== this.hashToken(refreshToken)
    ) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is invalid.',
      );
    }

    return session;
  }

  private createAccessExpiryDate() {
    return new Date(Date.now() + appEnv.jwtAccessTtlMinutes * 60 * 1000);
  }

  private createRefreshExpiryDate() {
    return new Date(
      Date.now() + appEnv.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
    );
  }
}
