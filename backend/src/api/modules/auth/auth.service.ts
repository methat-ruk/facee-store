import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
      throw new ConflictException('Email is already registered.');
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
      throw new UnauthorizedException('Email or password is invalid.');
    }

    const isValidPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Email or password is invalid.');
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
      throw new UnauthorizedException('Authentication is invalid.');
    }

    return this.toProfile(user);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private toProfile(user: {
    id: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'CUSTOMER';
  }): AuthProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
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
