export const API_ERROR_CODES = {
  addressNotFound: 'ADDRESS_NOT_FOUND',
  authEmailAlreadyExists: 'AUTH_EMAIL_ALREADY_EXISTS',
  authInvalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  authUnauthorized: 'AUTH_UNAUTHORIZED',
  cancellationRequestExists: 'CANCELLATION_REQUEST_EXISTS',
  cancellationRequestNotFound: 'CANCELLATION_REQUEST_NOT_FOUND',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  orderCancelNotAllowed: 'ORDER_CANCEL_NOT_ALLOWED',
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
