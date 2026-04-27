import type { Request } from 'express';

export const AUTH_COOKIE_NAME = 'facee_access_token';
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
};

export type AuthenticatedRequest = Request & {
  user: AuthTokenPayload;
};
