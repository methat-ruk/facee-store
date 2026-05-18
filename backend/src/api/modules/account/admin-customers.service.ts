import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AdminCustomerDetailResponseDto } from './dto/admin-customer-detail-response.dto';
import type { AdminCustomerListResponseDto } from './dto/admin-customer-list-response.dto';
import type { AdminCustomerQuery } from './dto/admin-customer-query.dto';
import { addressSchema } from './dto/address.dto';
import { z } from 'zod';

const adminCustomerProfileSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
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

type AddressRecord = Omit<
  z.infer<typeof addressSchema>,
  'createdAt' | 'updatedAt'
> & {
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(
    query: AdminCustomerQuery,
  ): Promise<AdminCustomerListResponseDto> {
    const normalizedQuery = query.query?.trim();
    const page = query.page;
    const limit = query.limit;
    const where: Prisma.UserWhereInput = {
      role: 'CUSTOMER',
      ...(normalizedQuery
        ? {
            OR: [
              {
                fullName: {
                  contains: normalizedQuery,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: normalizedQuery,
                  mode: 'insensitive' as const,
                },
              },
              { phone: { contains: normalizedQuery } },
            ],
          }
        : {}),
    };

    const [total, customers] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: adminCustomerProfileSelect,
      }),
    ]);

    const customerIds = customers.map(
      (customer: (typeof customers)[number]) => customer.id,
    );
    const orders =
      customerIds.length > 0
        ? await this.prisma.order.findMany({
            where: {
              userId: {
                in: customerIds,
              },
            },
            select: {
              userId: true,
              total: true,
              createdAt: true,
              cancellationRequests: {
                where: {
                  status: 'REQUESTED',
                },
                select: {
                  id: true,
                },
              },
            },
          })
        : [];

    const statsByCustomerId = this.buildStatsByCustomerId(customerIds, orders);

    return {
      items: customers.map((customer: (typeof customers)[number]) => {
        const stats = statsByCustomerId.get(customer.id);

        return {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          createdAt: customer.createdAt.toISOString(),
          orderCount: stats?.orderCount ?? 0,
          totalSpent: stats?.totalSpent ?? 0,
          lastOrderAt: stats?.lastOrderAt?.toISOString() ?? null,
          pendingCancellationCount: stats?.pendingCancellationCount ?? 0,
        };
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getCustomerDetail(
    customerId: string,
  ): Promise<AdminCustomerDetailResponseDto> {
    const customer = await this.ensureCustomerExists(customerId);

    const [addresses, allOrders, recentOrders] = await Promise.all([
      this.prisma.address.findMany({
        where: { userId: customerId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        select: addressSelect,
      }),
      this.prisma.order.findMany({
        where: { userId: customerId },
        select: {
          total: true,
          createdAt: true,
          cancellationRequests: {
            where: {
              status: 'REQUESTED',
            },
            select: {
              id: true,
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where: { userId: customerId },
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
        select: {
          orderNo: true,
          status: true,
          refundStatus: true,
          paymentMethod: true,
          createdAt: true,
          total: true,
          cancellationRequests: {
            where: {
              status: 'REQUESTED',
            },
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    const stats = this.buildStats(allOrders);

    return {
      profile: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
      summary: {
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderAt: stats.lastOrderAt?.toISOString() ?? null,
        pendingCancellationCount: stats.pendingCancellationCount,
      },
      addresses: addresses.map((address: AddressRecord) =>
        this.toAddress(address),
      ),
      recentOrders: recentOrders.map(
        (order: (typeof recentOrders)[number]) => ({
          orderNo: order.orderNo,
          status: order.status,
          refundStatus: order.refundStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt.toISOString(),
          total: Number(order.total),
          hasPendingCancellationRequest: order.cancellationRequests.length > 0,
        }),
      ),
    };
  }

  private buildStatsByCustomerId(
    customerIds: string[],
    orders: Array<{
      userId: string;
      total: unknown;
      createdAt: Date;
      cancellationRequests: Array<{ id: string }>;
    }>,
  ) {
    const stats = new Map<
      string,
      {
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date | null;
        pendingCancellationCount: number;
      }
    >();

    for (const customerId of customerIds) {
      stats.set(customerId, {
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
        pendingCancellationCount: 0,
      });
    }

    for (const order of orders) {
      const current = stats.get(order.userId);

      if (!current) {
        continue;
      }

      current.orderCount += 1;
      current.totalSpent += Number(order.total);
      current.pendingCancellationCount += order.cancellationRequests.length;

      if (!current.lastOrderAt || order.createdAt > current.lastOrderAt) {
        current.lastOrderAt = order.createdAt;
      }
    }

    return stats;
  }

  private buildStats(
    orders: Array<{
      total: unknown;
      createdAt: Date;
      cancellationRequests: Array<{ id: string }>;
    }>,
  ) {
    return orders.reduce(
      (summary, order) => {
        summary.orderCount += 1;
        summary.totalSpent += Number(order.total);
        summary.pendingCancellationCount += order.cancellationRequests.length;

        if (!summary.lastOrderAt || order.createdAt > summary.lastOrderAt) {
          summary.lastOrderAt = order.createdAt;
        }

        return summary;
      },
      {
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: null as Date | null,
        pendingCancellationCount: 0,
      },
    );
  }

  private async ensureCustomerExists(customerId: string) {
    const customer = await this.prisma.user.findFirst({
      where: {
        id: customerId,
        role: 'CUSTOMER',
      },
      select: adminCustomerProfileSelect,
    });

    if (!customer) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.customerNotFound,
        'The requested customer was not found.',
      );
    }

    return customer;
  }

  private toAddress(address: AddressRecord) {
    return {
      ...address,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }
}
