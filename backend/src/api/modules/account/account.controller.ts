import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { setAuthCookie } from '../auth/auth-cookie';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountService } from './account.service';
import { AccountProfileDto } from './dto/account-profile.dto';
import { AddressDto, AddressListResponseDto } from './dto/address.dto';
import { AddressParamDto } from './dto/address-param.dto';
import { UpdateAccountProfileRequestDto } from './dto/update-account-profile-request.dto';
import { UpsertAddressRequestDto } from './dto/upsert-address-request.dto';

function applyNoStore(response: Response) {
  response.setHeader(
    'Cache-Control',
    'private, no-store, no-cache, max-age=0, must-revalidate',
  );
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');
  response.setHeader('Vary', 'Cookie');
}

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  getProfile(@Req() request: AuthenticatedRequest): Promise<AccountProfileDto> {
    return this.accountService.getProfile(request.user.sub);
  }

  @Patch('profile')
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateAccountProfileRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccountProfileDto> {
    applyNoStore(response);
    const result = await this.accountService.updateProfile(
      request.user.sub,
      body,
    );
    setAuthCookie(response, result.token);

    return result.profile;
  }

  @Get('addresses')
  listAddresses(
    @Req() request: AuthenticatedRequest,
  ): Promise<AddressListResponseDto> {
    return this.accountService.listAddresses(request.user.sub);
  }

  @Post('addresses')
  createAddress(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpsertAddressRequestDto,
  ): Promise<AddressDto> {
    return this.accountService.createAddress(request.user.sub, body);
  }

  @Patch('addresses/:addressId')
  updateAddress(
    @Req() request: AuthenticatedRequest,
    @Param() params: AddressParamDto,
    @Body() body: UpsertAddressRequestDto,
  ): Promise<AddressDto> {
    return this.accountService.updateAddress(
      request.user.sub,
      params.addressId,
      body,
    );
  }

  @Post('addresses/:addressId/default')
  setDefaultAddress(
    @Req() request: AuthenticatedRequest,
    @Param() params: AddressParamDto,
  ): Promise<AddressDto> {
    return this.accountService.setDefaultAddress(
      request.user.sub,
      params.addressId,
    );
  }

  @Delete('addresses/:addressId')
  deleteAddress(
    @Req() request: AuthenticatedRequest,
    @Param() params: AddressParamDto,
  ) {
    return this.accountService.deleteAddress(
      request.user.sub,
      params.addressId,
    );
  }
}
