import type { ApiErrorCode } from './error-codes';

export type ApiFieldErrors = Record<string, ApiErrorCode[]>;

export type ApiErrorResponse = {
  statusCode: number;
  code: ApiErrorCode | `HTTP_${number}`;
  message: string;
  fieldErrors?: ApiFieldErrors;
};
