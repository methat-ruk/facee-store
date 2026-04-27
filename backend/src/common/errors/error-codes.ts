export const API_ERROR_CODES = {
  authEmailAlreadyExists: 'AUTH_EMAIL_ALREADY_EXISTS',
  authInvalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  authUnauthorized: 'AUTH_UNAUTHORIZED',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  invalidEmail: 'INVALID_EMAIL',
  passwordMismatch: 'PASSWORD_MISMATCH',
  passwordTooShort: 'PASSWORD_TOO_SHORT',
  required: 'REQUIRED',
  validationFailed: 'VALIDATION_FAILED',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
