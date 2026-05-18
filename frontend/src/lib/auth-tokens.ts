'use client';

import type { AuthTokens } from '@/features/auth/auth-session-schema';

const AUTH_TOKENS_STORAGE_KEY = 'facee.auth.tokens';

let memoryTokens: AuthTokens | null = null;

function canUseStorage() {
  return typeof window !== 'undefined';
}

function parseStoredTokens(rawValue: string | null): AuthTokens | null {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthTokens;
  } catch {
    return null;
  }
}

export function readStoredAuthTokens(): AuthTokens | null {
  if (memoryTokens) {
    return memoryTokens;
  }

  if (!canUseStorage()) {
    return null;
  }

  const parsedTokens = parseStoredTokens(
    window.localStorage.getItem(AUTH_TOKENS_STORAGE_KEY),
  );

  memoryTokens = parsedTokens;
  return parsedTokens;
}

export function persistAuthTokens(tokens: AuthTokens) {
  memoryTokens = tokens;

  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredAuthTokens() {
  memoryTokens = null;

  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
}

export function getStoredAccessToken() {
  return readStoredAuthTokens()?.accessToken ?? null;
}

export function getStoredRefreshToken() {
  return readStoredAuthTokens()?.refreshToken ?? null;
}
