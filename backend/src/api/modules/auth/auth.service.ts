import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthProfileResponseDto } from './dto/auth-profile-response.dto';
import type { LoginRequestDto } from './dto/login-request.dto';
import type { RegisterRequestDto } from './dto/register-request.dto';
import type { AuthTokenPayload } from './auth.types';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterRequestDto) {
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

    return {
      profile: this.toProfile(user),
      token: await this.signUserToken(user),
    };
  }

  async login(input: LoginRequestDto) {
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

    return {
      profile: this.toProfile(user),
      token: await this.signUserToken(user),
    };
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

  async getSessionProfile(token: string | null) {
    if (!token) {
      return null;
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      return await this.getProfile(payload.sub);
    } catch {
      return null;
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private toProfile(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    addressLine: string | null;
    city: string | null;
    postalCode: string | null;
    role: 'ADMIN' | 'CUSTOMER';
  }): AuthProfileResponseDto {
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

  private async signUserToken(user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'CUSTOMER';
  }) {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }
}
