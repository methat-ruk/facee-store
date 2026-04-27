import { Body, Controller, Get, Req, Post, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { clearAuthCookie, readCookie, setAuthCookie } from './auth-cookie';
import { AuthService } from './auth.service';
import { AuthProfileResponseDto } from './dto/auth-profile-response.dto';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { AUTH_COOKIE_NAME } from './auth.types';

function applyNoStore(response: Response) {
  response.setHeader(
    'Cache-Control',
    'private, no-store, no-cache, max-age=0, must-revalidate',
  );
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');
  response.setHeader('Vary', 'Cookie');
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthProfileResponseDto> {
    applyNoStore(response);
    const result = await this.authService.register(body);
    setAuthCookie(response, result.token);

    return result.profile;
  }

  @Post('login')
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthProfileResponseDto> {
    applyNoStore(response);
    const result = await this.authService.login(body);
    setAuthCookie(response, result.token);

    return result.profile;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    applyNoStore(response);
    clearAuthCookie(response);

    return {
      ok: true,
    };
  }

  @Get('profile')
  async profile(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    applyNoStore(response);
    const token = readCookie(request.headers.cookie, AUTH_COOKIE_NAME);
    const user = await this.authService.getSessionProfile(token);

    if (!user) {
      if (token) {
        clearAuthCookie(response);
      }

      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user,
    };
  }
}
