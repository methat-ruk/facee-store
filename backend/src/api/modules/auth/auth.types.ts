import type { Request } from 'express';

export type AuthTokenPayload = {
  sub: string;
  role: 'ADMIN' | 'CUSTOMER';
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  type: 'refresh';
};

export type AuthenticatedRequest = Request & {
  user: AuthTokenPayload;
};
