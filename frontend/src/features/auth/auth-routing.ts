const AUTH_ROUTE_PREFIXES = ['/login', '/register'];

export function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/')) {
    return null;
  }

  if (value.startsWith('//')) {
    return null;
  }

  if (AUTH_ROUTE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return null;
  }

  return value;
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
