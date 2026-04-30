import { HttpStatus, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type {
  Order,
  OrderCancellationRequest,
  PaymentDemoStatus,
  PaymentMethod,
  RefundStatus,
  User,
} from '../../../generated/prisma/client.cjs';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CreateCancellationRequest } from './dto/create-cancellation-request.dto';
import type { CreateOrderRequest } from './dto/create-order-request.dto';
import type { CreateOrderResponseDto } from './dto/create-order-response.dto';
import type { AdminReviewCancellationRequest } from './dto/admin-review-cancellation-request.dto';
import type { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import type { OrderListResponseDto } from './dto/order-list-response.dto';
import type { UpdateOrderPaymentMethod } from './dto/update-order-payment-method.dto';
import type { UpdateRefundStatusInput } from './dto/update-refund-status.dto';
import { getShippingFee } from './order-pricing';

type OrderContactSource = Pick<
  Order,
  | 'customerFullName'
  | 'customerEmail'
  | 'customerPhone'
  | 'shippingAddressLine'
  | 'shippingCity'
  | 'shippingPostalCode'
> & {
  user: Pick<
    User,
    'fullName' | 'email' | 'phone' | 'addressLine' | 'city' | 'postalCode'
  > | null;
};

type OrderDetailSource = OrderContactSource & {
  orderNo: string;
  status: Order['status'];
  refundStatus: RefundStatus;
  paymentMethod: PaymentMethod;
  paymentDemoStatus: PaymentDemoStatus;
  paymentSubmittedAt: Date | null;
  paymentCompletedAt: Date | null;
  createdAt: Date;
  subtotal: unknown;
  shippingTotal: unknown;
  total: unknown;
  items: Array<{
    id: string;
    productId: string;
    productName: string | null;
    productSlug: string | null;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: unknown;
  }>;
  cancellationRequests: OrderCancellationRequest[];
};

const orderProductSelect = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  isPublished: true,
  price: true,
  stock: true,
} as const;

const orderDetailSelect = {
  id: true,
  orderNo: true,
  status: true,
  refundStatus: true,
  paymentMethod: true,
  paymentDemoStatus: true,
  paymentSubmittedAt: true,
  paymentCompletedAt: true,
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
  cancellationRequests: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
} as const;

