import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { clearAuthCookie, setAuthCookie } from './auth-cookie';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { AuthProfileResponseDto } from './dto/auth-profile-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthProfileResponseDto> {
    const result = await this.authService.register(body);
    setAuthCookie(response, result.token);

    return result.profile;
  }

  @Post('login')
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthProfileResponseDto> {
    const result = await this.authService.login(body);
    setAuthCookie(response, result.token);

    return result.profile;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    clearAuthCookie(response);

    return {
      ok: true,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthProfileResponseDto> {
    return this.authService.getProfile(request.user.sub);
  }
}
