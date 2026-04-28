import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import type { UpdateAccountProfileRequest } from './dto/update-account-profile-request.dto';
import type { UpsertAddressRequest } from './dto/upsert-address-request.dto';

const accountProfileSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
} as const;

const addressSelect = {
  id: true,
  label: true,
  recipientFullName: true,
  recipientEmail: true,
  recipientPhone: true,
  addressLine: true,
  city: true,
  postalCode: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: accountProfileSelect,
    });

    if (!user) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is required.',
      );
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateAccountProfileRequest) {
    const email = input.email.trim().toLowerCase();
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: accountProfileSelect,
    });

    if (!currentUser) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is required.',
      );
    }

    if (email !== currentUser.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new AppException(
          HttpStatus.CONFLICT,
          API_ERROR_CODES.authEmailAlreadyExists,
          'This email is already registered.',
          {
            email: [API_ERROR_CODES.authEmailAlreadyExists],
          },
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName.trim(),
        email,
      },
      select: accountProfileSelect,
    });

    return {
      profile: user,
      token: await this.authService.issueUserToken(user),
    };
  }

  async listAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: addressSelect,
    });

    return {
      items: addresses.map((address) => this.toAddress(address)),
    };
  }

  async createAddress(userId: string, input: UpsertAddressRequest) {
    const existingAddressCount = await this.prisma.address.count({
      where: { userId },
    });
    const shouldBeDefault = existingAddressCount === 0;

    const address = await this.prisma.$transaction(async (transaction) => {
      if (shouldBeDefault) {
        return transaction.address.create({
          data: {
            userId,
            ...this.normalizeAddressInput(input),
            isDefault: true,
          },
          select: addressSelect,
        });
      }

      return transaction.address.create({
        data: {
          userId,
          ...this.normalizeAddressInput(input),
        },
        select: addressSelect,
      });
    });

    return this.toAddress(address);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpsertAddressRequest,
  ) {
    await this.ensureOwnedAddress(userId, addressId);

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: this.normalizeAddressInput(input),
      select: addressSelect,
    });

    return this.toAddress(address);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await this.ensureOwnedAddress(userId, addressId);

    const address = await this.prisma.$transaction(async (transaction) => {
      await transaction.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return transaction.address.update({
        where: { id: addressId },
        data: { isDefault: true },
        select: addressSelect,
      });
    });

    return this.toAddress(address);
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.ensureOwnedAddress(userId, addressId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.address.delete({
        where: { id: addressId },
      });

      if (!address.isDefault) {
        return;
      }

      const nextDefault = await transaction.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (!nextDefault) {
        return;
      }

      await transaction.address.update({
        where: { id: nextDefault.id },
        data: { isDefault: true },
      });
    });

    return { ok: true };
  }

  private async ensureOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
      select: {
        id: true,
        isDefault: true,
      },
    });

    if (!address) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.addressNotFound,
        'The requested address was not found.',
      );
    }

    return address;
  }

  private normalizeAddressInput(input: UpsertAddressRequest) {
    return {
      label: input.label.trim(),
      recipientFullName: input.recipientFullName.trim(),
      recipientEmail: input.recipientEmail.trim().toLowerCase(),
      recipientPhone: input.recipientPhone.trim(),
      addressLine: input.addressLine.trim(),
      city: input.city.trim(),
      postalCode: input.postalCode.trim(),
    };
  }

  private toAddress(address: {
    id: string;
    label: string;
    recipientFullName: string;
    recipientEmail: string;
    recipientPhone: string;
    addressLine: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...address,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }
}