const orderListSelect = {
  orderNo: true,
  status: true,
  refundStatus: true,
  paymentMethod: true,
  paymentDemoStatus: true,
  paymentSubmittedAt: true,
  paymentCompletedAt: true,
  createdAt: true,
  total: true,
  customerFullName: true,
  customerEmail: true,
  customerPhone: true,
  shippingAddressLine: true,
  shippingCity: true,
  shippingPostalCode: true,
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
      productName: true,
      productImageUrl: true,
      quantity: true,
    },
  },
  cancellationRequests: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    userId: string,
    input: CreateOrderRequest,
  ): Promise<CreateOrderResponseDto> {
    await this.ensureOwnedUser(userId);

    const address = await this.ensureOwnedAddress(userId, input.addressId);
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
        product: {
          ...product,
          price: Number(product.price),
        },
        quantity: item.quantity,
        lineTotal: Number(product.price) * item.quantity,
      };
    });

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingTotal = getShippingFee(subtotal);
    const total = subtotal + shippingTotal;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (transaction) => {
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

          const order = await transaction.order.create({
            data: {
              orderNo: this.generateOrderNo(),
              userId,
              status: 'PENDING',
              refundStatus: 'NONE',
              paymentMethod: input.paymentMethod,
              paymentDemoStatus: 'NOT_STARTED',
              customerFullName: address.recipientFullName,
              customerEmail: address.recipientEmail,
              customerPhone: address.recipientPhone,
              shippingAddressLine: address.addressLine,
              shippingCity: address.city,
              shippingPostalCode: address.postalCode,
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
                  unitPrice: item.product.price,
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

  async listOrders(userId: string): Promise<OrderListResponseDto> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      select: orderListSelect,
    });

    return {
      items: orders.map((order) => this.toOrderListItem(order)),
    };
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
      throw this.buildOrderNotFound();
    }

    return this.toOrderDetail(order);
  }

  async cancelOrder(
    userId: string,
    orderNo: string,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
      },
      select: {
        id: true,
        status: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      throw this.buildOrderNotFound();
    }

    if (order.status !== 'PENDING') {
      throw new AppException(
        HttpStatus.CONFLICT,
        API_ERROR_CODES.orderCancelNotAllowed,
        'This order can no longer be canceled directly.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      for (const item of order.items) {
        await transaction.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      await transaction.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: 'CANCELED',
        },
      });
    });

    return this.getOrderByOrderNo(userId, orderNo);
  }

  async confirmPaymentDemo(
    userId: string,
    orderNo: string,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        paymentDemoStatus: true,
      },
    });

    if (!order) {
      throw this.buildOrderNotFound();
    }

    if (!this.canConfirmPaymentDemo(order.status, order.paymentDemoStatus)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        order.paymentDemoStatus !== 'NOT_STARTED'
          ? API_ERROR_CODES.orderPaymentDemoAlreadyConfirmed
          : API_ERROR_CODES.orderPaymentDemoNotAllowed,
        order.paymentDemoStatus !== 'NOT_STARTED'
          ? 'This sandbox payment has already been confirmed.'
          : 'This order cannot accept a sandbox payment confirmation right now.',
      );
    }

    const now = new Date();

    await this.prisma.order.update({
      where: {
        id: order.id,
      },
      data:
        order.paymentMethod === 'CARD'
          ? {
              status: 'PAID',
              paymentDemoStatus: 'CARD_COMPLETED',
              paymentCompletedAt: now,
            }
          : {
              status: 'PENDING',
              paymentDemoStatus: 'QR_SUBMITTED',
              paymentSubmittedAt: now,
            },
    });

    return this.getOrderByOrderNo(userId, orderNo);
  }

  async updatePaymentMethod(
    userId: string,
    orderNo: string,
    input: UpdateOrderPaymentMethod,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
      },
      select: {
        id: true,
        status: true,
        paymentDemoStatus: true,
      },
    });

    if (!order) {
      throw this.buildOrderNotFound();
    }

    if (!this.canConfirmPaymentDemo(order.status, order.paymentDemoStatus)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        order.paymentDemoStatus !== 'NOT_STARTED'
          ? API_ERROR_CODES.orderPaymentDemoAlreadyConfirmed
          : API_ERROR_CODES.orderPaymentDemoNotAllowed,
        order.paymentDemoStatus !== 'NOT_STARTED'
          ? 'This sandbox payment has already been confirmed.'
          : 'This order cannot change its payment method right now.',
      );
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: input.paymentMethod,
      },
    });

    return this.getOrderByOrderNo(userId, orderNo);
  }

  async createCancellationRequest(
    userId: string,
    orderNo: string,
    input: CreateCancellationRequest,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
      },
      select: {
        id: true,
        status: true,
        cancellationRequests: {
          where: {
            status: 'REQUESTED',
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!order) {
      throw this.buildOrderNotFound();
    }

    if (!this.canRequestCancellation(order.status)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        API_ERROR_CODES.orderCancelNotAllowed,
        'This order cannot accept a cancellation request right now.',
      );
    }

    if (order.cancellationRequests.length > 0) {
      throw new AppException(
        HttpStatus.CONFLICT,
        API_ERROR_CODES.cancellationRequestExists,
        'A cancellation request is already pending for this order.',
      );
    }

    await this.prisma.orderCancellationRequest.create({
      data: {
        orderId: order.id,
        requesterUserId: userId,
        reasonCode: input.reasonCode,
        details: input.details?.trim() || null,
        status: 'REQUESTED',
      },
    });

    return this.getOrderByOrderNo(userId, orderNo);
  }

  async listAdminOrders(): Promise<OrderListResponseDto> {
    const orders = await this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: orderListSelect,
    });

    return {
      items: orders.map((order) => this.toOrderListItem(order)),
    };
  }

  async getAdminOrderByOrderNo(
    orderNo: string,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: {
        orderNo,
      },
      select: orderDetailSelect,
    });

    if (!order) {
      throw this.buildOrderNotFound();
    }

    return this.toOrderDetail(order);
  }

  async reviewCancellationRequest(
    adminUserId: string,
    requestId: string,
    input: AdminReviewCancellationRequest,
  ): Promise<OrderDetailResponseDto> {
    const request = await this.prisma.orderCancellationRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        status: true,
        orderId: true,
        order: {
          select: {
            orderNo: true,
            status: true,
            items: {
              select: {
                productId: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.cancellationRequestNotFound,
        'The requested cancellation request was not found.',
      );
    }

    if (request.status !== 'REQUESTED') {
      throw new AppException(
        HttpStatus.CONFLICT,
        API_ERROR_CODES.orderCancelNotAllowed,
        'This cancellation request has already been reviewed.',
      );
    }

    if (input.decision === 'APPROVE') {
      await this.prisma.$transaction(async (transaction) => {
        for (const item of request.order.items) {
          await transaction.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        await transaction.orderCancellationRequest.update({
          where: {
            id: request.id,
          },
          data: {
            status: 'APPROVED',
            reviewNote: input.reviewNote?.trim() || null,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
          },
        });

        await transaction.order.update({
          where: {
            id: request.orderId,
          },
          data: {
            status: 'CANCELED',
            refundStatus: 'PENDING_MANUAL',
          },
        });
      });
    } else {
      await this.prisma.orderCancellationRequest.update({
        where: {
          id: request.id,
        },
        data: {
          status: 'REJECTED',
          reviewNote: input.reviewNote?.trim() || null,
          reviewedByUserId: adminUserId,
          reviewedAt: new Date(),
        },
      });
    }

    return this.getAdminOrderByOrderNo(request.order.orderNo);
  }

  async updateRefundStatus(
    orderNo: string,
    input: UpdateRefundStatusInput,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: {
        orderNo,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw this.buildOrderNotFound();
    }

    await this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        refundStatus: input.refundStatus,
      },
    });

    return this.getAdminOrderByOrderNo(orderNo);
  }

  private async ensureOwnedUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
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

  private async ensureOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.addressNotFound,
        'The requested address was not found.',
        {
          addressId: [API_ERROR_CODES.addressNotFound],
        },
      );
    }

    return address;
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

  private toOrderListItem(order: {
    status: Order['status'];
    refundStatus: RefundStatus;
    paymentMethod: PaymentMethod;
    paymentDemoStatus: PaymentDemoStatus;
    paymentSubmittedAt: Date | null;
    paymentCompletedAt: Date | null;
    orderNo: string;
    createdAt: Date;
    total: unknown;
    customerFullName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    shippingAddressLine: string | null;
    shippingCity: string | null;
    shippingPostalCode: string | null;
    user: Pick<
      User,
      'fullName' | 'email' | 'phone' | 'addressLine' | 'city' | 'postalCode'
    > | null;
    items: Array<{
      id: string;
      productName: string | null;
      productImageUrl: string | null;
      quantity: number;
    }>;
    cancellationRequests: Array<Pick<OrderCancellationRequest, 'status'>>;
  }) {
    const latestRequest = order.cancellationRequests[0] ?? null;

    return {
      orderNo: order.orderNo,
      status: order.status,
      refundStatus: order.refundStatus,
      paymentMethod: order.paymentMethod,
      paymentDemoStatus: order.paymentDemoStatus,
      paymentSubmittedAt: order.paymentSubmittedAt?.toISOString() ?? null,
      paymentCompletedAt: order.paymentCompletedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      total: Number(order.total),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      previewItems: order.items.slice(0, 3).map((item) => ({
        id: item.id,
        productName: item.productName ?? '',
        productImageUrl: item.productImageUrl,
      })),
      contact: this.toContact(order),
      hasPendingCancellationRequest: latestRequest?.status === 'REQUESTED',
      latestCancellationRequestStatus: latestRequest?.status ?? null,
    };
  }

  private toOrderDetail(order: OrderDetailSource): OrderDetailResponseDto {
    return {
      orderNo: order.orderNo,
      status: order.status,
      refundStatus: order.refundStatus,
      paymentMethod: order.paymentMethod,
      paymentDemoStatus: order.paymentDemoStatus,
      paymentSubmittedAt: order.paymentSubmittedAt?.toISOString() ?? null,
      paymentCompletedAt: order.paymentCompletedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      contact: this.toContact(order),
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
      latestCancellationRequest: this.toCancellationSummary(
        order.cancellationRequests[0] ?? null,
      ),
    };
  }

  private toContact(order: OrderContactSource) {
    return {
      fullName: order.customerFullName ?? order.user?.fullName ?? '',
      email: order.customerEmail ?? order.user?.email ?? '',
      phone: order.customerPhone ?? order.user?.phone ?? '',
      addressLine: order.shippingAddressLine ?? order.user?.addressLine ?? '',
      city: order.shippingCity ?? order.user?.city ?? '',
      postalCode: order.shippingPostalCode ?? order.user?.postalCode ?? '',
    };
  }

  private toCancellationSummary(
    request: OrderCancellationRequest | null,
  ): OrderDetailResponseDto['latestCancellationRequest'] {
    if (!request) {
      return null;
    }

    return {
      id: request.id,
      reasonCode: request.reasonCode,
      details: request.details,
      status: request.status,
      reviewNote: request.reviewNote,
      reviewedAt: request.reviewedAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
    };
  }

  private canRequestCancellation(status: Order['status']) {
    return status === 'PAID' || status === 'PACKING';
  }

  private canConfirmPaymentDemo(
    status: Order['status'],
    paymentDemoStatus: PaymentDemoStatus,
  ) {
    return status === 'PENDING' && paymentDemoStatus === 'NOT_STARTED';
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

  private buildOrderNotFound() {
    return new AppException(
      HttpStatus.NOT_FOUND,
      API_ERROR_CODES.orderNotFound,
      'The requested order was not found.',
    );
  }
}
