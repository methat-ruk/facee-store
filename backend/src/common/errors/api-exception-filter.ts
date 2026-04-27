import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodError } from 'zod';
import type { ApiErrorResponse, ApiFieldErrors } from './api-error-response';
import { AppException } from './app-exception';
import { API_ERROR_CODES, type ApiErrorCode } from './error-codes';

const UNAUTHORIZED_STATUS = 401;
const INTERNAL_SERVER_ERROR_STATUS = 500;

type ZodIssueLike = {
  code?: string;
  message?: string;
  path?: Array<string | number>;
};

function createInternalServerErrorResponse(): ApiErrorResponse {
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: API_ERROR_CODES.internalServerError,
    message: 'Something went wrong. Please try again later.',
  };
}

function appendFieldError(
  fieldErrors: ApiFieldErrors,
  field: string,
  code: ApiErrorCode,
) {
  const currentCodes = fieldErrors[field] ?? [];

  if (!currentCodes.includes(code)) {
    fieldErrors[field] = [...currentCodes, code];
  }
}

function getIssueFieldCode(field: string, issue: ZodIssueLike): ApiErrorCode {
  if (field === 'email' && issue.code === 'invalid_format') {
    return API_ERROR_CODES.invalidEmail;
  }

  if (field === 'password' && issue.code === 'too_small') {
    return API_ERROR_CODES.passwordTooShort;
  }

  if (
    field === 'confirmPassword' &&
    issue.message === 'Passwords do not match.'
  ) {
    return API_ERROR_CODES.passwordMismatch;
  }

  return API_ERROR_CODES.required;
}

function getFieldErrorsFromZodError(
  error: ZodError,
): ApiFieldErrors | undefined {
  const fieldErrors: ApiFieldErrors = {};

  for (const issue of error.issues as ZodIssueLike[]) {
    const [rawField] = issue.path ?? [];

    if (typeof rawField !== 'string') {
      continue;
    }

    appendFieldError(fieldErrors, rawField, getIssueFieldCode(rawField, issue));
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

function getHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    typeof response.message === 'string'
  ) {
    return response.message;
  }

  return 'Request failed.';
}

export function mapExceptionToApiErrorResponse(
  exception: unknown,
): ApiErrorResponse {
  if (exception instanceof AppException) {
    return exception.getErrorResponse();
  }

  if (exception instanceof ZodValidationException) {
    const zodError = exception.getZodError() as ZodError;
    const fieldErrors = getFieldErrorsFromZodError(zodError);

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: API_ERROR_CODES.validationFailed,
      message: 'Request validation failed.',
      ...(fieldErrors ? { fieldErrors } : {}),
    };
  }

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();

    return {
      statusCode,
      code:
        statusCode === UNAUTHORIZED_STATUS
          ? API_ERROR_CODES.authUnauthorized
          : (`HTTP_${statusCode}` as const),
      message: getHttpExceptionMessage(exception),
    };
  }

  return createInternalServerErrorResponse();
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const errorResponse = mapExceptionToApiErrorResponse(exception);

    if (errorResponse.statusCode >= INTERNAL_SERVER_ERROR_STATUS) {
      this.logger.error(exception);
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
