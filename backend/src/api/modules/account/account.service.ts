import { HttpStatus, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import type { UpdateAccountProfileRequest } from './dto/update-account-profile-request.dto';
import type { UpsertAddressRequest } from './dto/upsert-address-request.dto';
import type { UpsertPaymentMethodRequest } from './dto/upsert-payment-method-request.dto';
import { addressListResponseSchema, addressSchema } from './dto/address.dto';
import {
  savedPaymentMethodListResponseSchema,
  savedPaymentMethodSchema,
} from './dto/payment-method.dto';

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

const paymentMethodSelect = {
  id: true,
  type: true,
  label: true,
  isDefault: true,
  cardholderName: true,
  cardLast4: true,
  cardExpiryMonth: true,
  cardExpiryYear: true,
  bankName: true,
  createdAt: true,
  updatedAt: true,
} as const;

type AddressDtoShape = z.infer<typeof addressSchema>;
type AddressListResponseDtoShape = z.infer<typeof addressListResponseSchema>;
type AddressRecord = Omit<AddressDtoShape, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

type SavedPaymentMethodDtoShape = z.infer<typeof savedPaymentMethodSchema>;
type SavedPaymentMethodListResponseDtoShape = z.infer<
  typeof savedPaymentMethodListResponseSchema
>;
type SavedPaymentMethodRecord = Omit<
  SavedPaymentMethodDtoShape,
  'createdAt' | 'updatedAt'
> & {
  createdAt: Date;
  updatedAt: Date;
};

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

  async listAddresses(userId: string): Promise<AddressListResponseDtoShape> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: addressSelect,
    });

    return {
      items: addresses.map((address) => this.toAddress(address)),
    };
  }

  async createAddress(
    userId: string,
    input: UpsertAddressRequest,
  ): Promise<AddressDtoShape> {
    const existingAddressCount = await this.prisma.address.count({
      where: { userId },
    });
    const shouldBeDefault = existingAddressCount === 0;

    const address: AddressRecord = await this.prisma.$transaction(
      async (transaction): Promise<AddressRecord> => {
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
      },
    );

    return this.toAddress(address);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpsertAddressRequest,
  ): Promise<AddressDtoShape> {
    await this.ensureOwnedAddress(userId, addressId);

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: this.normalizeAddressInput(input),
      select: addressSelect,
    });

    return this.toAddress(address);
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressDtoShape> {
    await this.ensureOwnedAddress(userId, addressId);

    const address: AddressRecord = await this.prisma.$transaction(
      async (transaction): Promise<AddressRecord> => {
        await transaction.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });

        return transaction.address.update({
          where: { id: addressId },
          data: { isDefault: true },
          select: addressSelect,
        });
      },
    );

    return this.toAddress(address);
  }

  async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<{ ok: true }> {
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

  async listPaymentMethods(
    userId: string,
  ): Promise<SavedPaymentMethodListResponseDtoShape> {
    const paymentMethods = await this.prisma.savedPaymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: paymentMethodSelect,
    });

    return {
      items: paymentMethods.map((paymentMethod) =>
        this.toPaymentMethod(paymentMethod),
      ),
    };
  }

  async createPaymentMethod(
    userId: string,
    input: UpsertPaymentMethodRequest,
  ): Promise<SavedPaymentMethodDtoShape> {
    const existingPaymentMethodCount =
      await this.prisma.savedPaymentMethod.count({
        where: { userId },
      });
    const shouldBeDefault = existingPaymentMethodCount === 0;

    const paymentMethod: SavedPaymentMethodRecord =
      await this.prisma.$transaction(
        async (transaction): Promise<SavedPaymentMethodRecord> => {
          if (shouldBeDefault) {
            return transaction.savedPaymentMethod.create({
              data: {
                userId,
                ...this.normalizePaymentMethodInput(input),
                isDefault: true,
              },
              select: paymentMethodSelect,
            });
          }

          return transaction.savedPaymentMethod.create({
            data: {
              userId,
              ...this.normalizePaymentMethodInput(input),
            },
            select: paymentMethodSelect,
          });
        },
      );

    return this.toPaymentMethod(paymentMethod);
  }

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    input: UpsertPaymentMethodRequest,
  ): Promise<SavedPaymentMethodDtoShape> {
    await this.ensureOwnedPaymentMethod(userId, paymentMethodId);

    const paymentMethod = await this.prisma.savedPaymentMethod.update({
      where: { id: paymentMethodId },
      data: this.normalizePaymentMethodInput(input),
      select: paymentMethodSelect,
    });

    return this.toPaymentMethod(paymentMethod);
  }

  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<SavedPaymentMethodDtoShape> {
    await this.ensureOwnedPaymentMethod(userId, paymentMethodId);

    const paymentMethod: SavedPaymentMethodRecord =
      await this.prisma.$transaction(
        async (transaction): Promise<SavedPaymentMethodRecord> => {
          await transaction.savedPaymentMethod.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          });

          return transaction.savedPaymentMethod.update({
            where: { id: paymentMethodId },
            data: { isDefault: true },
            select: paymentMethodSelect,
          });
        },
      );

    return this.toPaymentMethod(paymentMethod);
  }

  async deletePaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<{ ok: true }> {
    const paymentMethod = await this.ensureOwnedPaymentMethod(
      userId,
      paymentMethodId,
    );

    await this.prisma.$transaction(async (transaction) => {
      await transaction.savedPaymentMethod.delete({
        where: { id: paymentMethodId },
      });

      if (!paymentMethod.isDefault) {
        return;
      }

      const nextDefault = await transaction.savedPaymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (!nextDefault) {
        return;
      }

      await transaction.savedPaymentMethod.update({
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

  private async ensureOwnedPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ) {
    const paymentMethod = await this.prisma.savedPaymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
      select: {
        id: true,
        isDefault: true,
      },
    });

    if (!paymentMethod) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.paymentMethodNotFound,
        'The requested payment method was not found.',
      );
    }

    return paymentMethod;
  }

  private normalizePaymentMethodInput(input: UpsertPaymentMethodRequest) {
    if (input.type === 'CARD') {
      return {
        type: input.type,
        label: input.label.trim(),
        cardholderName: input.cardholderName?.trim() ?? null,
        cardLast4: input.cardLast4?.trim() ?? null,
        cardExpiryMonth: input.cardExpiryMonth?.trim() ?? null,
        cardExpiryYear: input.cardExpiryYear?.trim() ?? null,
        bankName: null,
      };
    }

    return {
      type: input.type,
      label: input.label.trim(),
      cardholderName: null,
      cardLast4: null,
      cardExpiryMonth: null,
      cardExpiryYear: null,
      bankName: input.bankName?.trim() ?? null,
    };
  }

  private toAddress(address: AddressRecord): AddressDtoShape {
    return {
      ...address,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }

  private toPaymentMethod(
    paymentMethod: SavedPaymentMethodRecord,
  ): SavedPaymentMethodDtoShape {
    return {
      ...paymentMethod,
      createdAt: paymentMethod.createdAt.toISOString(),
      updatedAt: paymentMethod.updatedAt.toISOString(),
    };
  }
}
