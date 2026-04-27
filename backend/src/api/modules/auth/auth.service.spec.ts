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
    const create = jest.fn();
    const findUnique = jest.fn();
    const signAsync = jest.fn();
    const verifyAsync = jest.fn();

    const prisma = {
      user: {
        create,
        findUnique,
      },
    } satisfies {
      user: Pick<PrismaService['user'], 'create' | 'findUnique'>;
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
      create,
      findUnique,
      signAsync,
      verifyAsync,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a customer with a hashed password and token', async () => {
    const { service, create, findUnique, signAsync } = buildService();

    findUnique.mockResolvedValue(null);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    create.mockResolvedValue({
      id: 'cm8user000001234567890123',
      email: 'new@example.com',
      fullName: 'New Customer',
      role: 'CUSTOMER',
    });
    signAsync.mockResolvedValue('jwt-token');

    await expect(
      service.register({
        fullName: ' New Customer ',
        email: 'NEW@EXAMPLE.COM',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    ).resolves.toEqual({
      profile: {
        id: 'cm8user000001234567890123',
        email: 'new@example.com',
        fullName: 'New Customer',
        role: 'CUSTOMER',
      },
      token: 'jwt-token',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        fullName: 'New Customer',
        passwordHash: 'hashed-password',
      },
    });
  });

  it('rejects duplicate registration emails', async () => {
    const { service, findUnique } = buildService();

    findUnique.mockResolvedValue({
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
    const { service, findUnique, signAsync } = buildService();

    findUnique.mockResolvedValue({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      passwordHash: 'hashed-password',
      role: 'CUSTOMER',
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    signAsync.mockResolvedValue('jwt-token');

    await expect(
      service.login({
        email: 'CUSTOMER@EXAMPLE.COM',
        password: 'password123',
      }),
    ).resolves.toEqual({
      profile: {
        id: 'cm8user000001234567890123',
        email: 'customer@example.com',
        fullName: 'Customer',
        role: 'CUSTOMER',
      },
      token: 'jwt-token',
    });
  });

  it('rejects invalid credentials', async () => {
    const { service, findUnique } = buildService();

    findUnique.mockResolvedValue({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      passwordHash: 'hashed-password',
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

  it('returns a profile for an authenticated user id', async () => {
    const { service, findUnique } = buildService();

    findUnique.mockResolvedValue({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      role: 'CUSTOMER',
    });

    await expect(
      service.getProfile('cm8user000001234567890123'),
    ).resolves.toEqual({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      role: 'CUSTOMER',
    });
  });

  it('returns null session profile when no token is provided', async () => {
    const { service } = buildService();

    await expect(service.getSessionProfile(null)).resolves.toBeNull();
  });

  it('returns null session profile for invalid tokens', async () => {
    const { service, verifyAsync } = buildService();

    verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(service.getSessionProfile('bad-token')).resolves.toBeNull();
  });

  it('returns a session profile for valid tokens', async () => {
    const { service, findUnique, verifyAsync } = buildService();

    verifyAsync.mockResolvedValue({
      sub: 'cm8user000001234567890123',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });
    findUnique.mockResolvedValue({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      role: 'CUSTOMER',
    });

    await expect(service.getSessionProfile('good-token')).resolves.toEqual({
      id: 'cm8user000001234567890123',
      email: 'customer@example.com',
      fullName: 'Customer',
      role: 'CUSTOMER',
    });
  });

  it('rejects unknown authenticated user ids', async () => {
    const { service, findUnique } = buildService();

    findUnique.mockResolvedValue(null);

    await expect(service.getProfile('missing-user')).rejects.toMatchObject({
      response: {
        code: API_ERROR_CODES.authUnauthorized,
      },
    });
  });
});
