'use client';

import type { ApiError } from '@/services/api-error';

export type AuthErrorSource =
  | 'profile-restore'
  | 'login'
  | 'register'
  | 'logout';

export type ClassifiedAuthError = {
  kind: 'expected' | 'unexpected';
  reason:
    | 'auth-guest'
    | 'auth-invalid-credentials'
    | 'auth-email-exists'
    | 'validation'
    | 'profile-restore-failed'
    | 'server-failure';
  ui: 'silent' | 'inline' | 'inline+toast';
};

export function classifyAuthError(
  error: ApiError,
  source: AuthErrorSource,
): ClassifiedAuthError {
  if (source === 'profile-restore') {
    if (error.code === 'AUTH_UNAUTHORIZED') {
      return {
        kind: 'expected',
        reason: 'auth-guest',
        ui: 'silent',
      };
    }

    return {
      kind: 'unexpected',
      reason: 'profile-restore-failed',
      ui: 'silent',
    };
  }

  if (error.code === 'VALIDATION_FAILED') {
    return {
      kind: 'expected',
      reason: 'validation',
      ui: 'inline',
    };
  }

  if (error.code === 'AUTH_INVALID_CREDENTIALS') {
    return {
      kind: 'expected',
      reason: 'auth-invalid-credentials',
      ui: 'inline',
    };
  }

  if (error.code === 'AUTH_EMAIL_ALREADY_EXISTS') {
    return {
      kind: 'expected',
      reason: 'auth-email-exists',
      ui: 'inline',
    };
  }

  return {
    kind: 'unexpected',
    reason: 'server-failure',
    ui: 'inline+toast',
  };
}
