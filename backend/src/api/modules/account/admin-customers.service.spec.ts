jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import type { PrismaService } from '../../../prisma/prisma.service';
import { AdminCustomersService } from './admin-customers.service';

describe('AdminCustomersService', () => {
  const buildService = () => {
    const userCount = jest.fn();
    const userFindMany = jest.fn();
    const userFindFirst = jest.fn();
    const addressFindMany = jest.fn();
    const orderFindMany = jest.fn();
    const prisma = {
      user: {
        count: userCount,
        findMany: userFindMany,
        findFirst: userFindFirst,
      },
      address: {
        findMany: addressFindMany,
      },
      order: {
        findMany: orderFindMany,
      },
    };

    return {
      service: new AdminCustomersService(prisma as unknown as PrismaService),
      prisma,
      userCount,
      userFindMany,
      userFindFirst,
      addressFindMany,
      orderFindMany,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists customers with commerce summary fields', async () => {
    const { service, userCount, userFindMany, orderFindMany } = buildService();

    userCount.mockResolvedValueOnce(2);
    userFindMany.mockResolvedValueOnce([
      {
        id: 'cm9customer0000000000000001',
        fullName: 'Aree',
        email: 'aree@example.com',
        phone: '0811111111',
        role: 'CUSTOMER',
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        updatedAt: new Date('2026-05-01T10:00:00.000Z'),
      },
      {
        id: 'cm9customer0000000000000002',
        fullName: 'Nalin',
        email: 'nalin@example.com',
        phone: null,
        role: 'CUSTOMER',
        createdAt: new Date('2026-05-02T10:00:00.000Z'),
        updatedAt: new Date('2026-05-02T10:00:00.000Z'),
      },
    ]);
    orderFindMany.mockResolvedValueOnce([
      {
        userId: 'cm9customer0000000000000001',
        total: 960,
        createdAt: new Date('2026-05-03T10:00:00.000Z'),
        cancellationRequests: [{ id: 'req-1' }],
      },
      {
        userId: 'cm9customer0000000000000001',
        total: 1280,
        createdAt: new Date('2026-05-04T10:00:00.000Z'),
        cancellationRequests: [],
      },
    ]);

    await expect(
      service.listCustomers({ query: 'ar', page: 1, limit: 25 }),
    ).resolves.toEqual({
      items: [
        {
          id: 'cm9customer0000000000000001',
          fullName: 'Aree',
          email: 'aree@example.com',
          phone: '0811111111',
          createdAt: '2026-05-01T10:00:00.000Z',
          orderCount: 2,
          totalSpent: 2240,
          lastOrderAt: '2026-05-04T10:00:00.000Z',
          pendingCancellationCount: 1,
        },
        {
          id: 'cm9customer0000000000000002',
          fullName: 'Nalin',
          email: 'nalin@example.com',
          phone: null,
          createdAt: '2026-05-02T10:00:00.000Z',
          orderCount: 0,
          totalSpent: 0,
          lastOrderAt: null,
          pendingCancellationCount: 0,
        },
      ],
      page: 1,
      limit: 25,
      total: 2,
      totalPages: 1,
    });
  });

  it('returns customer detail with summary, addresses, and recent orders', async () => {
    const { service, userFindFirst, addressFindMany, orderFindMany } =
      buildService();

    userFindFirst.mockResolvedValueOnce({
      id: 'cm9customer0000000000000001',
      fullName: 'Aree',
      email: 'aree@example.com',
      phone: '0811111111',
      role: 'CUSTOMER',
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      updatedAt: new Date('2026-05-05T10:00:00.000Z'),
    });
    addressFindMany.mockResolvedValueOnce([
      {
        id: 'cm9address0000000000000001',
        label: 'Home',
        recipientFullName: 'Aree',
        recipientEmail: 'aree@example.com',
        recipientPhone: '0811111111',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
        isDefault: true,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        updatedAt: new Date('2026-05-01T10:00:00.000Z'),
      },
    ]);
    orderFindMany
      .mockResolvedValueOnce([
        {
          total: 960,
          createdAt: new Date('2026-05-03T10:00:00.000Z'),
          cancellationRequests: [{ id: 'req-1' }],
        },
        {
          total: 1280,
          createdAt: new Date('2026-05-04T10:00:00.000Z'),
          cancellationRequests: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          orderNo: 'FC-1',
          status: 'PAID',
          refundStatus: 'NONE',
          paymentMethod: 'CARD',
          createdAt: new Date('2026-05-04T10:00:00.000Z'),
          total: 1280,
          cancellationRequests: [],
        },
      ]);

    await expect(
      service.getCustomerDetail('cm9customer0000000000000001'),
    ).resolves.toEqual({
      profile: {
        id: 'cm9customer0000000000000001',
        fullName: 'Aree',
        email: 'aree@example.com',
        phone: '0811111111',
        role: 'CUSTOMER',
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z',
      },
      summary: {
        orderCount: 2,
        totalSpent: 2240,
        lastOrderAt: '2026-05-04T10:00:00.000Z',
        pendingCancellationCount: 1,
      },
      addresses: [
        {
          id: 'cm9address0000000000000001',
          label: 'Home',
          recipientFullName: 'Aree',
          recipientEmail: 'aree@example.com',
          recipientPhone: '0811111111',
          addressLine: '123 Facee Road',
          city: 'Bangkok',
          postalCode: '10110',
          isDefault: true,
          createdAt: '2026-05-01T10:00:00.000Z',
          updatedAt: '2026-05-01T10:00:00.000Z',
        },
      ],
      recentOrders: [
        {
          orderNo: 'FC-1',
          status: 'PAID',
          refundStatus: 'NONE',
          paymentMethod: 'CARD',
          createdAt: '2026-05-04T10:00:00.000Z',
          total: 1280,
          hasPendingCancellationRequest: false,
        },
      ],
    });
  });
});
