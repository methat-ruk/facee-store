export const API_ERROR_CODES = {
  authEmailAlreadyExists: 'AUTH_EMAIL_ALREADY_EXISTS',
  authInvalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  authUnauthorized: 'AUTH_UNAUTHORIZED',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  orderEmpty: 'ORDER_EMPTY',
  orderNotFound: 'ORDER_NOT_FOUND',
  orderStockChanged: 'ORDER_STOCK_CHANGED',
  orderUnavailableItems: 'ORDER_UNAVAILABLE_ITEMS',
  invalidEmail: 'INVALID_EMAIL',
  invalidPhone: 'INVALID_PHONE',
  passwordMismatch: 'PASSWORD_MISMATCH',
  passwordTooShort: 'PASSWORD_TOO_SHORT',
  required: 'REQUIRED',
  validationFailed: 'VALIDATION_FAILED',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
