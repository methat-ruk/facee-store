jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import type { PrismaService } from '../../../prisma/prisma.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { OrdersService } from './orders.service';

describe('AdminDashboardService', () => {
  const buildService = () => {
    const orderCount = jest.fn();
    const orderFindMany = jest.fn();
    const orderCancellationRequestCount = jest.fn();
    const orderCancellationRequestFindMany = jest.fn();
    const productCount = jest.fn();
    const productFindMany = jest.fn();
    const listAdminOrders = jest.fn();

    const prisma = {
      order: {
        count: orderCount,
        findMany: orderFindMany,
      },
      orderCancellationRequest: {
        count: orderCancellationRequestCount,
        findMany: orderCancellationRequestFindMany,
      },
      product: {
        count: productCount,
        findMany: productFindMany,
      },
    };

    const ordersService = {
      listAdminOrders,
    };

    const service = new AdminDashboardService(
      prisma as unknown as PrismaService,
      ordersService as unknown as OrdersService,
    );

    return {
      service,
      orderCount,
      orderFindMany,
      orderCancellationRequestCount,
      orderCancellationRequestFindMany,
      productCount,
      productFindMany,
      listAdminOrders,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-30T08:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds the admin dashboard summary, queue, stock alerts, and recent orders', async () => {
    const {
      service,
      orderCount,
      orderFindMany,
      orderCancellationRequestCount,
      orderCancellationRequestFindMany,
      productCount,
      productFindMany,
      listAdminOrders,
    } = buildService();

    orderCount.mockResolvedValueOnce(7);
    orderCancellationRequestCount.mockResolvedValueOnce(3);
    productCount.mockResolvedValueOnce(4);
    listAdminOrders.mockResolvedValue({
      items: [
        { orderNo: 'FC-1' },
        { orderNo: 'FC-2' },
        { orderNo: 'FC-3' },
        { orderNo: 'FC-4' },
        { orderNo: 'FC-5' },
        { orderNo: 'FC-6' },
        { orderNo: 'FC-7' },
      ],
    });
    orderCancellationRequestFindMany.mockResolvedValueOnce([
      {
        id: 'req-1',
        reasonCode: 'WRONG_ADDRESS',
        details: null,
        createdAt: new Date('2026-04-30T07:00:00.000Z'),
        order: {
          orderNo: 'FC-20260430-100001',
          total: 960,
          customerFullName: 'Aree',
          user: null,
        },
      },
      {
        id: 'req-2',
        reasonCode: 'OTHER',
        details: 'ส่งช้าเกินไป ขอเปลี่ยนใจค่ะ',
        createdAt: new Date('2026-04-30T08:00:00.000Z'),
        order: {
          orderNo: 'FC-20260430-100002',
          total: 1280,
          customerFullName: null,
          user: {
            fullName: 'Nalin',
          },
        },
      },
    ]);
    orderFindMany.mockResolvedValueOnce([{ total: 960 }, { total: 1280 }]);
    productFindMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Quiet Bloom Cleanser',
        slug: 'quiet-bloom-cleanser',
        stock: 2,
        category: {
          name: 'Cleansers',
        },
      },
      {
        id: 'prod-2',
        name: 'Soft Cloud Toner',
        slug: 'soft-cloud-toner',
        stock: 5,
        category: {
          name: 'Toners',
        },
      },
    ]);

    await expect(service.getDashboard()).resolves.toEqual({
      summary: {
        pendingOrdersCount: 7,
        pendingCancellationCount: 3,
        lowStockProductsCount: 4,
        paidTodayRevenue: 2240,
      },
      pendingCancellationRequests: [
        {
          requestId: 'req-1',
          orderNo: 'FC-20260430-100001',
          customerName: 'Aree',
          reasonCode: 'WRONG_ADDRESS',
          details: null,
          requestedAt: '2026-04-30T07:00:00.000Z',
          orderTotal: 960,
        },
        {
          requestId: 'req-2',
          orderNo: 'FC-20260430-100002',
          customerName: 'Nalin',
          reasonCode: 'OTHER',
          details: 'ส่งช้าเกินไป ขอเปลี่ยนใจค่ะ',
          requestedAt: '2026-04-30T08:00:00.000Z',
          orderTotal: 1280,
        },
      ],
      recentOrders: [
        { orderNo: 'FC-1' },
        { orderNo: 'FC-2' },
        { orderNo: 'FC-3' },
        { orderNo: 'FC-4' },
        { orderNo: 'FC-5' },
        { orderNo: 'FC-6' },
      ],
      stockAlerts: [
        {
          productId: 'prod-1',
          productName: 'Quiet Bloom Cleanser',
          productSlug: 'quiet-bloom-cleanser',
          stock: 2,
          categoryName: 'Cleansers',
        },
        {
          productId: 'prod-2',
          productName: 'Soft Cloud Toner',
          productSlug: 'soft-cloud-toner',
          stock: 5,
          categoryName: 'Toners',
        },
      ],
    });

    expect(orderCount).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: new Date('2026-03-31T17:00:00.000Z'),
          lt: new Date('2026-04-30T17:00:00.000Z'),
        },
      },
    });
    expect(orderCancellationRequestCount).toHaveBeenCalledWith({
      where: {
        status: 'REQUESTED',
        createdAt: {
          gte: new Date('2026-03-31T17:00:00.000Z'),
          lt: new Date('2026-04-30T17:00:00.000Z'),
        },
      },
    });
    expect(productCount).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        stock: {
          lte: 10,
        },
      },
    });
    expect(orderFindMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          paymentCompletedAt: {
            gte: new Date('2026-03-31T17:00:00.000Z'),
            lt: new Date('2026-04-30T17:00:00.000Z'),
          },
        },
      }),
    );
  });
});
