import type { Response } from 'express';
import { AUTH_COOKIE_MAX_AGE_MS, AUTH_COOKIE_NAME } from './auth.types';

export function setAuthCookie(response: Response, token: string) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!target) {
    return null;
  }

  return decodeURIComponent(target.slice(name.length + 1));
}
