import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './auth.types';
import { AuthService } from './auth.service';
import { AuthProfileResponseDto } from './dto/auth-profile-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { LogoutRequestDto } from './dto/logout-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(body);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    return this.authService.refresh(body);
  }

  @Post('logout')
  logout(@Body() body: LogoutRequestDto) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthProfileResponseDto> {
    return this.authService.getProfile(request.user.sub);
  }
}
