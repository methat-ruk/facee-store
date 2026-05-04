import type { ApiError } from '@/services/api-error';
import type { AuthErrorSource } from './classify-auth-error';

export type AuthMode = 'login' | 'register';

export type AuthField = 'fullName' | 'email' | 'password' | 'confirmPassword';

export type AuthMessageKey =
  | 'errorConfirmPasswordRequired'
  | 'errorEmailExists'
  | 'errorEmailInvalid'
  | 'errorEmailRequired'
  | 'errorFormInvalid'
  | 'errorInvalidCredentials'
  | 'errorLoginFailed'
  | 'errorLogoutFailed'
  | 'errorNameRequired'
  | 'errorPasswordRequired'
  | 'errorRegisterFailed'
  | 'unexpectedErrorTitle'
  | 'passwordMismatch'
  | 'passwordTooShort';

export type AuthFieldErrors = Partial<Record<AuthField, AuthMessageKey>>;

const requiredFieldMessages: Record<AuthField, AuthMessageKey> = {
  fullName: 'errorNameRequired',
  email: 'errorEmailRequired',
  password: 'errorPasswordRequired',
  confirmPassword: 'errorConfirmPasswordRequired',
};

export function getAuthFieldMessageKey(
  field: AuthField,
  errorCode: string,
): AuthMessageKey | null {
  switch (errorCode) {
    case 'REQUIRED':
      return requiredFieldMessages[field];
    case 'INVALID_EMAIL':
      return field === 'email' ? 'errorEmailInvalid' : null;
    case 'PASSWORD_TOO_SHORT':
      return field === 'password' ? 'passwordTooShort' : null;
    case 'PASSWORD_MISMATCH':
      return field === 'confirmPassword' ? 'passwordMismatch' : null;
    case 'AUTH_EMAIL_ALREADY_EXISTS':
      return field === 'email' ? 'errorEmailExists' : null;
    case 'AUTH_INVALID_CREDENTIALS':
      return field === 'email' || field === 'password'
        ? 'errorInvalidCredentials'
        : null;
    default:
      return null;
  }
}

export function getAuthFieldErrors(error: ApiError): AuthFieldErrors {
  const nextFieldErrors: AuthFieldErrors = {};

  for (const [field, codes] of Object.entries(error.fieldErrors ?? {})) {
    if (
      field !== 'fullName' &&
      field !== 'email' &&
      field !== 'password' &&
      field !== 'confirmPassword'
    ) {
      continue;
    }

    const messageKey = codes
      .map((code) => getAuthFieldMessageKey(field, code))
      .find((code) => code !== null);

    if (messageKey) {
      nextFieldErrors[field] = messageKey;
    }
  }

  return nextFieldErrors;
}

export function getAuthFormMessageKey(
  mode: AuthMode,
  errorCode: string,
): AuthMessageKey {
  switch (errorCode) {
    case 'VALIDATION_FAILED':
      return 'errorFormInvalid';
    case 'AUTH_INVALID_CREDENTIALS':
    case 'AUTH_UNAUTHORIZED':
      return 'errorInvalidCredentials';
    case 'AUTH_EMAIL_ALREADY_EXISTS':
      return 'errorEmailExists';
    default:
      return mode === 'register' ? 'errorRegisterFailed' : 'errorLoginFailed';
  }
}

export function getAuthActionMessageKey(
  source: AuthErrorSource,
  errorCode: string,
): AuthMessageKey {
  if (source === 'logout') {
    return 'errorLogoutFailed';
  }

  if (source === 'register') {
    return getAuthFormMessageKey('register', errorCode);
  }

  return getAuthFormMessageKey('login', errorCode);
}
