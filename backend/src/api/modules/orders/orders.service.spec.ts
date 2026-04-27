jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import type { PrismaService } from '../../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const buildService = () => {
    const productFindMany = jest.fn();
    const productUpdateMany = jest.fn();
    const orderFindFirst = jest.fn();
    const orderCreate = jest.fn();
    const userFindUnique = jest.fn();
    const userUpdate = jest.fn();
    const transaction = jest.fn(
      <T>(
        callback: (client: {
          product: {
            updateMany: typeof productUpdateMany;
          };
          order: {
            create: typeof orderCreate;
          };
          user: {
            update: typeof userUpdate;
          };
        }) => Promise<T>,
      ) =>
        callback({
          product: {
            updateMany: productUpdateMany,
          },
          order: {
            create: orderCreate,
          },
          user: {
            update: userUpdate,
          },
        }),
    );

    const prisma = {
      client: {
        $transaction: transaction,
      },
      product: {
        findMany: productFindMany,
      },
      order: {
        findFirst: orderFindFirst,
      },
      user: {
        findUnique: userFindUnique,
      },
    };

    const service = new OrdersService(prisma as unknown as PrismaService);

    return {
      service,
      productFindMany,
      productUpdateMany,
      orderFindFirst,
      orderCreate,
      userFindUnique,
      userUpdate,
      transaction,
    };
  };

  const currentUser = {
    id: 'cm8user000001234567890123',
    email: 'customer@example.com',
    fullName: 'Customer',
    phone: '0800000000',
    addressLine: '123 Facee Road',
    city: 'Bangkok',
    postalCode: '10110',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an order, updates the profile, and deducts stock', async () => {
    const {
      service,
      productFindMany,
      productUpdateMany,
      orderCreate,
      userFindUnique,
      userUpdate,
    } = buildService();

    userFindUnique.mockResolvedValue(currentUser);
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
      orderNo: 'FC-20260427-123456',
    });
    userUpdate.mockResolvedValue(undefined);

    await expect(
      service.createOrder(currentUser.id, {
        fullName: 'Facee Customer',
        email: 'customer@example.com',
        phone: '0800000000',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
        items: [
          {
            productId: 'cm8product00000123456789012',
            quantity: 2,
          },
        ],
      }),
    ).resolves.toEqual({
      orderNo: 'FC-20260427-123456',
    });

    const orderCreateCall = orderCreate.mock.calls[0] as
      | [
          {
            data: {
              subtotal: number;
              shippingTotal: number;
              total: number;
            };
          },
        ]
      | undefined;

    expect(orderCreateCall).toBeDefined();
    expect(orderCreateCall?.[0].data).toMatchObject({
      subtotal: 900,
      shippingTotal: 60,
      total: 960,
    });
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
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: currentUser.id },
      data: {
        fullName: 'Facee Customer',
        email: 'customer@example.com',
        phone: '0800000000',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
      },
    });
  });

  it('rejects empty order items', async () => {
    const { service, userFindUnique } = buildService();

    userFindUnique.mockResolvedValue(currentUser);

    await expect(
      service.createOrder(currentUser.id, {
        fullName: 'Facee Customer',
        email: 'customer@example.com',
        phone: '0800000000',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
        items: [],
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.orderEmpty,
      },
    });
  });

  it('rejects unavailable products', async () => {
    const { service, productFindMany, userFindUnique } = buildService();

    userFindUnique.mockResolvedValue(currentUser);
    productFindMany.mockResolvedValue([
      {
        id: 'cm8product00000123456789012',
        name: 'Quiet Bloom Cleanser',
        slug: 'quiet-bloom-cleanser',
        imageUrl: '/images/products/quiet-bloom-cleanser.png',
        isPublished: false,
        price: 450,
        stock: 12,
      },
    ]);

    await expect(
      service.createOrder(currentUser.id, {
        fullName: 'Facee Customer',
        email: 'customer@example.com',
        phone: '0800000000',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
        items: [
          {
            productId: 'cm8product00000123456789012',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.orderUnavailableItems,
      },
    });
  });

  it('rejects stock changes before transaction commit', async () => {
    const { service, productFindMany, userFindUnique } = buildService();

    userFindUnique.mockResolvedValue(currentUser);
    productFindMany.mockResolvedValue([
      {
        id: 'cm8product00000123456789012',
        name: 'Quiet Bloom Cleanser',
        slug: 'quiet-bloom-cleanser',
        imageUrl: '/images/products/quiet-bloom-cleanser.png',
        isPublished: true,
        price: 450,
        stock: 1,
      },
    ]);

    await expect(
      service.createOrder(currentUser.id, {
        fullName: 'Facee Customer',
        email: 'customer@example.com',
        phone: '0800000000',
        addressLine: '123 Facee Road',
        city: 'Bangkok',
        postalCode: '10110',
        items: [
          {
            productId: 'cm8product00000123456789012',
            quantity: 2,
          },
        ],
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.orderStockChanged,
      },
    });
  });

  it('returns an owned order by order number', async () => {
    const { service, orderFindFirst } = buildService();

    orderFindFirst.mockResolvedValue({
      orderNo: 'FC-20260427-123456',
      status: 'PENDING',
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
      customerFullName: 'Facee Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '0800000000',
      shippingAddressLine: '123 Facee Road',
      shippingCity: 'Bangkok',
      shippingPostalCode: '10110',
      subtotal: 900,
      shippingTotal: 60,
      total: 960,
      user: currentUser,
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
    });

    await expect(
      service.getOrderByOrderNo(currentUser.id, 'FC-20260427-123456'),
    ).resolves.toEqual({
      orderNo: 'FC-20260427-123456',
      status: 'PENDING',
      createdAt: '2026-04-27T10:00:00.000Z',
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
    });
  });

  it('rejects missing orders', async () => {
    const { service, orderFindFirst } = buildService();

    orderFindFirst.mockResolvedValue(null);

    await expect(
      service.getOrderByOrderNo(currentUser.id, 'missing-order'),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.orderNotFound,
      },
    });
  });
});
