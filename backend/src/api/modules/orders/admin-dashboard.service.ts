import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';
import type { AdminDashboardQuery } from './dto/admin-dashboard-query.dto';
import { OrdersService } from './orders.service';

const LOW_STOCK_THRESHOLD = 10;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async getDashboard(
    query: AdminDashboardQuery = { preset: 'month' },
  ): Promise<AdminDashboardResponseDto> {
    const orderRange = this.getBangkokRange(query);

    const [
      pendingOrdersCount,
      pendingCancellationCount,
      lowStockProductsCount,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          status: 'PENDING',
          createdAt: orderRange,
        },
      }),
      this.prisma.orderCancellationRequest.count({
        where: {
          status: 'REQUESTED',
          createdAt: orderRange,
        },
      }),
      this.prisma.product.count({
        where: {
          isPublished: true,
          stock: {
            lte: LOW_STOCK_THRESHOLD,
          },
        },
      }),
    ]);

    const [
      { items: recentOrders },
      pendingCancellationRequests,
      stockAlerts,
      paidInRangeOrders,
    ] = await Promise.all([
      this.ordersService.listAdminOrders({
        createdAt: orderRange,
      }),
      this.prisma.orderCancellationRequest.findMany({
        where: {
          status: 'REQUESTED',
          createdAt: orderRange,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
        select: {
          id: true,
          reasonCode: true,
          details: true,
          createdAt: true,
          order: {
            select: {
              orderNo: true,
              total: true,
              customerFullName: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.findMany({
        where: {
          isPublished: true,
          stock: {
            lte: LOW_STOCK_THRESHOLD,
          },
        },
        orderBy: [{ stock: 'asc' }, { createdAt: 'asc' }],
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          stock: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          paymentCompletedAt: orderRange,
        },
        select: {
          total: true,
        },
      }),
    ]);

    return {
      summary: {
        pendingOrdersCount,
        pendingCancellationCount,
        lowStockProductsCount,
        paidTodayRevenue: paidInRangeOrders.reduce(
          (sum, order) => sum + Number(order.total),
          0,
        ),
      },
      pendingCancellationRequests: pendingCancellationRequests.map(
        (request) => ({
          requestId: request.id,
          orderNo: request.order.orderNo,
          customerName:
            request.order.customerFullName ??
            request.order.user?.fullName ??
            'Facee Customer',
          reasonCode: request.reasonCode,
          details: request.details,
          requestedAt: request.createdAt.toISOString(),
          orderTotal: Number(request.order.total),
        }),
      ),
      recentOrders: recentOrders.slice(0, 6),
      stockAlerts: stockAlerts.map((product) => ({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: product.imageUrl,
        stock: product.stock,
        categoryName: product.category.name,
      })),
    };
  }

  private getBangkokRange(query: AdminDashboardQuery, now = new Date()) {
    const bangkokNow = new Date(now.getTime() + BANGKOK_OFFSET_MS);

    if (query.preset === 'range' && query.start && query.end) {
      return {
        gte: new Date(query.start),
        lt: new Date(query.end),
      };
    }

    const rangeStart =
      query.preset === 'year'
        ? new Date(Date.UTC(bangkokNow.getUTCFullYear(), 0, 1))
        : query.preset === 'day'
          ? new Date(
              Date.UTC(
                bangkokNow.getUTCFullYear(),
                bangkokNow.getUTCMonth(),
                bangkokNow.getUTCDate(),
              ),
            )
          : new Date(
              Date.UTC(
                bangkokNow.getUTCFullYear(),
                bangkokNow.getUTCMonth(),
                1,
              ),
            );

    const rangeEnd =
      query.preset === 'year'
        ? new Date(Date.UTC(bangkokNow.getUTCFullYear() + 1, 0, 1))
        : query.preset === 'day'
          ? new Date(rangeStart.getTime() + 24 * 60 * 60 * 1000)
          : new Date(
              Date.UTC(
                bangkokNow.getUTCFullYear(),
                bangkokNow.getUTCMonth() + 1,
                1,
              ),
            );

    return {
      gte: new Date(rangeStart.getTime() - BANGKOK_OFFSET_MS),
      lt: new Date(rangeEnd.getTime() - BANGKOK_OFFSET_MS),
    };
  }

  private getBangkokDayRange(now = new Date()) {
    const bangkokNow = new Date(now.getTime() + BANGKOK_OFFSET_MS);
    const bangkokDayStart = new Date(
      Date.UTC(
        bangkokNow.getUTCFullYear(),
        bangkokNow.getUTCMonth(),
        bangkokNow.getUTCDate(),
      ),
    );

    const bangkokDayEnd = new Date(
      bangkokDayStart.getTime() + 24 * 60 * 60 * 1000,
    );

    return {
      gte: new Date(bangkokDayStart.getTime() - BANGKOK_OFFSET_MS),
      lt: new Date(bangkokDayEnd.getTime() - BANGKOK_OFFSET_MS),
    };
  }
}
