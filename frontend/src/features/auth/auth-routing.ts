import type { ReadonlyURLSearchParams } from 'next/navigation';
import { routing } from '@/i18n/routing';

const AUTH_ROUTE_PREFIXES = ['/login', '/register'];

function isAuthRoute(pathname: string) {
  if (AUTH_ROUTE_PREFIXES.some((prefix) => pathname === prefix)) {
    return true;
  }

  return routing.locales.some(
    (locale) =>
      pathname === `/${locale}/login` || pathname === `/${locale}/register`,
  );
}

export function sanitizeReturnTo(value: string | null | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue || !normalizedValue.startsWith('/')) {
    return null;
  }

  if (normalizedValue.startsWith('//')) {
    return null;
  }

  const [pathname] = normalizedValue.split(/[?#]/, 1);

  if (!pathname || isAuthRoute(pathname)) {
    return null;
  }

  return normalizedValue;
}

export function buildReturnTo(
  pathname: string,
  searchParams?: URLSearchParams | ReadonlyURLSearchParams | null,
) {
  const query = searchParams?.toString();
  const nextValue = query ? `${pathname}?${query}` : pathname;

  return sanitizeReturnTo(nextValue);
}

export function buildAuthNoticeHref(
  authPath: '/login' | '/register',
  reason: 'auth-required' | 'session-expired' | 'access-denied' | 'logged-out',
  returnTo?: string | null,
) {
  const params = new URLSearchParams();

  if (reason === 'logged-out') {
    params.set('loggedOut', '1');
  } else {
    params.set('reason', reason);
  }

  const safeReturnTo = sanitizeReturnTo(returnTo);

  if (safeReturnTo) {
    params.set('returnTo', safeReturnTo);
  }

  const query = params.toString();
  return query ? `${authPath}?${query}` : authPath;
}
