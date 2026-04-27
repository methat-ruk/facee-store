import axios from 'axios';
import { z } from 'zod';

const apiFieldErrorsSchema = z.record(z.string(), z.array(z.string()));

const apiErrorResponseSchema = z.object({
  statusCode: z.number(),
  code: z.string(),
  message: z.string(),
  fieldErrors: apiFieldErrorsSchema.optional(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

type ApiErrorFallback = {
  code: string;
  message: string;
  statusCode?: number;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.code = response.code;
    this.fieldErrors = response.fieldErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toApiError(
  error: unknown,
  fallback: ApiErrorFallback,
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const parsedResponse = apiErrorResponseSchema.safeParse(
      error.response?.data,
    );

    if (parsedResponse.success) {
      return new ApiError(parsedResponse.data);
    }

    return new ApiError({
      statusCode: error.response?.status ?? fallback.statusCode ?? 500,
      code: fallback.code,
      message: fallback.message,
    });
  }

  return new ApiError({
    statusCode: fallback.statusCode ?? 500,
    code: fallback.code,
    message: fallback.message,
  });
}
