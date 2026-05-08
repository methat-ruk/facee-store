import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { AppException } from './app-exception';
import { mapExceptionToApiErrorResponse } from './api-exception-filter';
import { API_ERROR_CODES } from './error-codes';

describe('mapExceptionToApiErrorResponse', () => {
  it('returns the payload from AppException unchanged', () => {
    const exception = new AppException(
      HttpStatus.CONFLICT,
      API_ERROR_CODES.authEmailAlreadyExists,
      'This email is already registered.',
      {
        email: [API_ERROR_CODES.authEmailAlreadyExists],
      },
    );

    expect(mapExceptionToApiErrorResponse(exception)).toEqual({
      statusCode: 409,
      code: API_ERROR_CODES.authEmailAlreadyExists,
      message: 'This email is already registered.',
      fieldErrors: {
        email: [API_ERROR_CODES.authEmailAlreadyExists],
      },
    });
  });

  it('normalizes zod validation errors into fieldErrors', () => {
    const schema = z
      .object({
        email: z.email(),
        password: z.string().min(8),
      })
      .safeParse({
        email: 'invalid-email',
        password: 'short',
      });

    if (schema.success) {
      throw new Error('Expected schema to fail.');
    }

    const exception = new ZodValidationException(schema.error);

    expect(mapExceptionToApiErrorResponse(exception)).toEqual({
      statusCode: 400,
      code: API_ERROR_CODES.validationFailed,
      message: 'Request validation failed.',
      fieldErrors: {
        email: [API_ERROR_CODES.invalidEmail],
        password: [API_ERROR_CODES.passwordTooShort],
      },
    });
  });

  it('maps product validation issues to specific field codes', () => {
    const schema = z
      .object({
        sku: z.string().regex(/^[A-Z0-9-]+$/),
        compareAtPrice: z.number(),
        benefits: z.array(z.string()).refine((items) => items.length > 0),
        imageUrl: z.string().refine(() => false, 'Invalid media URL.'),
      })
      .superRefine((value, ctx) => {
        if (value.compareAtPrice <= 350) {
          ctx.addIssue({
            code: 'custom',
            message: 'Compare-at price must be greater than price.',
            path: ['compareAtPrice'],
          });
        }
      })
      .safeParse({
        sku: 'bad sku',
        compareAtPrice: 300,
        benefits: [],
        imageUrl: '/broken',
      });

    if (schema.success) {
      throw new Error('Expected schema to fail.');
    }

    const exception = new ZodValidationException(schema.error);

    expect(mapExceptionToApiErrorResponse(exception)).toEqual({
      statusCode: 400,
      code: API_ERROR_CODES.validationFailed,
      message: 'Request validation failed.',
      fieldErrors: {
        sku: [API_ERROR_CODES.productSkuInvalid],
        compareAtPrice: [API_ERROR_CODES.productCompareAtPriceInvalid],
        benefits: [API_ERROR_CODES.productBenefitsRequired],
        imageUrl: [API_ERROR_CODES.productMediaUrlInvalid],
      },
    });
  });

  it('maps bare unauthorized exceptions to AUTH_UNAUTHORIZED', () => {
    const exception = new BadRequestException('Request is invalid.');

    expect(mapExceptionToApiErrorResponse(exception)).toEqual({
      statusCode: 400,
      code: 'HTTP_400',
      message: 'Request is invalid.',
    });
  });

  it('falls back to INTERNAL_SERVER_ERROR for unknown errors', () => {
    expect(mapExceptionToApiErrorResponse(new Error('boom'))).toEqual({
      statusCode: 500,
      code: API_ERROR_CODES.internalServerError,
      message: 'Something went wrong. Please try again later.',
    });
  });
});
