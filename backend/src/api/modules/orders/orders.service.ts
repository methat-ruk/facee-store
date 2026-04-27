import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type { Prisma } from '../../../generated/prisma/client.cjs';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CreateOrderRequest } from './dto/create-order-request.dto';
import type { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { getShippingFee } from './order-pricing';

type OrdersTransactionPrisma = {
  order: Pick<PrismaService['order'], 'create'>;
  product: Pick<PrismaService['product'], 'updateMany'>;
  user: Pick<PrismaService['user'], 'update'>;
};

type OrdersPrisma = {
  client: {
    $transaction: <T>(
      fn: (transaction: OrdersTransactionPrisma) => Promise<T>,
    ) => Promise<T>;
  };
  order: Pick<PrismaService['order'], 'findFirst'>;
  product: Pick<PrismaService['product'], 'findMany'>;
  user: Pick<PrismaService['user'], 'findFirst' | 'findUnique'>;
};

const orderProductSelect = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  isPublished: true,
  price: true,
  stock: true,
} satisfies Prisma.ProductSelect;

const orderDetailSelect = {
  orderNo: true,
  status: true,
  createdAt: true,
  customerFullName: true,
  customerEmail: true,
  customerPhone: true,
  shippingAddressLine: true,
  shippingCity: true,
  shippingPostalCode: true,
  subtotal: true,
  shippingTotal: true,
  total: true,
  user: {
    select: {
      fullName: true,
      email: true,
      phone: true,
      addressLine: true,
      city: true,
      postalCode: true,
    },
  },
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productSlug: true,
      productImageUrl: true,
      quantity: true,
      unitPrice: true,
    },
  },
} satisfies Prisma.OrderSelect;

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: OrdersPrisma,
  ) {}

  async createOrder(userId: string, input: CreateOrderRequest) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        API_ERROR_CODES.authUnauthorized,
        'Authentication is required.',
      );
    }

    const email = input.email.trim().toLowerCase();

    if (email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
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

    const normalizedItems = this.normalizeItems(input.items);

    if (normalizedItems.length === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        API_ERROR_CODES.orderEmpty,
        'Your cart is empty.',
        {
          items: [API_ERROR_CODES.orderEmpty],
        },
      );
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: normalizedItems.map((item) => item.productId),
        },
      },
      select: orderProductSelect,
    });

    const pricedItems = normalizedItems.map((item) => {
      const product = products.find((current) => current.id === item.productId);

      if (!product || !product.isPublished || product.stock === 0) {
        throw new AppException(
          HttpStatus.CONFLICT,
          API_ERROR_CODES.orderUnavailableItems,
          'Some cart items are no longer available.',
          {
            items: [API_ERROR_CODES.orderUnavailableItems],
          },
        );
      }

      if (item.quantity > product.stock) {
        throw new AppException(
          HttpStatus.CONFLICT,
          API_ERROR_CODES.orderStockChanged,
          'Some cart quantities changed before checkout completed.',
          {
            items: [API_ERROR_CODES.orderStockChanged],
          },
        );
      }

      return {
        product,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        lineTotal: Number(product.price) * item.quantity,
      };
    });

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingTotal = getShippingFee(subtotal);
    const total = subtotal + shippingTotal;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.client.$transaction(async (transaction) => {
          for (const item of pricedItems) {
            const result = await transaction.product.updateMany({
              where: {
                id: item.product.id,
                isPublished: true,
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

            if (result.count !== 1) {
              throw new AppException(
                HttpStatus.CONFLICT,
                API_ERROR_CODES.orderStockChanged,
                'Some cart quantities changed before checkout completed.',
                {
                  items: [API_ERROR_CODES.orderStockChanged],
                },
              );
            }
          }

          await transaction.user.update({
            where: { id: userId },
            data: {
              fullName: input.fullName.trim(),
              email,
              phone: input.phone.trim(),
              addressLine: input.addressLine.trim(),
              city: input.city.trim(),
              postalCode: input.postalCode.trim(),
            },
          });

          const order = await transaction.order.create({
            data: {
              orderNo: this.generateOrderNo(),
              userId,
              status: 'PENDING',
              customerFullName: input.fullName.trim(),
              customerEmail: email,
              customerPhone: input.phone.trim(),
              shippingAddressLine: input.addressLine.trim(),
              shippingCity: input.city.trim(),
              shippingPostalCode: input.postalCode.trim(),
              subtotal,
              shippingTotal,
              total,
              items: {
                create: pricedItems.map((item) => ({
                  productId: item.product.id,
                  productName: item.product.name,
                  productSlug: item.product.slug,
                  productImageUrl: item.product.imageUrl,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
            },
            select: {
              orderNo: true,
            },
          });

          return order;
        });
      } catch (error) {
        if (this.isOrderNoCollision(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new AppException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      API_ERROR_CODES.internalServerError,
      'Unable to create the order right now. Please try again.',
    );
  }

  async getOrderByOrderNo(
    userId: string,
    orderNo: string,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
      },
      select: orderDetailSelect,
    });

    if (!order) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.orderNotFound,
        'The requested order was not found.',
      );
    }

    const contact = {
      fullName: order.customerFullName ?? order.user.fullName ?? '',
      email: order.customerEmail ?? order.user.email ?? '',
      phone: order.customerPhone ?? order.user.phone ?? '',
      addressLine: order.shippingAddressLine ?? order.user.addressLine ?? '',
      city: order.shippingCity ?? order.user.city ?? '',
      postalCode: order.shippingPostalCode ?? order.user.postalCode ?? '',
    };

    return {
      orderNo: order.orderNo,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      contact,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName ?? '',
        productSlug: item.productSlug ?? '',
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
      })),
      subtotal: Number(order.subtotal ?? order.total),
      shippingTotal: Number(order.shippingTotal ?? 0),
      total: Number(order.total),
    };
  }

  private normalizeItems(items: CreateOrderRequest['items']) {
    const itemMap = new Map<string, number>();

    for (const item of items) {
      itemMap.set(
        item.productId,
        (itemMap.get(item.productId) ?? 0) + item.quantity,
      );
    }

    return Array.from(itemMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private generateOrderNo() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = `${now.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${now.getUTCDate()}`.padStart(2, '0');
    const suffix = `${randomInt(0, 1_000_000)}`.padStart(6, '0');

    return `FC-${year}${month}${day}-${suffix}`;
  }

  private isOrderNoCollision(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
