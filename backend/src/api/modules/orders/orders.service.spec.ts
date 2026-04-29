jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import type { PrismaService } from '../../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const currentUser = {
    id: 'cm8user000001234567890123',
  };

  const currentAddress = {
    id: 'cm8addr000001234567890123',
    userId: currentUser.id,
    label: 'Home',
    recipientFullName: 'Facee Customer',
    recipientEmail: 'customer@example.com',
    recipientPhone: '0800000000',
    addressLine: '123 Facee Road',
    city: 'Bangkok',
    postalCode: '10110',
    isDefault: true,
  };

  const buildService = () => {
    const addressFindFirst = jest.fn();
    const orderCancellationRequestCreate = jest.fn();
    const orderCancellationRequestFindUnique = jest.fn();
    const orderCancellationRequestUpdate = jest.fn();
    const orderCreate = jest.fn();
    const orderFindFirst = jest.fn();
    const orderFindMany = jest.fn();
    const orderFindUnique = jest.fn();
    const orderUpdate = jest.fn();
    const productFindMany = jest.fn();
    const productUpdate = jest.fn();
    const productUpdateMany = jest.fn();
    const userFindUnique = jest.fn();
    const userUpdate = jest.fn();
    const transaction = jest.fn(
      <T>(
        callback: (client: {
          product: {
            update: typeof productUpdate;
            updateMany: typeof productUpdateMany;
          };
          order: {
            create: typeof orderCreate;
            update: typeof orderUpdate;
          };
          orderCancellationRequest: {
            update: typeof orderCancellationRequestUpdate;
          };
          user: {
            update: typeof userUpdate;
          };
        }) => Promise<T>,
      ) =>
        callback({
          product: {
            update: productUpdate,
            updateMany: productUpdateMany,
          },
          order: {
            create: orderCreate,
            update: orderUpdate,
          },
          orderCancellationRequest: {
            update: orderCancellationRequestUpdate,
          },
          user: {
            update: userUpdate,
          },
        }),
    );

    const prisma = {
      $transaction: transaction,
      address: {
        findFirst: addressFindFirst,
      },
      order: {
        create: orderCreate,
        findFirst: orderFindFirst,
        findMany: orderFindMany,
        findUnique: orderFindUnique,
        update: orderUpdate,
      },
      orderCancellationRequest: {
        create: orderCancellationRequestCreate,
        findUnique: orderCancellationRequestFindUnique,
        update: orderCancellationRequestUpdate,
      },
      product: {
        findMany: productFindMany,
        update: productUpdate,
        updateMany: productUpdateMany,
      },
      user: {
        findUnique: userFindUnique,
        update: userUpdate,
      },
    };

    const service = new OrdersService(prisma as unknown as PrismaService);

    return {
      service,
      addressFindFirst,
      orderCancellationRequestCreate,
      orderCancellationRequestFindUnique,
      orderCancellationRequestUpdate,
      orderCreate,
      orderFindFirst,
      orderFindMany,
      orderFindUnique,
      orderUpdate,
      productFindMany,
      productUpdate,
      productUpdateMany,
      transaction,
      userFindUnique,
      userUpdate,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an order from the selected address and deducts stock', async () => {
    const {
      service,
      addressFindFirst,
      orderCreate,
      productFindMany,
      productUpdateMany,
      userFindUnique,
      userUpdate,
    } = buildService();

    userFindUnique.mockResolvedValue(currentUser);
    addressFindFirst.mockResolvedValue(currentAddress);
    productFindMany.mockResolvedValue([
      {
        id: 'cm8product00000123456789012',
        name: 'Quiet Bloom Cleanser',
        slug: 'quiet-bloom-cleanser',
        imageUrl: '/images/products/quiet-bloom-cleanser.png',
        isPublished: true,
        price: 450,
        stock: 12,
      },
    ]);
    productUpdateMany.mockResolvedValue({ count: 1 });
    orderCreate.mockResolvedValue({
      orderNo: 'FC-20260428-123456',
    });
    userUpdate.mockResolvedValue(undefined);

    await expect(
      service.createOrder(currentUser.id, {
        addressId: currentAddress.id,
        items: [
          {
            productId: 'cm8product00000123456789012',
            quantity: 2,
          },
        ],
      }),
    ).resolves.toEqual({
      orderNo: 'FC-20260428-123456',
    });

    expect(userUpdate).not.toHaveBeenCalled();
    expect(productUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'cm8product00000123456789012',
        isPublished: true,
        stock: {
          gte: 2,
        },
      },
      data: {
        stock: {
          decrement: 2,
        },
      },
    });
  });

  it('rejects missing addresses', async () => {
    const { service, addressFindFirst, userFindUnique } = buildService();

    userFindUnique.mockResolvedValue(currentUser);
    addressFindFirst.mockResolvedValue(null);

    await expect(
      service.createOrder(currentUser.id, {
        addressId: currentAddress.id,
        items: [
          {
            productId: 'cm8product00000123456789012',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.addressNotFound,
      },
    });
  });

  it('rejects empty order items', async () => {
    const { service, addressFindFirst, userFindUnique } = buildService();

    userFindUnique.mockResolvedValue(currentUser);
    addressFindFirst.mockResolvedValue(currentAddress);

    await expect(
      service.createOrder(currentUser.id, {
        addressId: currentAddress.id,
        items: [],
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.orderEmpty,
      },
    });
  });

  it('returns an owned order by order number', async () => {
    const { service, orderFindFirst } = buildService();

    orderFindFirst.mockResolvedValue({
      id: 'cm8order000001234567890123',
      orderNo: 'FC-20260428-123456',
      status: 'PENDING',
      refundStatus: 'NONE',
      createdAt: new Date('2026-04-28T10:00:00.000Z'),
      customerFullName: 'Facee Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '0800000000',
      shippingAddressLine: '123 Facee Road',
      shippingCity: 'Bangkok',
      shippingPostalCode: '10110',
      subtotal: 900,
      shippingTotal: 60,
      total: 960,
      user: {
        fullName: 'Facee Customer',
        email: 'customer@example.com',
        phone: '0800000000',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
      },
      items: [
        {
          id: 'cm8orderitem0000012345678',
          productId: 'cm8product00000123456789012',
          productName: 'Quiet Bloom Cleanser',
          productSlug: 'quiet-bloom-cleanser',
          productImageUrl: '/images/products/quiet-bloom-cleanser.png',
          quantity: 2,
          unitPrice: 450,
        },
      ],
      cancellationRequests: [],
    });

    await expect(
      service.getOrderByOrderNo(currentUser.id, 'FC-20260428-123456'),
    ).resolves.toEqual({
      orderNo: 'FC-20260428-123456',
      status: 'PENDING',
      refundStatus: 'NONE',
      createdAt: '2026-04-28T10:00:00.000Z',
      contact: {
        fullName: 'Facee Customer',
        email: 'customer@example.com',
        phone: '0800000000',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
      },
      items: [
        {
          id: 'cm8orderitem0000012345678',
          productId: 'cm8product00000123456789012',
          productName: 'Quiet Bloom Cleanser',
          productSlug: 'quiet-bloom-cleanser',
          productImageUrl: '/images/products/quiet-bloom-cleanser.png',
          quantity: 2,
          unitPrice: 450,
          lineTotal: 900,
        },
      ],
      subtotal: 900,
      shippingTotal: 60,
      total: 960,
      latestCancellationRequest: null,
    });
  });

  it('sums quantities for the order list item count', async () => {
    const { service, orderFindMany } = buildService();

    orderFindMany.mockResolvedValue([
      {
        orderNo: 'FC-20260428-123456',
        status: 'PAID',
        refundStatus: 'NONE',
        createdAt: new Date('2026-04-28T10:00:00.000Z'),
        total: 960,
        customerFullName: 'Facee Customer',
        customerEmail: 'customer@example.com',
        customerPhone: '0800000000',
        shippingAddressLine: '123 Facee Road',
        shippingCity: 'Bangkok',
        shippingPostalCode: '10110',
        user: {
          fullName: 'Facee Customer',
          email: 'customer@example.com',
          phone: '0800000000',
          addressLine: '123 Facee Road',
          city: 'Bangkok',
          postalCode: '10110',
        },
        items: [
          {
            id: 'cm8orderitem0000012345678',
            productName: 'Quiet Bloom Cleanser',
            productImageUrl: '/images/products/quiet-bloom-cleanser.png',
            quantity: 2,
          },
          {
            id: 'cm8orderitem0000012345679',
            productName: 'Soft Cloud Toner',
            productImageUrl: '/images/products/soft-cloud-toner.png',
            quantity: 1,
          },
        ],
        cancellationRequests: [],
      },
    ]);

    await expect(service.listOrders(currentUser.id)).resolves.toEqual({
      items: [
        expect.objectContaining({
          orderNo: 'FC-20260428-123456',
          itemCount: 3,
        }),
      ],
    });
  });

  it('cancels pending orders and restores stock immediately', async () => {
    const { service, orderFindFirst, orderUpdate, productUpdate } =
      buildService();

    orderFindFirst
      .mockResolvedValueOnce({
        id: 'cm8order000001234567890123',
        status: 'PENDING',
        items: [
          {
            productId: 'cm8product00000123456789012',
            quantity: 2,
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'cm8order000001234567890123',
        orderNo: 'FC-20260428-123456',
        status: 'CANCELED',
        refundStatus: 'NONE',
        createdAt: new Date('2026-04-28T10:00:00.000Z'),
        customerFullName: 'Facee Customer',
        customerEmail: 'customer@example.com',
        customerPhone: '0800000000',
        shippingAddressLine: '123 Facee Road',
        shippingCity: 'Bangkok',
        shippingPostalCode: '10110',
        subtotal: 900,
        shippingTotal: 60,
        total: 960,
        user: {
          fullName: 'Facee Customer',
          email: 'customer@example.com',
          phone: '0800000000',
          addressLine: '123 Facee Road',
          city: 'Bangkok',
          postalCode: '10110',
        },
        items: [],
        cancellationRequests: [],
      });

    await expect(
      service.cancelOrder(currentUser.id, 'FC-20260428-123456'),
    ).resolves.toMatchObject({
      status: 'CANCELED',
    });

    expect(productUpdate).toHaveBeenCalledWith({
      where: {
        id: 'cm8product00000123456789012',
      },
      data: {
        stock: {
          increment: 2,
        },
      },
    });
    expect(orderUpdate).toHaveBeenCalledWith({
      where: {
        id: 'cm8order000001234567890123',
      },
      data: {
        status: 'CANCELED',
      },
    });
  });

  it('creates a cancellation request for paid orders without restoring stock', async () => {
    const {
      service,
      orderCancellationRequestCreate,
      orderFindFirst,
      productUpdate,
    } = buildService();

    orderFindFirst
      .mockResolvedValueOnce({
        id: 'cm8order000001234567890123',
        status: 'PAID',
        cancellationRequests: [],
      })
      .mockResolvedValueOnce({
        id: 'cm8order000001234567890123',
        orderNo: 'FC-20260428-123456',
        status: 'PAID',
        refundStatus: 'NONE',
        createdAt: new Date('2026-04-28T10:00:00.000Z'),
        customerFullName: 'Facee Customer',
        customerEmail: 'customer@example.com',
        customerPhone: '0800000000',
        shippingAddressLine: '123 Facee Road',
        shippingCity: 'Bangkok',
        shippingPostalCode: '10110',
        subtotal: 900,
        shippingTotal: 60,
        total: 960,
        user: {
          fullName: 'Facee Customer',
          email: 'customer@example.com',
          phone: '0800000000',
          addressLine: '123 Facee Road',
          city: 'Bangkok',
          postalCode: '10110',
        },
        items: [],
        cancellationRequests: [
          {
            id: 'cm8cancel0000012345678901',
            orderId: 'cm8order000001234567890123',
            requesterUserId: currentUser.id,
            reasonCode: 'WRONG_ADDRESS',
            details: 'Need another address',
            status: 'REQUESTED',
            reviewNote: null,
            reviewedByUserId: null,
            reviewedAt: null,
            createdAt: new Date('2026-04-28T11:00:00.000Z'),
            updatedAt: new Date('2026-04-28T11:00:00.000Z'),
          },
        ],
      });

    await expect(
      service.createCancellationRequest(currentUser.id, 'FC-20260428-123456', {
        reasonCode: 'WRONG_ADDRESS',
        details: 'Need another address',
      }),
    ).resolves.toMatchObject({
      latestCancellationRequest: {
        status: 'REQUESTED',
      },
    });

    expect(orderCancellationRequestCreate).toHaveBeenCalledWith({
      data: {
        orderId: 'cm8order000001234567890123',
        requesterUserId: currentUser.id,
        reasonCode: 'WRONG_ADDRESS',
        details: 'Need another address',
        status: 'REQUESTED',
      },
    });
    expect(productUpdate).not.toHaveBeenCalled();
  });
});
