jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import * as bcrypt from 'bcrypt';
import type { JwtService } from '@nestjs/jwt';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import type { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const buildService = () => {
    const userCreate = jest.fn();
    const userFindUnique = jest.fn();
    const authSessionCreate = jest.fn();
    const authSessionFindFirst = jest.fn();
    const authSessionUpdate = jest.fn();
    const authSessionUpdateMany = jest.fn();
    const signAsync = jest.fn();
    const verifyAsync = jest.fn();

    const prisma = {
      user: {
        create: userCreate,
        findUnique: userFindUnique,
      },
      authSession: {
        create: authSessionCreate,
        findFirst: authSessionFindFirst,
        update: authSessionUpdate,
        updateMany: authSessionUpdateMany,
      },
    } satisfies {
      user: Pick<PrismaService['user'], 'create' | 'findUnique'>;
      authSession: Pick<
        PrismaService['authSession'],
        'create' | 'findFirst' | 'update' | 'updateMany'
      >;
    };

    const jwtService = {
      signAsync,
      verifyAsync,
    } satisfies Pick<JwtService, 'signAsync' | 'verifyAsync'>;

    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );

    return {
      service,
      userCreate,
      userFindUnique,
      authSessionCreate,
      authSessionFindFirst,
      authSessionUpdate,
      authSessionUpdateMany,
      signAsync,
      verifyAsync,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a customer with hashed password and token pair', async () => {
    const {
      service,
      userCreate,
      userFindUnique,
      authSessionCreate,
      authSessionUpdate,
      signAsync,
    } = buildService();

    userFindUnique.mockResolvedValueOnce(null);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    userCreate.mockResolvedValueOnce({
      id: 'cm8user000001234567890123',
      email: 'new@example.com',
      fullName: 'New Customer',
      phone: null,
      addressLine: null,
      city: null,
      postalCode: null,
      role: 'CUSTOMER',
    });
    authSessionCreate.mockResolvedValueOnce({ id: 'session-1' });
    authSessionUpdate.mockResolvedValueOnce({});
    signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.register({
      fullName: ' New Customer ',
      email: 'NEW@EXAMPLE.COM',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.user).toEqual({
      id: 'cm8user000001234567890123',
      email: 'new@example.com',
      fullName: 'New Customer',
      phone: null,
      addressLine: null,
      city: null,
      postalCode: null,
      role: 'CUSTOMER',
    });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.accessTokenExpiresAt).toEqual(expect.any(String));
    expect(result.refreshTokenExpiresAt).toEqual(expect.any(String));

    expect(userCreate).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        fullName: 'New Customer',
        passwordHash: 'hashed-password',
      },
    });
    expect(authSessionCreate).toHaveBeenCalledTimes(1);
    const [registerSessionUpdate] = authSessionUpdate.mock.calls as [
      [
        {
          where: { id: string };
          data: {
            expiresAt: Date;
            lastUsedAt: Date;
            tokenHash: string;
          };
        },
      ],
    ];
    expect(registerSessionUpdate[0].where).toEqual({
      id: 'session-1',
    });
    expect(registerSessionUpdate[0].data.expiresAt).toBeInstanceOf(Date);
    expect(registerSessionUpdate[0].data.lastUsedAt).toBeInstanceOf(Date);
    expect(registerSessionUpdate[0].data.tokenHash).toEqual(expect.any(String));
  });

  it('rejects duplicate registration emails', async () => {
    const { service, userFindUnique } = buildService();

    userFindUnique.mockResolvedValue({
      id: 'cm8user000001234567890123',
    });

    await expect(
      service.register({
        fullName: 'Existing Customer',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.authEmailAlreadyExists,
        fieldErrors: {
          email: [API_ERROR_CODES.authEmailAlreadyExists],
        },
      },
    });
  });

  it('logs in with valid credentials', async () => {
    const {
      service,
      userFindUnique,
      authSessionCreate,
      authSessionUpdate,
      signAsync,
    } = buildService();

    userFindUnique.mockResolvedValueOnce({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      passwordHash: 'hashed-password',
      phone: null,
      addressLine: null,
      city: null,
      postalCode: null,
      role: 'CUSTOMER',
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    authSessionCreate.mockResolvedValueOnce({ id: 'session-1' });
    authSessionUpdate.mockResolvedValueOnce({});
    signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      email: 'CUSTOMER@EXAMPLE.COM',
      password: 'password123',
    });

    expect(result.user).toEqual({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      phone: null,
      addressLine: null,
      city: null,
      postalCode: null,
      role: 'CUSTOMER',
    });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('rejects invalid credentials', async () => {
    const { service, userFindUnique } = buildService();

    userFindUnique.mockResolvedValue({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      passwordHash: 'hashed-password',
      phone: null,
      addressLine: null,
      city: null,
      postalCode: null,
      role: 'CUSTOMER',
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.login({
        email: 'customer@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.authInvalidCredentials,
        fieldErrors: {
          email: [API_ERROR_CODES.authInvalidCredentials],
          password: [API_ERROR_CODES.authInvalidCredentials],
        },
      },
    });
  });

  it('refreshes a valid refresh token session', async () => {
    const {
      service,
      userFindUnique,
      authSessionFindFirst,
      authSessionUpdate,
      signAsync,
      verifyAsync,
    } = buildService();

    verifyAsync.mockResolvedValueOnce({
      sub: 'cm8user000001234567890123',
      sessionId: 'session-1',
      type: 'refresh',
    });
    authSessionFindFirst.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'cm8user000001234567890123',
      tokenHash:
        '0eb17643d4e9261163783a420859c92c7d212fa9624106a12b510afbec266120',
      expiresAt: new Date(Date.now() + 60_000),
    });
    userFindUnique.mockResolvedValueOnce({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      phone: null,
      addressLine: null,
      city: null,
      postalCode: null,
      role: 'CUSTOMER',
    });
    authSessionUpdate.mockResolvedValueOnce({});
    signAsync
      .mockResolvedValueOnce('next-access-token')
      .mockResolvedValueOnce('next-refresh-token');

    const result = await service.refresh({
      refreshToken: 'refresh-token',
    });

    expect(result.user.email).toBe('customer@example.com');
    expect(result.accessToken).toBe('next-access-token');
    expect(result.refreshToken).toBe('next-refresh-token');
    const [refreshSessionUpdate] = authSessionUpdate.mock.calls as [
      [
        {
          where: { id: string };
          data: {
            expiresAt: Date;
            lastUsedAt: Date;
            tokenHash: string;
          };
        },
      ],
    ];
    expect(refreshSessionUpdate[0].where).toEqual({
      id: 'session-1',
    });
    expect(refreshSessionUpdate[0].data.expiresAt).toBeInstanceOf(Date);
    expect(refreshSessionUpdate[0].data.lastUsedAt).toBeInstanceOf(Date);
    expect(refreshSessionUpdate[0].data.tokenHash).toEqual(expect.any(String));
  });

  it('rejects invalid refresh tokens', async () => {
    const { service, verifyAsync } = buildService();

    verifyAsync.mockRejectedValueOnce(new Error('invalid token'));

    await expect(
      service.refresh({
        refreshToken: 'bad-token',
      }),
    ).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.authUnauthorized,
      },
    });
  });

  it('returns a profile for an authenticated user id', async () => {
    const { service, userFindUnique } = buildService();

    userFindUnique.mockResolvedValueOnce({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      phone: '0800000000',
      addressLine: '123 Facee Road',
      city: 'Bangkok',
      postalCode: '10110',
      role: 'CUSTOMER',
    });

    await expect(
      service.getProfile('cm8user000001234567890123'),
    ).resolves.toEqual({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      phone: '0800000000',
      addressLine: '123 Facee Road',
      city: 'Bangkok',
      postalCode: '10110',
      role: 'CUSTOMER',
    });
  });

  it('revokes a valid refresh token during logout', async () => {
    const { service, authSessionUpdateMany, verifyAsync } = buildService();

    verifyAsync.mockResolvedValueOnce({
      sub: 'cm8user000001234567890123',
      sessionId: 'session-1',
      type: 'refresh',
    });
    authSessionUpdateMany.mockResolvedValueOnce({ count: 1 });

    await expect(service.logout('refresh-token')).resolves.toEqual({
      ok: true,
    });
    const [logoutSessionUpdate] = authSessionUpdateMany.mock.calls as [
      [
        {
          where: {
            id: string;
            userId: string;
            revokedAt: null;
          };
          data: {
            revokedAt: Date;
          };
        },
      ],
    ];
    expect(logoutSessionUpdate[0].where).toEqual({
      id: 'session-1',
      userId: 'cm8user000001234567890123',
      revokedAt: null,
    });
    expect(logoutSessionUpdate[0].data.revokedAt).toBeInstanceOf(Date);
  });

  it('ignores invalid logout tokens', async () => {
    const { service, verifyAsync } = buildService();

    verifyAsync.mockRejectedValueOnce(new Error('invalid token'));

    await expect(service.logout('bad-token')).resolves.toEqual({ ok: true });
  });

  it('rejects unknown authenticated user ids', async () => {
    const { service, userFindUnique } = buildService();

    userFindUnique.mockResolvedValueOnce(null);

    await expect(service.getProfile('missing-user')).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.authUnauthorized,
      },
    });
  });
});
