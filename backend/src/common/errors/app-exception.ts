import { HttpException } from '@nestjs/common';
import type { ApiErrorResponse, ApiFieldErrors } from './api-error-response';
import type { ApiErrorCode } from './error-codes';

export class AppException extends HttpException {
  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    fieldErrors?: ApiFieldErrors,
  ) {
    super(
      {
        statusCode,
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      } satisfies ApiErrorResponse,
      statusCode,
    );
  }

  getErrorResponse() {
    return this.getResponse() as ApiErrorResponse;
  }
}
